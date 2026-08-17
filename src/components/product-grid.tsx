'use client'

import { useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, PackageX, AlertTriangle, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductCard } from './product-card'
import type { Product } from '@/lib/cart-context'

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) {
        // API returned an error — extract message if available
        const body = await res.json().catch(() => ({}))
        const msg = body?.error || `Server error (${res.status})`
        setError(msg)
        setProducts([])
        return
      }
      const data: Product[] = await res.json()
      // Guard: ensure it's actually an array before setting state
      if (!Array.isArray(data)) {
        setError('Format data produk tidak valid')
        setProducts([])
        return
      }
      setProducts(data)
    } catch (err) {
      // Network error / fetch failed
      setError('Tidak dapat terhubung ke server')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filtered = products.filter(p =>
    p.namaProduk.toLowerCase().includes(search.toLowerCase())
  )

  const availableCount = products.filter(p => p.stok > 0).length
  const outOfStockCount = products.filter(p => p.stok === 0).length

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-gray-900 font-semibold text-lg">Gagal Memuat Produk</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{error}</p>
        <Button
          variant="outline"
          className="mt-4 gap-2 border-red-200 text-red-600 hover:bg-red-50"
          onClick={fetchProducts}
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    )
  }

  // ── Product Grid ──
  return (
    <div className="space-y-4">
      {/* Search & count */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari bahan baku..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200 focus-visible:ring-red-500/20 focus-visible:border-red-300"
          />
        </div>
        <p className="text-sm text-gray-500 whitespace-nowrap">
          <span className="font-semibold text-gray-800">{availableCount}</span> tersedia
          {outOfStockCount > 0 && (
            <>
              {' · '}
              <span className="text-red-500 font-semibold">{outOfStockCount}</span> habis
            </>
          )}
          {search && filtered.length !== products.length && (
            <>
              {' · '}
              <span className="font-semibold text-gray-800">{filtered.length}</span> ditemukan
            </>
          )}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <PackageX className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Produk tidak ditemukan</p>
          <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Show in-stock first, then out-of-stock */}
          {filtered
            .sort((a, b) => {
              if (a.stok === 0 && b.stok > 0) return 1
              if (a.stok > 0 && b.stok === 0) return -1
              return a.namaProduk.localeCompare(b.namaProduk)
            })
            .map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </div>
  )
}
