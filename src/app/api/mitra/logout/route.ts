import { NextResponse } from 'next/server'
import { partnerCookie } from '@/lib/partner-auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(partnerCookie.name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
