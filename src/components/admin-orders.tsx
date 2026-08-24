'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Search,
  Eye,
  Clock,
  Loader2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  RotateCcw,
} from 'lucide-react'

interface OrderItem {
  id: string
  jumlah: number
  hargaSatuan: number
  subtotal: number
  product: { namaProduk: string; satuan: string }
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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  menunggu: { label: 'Baru', icon: Clock, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  diproses: { label: 'Diproses', icon: PackageCheck, className: 'bg-sky-100 text-sky-800 border-sky-200' },
  dikirim: { label: 'Dikirim', icon: Truck, className: 'bg-violet-100 text-violet-800 border-violet-200' },
  selesai: { label: 'Selesai', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  dibatalkan: { label: 'Dibatalkan', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
}

const STATUS_OPTIONS = ['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan']

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setOrders(await res.json())
    } catch {
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function handleChangeStatus(orderId: string, newStatus: string) {
    try {
      setChangingStatus(orderId)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()

      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order))
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev)
      toast.success(`Status diubah menjadi ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
    } catch {
      toast.error('Gagal mengubah status pesanan')
    } finally {
      setChangingStatus(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(order => {
      const matchSearch = !q || [order.kodeMitra, order.namaCabang, order.namaPic, order.whatsapp]
        .some(value => value?.toLowerCase().includes(q))
      const matchStatus = statusFilter === 'semua' || order.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const stats = useMemo(() => ({
    total: orders.length,
    menunggu: orders.filter(o => o.status === 'menunggu').length,
    diproses: orders.filter(o => o.status === 'diproses').length,
    dikirim: orders.filter(o => o.status === 'dikirim').length,
    selesai: orders.filter(o => o.status === 'selesai').length,
  }), [orders])

  const quickFilters = [
    { value: 'semua', label: 'Semua', count: stats.total },
    { value: 'menunggu', label: 'Baru', count: stats.menunggu },
    { value: 'diproses', label: 'Diproses', count: stats.diproses },
    { value: 'dikirim', label: 'Dikirim', count: stats.dikirim },
    { value: 'selesai', label: 'Selesai', count: stats.selesai },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} color="text-slate-600" />
        <StatCard label="Baru" value={stats.menunggu} icon={Clock} color="text-amber-600" />
        <StatCard label="Diproses" value={stats.diproses} icon={PackageCheck} color="text-sky-600" />
        <StatCard label="Dikirim" value={stats.dikirim} icon={Truck} color="text-violet-600" />
        <StatCard label="Selesai" value={stats.selesai} icon={CheckCircle2} color="text-emerald-600" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode mitra, cabang, PIC, atau WhatsApp..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status} value={status}>{STATUS_CONFIG[status]?.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={fetchOrders} title="Refresh">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickFilters.map(item => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === item.value ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600'}`}
            >
              {item.label} <span className="ml-1 opacity-70">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="py-14 text-center">
            <ClipboardList className="h-11 w-11 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">Tidak ada pesanan</p>
            <p className="text-sm text-slate-400 mt-1">Coba ubah pencarian atau filter status.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Mitra</TableHead>
                  <TableHead>Cabang / PIC</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(order => (
                  <TableRow key={order.id} className="hover:bg-slate-50/70">
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatTanggal(order.createdAt)}</TableCell>
                    <TableCell className="font-bold">{order.kodeMitra}</TableCell>
                    <TableCell><div className="font-semibold">{order.namaCabang}</div><div className="text-xs text-slate-400">{order.namaPic}</div></TableCell>
                    <TableCell className="font-bold tabular-nums whitespace-nowrap">{formatRupiah(order.totalHarga)}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <StatusSelect currentStatus={order.status} onChange={s => handleChangeStatus(order.id, s)} disabled={changingStatus === order.id} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(order => (
              <Card key={order.id} className="rounded-2xl overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900">{order.kodeMitra}</p>
                      <p className="text-sm font-semibold text-slate-700 truncate">{order.namaCabang}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.namaPic} • {formatTanggal(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <p className="font-black text-lg tabular-nums">{formatRupiah(order.totalHarga)}</p>
                    <div className="flex items-center gap-1.5">
                      <StatusSelect currentStatus={order.status} onChange={s => handleChangeStatus(order.id, s)} disabled={changingStatus === order.id} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">Detail Pesanan <StatusBadge status={selectedOrder.status} /></DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                <div className="grid sm:grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                  <InfoRow label="Kode Mitra" value={selectedOrder.kodeMitra} />
                  <InfoRow label="Cabang" value={selectedOrder.namaCabang} />
                  <InfoRow label="PIC" value={selectedOrder.namaPic} />
                  <InfoRow label="WhatsApp" value={selectedOrder.whatsapp} />
                  <InfoRow label="Alamat" value={selectedOrder.alamat} />
                  <InfoRow label="Tanggal" value={formatTanggal(selectedOrder.createdAt)} />
                  {selectedOrder.catatan && <InfoRow label="Catatan" value={selectedOrder.catatan} />}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Alur Status</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {['menunggu', 'diproses', 'dikirim', 'selesai'].map((status, index) => (
                      <div key={status} className="flex items-center gap-2">
                        <button
                          onClick={() => handleChangeStatus(selectedOrder.id, status)}
                          disabled={changingStatus === selectedOrder.id}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${selectedOrder.status === status ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}
                        >{STATUS_CONFIG[status].label}</button>
                        {index < 3 && <span className="text-slate-300">→</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-sm mb-2">Item Pesanan</h4>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-slate-50"><TableHead>Produk</TableHead><TableHead className="text-center">Jumlah</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {selectedOrder.orderItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell><p className="font-semibold">{item.product.namaProduk}</p><p className="text-xs text-slate-400">{formatRupiah(item.hargaSatuan)} / {item.product.satuan}</p></TableCell>
                            <TableCell className="text-center">{item.jumlah} {item.product.satuan}</TableCell>
                            <TableCell className="text-right font-bold">{formatRupiah(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 flex justify-end"><div className="text-right"><p className="text-xs text-slate-400">Total Pesanan</p><p className="text-2xl font-black">{formatRupiah(selectedOrder.totalHarga)}</p></div></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}><Icon className="h-4 w-4" /></div>
        <div><p className="text-xl font-black tabular-nums text-slate-900">{value}</p><p className="text-[11px] text-slate-400 font-semibold">{label}</p></div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <Badge variant="outline">{status}</Badge>
  const Icon = cfg.icon
  return <Badge variant="outline" className={`${cfg.className} gap-1 text-[11px] font-bold rounded-full`}><Icon className="h-3 w-3" />{cfg.label}</Badge>
}

function StatusSelect({ currentStatus, onChange, disabled }: { currentStatus: string; onChange: (status: string) => void; disabled?: boolean }) {
  return (
    <Select value={currentStatus} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-32 h-8 text-xs rounded-lg">{disabled ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}</SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{STATUS_CONFIG[status]?.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p><p className="font-semibold text-slate-800 mt-0.5 break-words">{value || '-'}</p></div>
}
