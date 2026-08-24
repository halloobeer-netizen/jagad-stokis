'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  Building2,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'

type Product = {
  id: string
  namaProduk: string
  satuan: string
  harga: number
  stok: number
  isActive: boolean
}

type OrderItem = {
  id: string
  jumlah: number
  subtotal: number
  product: {
    namaProduk: string
    satuan: string
  }
}

type Order = {
  id: string
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  totalHarga: number
  status: string
  createdAt: string
  orderItems: OrderItem[]
}

const LOW_STOCK_LIMIT = 10

export function AdminDashboardOverview({ onOpenOrders }: { onOpenOrders: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')

      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' }),
      ])

      if (!ordersRes.ok || !productsRes.ok) {
        throw new Error('Gagal mengambil data dashboard')
      }

      const [ordersData, productsData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
      ])

      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const summary = useMemo(() => {
    const waiting = orders.filter(order => ['menunggu', 'baru'].includes(order.status.toLowerCase())).length
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalHarga || 0), 0)
    const lowStock = products.filter(product => product.stok <= LOW_STOCK_LIMIT).length
    const branches = new Set(orders.map(order => order.namaCabang.trim().toLowerCase()).filter(Boolean)).size

    return {
      totalOrders: orders.length,
      waiting,
      revenue,
      lowStock,
      totalProducts: products.length,
      branches,
    }
  }, [orders, products])

  const recentOrders = orders.slice(0, 6)
  const lowStockProducts = [...products]
    .filter(product => product.stok <= LOW_STOCK_LIMIT)
    .sort((a, b) => a.stok - b.stok)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-7 w-7 animate-spin text-red-600 mx-auto" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Memuat ringkasan operasional...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Ringkasan data pesanan, produk, dan stok terbaru.</p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <Button
          variant="outline"
          onClick={() => void loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto rounded-xl border-slate-200 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Perbarui Data
        </Button>
      </div>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={ClipboardList} label="Total Pesanan" value={summary.totalOrders.toLocaleString('id-ID')} hint={`${summary.waiting} menunggu diproses`} tone="red" />
        <StatCard icon={Banknote} label="Nilai Pesanan" value={formatRupiah(summary.revenue)} hint="Akumulasi seluruh order" tone="dark" />
        <StatCard icon={Package} label="Produk Aktif" value={summary.totalProducts.toLocaleString('id-ID')} hint={`${summary.lowStock} stok perlu perhatian`} tone="amber" />
        <StatCard icon={Building2} label="Cabang Pemesan" value={summary.branches.toLocaleString('id-ID')} hint="Cabang unik yang pernah order" tone="blue" />
      </section>

      <section className="grid xl:grid-cols-[1.55fr_.85fr] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Aktivitas Terbaru</p>
              <h3 className="mt-1 font-black text-slate-950">Pesanan Terbaru</h3>
            </div>
            <Button variant="ghost" onClick={onOpenOrders} className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 font-bold">
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">Belum ada pesanan.</div>
            ) : recentOrders.map(order => (
              <div key={order.id} className="px-4 sm:px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 truncate">{order.namaCabang}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 truncate">{order.kodeMitra} • {order.namaPic} • {order.orderItems.length} produk</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="md:text-right shrink-0">
                  <p className="font-black text-slate-950">{formatRupiah(order.totalHarga)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{order.orderItems.reduce((sum, item) => sum + item.jumlah, 0)} item</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Inventory Alert</p>
                <h3 className="mt-1 font-black text-slate-950">Stok Menipis</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Boxes className="h-6 w-6 text-emerald-500 mx-auto" />
                <p className="mt-2 text-sm font-bold text-slate-700">Stok aman</p>
                <p className="mt-1 text-xs text-slate-400">Tidak ada produk ≤ {LOW_STOCK_LIMIT} stok.</p>
              </div>
            ) : lowStockProducts.map(product => (
              <div key={product.id} className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{product.namaProduk}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Batas perhatian ≤ {LOW_STOCK_LIMIT}</p>
                </div>
                <Badge className={`${product.stok === 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'} border hover:bg-inherit rounded-full`}>
                  {product.stok} {product.satuan}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <QuickAction icon={ShoppingBag} title="Pesanan Baru" value={summary.waiting} text="Menunggu tindakan admin" onClick={onOpenOrders} />
        <QuickAction icon={Boxes} title="Stok Menipis" value={summary.lowStock} text="Produk perlu diperiksa" />
        <QuickAction icon={Package} title="Katalog Aktif" value={summary.totalProducts} text="Produk tersedia di toko" />
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, hint, tone }: {
  icon: typeof ClipboardList
  label: string
  value: string
  hint: string
  tone: 'red' | 'dark' | 'amber' | 'blue'
}) {
  const toneClass = {
    red: 'bg-red-50 text-red-600',
    dark: 'bg-slate-900 text-white',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  }[tone]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneClass}`}><Icon className="h-5 w-5" /></div>
      <p className="mt-4 text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-950 truncate">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400 truncate">{hint}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, title, value, text, onClick }: {
  icon: typeof ClipboardList
  title: string
  value: number
  text: string
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} disabled={!onClick} className={`rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm ${onClick ? 'hover:border-red-200 hover:shadow-md cursor-pointer' : 'cursor-default'} transition-all`}>
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center"><Icon className="h-4 w-4 text-slate-700" /></div>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
      <p className="mt-3 text-sm font-black text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{text}</p>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const style = normalized === 'selesai'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : normalized === 'dikirim'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : normalized === 'diproses'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-red-50 text-red-700 border-red-100'

  const label = normalized === 'menunggu' ? 'Baru' : status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge className={`${style} border hover:bg-inherit rounded-full text-[10px]`}>{label}</Badge>
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}
