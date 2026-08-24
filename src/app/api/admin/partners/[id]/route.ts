import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPin } from '@/lib/partner-auth'

export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const {id}=await params;const b=await req.json();const data:any={};
  for(const k of ['namaCabang','namaPic','alamat']) if(b[k]!==undefined)data[k]=String(b[k]).trim();
  if(b.whatsapp!==undefined)data.whatsapp=String(b.whatsapp).replace(/\D/g,'');
  if(b.isActive!==undefined)data.isActive=Boolean(b.isActive);
  if(b.pin!==undefined){const pin=String(b.pin).trim();if(!/^\d{4,8}$/.test(pin))return NextResponse.json({error:'PIN harus 4-8 angka'},{status:400});data.pinHash=hashPin(pin)}
  const p=await db.partner.update({where:{id},data});const{pinHash,...safe}=p;return NextResponse.json(safe)
 }catch(e){console.error(e);return NextResponse.json({error:'Gagal memperbarui mitra'},{status:500})}
}

export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const{id}=await params;const p=await db.partner.findUnique({where:{id}});if(!p)return NextResponse.json({error:'Mitra tidak ditemukan'},{status:404});const orders=await db.order.findMany({where:{kodeMitra:p.kodeMitra},include:{orderItems:{include:{product:true}}},orderBy:{createdAt:'desc'}});const{pinHash,...safe}=p;return NextResponse.json({partner:safe,orders})}catch(e){return NextResponse.json({error:'Gagal mengambil detail'},{status:500})}
}
