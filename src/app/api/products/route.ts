import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: { namaProduk: 'asc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    // Log the FULL error message so it's visible in Vercel Function Logs
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/products] Database error:', message)

    // Help diagnose: is DATABASE_URL missing or misconfigured?
    if (!process.env.DATABASE_URL) {
      console.error('[/api/products] DATABASE_URL is not set in environment variables')
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi. DATABASE_URL belum diatur.' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: 'Gagal mengambil data produk', detail: message },
      { status: 500 },
    )
  }
}
