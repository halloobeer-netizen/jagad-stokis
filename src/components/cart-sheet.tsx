'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, ArrowRight, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CartItemRow } from './cart-item-row'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
}

export function CartSheet({ open, onOpenChange, onCheckout }: CartSheetProps) {
  const { items, totalItems, totalPrice, clearCart } = useCart()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang
            {totalItems > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({totalItems} item)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <Separator />

        {/* Cart items */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Keranjang masih kosong
              </p>
              <p className="text-xs text-muted-foreground">
                Pilih produk untuk mulai memesan
              </p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-5">
              <div className="divide-y divide-border">
                {items.map(item => (
                  <CartItemRow key={item.product.id} productId={item.product.id} />
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer with total & actions */}
            <div className="px-5 py-4 space-y-4">
              {/* Summary */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {items.length} jenis produk
                  </span>
                  <span>{totalItems} {items[0]?.product.satuan ?? 'item'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold tabular-nums">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    clearCart()
                    onOpenChange(false)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Kosongkan
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm shadow-red-600/20"
                  onClick={() => {
                    onOpenChange(false)
                    onCheckout()
                  }}
                >
                  Lanjut ke Data Pemesan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
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
