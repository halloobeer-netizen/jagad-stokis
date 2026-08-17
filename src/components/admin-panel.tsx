'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminOrders } from '@/components/admin-orders'
import { AdminProducts } from '@/components/admin-products'
import { AdminStok } from '@/components/admin-stok'
import {
  ArrowLeft,
  Shield,
  Loader2,
  ClipboardList,
  Package,
  Warehouse,
  Flame,
} from 'lucide-react'

// ── Component ──────────────────────────────────────
export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('orders')

  // ── Login handler ───────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      setLoginError('Password wajib diisi')
      return
    }

    try {
      setLoginLoading(true)
      setLoginError('')
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setLoginError('Password salah')
        return
      }
      setAuthenticated(true)
    } catch {
      setLoginError('Gagal terhubung ke server')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Login Gate ──────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/80">
        <AdminHeader onBack={onBack} />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-xl border-0 shadow-gray-200/50">
            <CardContent className="pt-8 pb-6 px-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center mx-auto border border-red-100">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Masukkan password untuk mengakses panel admin
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Masukkan password admin"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setLoginError('')
                    }}
                    autoFocus
                    className={loginError ? 'border-red-400 focus-visible:ring-red-500' : ''}
                  />
                  {loginError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                      {loginError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 font-semibold"
                  disabled={loginLoading}
                >
                  {loginLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Masuk
                </Button>
              </form>

              <p className="text-center text-xs text-gray-400">
                Hubungi super admin untuk mendapatkan password
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Admin Dashboard ─────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/80">
      <AdminHeader onBack={onBack} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto bg-white border border-gray-200 p-1 shadow-sm">
            <TabsTrigger value="orders" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden xs:inline">Pesanan</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span className="hidden xs:inline">Produk</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600">
              <Warehouse className="h-4 w-4" />
              <span className="hidden xs:inline">Stok</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'stock' && <AdminStok />}
      </main>

      <Footer />
    </div>
  )
}

// ── Sub-components ──────────────────────────────────

function AdminHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-md">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide leading-tight text-gray-900 flex items-center gap-2">
                JAGAD <span className="text-red-600">STOCKIS</span>
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] px-2 py-0 font-bold tracking-wider">
                  ADMIN
                </Badge>
              </h1>
              <p className="text-[11px] text-gray-400 hidden sm:block font-medium tracking-wider uppercase">
                Panel Administrasi
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-600" />
            <p className="text-sm font-bold text-gray-900">JAGAD STOCKIS</p>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} &middot; Sistem Pemesanan Bahan Baku Franchise Fried Chicken
          </p>
        </div>
      </div>
    </footer>
  )
}