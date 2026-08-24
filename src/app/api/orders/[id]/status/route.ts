import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_STATUSES = ['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan']

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('[PUT /api/orders/[id]/status]', error)
    return NextResponse.json({ error: 'Gagal mengubah status' }, { status: 500 })
  }
}
