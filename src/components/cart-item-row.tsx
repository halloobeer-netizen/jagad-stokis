'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'

type CartItemRowProps = {
  productId: string
}

export function CartItemRow({ productId }: CartItemRowProps) {
  const { items, updateQuantity, removeItem } = useCart()
  const item = items.find(i => i.product.id === productId)
  if (!item) return null

  const { product, jumlah } = item
  const subtotal = product.harga * jumlah

  return (
    <div className="flex gap-3 py-3">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">{product.namaProduk}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRupiah(product.harga)} / {product.satuan}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(productId, jumlah - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{jumlah}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(productId, jumlah + 1)}
          disabled={jumlah >= product.stok}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Subtotal */}
      <p className="text-sm font-semibold w-28 text-right shrink-0 tabular-nums">
        {formatRupiah(subtotal)}
      </p>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => removeItem(productId)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
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
