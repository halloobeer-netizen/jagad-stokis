'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Eye,
  Clock,
  Loader2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Truck,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────
interface OrderItem {
  id: string
  jumlah: number
  hargaSatuan: number
  subtotal: number
  product: {
    namaProduk: string
    satuan: string
  }
}

interface Order {
  id: string
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  alamat: string
  catatan: string | null
  totalHarga: number
  status: string
  createdAt: string
  orderItems: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className: string }> = {
  menunggu: { label: 'Menunggu', variant: 'secondary', icon: Clock, className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200' },
  diproses: { label: 'Diproses', variant: 'default', icon: Truck, className: 'bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200' },
  selesai: { label: 'Selesai', variant: 'default', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' },
  dibatalkan: { label: 'Dibatalkan', variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' },
}

const STATUS_OPTIONS = ['menunggu', 'diproses', 'selesai', 'dibatalkan']

// ── Component ──────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('semua')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data)
    } catch {
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleChangeStatus = async (orderId: string, newStatus: string) => {
    try {
      setChangingStatus(orderId)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Status pesanan diubah ke "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch {
      toast.error('Gagal mengubah status pesanan')
    } finally {
      setChangingStatus(null)
    }
  }

  // ── Filter ──────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.kodeMitra.toLowerCase().includes(search.toLowerCase()) ||
      o.namaCabang.toLowerCase().includes(search.toLowerCase()) ||
      o.namaPic.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'semua' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── Stats ───────────────────────────────────────
  const stats = {
    total: orders.length,
    menunggu: orders.filter(o => o.status === 'menunggu').length,
    diproses: orders.filter(o => o.status === 'diproses').length,
    selesai: orders.filter(o => o.status === 'selesai').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Pesanan" value={stats.total} icon={ClipboardList} color="text-slate-600" />
        <StatCard label="Menunggu" value={stats.menunggu} icon={Clock} color="text-amber-600" />
        <StatCard label="Diproses" value={stats.diproses} icon={Truck} color="text-teal-600" />
        <StatCard label="Selesai" value={stats.selesai} icon={CheckCircle2} color="text-emerald-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode mitra, cabang, PIC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{orders.length === 0 ? 'Belum ada pesanan' : 'Tidak ada pesanan yang cocok dengan filter'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-44">Tanggal</TableHead>
                  <TableHead>Kode Mitra</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead className="w-40">Total</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-32 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTanggal(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{order.kodeMitra}</TableCell>
                    <TableCell>
                      <div>{order.namaCabang}</div>
                      <div className="text-xs text-muted-foreground">{order.namaPic}</div>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatRupiah(order.totalHarga)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <StatusSelect
                          currentStatus={order.status}
                          onChange={(s) => handleChangeStatus(order.id, s)}
                          disabled={changingStatus === order.id}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4" />
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
            {filtered.map(order => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{order.kodeMitra}</p>
                      <p className="text-sm text-muted-foreground">{order.namaCabang} &middot; {order.namaPic}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTanggal(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg tabular-nums">{formatRupiah(order.totalHarga)}</p>
                    <div className="flex gap-1">
                      <StatusSelect
                        currentStatus={order.status}
                        onChange={(s) => handleChangeStatus(order.id, s)}
                        disabled={changingStatus === order.id}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Detail Pesanan
                  <StatusBadge status={selectedOrder.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Kode Mitra" value={selectedOrder.kodeMitra} />
                  <InfoRow label="Nama Cabang" value={selectedOrder.namaCabang} />
                  <InfoRow label="Nama PIC" value={selectedOrder.namaPic} />
                  <InfoRow label="WhatsApp" value={selectedOrder.whatsapp} />
                  <InfoRow label="Alamat" value={selectedOrder.alamat} />
                  <InfoRow label="Tanggal" value={formatTanggal(selectedOrder.createdAt)} />
                  {selectedOrder.catatan && (
                    <InfoRow label="Catatan" value={selectedOrder.catatan} />
                  )}
                </div>

                {/* Status Change */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Ubah Status:</span>
                  <StatusSelect
                    currentStatus={selectedOrder.status}
                    onChange={(s) => handleChangeStatus(selectedOrder.id, s)}
                    disabled={changingStatus === selectedOrder.id}
                  />
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Item Pesanan</h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-center">Jumlah</TableHead>
                          <TableHead className="text-right">Harga Satuan</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.orderItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product.namaProduk}</TableCell>
                            <TableCell className="text-center tabular-nums">
                              {item.jumlah} {item.product.satuan}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{formatRupiah(item.hargaSatuan)}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{formatRupiah(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end mt-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Pesanan</p>
                      <p className="text-xl font-bold tabular-nums">{formatRupiah(selectedOrder.totalHarga)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <Badge variant="outline">{status}</Badge>
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={`${cfg.className} gap-1 text-xs font-medium`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  )
}

function StatusSelect({ currentStatus, onChange, disabled }: {
  currentStatus: string
  onChange: (status: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={currentStatus} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-32 h-8 text-xs">
        {disabled ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(s => (
          <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
