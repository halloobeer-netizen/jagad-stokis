import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const updated = await db.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PUT /api/admin/products/[id]/toggle]', error)
    return NextResponse.json({ error: 'Gagal mengubah status produk' }, { status: 500 })
  }
}
