import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { partnerCookie, readPartnerSession } from '@/lib/partner-auth'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = readPartnerSession(request.cookies.get(partnerCookie.name)?.value)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const order = await db.order.findUnique({ where: { id }, select: { id: true, kodeMitra: true, paymentMethod: true, paymentStatus: true } })
    if (!order || order.kodeMitra !== session.kodeMitra) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    if (order.paymentMethod === 'cod') return NextResponse.json({ error: 'COD tidak memerlukan bukti pembayaran' }, { status: 400 })
    if (order.paymentStatus === 'lunas') return NextResponse.json({ error: 'Pembayaran sudah diverifikasi' }, { status: 409 })

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'File bukti pembayaran wajib dipilih' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Format file harus JPG, PNG, WEBP, atau PDF' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Ukuran file maksimal 5 MB' }, { status: 400 })

    const bytes = Buffer.from(await file.arrayBuffer())
    await db.paymentProof.upsert({
      where: { orderId: id },
      create: { orderId: id, mimeType: file.type, fileName: file.name.slice(0, 180), fileData: bytes },
      update: { mimeType: file.type, fileName: file.name.slice(0, 180), fileData: bytes, createdAt: new Date() },
    })
    await db.order.update({ where: { id }, data: { paymentStatus: 'menunggu_verifikasi', paymentVerifiedAt: null } })

    return NextResponse.json({ ok: true, paymentStatus: 'menunggu_verifikasi' })
  } catch (error) {
    console.error('[POST payment-proof]', error)
    return NextResponse.json({ error: 'Gagal mengunggah bukti pembayaran' }, { status: 500 })
  }
}
