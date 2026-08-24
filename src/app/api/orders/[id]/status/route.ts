import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOrderStatusNotification } from '@/lib/whatsapp'

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

    // Ambil order lama agar notifikasi hanya terkirim bila status benar-benar berubah.
    const existingOrder = await db.order.findUnique({ where: { id } })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (existingOrder.status === status) {
      return NextResponse.json(existingOrder)
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
    })

    // Status tetap tersimpan walaupun provider WhatsApp sedang bermasalah.
    // Request ditunggu agar serverless Vercel tidak berhenti sebelum Fonnte menerima request.
    const notificationSent = await sendOrderStatusNotification({
      kodeMitra: order.kodeMitra,
      namaCabang: order.namaCabang,
      namaPic: order.namaPic,
      whatsapp: order.whatsapp,
      totalHarga: order.totalHarga,
      status: order.status,
    })

    return NextResponse.json({ ...order, notificationSent })
  } catch (error) {
    console.error('[PUT /api/orders/[id]/status]', error)
    return NextResponse.json({ error: 'Gagal mengubah status' }, { status: 500 })
  }
}
