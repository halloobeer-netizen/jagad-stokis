'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminDashboardOverview } from '@/components/admin-dashboard-overview'
import { AdminOrders } from '@/components/admin-orders'
import { AdminProducts } from '@/components/admin-products'
import { AdminStok } from '@/components/admin-stok'
import { AdminPartners } from '@/components/admin-partners'
import { AdminPayments } from '@/components/admin-payments'
import { AdminReports } from '@/components/admin-reports'
import { ArrowLeft, BarChart3, Shield, Loader2, ClipboardList, Package, Warehouse, Flame, Users, WalletCards, FileBarChart } from 'lucide-react'

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setLoginError('Password wajib diisi'); return }
    try {
      setLoginLoading(true); setLoginError('')
      const res = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      if (!res.ok) { setLoginError('Password salah'); return }
      setAuthenticated(true); setActiveTab('overview')
    } catch { setLoginError('Gagal terhubung ke server') } finally { setLoginLoading(false) }
  }

  if (!authenticated) return <div className="min-h-screen bg-[#f4f6fa] flex flex-col"><AdminHeader onBack={onBack} compact/><main className="flex-1 grid lg:grid-cols-[1.05fr_.95fr]">
    <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-12 xl:p-16 items-center"><div className="absolute -top-24 -right-24 h-80 w-80 rounded-full border-[44px] border-white/5"/><div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-red-600/20 blur-3xl"/><div className="relative max-w-xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300"><Shield className="h-4 w-4"/> Secure Admin Access</div><h2 className="mt-6 text-5xl font-black leading-[1.02] tracking-[-0.04em]">Kendalikan Operasional<span className="block text-red-500 mt-1">Jagad Stockis</span></h2><p className="mt-5 text-slate-300 leading-relaxed text-base">Pantau ringkasan operasional, pesanan, pembayaran, laporan, produk, stok, dan akun mitra dari satu dashboard.</p><div className="mt-8 grid grid-cols-4 gap-3">{[{icon:BarChart3,label:'Ringkasan'},{icon:ClipboardList,label:'Pesanan'},{icon:WalletCards,label:'Pembayaran'},{icon:FileBarChart,label:'Laporan'},{icon:Package,label:'Produk'},{icon:Warehouse,label:'Stok'},{icon:Users,label:'Mitra'}].map(item=><div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><item.icon className="h-5 w-5 text-red-400"/><p className="mt-3 text-sm font-bold">{item.label}</p></div>)}</div></div></section>
    <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12 bg-white"><Card className="w-full max-w-md border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.08)] rounded-3xl overflow-hidden"><div className="h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-orange-500"/><CardContent className="p-7 sm:p-8 space-y-7"><div className="space-y-4"><div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center"><Shield className="h-7 w-7 text-red-600"/></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Administrator</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Masuk ke Dashboard</h2><p className="mt-2 text-sm text-slate-500">Masukkan password admin untuk mengakses pusat pengelolaan Jagad Stockis.</p></div></div><form onSubmit={handleLogin} className="space-y-4"><div className="space-y-2"><Label htmlFor="admin-password" className="text-sm font-bold text-slate-700">Password Admin</Label><Input id="admin-password" type="password" placeholder="Masukkan password" value={password} onChange={e=>{setPassword(e.target.value);setLoginError('')}} autoFocus className={`h-11 rounded-xl bg-slate-50 border-slate-200 ${loginError?'border-red-400':''}`}/>{loginError&&<p className="text-xs text-red-500">{loginError}</p>}</div><Button type="submit" className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loginLoading}>{loginLoading&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Masuk ke Dashboard</Button></form></CardContent></Card></section>
  </main></div>

  const navItems=[
    {value:'overview',label:'Ringkasan',desc:'Pantau operasional',icon:BarChart3},
    {value:'orders',label:'Pesanan',desc:'Kelola order masuk',icon:ClipboardList},
    {value:'payments',label:'Pembayaran',desc:'Verifikasi pembayaran',icon:WalletCards},
    {value:'reports',label:'Laporan',desc:'Analisis & export data',icon:FileBarChart},
    {value:'products',label:'Produk',desc:'Kelola katalog',icon:Package},
    {value:'stock',label:'Stok',desc:'Pantau persediaan',icon:Warehouse},
    {value:'partners',label:'Mitra',desc:'Kelola akun mitra',icon:Users},
  ]
  const current=navItems.find(item=>item.value===activeTab)??navItems[0]

  return <div className="min-h-screen bg-[#f4f6fa] text-slate-950"><div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="hidden lg:flex lg:flex-col bg-slate-950 text-white border-r border-slate-800 sticky top-0 h-screen"><div className="px-5 py-6 border-b border-white/10"><AdminBrand/></div><div className="px-4 pt-6"><p className="px-3 text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">Menu Utama</p><nav className="mt-3 space-y-1.5">{navItems.map(item=>{const active=activeTab===item.value;return <button key={item.value} onClick={()=>setActiveTab(item.value)} className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${active?'bg-red-600 text-white shadow-lg shadow-red-950/20':'text-slate-300 hover:bg-white/5 hover:text-white'}`}><div className={`h-9 w-9 rounded-xl flex items-center justify-center ${active?'bg-white/15':'bg-white/5'}`}><item.icon className="h-4.5 w-4.5"/></div><div><p className="text-sm font-bold">{item.label}</p><p className={`text-[11px] mt-0.5 ${active?'text-red-100':'text-slate-500'}`}>{item.desc}</p></div></button>})}</nav></div><div className="mt-auto p-4 border-t border-white/10"><div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center"><Shield className="h-4 w-4"/></div><div><p className="text-xs font-bold">Administrator</p><p className="text-[10px] text-slate-500 mt-0.5">Secure session</p></div></div></div><Button onClick={onBack} variant="ghost" className="mt-2 w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"><ArrowLeft className="h-4 w-4"/>Kembali ke Toko</Button></div></aside>
    <div className="min-w-0 flex flex-col min-h-screen"><AdminHeader onBack={onBack}/><main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6"><section className="rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white shadow-xl"><div className="px-5 sm:px-7 py-6 flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="flex items-center gap-2 text-xs font-black tracking-[0.18em] uppercase text-red-300"><Flame className="h-4 w-4"/>Operations Center</div><h1 className="mt-2 text-2xl sm:text-3xl font-black">Dashboard Administrator</h1><p className="mt-2 text-sm text-slate-400">Pantau performa dan kelola aktivitas operasional Jagad Stockis dari satu pusat kontrol.</p></div><Badge className="self-start md:self-auto bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">● Sistem Aktif</Badge></div></section>
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:hidden">{navItems.map(item=>{const active=activeTab===item.value;return <button key={item.value} onClick={()=>setActiveTab(item.value)} className={`rounded-2xl border p-4 text-left ${active?'bg-red-600 border-red-600 text-white':'bg-white border-slate-200 text-slate-800'}`}><item.icon className={`h-5 w-5 ${active?'text-white':'text-red-600'}`}/><p className="mt-3 text-sm font-black">{item.label}</p><p className={`mt-1 text-[11px] ${active?'text-red-100':'text-slate-400'}`}>{item.desc}</p></button>})}</section>
      <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden"><div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Management</p><h2 className="mt-1 text-lg font-black text-slate-950">{current.label}</h2></div><Badge variant="outline" className="border-slate-200 text-slate-500 rounded-full">Admin</Badge></div><div className="p-4 sm:p-6 bg-[#fbfcfe]">{activeTab==='overview'&&<AdminDashboardOverview onOpenOrders={()=>setActiveTab('orders')}/>} {activeTab==='orders'&&<AdminOrders/>}{activeTab==='payments'&&<AdminPayments/>}{activeTab==='reports'&&<AdminReports/>}{activeTab==='products'&&<AdminProducts/>}{activeTab==='stock'&&<AdminStok/>}{activeTab==='partners'&&<AdminPartners/>}</div></section>
    </main><AdminFooter/></div>
  </div></div>
}

function AdminBrand(){return <div className="flex items-center gap-3"><div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-950/30"><Flame className="h-6 w-6 text-white"/><div className="absolute bottom-1.5 right-1.5 h-3 w-3 rotate-45 rounded-sm border-2 border-white/90"/></div><div className="leading-none"><p className="text-lg font-black tracking-tight">JAGAD <span className="text-red-500">STOCKIS</span></p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Admin Control Center</p></div></div>}
function AdminHeader({onBack,compact=false}:{onBack:()=>void;compact?:boolean}){return <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 lg:hidden"><div className="px-4 sm:px-6"><div className="h-[68px] flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl"><ArrowLeft className="h-4 w-4"/></Button><div className="min-w-0"><p className="text-sm sm:text-base font-black truncate">JAGAD <span className="text-red-600">STOCKIS</span></p><p className="text-[9px] uppercase tracking-[0.16em] text-slate-400 font-bold">{compact?'Secure Admin Access':'Admin Control Center'}</p></div></div><Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[9px] font-black rounded-full">ADMIN</Badge></div></div></header>}
function AdminFooter(){return <footer className="mt-auto border-t border-slate-200 bg-white"><div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2"><div className="flex items-center gap-2"><Flame className="h-4 w-4 text-red-600"/><p className="text-xs font-black text-slate-800">JAGAD STOCKIS ADMIN</p></div><p className="text-[11px] text-slate-400">© {new Date().getFullYear()} Franchise Supply Network</p></div></footer>}
