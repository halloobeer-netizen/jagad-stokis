'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Clock3, Eye, RefreshCw, Search, WalletCards, XCircle } from 'lucide-react'

const rupiah=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)
const METHOD:any={cod:'Tunai / COD',transfer:'Transfer Bank',qris:'QRIS'}
const STATUS:any={belum_bayar:{label:'Belum Bayar',cls:'bg-slate-100 text-slate-700'},menunggu_verifikasi:{label:'Menunggu Verifikasi',cls:'bg-amber-100 text-amber-800'},lunas:{label:'Lunas',cls:'bg-emerald-100 text-emerald-800'},ditolak:{label:'Ditolak',cls:'bg-red-100 text-red-700'}}

type Order={id:string;kodeMitra:string;namaCabang:string;namaPic:string;totalHarga:number;createdAt:string;paymentMethod:string;paymentStatus:string;paymentProof?:{id:string;fileName:string;mimeType:string;createdAt:string}|null}

export function AdminPayments(){
 const[orders,setOrders]=useState<Order[]>([]),[loading,setLoading]=useState(true),[q,setQ]=useState(''),[filter,setFilter]=useState('semua'),[busy,setBusy]=useState<string|null>(null)
 const load=useCallback(async()=>{try{setLoading(true);const r=await fetch('/api/orders',{cache:'no-store'});if(!r.ok)throw new Error();setOrders(await r.json())}catch{toast.error('Gagal memuat pembayaran')}finally{setLoading(false)}},[])
 useEffect(()=>{load()},[load])
 const change=async(id:string,paymentStatus:string)=>{try{setBusy(id);const r=await fetch(`/api/orders/${id}/payment`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentStatus})});const j=await r.json();if(!r.ok){toast.error(j.error||'Gagal mengubah status');return}setOrders(x=>x.map(o=>o.id===id?{...o,paymentStatus}:o));toast.success(paymentStatus==='lunas'?'Pembayaran ditandai Lunas':'Status pembayaran diperbarui')}finally{setBusy(null)}}
 const shown=useMemo(()=>orders.filter(o=>{const s=`${o.kodeMitra} ${o.namaCabang} ${o.namaPic}`.toLowerCase();return(!q||s.includes(q.toLowerCase()))&&(filter==='semua'||o.paymentStatus===filter)}),[orders,q,filter])
 const stats={total:orders.length,pending:orders.filter(o=>o.paymentStatus==='menunggu_verifikasi').length,lunas:orders.filter(o=>o.paymentStatus==='lunas').length,unpaid:orders.filter(o=>o.paymentStatus==='belum_bayar').length}
 return <div className="space-y-5">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Semua" value={stats.total}/><Stat label="Belum Bayar" value={stats.unpaid}/><Stat label="Perlu Verifikasi" value={stats.pending}/><Stat label="Lunas" value={stats.lunas}/></div>
  <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input className="pl-9" placeholder="Cari mitra, cabang, PIC..." value={q} onChange={e=>setQ(e.target.value)}/></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="md:w-52"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="semua">Semua Pembayaran</SelectItem><SelectItem value="belum_bayar">Belum Bayar</SelectItem><SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem><SelectItem value="lunas">Lunas</SelectItem><SelectItem value="ditolak">Ditolak</SelectItem></SelectContent></Select><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button></div>
  {loading?<div className="py-10 text-center text-slate-500">Memuat...</div>:<div className="space-y-3">{shown.map(o=><Card key={o.id} className="rounded-2xl"><CardContent className="p-5"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{o.namaCabang}</p><span className="text-xs text-slate-400">{o.kodeMitra}</span><Badge className={`${STATUS[o.paymentStatus]?.cls||'bg-slate-100'} hover:opacity-100`}>{STATUS[o.paymentStatus]?.label||o.paymentStatus}</Badge></div><p className="text-sm text-slate-500 mt-1">{o.namaPic} • {METHOD[o.paymentMethod]||o.paymentMethod}</p><p className="font-black text-lg mt-2">{rupiah(o.totalHarga)}</p></div><div className="flex flex-wrap gap-2 items-center">{o.paymentProof&&<Button variant="outline" size="sm" onClick={()=>window.open(`/api/orders/${o.id}/payment-proof`,'_blank')}><Eye className="h-4 w-4 mr-2"/>Lihat Bukti</Button>}{o.paymentStatus!=='lunas'&&<Button size="sm" disabled={busy===o.id} onClick={()=>change(o.id,'lunas')} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4 mr-2"/>Verifikasi Lunas</Button>}{o.paymentStatus==='menunggu_verifikasi'&&<Button size="sm" variant="outline" disabled={busy===o.id} onClick={()=>change(o.id,'ditolak')} className="text-red-600"><XCircle className="h-4 w-4 mr-2"/>Tolak</Button>}{o.paymentStatus==='ditolak'&&<Button size="sm" variant="outline" disabled={busy===o.id} onClick={()=>change(o.id,'belum_bayar')}><Clock3 className="h-4 w-4 mr-2"/>Reset</Button>}</div></div></CardContent></Card>)}{shown.length===0&&<div className="bg-white border rounded-2xl py-14 text-center text-slate-500"><WalletCards className="h-10 w-10 mx-auto mb-3 text-slate-300"/>Tidak ada data pembayaran.</div>}</div>}
 </div>
}
function Stat({label,value}:{label:string;value:number}){return <Card className="rounded-2xl"><CardContent className="p-4"><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-black mt-1">{value}</p></CardContent></Card>}
