import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWablasNotification, type WhatsAppOrderPayload } from '@/lib/whatsapp'

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { orderItems: { include: { product: true } } },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('[GET /api/orders]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data pesanan' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kodeMitra, namaCabang, namaPic, whatsapp, alamat, catatan, items } = body

    // ── Validasi field wajib ────────────────────────────────
    if (!kodeMitra?.trim()) {
      return NextResponse.json({ error: 'Kode Mitra wajib diisi', field: 'kodeMitra' }, { status: 400 })
    }
    if (!namaCabang?.trim()) {
      return NextResponse.json({ error: 'Nama Cabang wajib diisi', field: 'namaCabang' }, { status: 400 })
    }
    if (!namaPic?.trim()) {
      return NextResponse.json({ error: 'Nama PIC wajib diisi', field: 'namaPic' }, { status: 400 })
    }
    if (!whatsapp?.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi', field: 'whatsapp' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Pesanan tidak boleh kosong' }, { status: 400 })
    }

    // Normalisasi item dan cegah productId duplikat membuat update stok berulang.
    const normalizedItems = new Map<string, number>()
    for (const item of items) {
      if (!item?.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Data produk tidak valid' }, { status: 400 })
      }

      const rawJumlah = Number(item.jumlah)
      if (!Number.isFinite(rawJumlah) || rawJumlah <= 0) {
        return NextResponse.json({ error: 'Jumlah produk tidak valid' }, { status: 400 })
      }

      const jumlah = Math.max(1, Math.floor(rawJumlah))
      normalizedItems.set(
        item.productId,
        (normalizedItems.get(item.productId) ?? 0) + jumlah
      )
    }

    const productIds = [...normalizedItems.keys()]

    // Ambil semua produk dalam SATU query. Sebelumnya satu query per item,
    // sehingga checkout banyak item lebih lambat dan rentan timeout.
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    const productById = new Map(products.map(product => [product.id, product]))

    const validatedItems: {
      productId: string
      jumlah: number
      hargaSatuan: number
      subtotal: number
      namaProduk: string
      satuan: string
    }[] = []

    let totalHarga = 0

    for (const [productId, jumlah] of normalizedItems) {
      const product = productById.get(productId)

      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Produk "${productId}" tidak ditemukan atau sudah tidak aktif` },
          { status: 400 }
        )
      }

      if (product.stok < jumlah) {
        return NextResponse.json(
          { error: `Stok ${product.namaProduk} tidak mencukupi (sisa: ${product.stok} ${product.satuan})` },
          { status: 409 }
        )
      }

      const subtotal = product.harga * jumlah
      totalHarga += subtotal

      validatedItems.push({
        productId: product.id,
        jumlah,
        hargaSatuan: product.harga,
        subtotal,
        namaProduk: product.namaProduk,
        satuan: product.satuan,
      })
    }

    // ── Transaction: buat order + items + kurangi stok ─────
    // Timeout diperpanjang karena checkout banyak item membutuhkan beberapa
    // operasi update stok ke PostgreSQL dari environment serverless.
    const order = await db.$transaction(
      async (tx) => {
        // Cek stok lagi di dalam transaksi untuk mengurangi risiko stok berubah
        // setelah validasi awal.
        const currentProducts = await tx.product.findMany({
          where: { id: { in: productIds } },
        })
        const currentById = new Map(currentProducts.map(product => [product.id, product]))

        for (const vi of validatedItems) {
          const current = currentById.get(vi.productId)
          if (!current || !current.isActive || current.stok < vi.jumlah) {
            throw new Error(`STOCK_CHANGED:${vi.productId}`)
          }
        }

        // 1. Buat order beserta seluruh item dalam nested write.
        const newOrder = await tx.order.create({
          data: {
            kodeMitra: kodeMitra.trim(),
            namaCabang: namaCabang.trim(),
            namaPic: namaPic.trim(),
            whatsapp: whatsapp.trim(),
            alamat: alamat?.trim() || '-',
            catatan: catatan?.trim() || null,
            totalHarga,
            status: 'menunggu',
            orderItems: {
              create: validatedItems.map(vi => ({
                productId: vi.productId,
                jumlah: vi.jumlah,
                hargaSatuan: vi.hargaSatuan,
                subtotal: vi.subtotal,
              })),
            },
          },
          include: {
            orderItems: { include: { product: true } },
          },
        })

        // 2. Kurangi stok. updateMany dengan syarat stok >= jumlah mencegah stok minus.
        for (const vi of validatedItems) {
          const result = await tx.product.updateMany({
            where: {
              id: vi.productId,
              isActive: true,
              stok: { gte: vi.jumlah },
            },
            data: { stok: { decrement: vi.jumlah } },
          })

          if (result.count !== 1) {
            throw new Error(`STOCK_CHANGED:${vi.productId}`)
          }
        }

        return newOrder
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    )

    // ── Kirim notifikasi Wablas ke Admin (fire & forget) ──
    const waPayload: WhatsAppOrderPayload = {
      kodeMitra: order.kodeMitra,
      namaCabang: order.namaCabang,
      namaPic: order.namaPic,
      whatsapp: order.whatsapp,
      alamat: order.alamat,
      catatan: order.catatan,
      totalHarga: order.totalHarga,
      items: order.orderItems.map(oi => ({
        namaProduk: oi.product.namaProduk,
        satuan: oi.product.satuan,
        jumlah: oi.jumlah,
        hargaSatuan: oi.hargaSatuan,
        subtotal: oi.subtotal,
      })),
      createdAt: order.createdAt.toISOString(),
    }

    // Jangan biarkan kegagalan notifikasi WhatsApp menggagalkan response checkout.
    void Promise.resolve(sendWablasNotification(waPayload)).catch(error => {
      console.error('[Wablas notification]', error)
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orders]', error)

    if (error instanceof Error && error.message.startsWith('STOCK_CHANGED:')) {
      return NextResponse.json(
        { error: 'Stok berubah saat pesanan diproses. Silakan periksa keranjang lalu coba lagi.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal membuat pesanan. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
