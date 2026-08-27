'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, ArrowLeft, ShoppingCart, Loader2, Banknote, Landmark, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'

export interface CheckoutFormData {
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  alamat: string
  catatan: string
  paymentMethod: 'cod' | 'transfer' | 'qris'
}

export interface SubmittedOrder {
  id: string
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  alamat: string
  catatan: string | null
  totalHarga: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  orderItems: { id: string; jumlah: number; hargaSatuan: number; subtotal: number; product: { namaProduk: string; satuan: string } }[]
}

interface CheckoutFormProps { onBack: () => void; onSuccess: (order: SubmittedOrder) => void }

const PAYMENT_OPTIONS = [
  { value: 'cod' as const, label: 'Tunai / COD', desc: 'Bayar saat pesanan diterima', icon: Banknote },
  { value: 'transfer' as const, label: 'Transfer Bank', desc: 'Transfer lalu unggah bukti dari Dashboard Mitra', icon: Landmark },
  { value: 'qris' as const, label: 'QRIS', desc: 'Bayar via QRIS lalu unggah bukti dari Dashboard Mitra', icon: QrCode },
]

export function CheckoutForm({ onBack, onSuccess }: CheckoutFormProps) {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [form, setForm] = useState<CheckoutFormData>({ kodeMitra: '', namaCabang: '', namaPic: '', whatsapp: '', alamat: '', catatan: '', paymentMethod: 'cod' })

  function setField<K extends keyof CheckoutFormData>(key: K, value: CheckoutFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof CheckoutFormData, string>> = {}
    if (!form.kodeMitra.trim()) e.kodeMitra = 'Kode Mitra wajib diisi'
    if (!form.namaCabang.trim()) e.namaCabang = 'Nama Cabang wajib diisi'
    if (!form.namaPic.trim()) e.namaPic = 'Nama PIC wajib diisi'
    if (!form.whatsapp.trim()) e.whatsapp = 'WhatsApp wajib diisi'
    else if (!/^\d{8,15}$/.test(form.whatsapp.replace(/\D/g, ''))) e.whatsapp = 'Format nomor tidak valid'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (items.length === 0) return toast.error('Keranjang masih kosong')
    if (!validate()) return toast.error('Lengkapi data wajib yang bertanda *')
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items: items.map(i => ({ productId: i.product.id, jumlah: i.jumlah })) }) })
      const data = await res.json()
      if (!res.ok) { if (data.field) setErrors({ [data.field]: data.error }); toast.error(data.error || 'Gagal membuat pesanan'); return }
      clearCart()
      setForm({ kodeMitra: '', namaCabang: '', namaPic: '', whatsapp: '', alamat: '', catatan: '', paymentMethod: 'cod' })
      setErrors({})
      onSuccess(data)
    } catch { toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.') } finally { setSubmitting(false) }
  }

  return <section id="checkout-section"><Separator className="mb-8"/><div className="grid lg:grid-cols-5 gap-6">
    <div className="lg:col-span-3 space-y-6">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Step n={1}/>Data Pemesan</CardTitle><CardDescription>Lengkapi informasi cabang dan penanggung jawab</CardDescription></CardHeader><CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4"><FieldInput id="kodeMitra" label="Kode Mitra" required placeholder="JGD-001" value={form.kodeMitra} error={errors.kodeMitra} onChange={v=>setField('kodeMitra',v)}/><FieldInput id="namaCabang" label="Nama Cabang" required placeholder="Nama cabang" value={form.namaCabang} error={errors.namaCabang} onChange={v=>setField('namaCabang',v)}/></div>
        <div className="grid sm:grid-cols-2 gap-4"><FieldInput id="namaPic" label="Nama PIC" required placeholder="Nama penanggung jawab" value={form.namaPic} error={errors.namaPic} onChange={v=>setField('namaPic',v)}/><FieldInput id="whatsapp" label="Nomor WhatsApp" required placeholder="081234567890" value={form.whatsapp} error={errors.whatsapp} onChange={v=>setField('whatsapp',v)} type="tel"/></div>
        <div className="space-y-2"><Label htmlFor="alamat">Alamat Pengiriman</Label><Textarea id="alamat" placeholder="Alamat lengkap cabang (opsional)" value={form.alamat} onChange={e=>setField('alamat',e.target.value)} rows={3}/></div>
        <div className="space-y-2"><Label htmlFor="catatan">Catatan</Label><Textarea id="catatan" placeholder="Instruksi khusus pengiriman (opsional)" value={form.catatan} onChange={e=>setField('catatan',e.target.value)} rows={2}/></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Step n={2}/>Metode Pembayaran</CardTitle><CardDescription>Pilih cara pembayaran untuk pesanan ini</CardDescription></CardHeader><CardContent><div className="grid sm:grid-cols-3 gap-3">{PAYMENT_OPTIONS.map(o=>{const active=form.paymentMethod===o.value;const Icon=o.icon;return <button type="button" key={o.value} onClick={()=>setField('paymentMethod',o.value)} className={`rounded-2xl border p-4 text-left transition-all ${active?'border-red-500 bg-red-50 ring-2 ring-red-100':'border-slate-200 bg-white hover:border-red-200'}`}><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active?'bg-red-600 text-white':'bg-slate-100 text-slate-600'}`}><Icon className="h-5 w-5"/></div><p className="font-bold mt-3">{o.label}</p><p className="text-xs text-slate-500 mt-1 leading-relaxed">{o.desc}</p></button>})}</div>{form.paymentMethod!=='cod'&&<div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">Setelah pesanan dibuat, masuk ke <b>Dashboard Mitra</b> untuk mengunggah bukti pembayaran. Status akan berubah menjadi <b>Menunggu Verifikasi</b>.</div>}</CardContent></Card>
    </div>

    <Card className="lg:col-span-2 h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><Step n={3}/>Ringkasan Pesanan</CardTitle></CardHeader><CardContent><div className="max-h-64 overflow-y-auto divide-y">{items.map(item=><div key={item.product.id} className="py-2.5 first:pt-0"><div className="flex justify-between text-sm gap-2"><span className="font-medium">{item.product.namaProduk}</span><span className="font-semibold shrink-0">{formatRupiah(item.product.harga*item.jumlah)}</span></div><p className="text-xs text-muted-foreground mt-0.5">{item.jumlah} {item.product.satuan} × {formatRupiah(item.product.harga)}</p></div>)}</div><Separator className="my-3"/><div className="flex justify-between items-baseline"><span className="text-sm text-muted-foreground">Total ({totalItems} item)</span><span className="text-2xl font-bold">{formatRupiah(totalPrice)}</span></div><p className="mt-2 text-xs text-slate-500">Pembayaran: <b>{PAYMENT_OPTIONS.find(x=>x.value===form.paymentMethod)?.label}</b></p><div className="mt-5 space-y-2"><Button className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-11" onClick={handleSubmit} disabled={submitting}>{submitting?<><Loader2 className="h-4 w-4 animate-spin"/>Memproses...</>:<><ShoppingCart className="h-4 w-4"/>Kirim Pesanan<ArrowRight className="h-4 w-4"/></>}</Button><Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={onBack}><ArrowLeft className="h-3.5 w-3.5 mr-1"/>Kembali ke Daftar Produk</Button></div></CardContent></Card>
  </div></section>
}

function Step({n}:{n:number}){return <div className="h-7 w-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">{n}</div>}
function FieldInput({id,label,required,placeholder,value,error,onChange,type='text'}:{id:string;label:string;required?:boolean;placeholder:string;value:string;error?:string;onChange:(v:string)=>void;type?:string}){return <div className="space-y-2"><Label htmlFor={id}>{label}{required&&<span className="text-destructive ml-0.5">*</span>}</Label><Input id={id} type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} className={error?'border-destructive':''}/>{error&&<p className="text-xs text-destructive">{error}</p>}</div>}
function formatRupiah(n:number){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0,maximumFractionDigits:0}).format(n)}
