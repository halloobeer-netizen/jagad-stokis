import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPin } from '@/lib/partner-auth'

export async function GET() {
  try {
    const partners = await db.partner.findMany({ orderBy: { createdAt: 'desc' } })
    const counts = await db.order.groupBy({ by: ['kodeMitra'], _count: { id: true }, _sum: { totalHarga: true } })
    const map = new Map(counts.map(x => [x.kodeMitra, { orderCount: x._count.id, totalBelanja: x._sum.totalHarga || 0 }]))
    return NextResponse.json(partners.map(({ pinHash, ...p }) => ({ ...p, ...(map.get(p.kodeMitra) || { orderCount: 0, totalBelanja: 0 }) })))
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Gagal mengambil data mitra' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json(); const kodeMitra = String(b.kodeMitra||'').trim().toUpperCase(); const pin=String(b.pin||'').trim()
    if(!kodeMitra||!b.namaCabang||!b.namaPic||!b.whatsapp||!/^\d{4,8}$/.test(pin)) return NextResponse.json({error:'Lengkapi data. PIN harus 4-8 angka.'},{status:400})
    const partner=await db.partner.create({data:{kodeMitra,namaCabang:String(b.namaCabang).trim(),namaPic:String(b.namaPic).trim(),whatsapp:String(b.whatsapp).replace(/\D/g,''),alamat:String(b.alamat||'').trim(),pinHash:hashPin(pin)}})
    const {pinHash,...safe}=partner; return NextResponse.json(safe,{status:201})
  } catch(e:any){ if(e?.code==='P2002') return NextResponse.json({error:'Kode mitra sudah digunakan'},{status:409}); console.error(e); return NextResponse.json({error:'Gagal membuat mitra'},{status:500}) }
}
