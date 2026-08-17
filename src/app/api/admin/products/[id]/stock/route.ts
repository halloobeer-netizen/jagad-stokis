import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { stok } = await request.json()

    if (stok == null || Number(stok) < 0 || isNaN(Number(stok))) {
      return NextResponse.json({ error: 'Stok harus angka positif' }, { status: 400 })
    }

    const product = await db.product.update({
      where: { id },
      data: { stok: Math.floor(Number(stok)) },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PUT /api/admin/products/[id]/stock]', error)
    return NextResponse.json({ error: 'Gagal mengubah stok' }, { status: 500 })
  }
}
