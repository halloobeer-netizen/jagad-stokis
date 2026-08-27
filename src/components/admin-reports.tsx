'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, ClipboardList, WalletCards, Users, Package, Download, RefreshCw, CalendarDays } from 'lucide-react'
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

  return <div className="space-y-5">
    <div className="rounded-2xl border bg-white p-4 flex flex-col xl:flex-row gap-3 xl:items-end justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-red-600">Periode Laporan</p><div className="flex flex-wrap gap-2 mt-3">{[['today','Hari Ini'],['7d','7 Hari'],['30d','30 Hari'],['month','Bulan Ini'],['all','Semua'],['custom','Custom']].map(([v,l])=><button key={v} onClick={()=>setPreset(v)} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${preset===v?'bg-red-600 border-red-600 text-white':'bg-white border-slate-200 text-slate-600'}`}>{l}</button>)}</div>{preset==='custom'&&<div className="flex gap-2 mt-3"><Input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-40"/><Input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="w-40"/></div>}</div>
      <div className="flex gap-2"><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button><Button onClick={exportCsv} className="bg-red-600 hover:bg-red-700"><Download className="h-4 w-4 mr-2"/>Export CSV</Button></div>
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
