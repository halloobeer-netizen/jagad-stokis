import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Build a production-safe DATABASE_URL for Neon PostgreSQL.
 *
 * Two critical fixes for Vercel serverless + Neon:
 * 1. Ensures sslmode=require  → Neon REQUIRES SSL for all connections
 * 2. Appends pgbouncer=true  → Neon's pooled URL uses PgBouncer which
 *    does NOT support Prisma's default prepared statements.
 *    Without this flag, every query fails.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please add it in Vercel → Project → Settings → Environment Variables.'
    )
  }

  let finalUrl = url

  // 1. Ensure sslmode=require (mandatory for Neon external connections)
  if (!finalUrl.includes('sslmode=')) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'sslmode=require'
  }

  // 2. In production, add pgbouncer=true for Neon's connection pooler
  //    This disables Prisma's prepared statements, which PgBouncer cannot handle.
  if (process.env.NODE_ENV === 'production') {
    if (!finalUrl.includes('pgbouncer=true')) {
      finalUrl += '&pgbouncer=true'
    }
  }

  return finalUrl
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

// Prevent multiple PrismaClient instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
