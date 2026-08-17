'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, PackageX } from 'lucide-react'
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
    <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      {/* Stock indicator stripe */}
      <div
        className={`h-1 ${
          outOfStock
            ? 'bg-gradient-to-r from-red-300 to-red-400'
            : product.stok <= 20
              ? 'bg-gradient-to-r from-amber-300 to-amber-400'
              : 'bg-gradient-to-r from-emerald-300 to-emerald-400'
        }`}
      />

      <CardContent className="p-4 flex flex-col gap-3">
        {/* Product name & status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-900">{product.namaProduk}</h3>
          {outOfStock ? (
            <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
              <PackageX className="h-3 w-3 mr-0.5" />
              Habis
            </Badge>
          ) : product.stok <= 20 ? (
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50"
            >
              Sisa {product.stok}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700"
            >
              Stok {product.stok}
            </Badge>
          )}
        </div>

        {/* Price & unit */}
        <div>
          <p className="text-lg font-bold text-gray-900">
            {formatRupiah(product.harga)}
          </p>
          <p className="text-xs text-gray-400">per {product.satuan}</p>
        </div>

        {/* Already in cart indicator */}
        {inCart > 0 && !outOfStock && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700 font-medium">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{inCart} {product.satuan} di keranjang</span>
          </div>
        )}

        {/* Quantity input + Add button */}
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
                className="h-9 text-center pr-7 text-sm border-gray-200"
                disabled={outOfStock}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                {product.satuan}
              </span>
            </div>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-red-600 hover:bg-red-700 text-white shrink-0 shadow-sm shadow-red-600/20"
              onClick={handleAdd}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Tambah</span>
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
