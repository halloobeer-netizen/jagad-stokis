'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, PackageX, CheckCircle2, Box } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/cart-context'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, getItemQuantity } = useCart()
  const [qty, setQty] = useState(1)
  const outOfStock = product.stok === 0
  const inCart = getItemQuantity(product.id)

  function handleAdd() {
    const num = Math.max(1, Math.floor(qty))
    addItem(product, num)
    setQty(1)
  }

  return (
    <Card className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-all duration-300">
      <div className="relative h-28 sm:h-36 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-red-50/60 border-b border-slate-100">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/50" />
        <div className="absolute -left-8 -bottom-10 h-24 w-24 rounded-full bg-orange-100/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-[22px] bg-white shadow-lg border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Box className="h-8 w-8 sm:h-9 sm:w-9 text-red-600" />
          </div>
        </div>
        <div className="absolute left-3 top-3">
          {outOfStock ? (
            <Badge variant="destructive" className="rounded-full px-2 py-1 text-[10px] font-bold shadow-sm">
              <PackageX className="h-3 w-3 mr-1" /> Habis
            </Badge>
          ) : (
            <Badge className="rounded-full border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 px-2 py-1 text-[10px] font-bold shadow-sm">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Stok tersedia
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="min-h-[38px]">
          <h3 className="font-extrabold text-sm sm:text-[15px] leading-tight line-clamp-2 text-slate-900">{product.namaProduk}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Satuan: {product.satuan}</p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg sm:text-xl font-black text-red-600 tracking-tight">{formatRupiah(product.harga)}</p>
            <p className="text-[10px] sm:text-xs text-slate-400">per {product.satuan}</p>
          </div>
          {!outOfStock && (
            <span className="text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 px-2 py-1">Stok {product.stok}</span>
          )}
        </div>

        {inCart > 0 && !outOfStock && (
          <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-2 text-[11px] text-red-700 font-bold">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{inCart} {product.satuan} di keranjang</span>
          </div>
        )}

        {!outOfStock && (
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Input
                type="number"
                min={1}
                max={product.stok}
                value={qty}
                onChange={e => {
                  const v = parseInt(e.target.value) || 1
                  setQty(v > product.stok ? product.stok : v < 1 ? 1 : v)
                }}
                className="h-10 rounded-xl text-center pr-8 text-sm border-slate-200 bg-slate-50 focus-visible:ring-red-500/20 focus-visible:border-red-300"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">{product.satuan}</span>
            </div>
            <Button
              size="sm"
              className="h-10 min-w-10 rounded-xl gap-1.5 bg-red-600 hover:bg-red-700 text-white shrink-0 shadow-lg shadow-red-600/20"
              onClick={handleAdd}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden xl:inline text-xs font-bold">Tambah</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
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
