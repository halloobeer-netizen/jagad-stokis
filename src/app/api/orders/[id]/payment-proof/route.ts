import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const proof = await db.paymentProof.findUnique({ where: { orderId: id } })
    if (!proof) return NextResponse.json({ error: 'Bukti pembayaran belum tersedia' }, { status: 404 })
    return new NextResponse(proof.fileData, {
      status: 200,
      headers: {
        'Content-Type': proof.mimeType,
        'Content-Disposition': `inline; filename="${proof.fileName.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[GET payment-proof]', error)
    return NextResponse.json({ error: 'Gagal membuka bukti pembayaran' }, { status: 500 })
  }
}
