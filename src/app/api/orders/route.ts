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
    if (!items?.length) {
      return NextResponse.json({ error: 'Pesanan tidak boleh kosong' }, { status: 400 })
    }

    // ── Persiapkan data item & validasi produk + stok ───────
    const validatedItems: {
      productId: string
      jumlah: number
      hargaSatuan: number
      subtotal: number
      namaProduk: string
      satuan: string
    }[] = []

    let totalHarga = 0

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Produk "${item.productId}" tidak ditemukan atau sudah tidak aktif` },
          { status: 400 }
        )
      }

      const jumlah = Math.max(1, Math.floor(item.jumlah))

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
    const order = await db.$transaction(async (tx) => {
      // 1. Buat order
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

      // 2. Kurangi stok untuk setiap produk
      for (const vi of validatedItems) {
        await tx.product.update({
          where: { id: vi.productId },
          data: { stok: { decrement: vi.jumlah } },
        })
      }

      return newOrder
    })

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
    sendWablasNotification(waPayload)

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orders]', error)
    return NextResponse.json(
      { error: 'Gagal membuat pesanan. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
