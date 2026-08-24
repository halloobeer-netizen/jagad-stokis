import crypto from 'crypto'

const COOKIE_NAME = 'jagad_partner_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function secret() {
  return process.env.PARTNER_SESSION_SECRET || process.env.FOONTE_TOKEN || process.env.FONNTE_TOKEN || ''
}

export function hashPin(pin: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPin(pin: string, stored: string): boolean {
  try {
    const [salt, expected] = stored.split(':')
    if (!salt || !expected) return false
    const actual = crypto.scryptSync(pin, salt, 64)
    const expectedBuffer = Buffer.from(expected, 'hex')
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer)
  } catch { return false }
}

export function createPartnerSession(partnerId: string, kodeMitra: string): string {
  const payload = Buffer.from(JSON.stringify({ partnerId, kodeMitra, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function readPartnerSession(token?: string | null): { partnerId: string; kodeMitra: string } | null {
  if (!token || !secret()) return null
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.partnerId || !data.kodeMitra || Date.now() > data.exp) return null
    return { partnerId: data.partnerId, kodeMitra: data.kodeMitra }
  } catch { return null }
}

export const partnerCookie = { name: COOKIE_NAME, maxAge: SESSION_MAX_AGE }
