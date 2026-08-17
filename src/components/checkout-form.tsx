'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCart, type CartItem } from '@/lib/cart-context'

// ── Types ──────────────────────────────────────────────
export interface CheckoutFormData {
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  alamat: string
  catatan: string
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
  createdAt: string
  orderItems: {
    id: string
    jumlah: number
    hargaSatuan: number
    subtotal: number
    product: {
      namaProduk: string
      satuan: string
    }
  }[]
}

interface CheckoutFormProps {
  onBack: () => void
  onSuccess: (order: SubmittedOrder) => void
}

// ── Component ──────────────────────────────────────────
export function CheckoutForm({ onBack, onSuccess }: CheckoutFormProps) {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})

  const [form, setForm] = useState<CheckoutFormData>({
    kodeMitra: '',
    namaCabang: '',
    namaPic: '',
    whatsapp: '',
    alamat: '',
    catatan: '',
  })

  function setField<K extends keyof CheckoutFormData>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(e => ({ ...e, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const e: Partial<Record<keyof CheckoutFormData, string>> = {}
    if (!form.kodeMitra.trim()) e.kodeMitra = 'Kode Mitra wajib diisi'
    if (!form.namaCabang.trim()) e.namaCabang = 'Nama Cabang wajib diisi'
    if (!form.namaPic.trim()) e.namaPic = 'Nama PIC wajib diisi'
    if (!form.whatsapp.trim()) e.whatsapp = 'WhatsApp wajib diisi'
    else if (!/^\d{8,15}$/.test(form.whatsapp.replace(/\D/g, ''))) {
      e.whatsapp = 'Format nomor tidak valid'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error('Keranjang masih kosong')
      return
    }
    if (!validate()) {
      toast.error('Lengkapi data wajib yang bertanda *')
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0] as keyof CheckoutFormData | undefined
      if (firstErrorKey) {
        document.getElementById(firstErrorKey)?.focus()
      }
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map(i => ({ productId: i.product.id, jumlah: i.jumlah })),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Field-level error from API
        if (data.field) {
          setErrors({ [data.field]: data.error })
          document.getElementById(data.field)?.focus()
        }
        toast.error(data.error || 'Gagal membuat pesanan')
        return
      }

      // Success
      clearCart()
      setForm({ kodeMitra: '', namaCabang: '', namaPic: '', whatsapp: '', alamat: '', catatan: '' })
      setErrors({})
      onSuccess(data)
    } catch {
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="checkout-section">
      <Separator className="mb-8" />
      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Form Pemesan ──────────────────────────── */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                1
              </div>
              Data Pemesan
            </CardTitle>
            <CardDescription>
              Lengkapi informasi cabang dan penanggung jawab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldInput
                id="kodeMitra"
                label="Kode Mitra"
                required
                placeholder="MT-042"
                value={form.kodeMitra}
                error={errors.kodeMitra}
                onChange={v => setField('kodeMitra', v)}
              />
              <FieldInput
                id="namaCabang"
                label="Nama Cabang"
                required
                placeholder="FC Cabang Kelapa Gading"
                value={form.namaCabang}
                error={errors.namaCabang}
                onChange={v => setField('namaCabang', v)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldInput
                id="namaPic"
                label="Nama PIC"
                required
                placeholder="Nama lengkap penanggung jawab"
                value={form.namaPic}
                error={errors.namaPic}
                onChange={v => setField('namaPic', v)}
              />
              <FieldInput
                id="whatsapp"
                label="Nomor WhatsApp"
                required
                placeholder="081234567890"
                value={form.whatsapp}
                error={errors.whatsapp}
                onChange={v => setField('whatsapp', v)}
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat Pengiriman</Label>
              <Textarea
                id="alamat"
                placeholder="Alamat lengkap cabang (opsional)"
                value={form.alamat}
                onChange={e => setField('alamat', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                placeholder="Instruksi khusus pengiriman, catatan tambahan (opsional)"
                value={form.catatan}
                onChange={e => setField('catatan', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Ringkasan Pesanan ─────────────────────── */}
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                2
              </div>
              Ringkasan Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {/* Items list */}
            <div className="max-h-64 overflow-y-auto space-y-0 divide-y divide-border pr-1">
              {items.map(item => (
                <div key={item.product.id} className="py-2.5 first:pt-0">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="font-medium leading-tight">{item.product.namaProduk}</span>
                    <span className="font-semibold tabular-nums shrink-0">
                      {formatRupiah(item.product.harga * item.jumlah)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.jumlah} {item.product.satuan} &times; {formatRupiah(item.product.harga)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            {/* Total */}
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">
                Total ({totalItems} item)
              </span>
              <span className="text-2xl font-bold tabular-nums">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-11 shadow-md shadow-red-600/20 font-semibold"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses Pesanan...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Kirim Pesanan
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={onBack}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Kembali ke Daftar Produk
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ── Sub-component: Field with inline error ─────────────
function FieldInput({
  id,
  label,
  required,
  placeholder,
  value,
  error,
  onChange,
  type = 'text',
}: {
  id: string
  label: string
  required?: boolean
  placeholder: string
  value: string
  error?: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
      />
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Helper ──────────────────────────────────────────────
function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
