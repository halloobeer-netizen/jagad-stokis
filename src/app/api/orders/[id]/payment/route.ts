import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID = ['belum_bayar', 'menunggu_verifikasi', 'lunas', 'ditolak']

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { paymentStatus } = await request.json()
    if (!VALID.includes(paymentStatus)) return NextResponse.json({ error: 'Status pembayaran tidak valid' }, { status: 400 })

    const order = await db.order.update({
      where: { id },
      data: {
        paymentStatus,
        paymentVerifiedAt: paymentStatus === 'lunas' ? new Date() : null,
      },
    })
    return NextResponse.json(order)
  } catch (error) {
    console.error('[PUT payment status]', error)
    return NextResponse.json({ error: 'Gagal mengubah status pembayaran' }, { status: 500 })
  }
}
