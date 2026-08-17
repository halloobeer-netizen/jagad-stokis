import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH: Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    const updated = await db.order.update({
      where: { id },
      data: { status },
      include: { orderItems: { include: { product: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/admin/orders/:id]', error)
    return NextResponse.json({ error: 'Gagal mengupdate pesanan' }, { status: 500 })
  }
}
