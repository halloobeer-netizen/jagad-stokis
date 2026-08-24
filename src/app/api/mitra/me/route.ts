import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { partnerCookie, readPartnerSession } from '@/lib/partner-auth'

export async function GET(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(partnerCookie.name)?.value)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partner = await db.partner.findUnique({ where: { id: session.partnerId }, select: { kodeMitra: true, namaCabang: true, namaPic: true, whatsapp: true, alamat: true, isActive: true } })
  if (!partner?.isActive) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await db.order.findMany({ where: { kodeMitra: partner.kodeMitra }, include: { orderItems: { include: { product: true } } }, orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ partner, orders })
}
