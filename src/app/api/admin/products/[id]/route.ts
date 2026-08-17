import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { namaProduk, satuan, harga, stok } = body

    if (!namaProduk?.trim()) {
      return NextResponse.json({ error: 'Nama produk wajib diisi', field: 'namaProduk' }, { status: 400 })
    }
    if (!satuan?.trim()) {
      return NextResponse.json({ error: 'Satuan wajib diisi', field: 'satuan' }, { status: 400 })
    }
    if (harga == null || Number(harga) < 0) {
      return NextResponse.json({ error: 'Harga harus berupa angka positif', field: 'harga' }, { status: 400 })
    }
    if (stok == null || Number(stok) < 0) {
      return NextResponse.json({ error: 'Stok harus berupa angka positif', field: 'stok' }, { status: 400 })
    }

    const product = await db.product.update({
      where: { id },
      data: {
        namaProduk: namaProduk.trim(),
        satuan: satuan.trim(),
        harga: Math.floor(Number(harga)),
        stok: Math.floor(Number(stok)),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PUT /api/admin/products/[id]]', error)
    return NextResponse.json({ error: 'Gagal mengubah produk' }, { status: 500 })
  }
}
