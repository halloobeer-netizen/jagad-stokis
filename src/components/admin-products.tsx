'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Plus,
  Pencil,
  Package,
  Loader2,
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

interface ProductFormData {
  namaProduk: string
  satuan: string
  harga: string
  stok: string
}

const EMPTY_FORM: ProductFormData = { namaProduk: '', satuan: '', harga: '', stok: '' }

// ── Component ──────────────────────────────────────
export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProducts(data)
    } catch {
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Filter ──────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = !search || p.namaProduk.toLowerCase().includes(search.toLowerCase())
    const matchActive = showInactive || p.isActive
    return matchSearch && matchActive
  })

  // ── Dialog handlers ─────────────────────────────
  function openAddDialog() {
    setEditingProduct(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setDialogOpen(true)
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product)
    setForm({
      namaProduk: product.namaProduk,
      satuan: product.satuan,
      harga: String(product.harga),
      stok: String(product.stok),
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  // ── Form validation ─────────────────────────────
  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!form.namaProduk.trim()) errors.namaProduk = 'Nama produk wajib diisi'
    if (!form.satuan.trim()) errors.satuan = 'Satuan wajib diisi'
    const h = Number(form.harga)
    if (form.harga === '' || isNaN(h) || h < 0) errors.harga = 'Harga harus angka positif'
    const s = Number(form.stok)
    if (form.stok === '' || isNaN(s) || s < 0) errors.stok = 'Stok harus angka positif'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Submit ───────────────────────────────────────
  async function handleSubmit() {
    if (!validateForm()) return

    try {
      setSubmitting(true)
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaProduk: form.namaProduk,
          satuan: form.satuan,
          harga: Number(form.harga),
          stok: Number(form.stok),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Gagal menyimpan produk')
        return
      }

      toast.success(editingProduct ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan')
      setDialogOpen(false)
      fetchProducts()
    } catch {
      toast.error('Gagal menyimpan produk')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Toggle active ───────────────────────────────
  async function handleToggle(product: Product) {
    try {
      setTogglingId(product.id)
      const res = await fetch(`/api/admin/products/${product.id}/toggle`, { method: 'PUT' })
      if (!res.ok) throw new Error()
      toast.success(`${product.namaProduk} ${product.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchProducts()
    } catch {
      toast.error('Gagal mengubah status produk')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Stats ───────────────────────────────────────
  const activeCount = products.filter(p => p.isActive).length
  const inactiveCount = products.length - activeCount
  const lowStock = products.filter(p => p.isActive && p.stok > 0 && p.stok <= 10).length
  const outOfStock = products.filter(p => p.isActive && p.stok === 0).length

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Produk" value={products.length} icon={Package} color="text-slate-600" />
        <StatCard label="Aktif" value={activeCount} icon={Package} color="text-emerald-600" />
        <StatCard label="Stok Menipis" value={lowStock} icon={Package} color="text-amber-600" />
        <StatCard label="Stok Habis" value={outOfStock} icon={Package} color="text-red-600" />
      </div>

      {/* Filters + Add Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            <span className="text-muted-foreground">Tampilkan Nonaktif</span>
          </label>
          <Button className="gap-1.5 bg-red-600 hover:bg-red-700 text-white whitespace-nowrap shadow-sm shadow-red-600/20" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {products.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang cocok'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="w-24 text-center">Satuan</TableHead>
                  <TableHead className="w-32 text-right">Harga</TableHead>
                  <TableHead className="w-24 text-center">Stok</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(product => (
                  <TableRow key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{product.namaProduk}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{product.satuan}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatRupiah(product.harga)}</TableCell>
                    <TableCell className="text-center">
                      <StockBadge stok={product.stok} satuan={product.satuan} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.isActive ? 'default' : 'outline'} className={product.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' : ''}>
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {togglingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={() => handleToggle(product)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(product => (
              <Card key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{product.namaProduk}</p>
                      <p className="text-sm text-muted-foreground">{product.satuan}</p>
                    </div>
                    <Badge variant={product.isActive ? 'default' : 'outline'} className={product.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' : ''}>
                      {product.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold tabular-nums">{formatRupiah(product.harga)}</p>
                      <StockBadge stok={product.stok} satuan={product.satuan} />
                    </div>
                    <div className="flex items-center gap-2">
                      {togglingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggle(product)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField
              label="Nama Produk"
              placeholder="Contoh: Ayam Dada"
              value={form.namaProduk}
              onChange={v => setForm(prev => ({ ...prev, namaProduk: v }))}
              error={formErrors.namaProduk}
            />
            <FormField
              label="Satuan"
              placeholder="Contoh: kg, liter, pcs"
              value={form.satuan}
              onChange={v => setForm(prev => ({ ...prev, satuan: v }))}
              error={formErrors.satuan}
            />
            <FormField
              label="Harga (Rp)"
              type="number"
              placeholder="Contoh: 35000"
              value={form.harga}
              onChange={v => setForm(prev => ({ ...prev, harga: v }))}
              error={formErrors.harga}
            />
            <FormField
              label="Stok"
              type="number"
              placeholder="Contoh: 100"
              value={form.stok}
              onChange={v => setForm(prev => ({ ...prev, stok: v }))}
              error={formErrors.stok}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function StockBadge({ stok, satuan }: { stok: number; satuan: string }) {
  if (stok === 0) {
    return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Habis</span>
  }
  if (stok <= 10) {
    return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Sisa {stok} {satuan}</span>
  }
  return <span className="text-xs font-medium text-emerald-600">{stok} {satuan}</span>
}

function FormField({ label, placeholder, type = 'text', value, onChange, error }: {
  label: string
  placeholder: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}