'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Package,
  Check,
  Loader2,
  AlertTriangle,
  XCircle,
  Warehouse,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────
interface Product {
  id: string
  namaProduk: string
  satuan: string
  harga: number
  stok: number
  isActive: boolean
}

// ── Component ──────────────────────────────────────
export function AdminStok() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProducts(data.filter((p: Product) => p.isActive))
    } catch {
      toast.error('Gagal memuat data stok')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Inline stock edit ────────────────────────────
  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditValue(String(product.stok))
    setTimeout(() => inputRef.current?.select(), 50)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveStock(productId: string) {
    const val = Number(editValue)
    if (isNaN(val) || val < 0) {
      toast.error('Stok harus angka positif')
      return
    }

    try {
      setSavingId(productId)
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stok: val }),
      })
      if (!res.ok) throw new Error()
      toast.success('Stok berhasil diperbarui')
      setEditingId(null)
      fetchProducts()
    } catch {
      toast.error('Gagal memperbarui stok')
    } finally {
      setSavingId(null)
    }
  }

  // ── Filter ──────────────────────────────────────
  const filtered = products.filter(p =>
    !search || p.namaProduk.toLowerCase().includes(search.toLowerCase())
  )

  // ── Stats ───────────────────────────────────────
  const totalItems = products.reduce((s, p) => s + p.stok, 0)
  const lowStock = products.filter(p => p.stok > 0 && p.stok <= 10).length
  const outOfStock = products.filter(p => p.stok === 0).length
  const totalValue = products.reduce((s, p) => s + p.harga * p.stok, 0)

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Jenis Produk" value={products.length} icon={Package} color="text-slate-600" />
        <StatCard label="Total Stok" value={totalItems} icon={Warehouse} color="text-emerald-600" />
        <StatCard label="Stok Menipis" value={lowStock} icon={AlertTriangle} color="text-amber-600" />
        <StatCard label="Stok Habis" value={outOfStock} icon={XCircle} color="text-red-600" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Tidak ada produk yang cocok</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-24 text-center">Satuan</TableHead>
                  <TableHead className="w-28 text-right">Harga</TableHead>
                  <TableHead className="w-48 text-center">Stok Saat Ini</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.namaProduk}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{product.satuan}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatRupiah(product.harga)}</TableCell>
                    <TableCell className="text-center">
                      {editingId === product.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            ref={inputRef}
                            type="number"
                            min={0}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveStock(product.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className="w-24 h-8 text-center text-sm"
                            autoFocus
                          />
                          {savingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => saveStock(product.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer group"
                        >
                          <StockIndicator stok={product.stok} satuan={product.satuan} />
                          <PencilIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StockStatusBadge stok={product.stok} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(product => (
              <Card key={product.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{product.namaProduk}</p>
                      <p className="text-sm text-muted-foreground">{product.satuan} &middot; {formatRupiah(product.harga)}</p>
                    </div>
                    <StockStatusBadge stok={product.stok} />
                  </div>
                  <div>
                    {editingId === product.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          ref={inputRef}
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveStock(product.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="flex-1 h-9 text-center"
                          autoFocus
                          placeholder="Stok baru"
                        />
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9 px-3" onClick={() => saveStock(product.id)} disabled={savingId === product.id}>
                          {savingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 px-3" onClick={cancelEdit}>
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(product)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-dashed hover:border-solid hover:border-red-300 hover:bg-red-50/50 transition-all cursor-pointer group"
                      >
                        <StockIndicator stok={product.stok} satuan={product.satuan} />
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Tap untuk ubah</span>
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Total Value Footer */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimasi Nilai Stok</span>
              <span className="text-lg font-bold tabular-nums">{formatRupiah(totalValue)}</span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="p-4 border-0 shadow-sm bg-white">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-gray-50 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-gray-900">{value.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function StockIndicator({ stok, satuan }: { stok: number; satuan: string }) {
  const colorClass = stok === 0
    ? 'text-red-600'
    : stok <= 10
      ? 'text-amber-600'
      : 'text-emerald-700'

  return (
    <span className={`text-xl font-bold tabular-nums ${colorClass}`}>
      {stok} <span className="text-xs font-normal text-muted-foreground">{satuan}</span>
    </span>
  )
}

function StockStatusBadge({ stok }: { stok: number }) {
  if (stok === 0) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 gap-1">
        <XCircle className="h-3 w-3" />
        Habis
      </Badge>
    )
  }
  if (stok <= 10) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Menipis
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
      Tersedia
    </Badge>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
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
