import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPartnerSession, partnerCookie, verifyPin } from '@/lib/partner-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const kodeMitra = String(body.kodeMitra || '').trim().toUpperCase()
    const pin = String(body.pin || '').trim()
    if (!kodeMitra || !/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: 'Kode mitra atau PIN tidak valid' }, { status: 400 })

    const partner = await db.partner.findUnique({ where: { kodeMitra } })
    if (!partner || !partner.isActive || !verifyPin(pin, partner.pinHash)) {
      return NextResponse.json({ error: 'Kode mitra atau PIN salah' }, { status: 401 })
    }

    const token = createPartnerSession(partner.id, partner.kodeMitra)
    const res = NextResponse.json({ ok: true, partner: { kodeMitra: partner.kodeMitra, namaCabang: partner.namaCabang, namaPic: partner.namaPic } })
    res.cookies.set(partnerCookie.name, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: partnerCookie.maxAge })
    return res
  } catch (error) {
    console.error('[POST /api/mitra/login]', error)
    return NextResponse.json({ error: 'Login gagal' }, { status: 500 })
  }
}
