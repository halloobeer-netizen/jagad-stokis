import { NextResponse } from 'next/server'

/**
 * Diagnostic endpoint — visit /api/debug to see EXACTLY what's happening on Vercel.
 * DELETE this file after the issue is resolved.
 */
export async function GET() {
  const info: Record<string, unknown> = {}

  // 1. Environment
  info.NODE_ENV = process.env.NODE_ENV
  info.HAS_DATABASE_URL = !!process.env.DATABASE_URL
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL
    const masked = url.replace(/:([^@]+)@/, ':****@')
    info.DATABASE_URL_MASKED = masked
    info.URL_STARTS_WITH_POSTGRESQL = url.startsWith('postgresql://')
    info.URL_HAS_SSLMODE = url.includes('sslmode=')
    info.URL_HAS_PGBOUNCER = url.includes('pgbouncer=')
    info.URL_HAS_POOLER = url.includes('-pooler')
  } else {
    info.DATABASE_URL = 'NOT SET — this is the problem!'
  }

  // 2. Prisma version
  try {
    const { Prisma } = await import('@prisma/client')
    info.Prisma_CLIENT_VERSION = Prisma.prismaVersion?.client || 'unknown'
  } catch (e) {
    info.Prisma_IMPORT_ERROR = e instanceof Error ? e.message : String(e)
  }

  // 3. Try actual DB connection
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1 as ok`
    info.DB_CONNECTION = 'SUCCESS ✅'
  } catch (e) {
    info.DB_CONNECTION = 'FAILED ❌'
    info.DB_ERROR = e instanceof Error ? e.message : String(e)
  }

  // 4. Try fetching products
  try {
    const { db } = await import('@/lib/db')
    const count = await db.product.count()
    info.PRODUCT_COUNT = count
  } catch (e) {
    info.PRODUCT_COUNT_ERROR = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(info, {
    headers: { 'Cache-Control': 'no-store' },
  })
}