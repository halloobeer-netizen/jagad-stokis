'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────
export interface Product {
  id: string
  namaProduk: string
  satuan: string
  harga: number
  stok: number
  isActive: boolean
}

export interface CartItem {
  product: Product
  jumlah: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, jumlah: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, jumlah: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const getItemQuantity = useCallback(
    (productId: string) => {
      return items.find(i => i.product.id === productId)?.jumlah ?? 0
    },
    [items]
  )

  const addItem = useCallback((product: Product, jumlah: number) => {
    if (jumlah <= 0) return

    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)

      if (existing) {
        const newQty = existing.jumlah + jumlah
        if (newQty > product.stok) {
          toast.warning(`Stok ${product.namaProduk} tidak mencukupi. Tersisa ${product.stok} ${product.satuan}.`)
          return prev
        }
        toast.success(`${product.namaProduk} ditambahkan ke keranjang`)
        return prev.map(i =>
          i.product.id === product.id ? { ...i, jumlah: newQty } : i
        )
      }

      if (jumlah > product.stok) {
        toast.warning(`Stok ${product.namaProduk} tidak mencukupi. Tersisa ${product.stok} ${product.satuan}.`)
        return prev
      }

      toast.success(`${product.namaProduk} ditambahkan ke keranjang`)
      return [...prev, { product, jumlah }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, jumlah: number) => {
    if (jumlah <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId))
      return
    }

    setItems(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i
        if (jumlah > i.product.stok) {
          toast.warning(`Stok ${i.product.namaProduk} hanya tersisa ${i.product.stok} ${i.product.satuan}.`)
          return i
        }
        return { ...i, jumlah }
      })
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((s, i) => s + i.jumlah, 0)
  const totalPrice = items.reduce((s, i) => s + i.product.harga * i.jumlah, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, getItemQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
