'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  RotateCcw,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  formatOrderMessage,
  type WhatsAppOrderPayload,
} from '@/lib/whatsapp'
import type { SubmittedOrder } from './checkout-form'

interface OrderSuccessProps {
  order: SubmittedOrder
  onNewOrder: () => void
}

export function OrderSuccess({ order, onNewOrder }: OrderSuccessProps) {
  const waPayload: WhatsAppOrderPayload = {
    kodeMitra: order.kodeMitra,
    namaCabang: order.namaCabang,
    namaPic: order.namaPic,
    whatsapp: order.whatsapp,
    alamat: order.alamat === '-' ? '' : order.alamat,
    catatan: order.catatan,
    totalHarga: order.totalHarga,
    items: order.orderItems.map(oi => ({
      namaProduk: oi.product.namaProduk,
      satuan: oi.product.satuan,
      jumlah: oi.jumlah,
      hargaSatuan: oi.hargaSatuan,
      subtotal: oi.subtotal,
    })),
    createdAt: order.createdAt,
  }

  const waMessage = formatOrderMessage(waPayload)

  function handleCopyMessage() {
    navigator.clipboard.writeText(waMessage).then(() => {
      toast.success('Pesan berhasil disalin ke clipboard')
    }).catch(() => {
      toast.error('Gagal menyalin pesan')
    })
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pesanan Berhasil!</h2>
          <p className="text-muted-foreground mt-1">
            Pesanan Anda telah diterima dan notifikasi sedang diproses otomatis ke admin.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Kode Mitra</p>
              <p className="font-semibold">{order.kodeMitra}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Nama Cabang</p>
              <p className="font-semibold">{order.namaCabang}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">PIC</p>
              <p className="font-medium">{order.namaPic}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">WhatsApp</p>
              <p className="font-medium">{order.whatsapp}</p>
            </div>
            {order.alamat && order.alamat !== '-' && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Alamat</p>
                <p className="font-medium">{order.alamat}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Detail Pesanan
            </p>
            <div className="space-y-2">
              {order.orderItems.map(oi => (
                <div key={oi.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {oi.product.namaProduk} &times; {oi.jumlah} {oi.product.satuan}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatRupiah(oi.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-baseline">
            <span className="font-semibold">Total Pesanan</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatRupiah(order.totalHarga)}
            </span>
          </div>

          {order.catatan && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Catatan
                </p>
                <p className="text-sm">{order.catatan}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={handleCopyMessage}
        >
          <Copy className="h-4 w-4" />
          Salin Pesan
        </Button>
        <Button
          className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          onClick={onNewOrder}
        >
          <RotateCcw className="h-4 w-4" />
          Pesan Lagi
        </Button>
      </div>
    </div>
  )
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
