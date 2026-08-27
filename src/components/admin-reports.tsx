'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, ClipboardList, WalletCards, Users, Package, Download, RefreshCw, CalendarDays, FileText, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah, formatTanggal } from '@/lib/utils'

type OrderItem = { jumlah:number; subtotal:number; product:{ namaProduk:string; satuan:string } }
type Order = { id:string; kodeMitra:string; namaCabang:string; namaPic:string; totalHarga:number; status:string; paymentMethod?:string; paymentStatus?:string; createdAt:string; orderItems:OrderItem[] }

export function AdminReports(){
  const [orders,setOrders]=useState<Order[]>([])
  const [loading,setLoading]=useState(true)
  const [preset,setPreset]=useState('30d')
  const [start,setStart]=useState('')
  const [end,setEnd]=useState('')

  const load=useCallback(async()=>{try{setLoading(true);const r=await fetch('/api/orders',{cache:'no-store'});if(!r.ok)throw new Error();setOrders(await r.json())}catch{toast.error('Gagal memuat laporan')}finally{setLoading(false)}},[])
  useEffect(()=>{load()},[load])

  const filtered=useMemo(()=>{
    const now=new Date(); let from:Date|null=null; let to:Date|null=null
    if(preset==='today'){from=new Date(now.getFullYear(),now.getMonth(),now.getDate());to=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)}
    else if(preset==='7d'){from=new Date(now);from.setDate(from.getDate()-7)}
    else if(preset==='30d'){from=new Date(now);from.setDate(from.getDate()-30)}
    else if(preset==='month'){from=new Date(now.getFullYear(),now.getMonth(),1);to=new Date(now.getFullYear(),now.getMonth()+1,1)}
    else if(preset==='custom'){if(start)from=new Date(start+'T00:00:00');if(end){to=new Date(end+'T00:00:00');to.setDate(to.getDate()+1)}}
    return orders.filter(o=>{const d=new Date(o.createdAt);return(!from||d>=from)&&(!to||d<to)})
  },[orders,preset,start,end])

  const periodLabel=useMemo(()=>{
    const map:Record<string,string>={today:'Hari Ini', '7d':'7 Hari Terakhir','30d':'30 Hari Terakhir',month:'Bulan Ini',all:'Semua Periode'}
    if(preset==='custom') return `${start||'Awal'} s/d ${end||'Akhir'}`
    return map[preset]||'Periode Laporan'
  },[preset,start,end])

  const stats=useMemo(()=>{
    const omzet=filtered.reduce((s,o)=>s+o.totalHarga,0)
    const lunas=filtered.filter(o=>o.paymentStatus==='lunas').reduce((s,o)=>s+o.totalHarga,0)
    const belum=filtered.filter(o=>o.paymentStatus!=='lunas').reduce((s,o)=>s+o.totalHarga,0)
    const partners=new Set(filtered.map(o=>o.kodeMitra)).size
    return {orders:filtered.length,omzet,lunas,belum,partners,avg:filtered.length?Math.round(omzet/filtered.length):0}
  },[filtered])

  const topProducts=useMemo(()=>{const m=new Map<string,{qty:number,total:number}>();filtered.forEach(o=>o.orderItems.forEach(i=>{const x=m.get(i.product.namaProduk)||{qty:0,total:0};x.qty+=i.jumlah;x.total+=i.subtotal;m.set(i.product.namaProduk,x)}));return [...m.entries()].sort((a,b)=>b[1].qty-a[1].qty).slice(0,8)},[filtered])
  const topPartners=useMemo(()=>{const m=new Map<string,{cabang:string,count:number,total:number}>();filtered.forEach(o=>{const x=m.get(o.kodeMitra)||{cabang:o.namaCabang,count:0,total:0};x.count++;x.total+=o.totalHarga;m.set(o.kodeMitra,x)});return [...m.entries()].sort((a,b)=>b[1].total-a[1].total).slice(0,8)},[filtered])

  function exportCsv(){
    const rows=[['Tanggal','Order ID','Kode Mitra','Cabang','PIC','Total','Status Pesanan','Metode Pembayaran','Status Pembayaran'],...filtered.map(o=>[new Date(o.createdAt).toLocaleString('id-ID'),o.id,o.kodeMitra,o.namaCabang,o.namaPic,String(o.totalHarga),o.status,o.paymentMethod||'cod',o.paymentStatus||'belum_bayar'])]
    const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`laporan-jagad-stockis-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)
  }

  function pdfEscape(v:string){return v.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,' ')}
  function shortMoney(n:number){return 'Rp '+new Intl.NumberFormat('id-ID').format(n)}

  function downloadPdf(){
    const lines:string[]=[
      'JAGAD STOCKIS - LAPORAN RINGKAS',
      `Periode: ${periodLabel}`,
      `Dibuat: ${new Date().toLocaleString('id-ID')}`,
      '',
      `Omzet: ${shortMoney(stats.omzet)}`,
      `Jumlah Pesanan: ${stats.orders}`,
      `Pembayaran Lunas: ${shortMoney(stats.lunas)}`,
      `Belum Lunas: ${shortMoney(stats.belum)}`,
      `Mitra Aktif: ${stats.partners}`,
      `Rata-rata Order: ${shortMoney(stats.avg)}`,
      '',
      'PRODUK PALING LAKU',
      ...topProducts.slice(0,5).map(([name,x],i)=>`${i+1}. ${name} - ${x.qty} unit - ${shortMoney(x.total)}`),
      '',
      'MITRA TERATAS',
      ...topPartners.slice(0,5).map(([kode,x],i)=>`${i+1}. ${kode} / ${x.cabang} - ${x.count} order - ${shortMoney(x.total)}`),
      '',
      'TRANSAKSI TERBARU',
      ...filtered.slice(0,12).map(o=>`${new Date(o.createdAt).toLocaleDateString('id-ID')} | ${o.kodeMitra} | ${shortMoney(o.totalHarga)} | ${(o.paymentStatus||'belum_bayar').replaceAll('_',' ')}`),
    ]
    const pageChunks:string[][]=[];for(let i=0;i<lines.length;i+=42)pageChunks.push(lines.slice(i,i+42))
    const objects:string[]=[];const pageIds:number[]=[];const contentIds:number[]=[]
    objects.push('<< /Type /Catalog /Pages 2 0 R >>')
    objects.push('')
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
    for(const chunk of pageChunks){
      const contentId=objects.length+1;contentIds.push(contentId)
      let y=800;let stream='BT\n/F1 10 Tf\n'
      chunk.forEach((line,idx)=>{const isHeading=idx===0||line==='PRODUK PALING LAKU'||line==='MITRA TERATAS'||line==='TRANSAKSI TERBARU';stream+=`${isHeading?'/F2 12 Tf':'/F1 10 Tf'}\n1 0 0 1 48 ${y} Tm (${pdfEscape(line)}) Tj\n`;y-=18})
      stream+='ET'
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
      const pageId=objects.length+1;pageIds.push(pageId)
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`)
    }
    objects[1]=`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`
    let pdf='%PDF-1.4\n';const offsets=[0]
    objects.forEach((obj,i)=>{offsets[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`})
    const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objects.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
    const blob=new Blob([pdf],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`laporan-ringkas-jagad-stockis-${new Date().toISOString().slice(0,10)}.pdf`;a.click();URL.revokeObjectURL(url);toast.success('PDF laporan berhasil dibuat')
  }

  function printView(){
    const w=window.open('','_blank','width=1000,height=800');if(!w){toast.error('Popup diblokir browser');return}
    const trx=filtered.slice(0,100).map(o=>`<tr><td>${new Date(o.createdAt).toLocaleDateString('id-ID')}</td><td><b>${o.kodeMitra}</b><br><small>${o.namaCabang}</small></td><td>${shortMoney(o.totalHarga)}</td><td>${o.status}</td><td>${(o.paymentMethod||'cod').replaceAll('_',' ')}<br><small>${(o.paymentStatus||'belum_bayar').replaceAll('_',' ')}</small></td></tr>`).join('')
    const products=topProducts.slice(0,5).map(([name,x],i)=>`<tr><td>${i+1}</td><td>${name}</td><td>${x.qty}</td><td>${shortMoney(x.total)}</td></tr>`).join('')
    const partners=topPartners.slice(0,5).map(([kode,x],i)=>`<tr><td>${i+1}</td><td><b>${kode}</b><br><small>${x.cabang}</small></td><td>${x.count}</td><td>${shortMoney(x.total)}</td></tr>`).join('')
    w.document.write(`<!doctype html><html><head><title>Laporan JAGAD STOCKIS</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0f172a;margin:0;font-size:12px}h1{font-size:22px;margin:0}.sub{color:#64748b;margin-top:5px}.line{height:4px;background:#dc2626;margin:14px 0 18px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px}.metric{border:1px solid #e2e8f0;border-radius:8px;padding:10px}.metric span{color:#64748b;font-size:10px}.metric b{display:block;font-size:15px;margin-top:4px}h2{font-size:14px;margin:18px 0 8px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e2e8f0;padding:7px 6px;text-align:left;vertical-align:top}th{background:#f8fafc;font-size:10px;text-transform:uppercase}small{color:#64748b}.footer{margin-top:18px;border-top:1px solid #e2e8f0;padding-top:8px;color:#94a3b8;font-size:10px}.no-print{position:fixed;right:20px;top:20px;background:#dc2626;color:white;border:0;border-radius:8px;padding:10px 14px;font-weight:bold;cursor:pointer}@media print{.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">Cetak / Simpan PDF</button><h1>JAGAD STOCKIS</h1><div class="sub">Laporan Ringkas • ${periodLabel}<br>Dibuat ${new Date().toLocaleString('id-ID')}</div><div class="line"></div><div class="metrics"><div class="metric"><span>OMZET</span><b>${shortMoney(stats.omzet)}</b></div><div class="metric"><span>PESANAN</span><b>${stats.orders}</b></div><div class="metric"><span>PEMBAYARAN LUNAS</span><b>${shortMoney(stats.lunas)}</b></div><div class="metric"><span>BELUM LUNAS</span><b>${shortMoney(stats.belum)}</b></div><div class="metric"><span>MITRA AKTIF</span><b>${stats.partners}</b></div><div class="metric"><span>RATA-RATA ORDER</span><b>${shortMoney(stats.avg)}</b></div></div><h2>Produk Paling Laku</h2><table><thead><tr><th>No</th><th>Produk</th><th>Qty</th><th>Nilai</th></tr></thead><tbody>${products||'<tr><td colspan="4">Belum ada data</td></tr>'}</tbody></table><h2>Mitra Teratas</h2><table><thead><tr><th>No</th><th>Mitra</th><th>Order</th><th>Belanja</th></tr></thead><tbody>${partners||'<tr><td colspan="4">Belum ada data</td></tr>'}</tbody></table><h2>Detail Transaksi</h2><table><thead><tr><th>Tanggal</th><th>Mitra</th><th>Total</th><th>Pesanan</th><th>Pembayaran</th></tr></thead><tbody>${trx||'<tr><td colspan="5">Belum ada transaksi</td></tr>'}</tbody></table><div class="footer">JAGAD STOCKIS • Franchise Supply Network</div></body></html>`);w.document.close();w.focus()
  }

  return <div className="space-y-5">
    <div className="rounded-2xl border bg-white p-4 flex flex-col xl:flex-row gap-3 xl:items-end justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-red-600">Periode Laporan</p><div className="flex flex-wrap gap-2 mt-3">{[['today','Hari Ini'],['7d','7 Hari'],['30d','30 Hari'],['month','Bulan Ini'],['all','Semua'],['custom','Custom']].map(([v,l])=><button key={v} onClick={()=>setPreset(v)} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${preset===v?'bg-red-600 border-red-600 text-white':'bg-white border-slate-200 text-slate-600'}`}>{l}</button>)}</div>{preset==='custom'&&<div className="flex gap-2 mt-3"><Input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-40"/><Input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="w-40"/></div>}</div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button><Button variant="outline" onClick={printView}><Printer className="h-4 w-4 mr-2"/>Print View</Button><Button variant="outline" onClick={downloadPdf}><FileText className="h-4 w-4 mr-2"/>Download PDF</Button><Button onClick={exportCsv} className="bg-red-600 hover:bg-red-700"><Download className="h-4 w-4 mr-2"/>Export CSV</Button></div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <Metric label="Omzet" value={formatRupiah(stats.omzet)} icon={BarChart3}/><Metric label="Pesanan" value={String(stats.orders)} icon={ClipboardList}/><Metric label="Pembayaran Lunas" value={formatRupiah(stats.lunas)} icon={WalletCards}/><Metric label="Belum Lunas" value={formatRupiah(stats.belum)} icon={CalendarDays}/><Metric label="Mitra Aktif" value={String(stats.partners)} icon={Users}/><Metric label="Rata-rata Order" value={formatRupiah(stats.avg)} icon={Package}/>
    </div>

    <div className="grid xl:grid-cols-2 gap-4">
      <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between mb-4"><h3 className="font-black">Produk Paling Laku</h3><Badge variant="outline">Top {topProducts.length}</Badge></div><Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Nilai</TableHead></TableRow></TableHeader><TableBody>{topProducts.map(([name,x])=><TableRow key={name}><TableCell className="font-semibold">{name}</TableCell><TableCell className="text-center font-bold">{x.qty}</TableCell><TableCell className="text-right font-bold">{formatRupiah(x.total)}</TableCell></TableRow>)}</TableBody></Table>{topProducts.length===0&&<p className="text-sm text-slate-400 text-center py-8">Belum ada data.</p>}</CardContent></Card>
      <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between mb-4"><h3 className="font-black">Mitra Teratas</h3><Badge variant="outline">Top {topPartners.length}</Badge></div><Table><TableHeader><TableRow><TableHead>Mitra</TableHead><TableHead className="text-center">Order</TableHead><TableHead className="text-right">Belanja</TableHead></TableRow></TableHeader><TableBody>{topPartners.map(([kode,x])=><TableRow key={kode}><TableCell><p className="font-bold">{kode}</p><p className="text-xs text-slate-400">{x.cabang}</p></TableCell><TableCell className="text-center font-bold">{x.count}</TableCell><TableCell className="text-right font-bold">{formatRupiah(x.total)}</TableCell></TableRow>)}</TableBody></Table>{topPartners.length===0&&<p className="text-sm text-slate-400 text-center py-8">Belum ada data.</p>}</CardContent></Card>
    </div>

    <Card className="rounded-2xl overflow-hidden"><CardContent className="p-0"><div className="p-5 border-b"><h3 className="font-black">Detail Transaksi</h3><p className="text-xs text-slate-400 mt-1">{loading?'Memuat...':`${filtered.length} transaksi pada periode terpilih`}</p></div><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Tanggal</TableHead><TableHead>Mitra</TableHead><TableHead>Total</TableHead><TableHead>Pesanan</TableHead><TableHead>Pembayaran</TableHead></TableRow></TableHeader><TableBody>{filtered.slice(0,100).map(o=><TableRow key={o.id}><TableCell className="text-xs whitespace-nowrap">{formatTanggal(o.createdAt)}</TableCell><TableCell><p className="font-bold">{o.kodeMitra}</p><p className="text-xs text-slate-400">{o.namaCabang}</p></TableCell><TableCell className="font-bold whitespace-nowrap">{formatRupiah(o.totalHarga)}</TableCell><TableCell className="capitalize">{o.status}</TableCell><TableCell><span className="capitalize">{(o.paymentMethod||'cod').replace('_',' ')}</span><p className={`text-xs font-bold mt-1 ${o.paymentStatus==='lunas'?'text-emerald-600':'text-amber-600'}`}>{(o.paymentStatus||'belum_bayar').replace('_',' ')}</p></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
  </div>
}

function Metric({label,value,icon:Icon}:{label:string;value:string;icon:any}){return <Card className="rounded-2xl"><CardContent className="p-4"><div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Icon className="h-4 w-4"/></div><p className="text-[11px] text-slate-400 font-semibold mt-3">{label}</p><p className="font-black text-lg mt-1 break-words">{value}</p></CardContent></Card>}
