import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { namaProduk: 'asc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('[GET /api/admin/products]', error)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const product = await db.product.create({
      data: {
        namaProduk: namaProduk.trim(),
        satuan: satuan.trim(),
        harga: Math.floor(Number(harga)),
        stok: Math.floor(Number(stok)),
        isActive: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/products]', error)
    return NextResponse.json({ error: 'Gagal menambah produk' }, { status: 500 })
  }
}
