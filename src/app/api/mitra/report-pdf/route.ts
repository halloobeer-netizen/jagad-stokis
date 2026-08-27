import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { partnerCookie, readPartnerSession } from '@/lib/partner-auth'

function esc(s:string){return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,' ')}
function rp(n:number){return 'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(n)}
function dateId(d:Date){return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}

function buildPdf(pages:string[][]){
  const objects:string[]=[]
  objects[1]='<< /Type /Catalog /Pages 2 0 R >>'
  const pageIds:number[]=[]
  let next=4
  for(let i=0;i<pages.length;i++){pageIds.push(next);next+=2}
  objects[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  pages.forEach((lines,idx)=>{
    const pageId=pageIds[idx],contentId=pageId+1
    const commands:string[]=['BT','/F1 10 Tf','50 790 Td']
    lines.forEach((line,i)=>{if(i>0)commands.push('0 -15 Td');commands.push(`(${esc(line)}) Tj`)})
    commands.push('ET')
    const stream=commands.join('\n')
    objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    objects[contentId]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })
  let pdf='%PDF-1.4\n'
  const offsets:number[]=[0]
  for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}
  const xref=pdf.length
  pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`
  pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export async function GET(req:NextRequest){
  const session=readPartnerSession(req.cookies.get(partnerCookie.name)?.value)
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401})
  const partner=await db.partner.findUnique({where:{id:session.partnerId}})
  if(!partner?.isActive)return NextResponse.json({error:'Unauthorized'},{status:401})
  const all=await db.order.findMany({where:{kodeMitra:partner.kodeMitra},include:{orderItems:{include:{product:true}}},orderBy:{createdAt:'desc'}})
  const p=req.nextUrl.searchParams,preset=p.get('preset')||'30d',start=p.get('start')||'',end=p.get('end')||''
  const now=new Date();let from:Date|null=null,to:Date|null=null
  if(preset==='today'){from=new Date(now.getFullYear(),now.getMonth(),now.getDate());to=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)}
  else if(preset==='7d'){from=new Date(now);from.setDate(from.getDate()-7)}
  else if(preset==='30d'){from=new Date(now);from.setDate(from.getDate()-30)}
  else if(preset==='month'){from=new Date(now.getFullYear(),now.getMonth(),1);to=new Date(now.getFullYear(),now.getMonth()+1,1)}
  else if(preset==='custom'){if(start)from=new Date(start+'T00:00:00');if(end){to=new Date(end+'T00:00:00');to.setDate(to.getDate()+1)}}
  const orders=all.filter(o=>(!from||o.createdAt>=from)&&(!to||o.createdAt<to))
  const total=orders.reduce((s,o)=>s+o.totalHarga,0),lunas=orders.filter(o=>o.paymentStatus==='lunas').reduce((s,o)=>s+o.totalHarga,0)
  const productMap=new Map<string,{qty:number,total:number}>();orders.forEach(o=>o.orderItems.forEach(i=>{const x=productMap.get(i.product.namaProduk)||{qty:0,total:0};x.qty+=i.jumlah;x.total+=i.subtotal;productMap.set(i.product.namaProduk,x)}))
  const period=preset==='today'?'Hari Ini':preset==='7d'?'7 Hari Terakhir':preset==='30d'?'30 Hari Terakhir':preset==='month'?'Bulan Ini':preset==='all'?'Semua Periode':`${start||'-'} s/d ${end||'-'}`
  const lines=[
    'JAGAD STOCKIS - LAPORAN MITRA','',`Mitra: ${partner.kodeMitra} - ${partner.namaCabang}`,`PIC: ${partner.namaPic}`,`Periode: ${period}`,`Dicetak: ${dateId(new Date())}`,'',
    `Total Pesanan: ${orders.length}`,`Total Belanja: ${rp(total)}`,`Sudah Lunas: ${rp(lunas)}`,`Belum Lunas: ${rp(total-lunas)}`,'','PRODUK SERING DIBELI',
    ...[...productMap.entries()].sort((a,b)=>b[1].qty-a[1].qty).slice(0,8).map(([n,x],i)=>`${i+1}. ${n} - ${x.qty} item - ${rp(x.total)}`),'','RIWAYAT TRANSAKSI',
    ...orders.map(o=>`${dateId(o.createdAt)} | #${o.id.slice(-8).toUpperCase()} | ${(o.paymentMethod||'cod').toUpperCase()} | ${(o.paymentStatus||'belum_bayar').replaceAll('_',' ')} | ${rp(o.totalHarga)}`)
  ]
  const pages:string[][]=[];for(let i=0;i<lines.length;i+=46)pages.push(lines.slice(i,i+46))
  const bytes=buildPdf(pages.length?pages:[['JAGAD STOCKIS - LAPORAN MITRA','Tidak ada data.']])
  const filename=`laporan-${partner.kodeMitra}-${new Date().toISOString().slice(0,10)}.pdf`
  return new NextResponse(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'no-store'}})
}
