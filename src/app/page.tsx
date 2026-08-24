'use client'

import { useState } from 'react'
import { CartProvider, useCart } from '@/lib/cart-context'
import { ProductGrid } from '@/components/product-grid'
import { CartSheet } from '@/components/cart-sheet'
import { CheckoutForm, type SubmittedOrder } from '@/components/checkout-form'
import { OrderSuccess } from '@/components/order-success'
import { AdminPanel } from '@/components/admin-panel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  Shield,
  Flame,
  Clock3,
  PackageCheck,
  Boxes,
  Wheat,
  Soup,
  Drumstick,
  BottleWine,
  Package,
  ArrowRight,
  Search,
  Warehouse,
  MapPin,
  Sparkles,
} from 'lucide-react'

function PageContent() {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState(false)
  const [successOrder, setSuccessOrder] = useState<SubmittedOrder | null>(null)
  const [adminMode, setAdminMode] = useState(false)
  const { totalItems, totalPrice } = useCart()

  function handleGoToCheckout() {
    setCheckoutMode(true)
    setSuccessOrder(null)
    setTimeout(() => {
      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function handleOrderSuccess(order: SubmittedOrder) {
    setCheckoutMode(false)
    setSuccessOrder(order)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (adminMode) return <AdminPanel onBack={() => setAdminMode(false)} />

  if (successOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header totalItems={totalItems} onCart={() => setCartOpen(true)} onAdmin={() => setAdminMode(true)} />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <OrderSuccess order={successOrder} onNewOrder={() => { setSuccessOrder(null); setCheckoutMode(false) }} />
        </main>
        <Footer />
        <CartSheet open={cartOpen} onOpenChange={setCartOpen} onCheckout={handleGoToCheckout} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb] text-slate-950">
      <Header totalItems={totalItems} onCart={() => setCartOpen(true)} onAdmin={() => setAdminMode(true)} />
      <HeroSection onShop={() => document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' })} />
      <FeaturesBar />
      <CategoryStrip />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
        <ProductCatalogSection showCheckout={checkoutMode} onGoToCheckout={handleGoToCheckout} />
        {checkoutMode && (
          <CheckoutForm
            onBack={() => {
              setCheckoutMode(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onSuccess={handleOrderSuccess}
          />
        )}
      </main>

      {totalItems > 0 && !checkoutMode && !successOrder && (
        <FloatingCartButton totalPrice={totalPrice} onClick={() => setCartOpen(true)} />
      )}
      <Footer />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onCheckout={handleGoToCheckout} />
    </div>
  )
}

function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-orange-500 shadow-lg shadow-red-600/20 flex items-center justify-center overflow-hidden">
        <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-white/20" />
        <Flame className="h-6 w-6 text-white relative z-10" />
        <div className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-sm border-2 border-white/90 rotate-45" />
      </div>
      <div className="leading-none">
        <div className={`text-[19px] sm:text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-950'}`}>
          JAGAD <span className="text-red-600">STOCKIS</span>
        </div>
        <div className={`mt-1 text-[9px] sm:text-[10px] font-bold tracking-[0.18em] uppercase ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
          Franchise Supply Network
        </div>
      </div>
    </div>
  )
}

function Header({ totalItems, onCart, onAdmin }: { totalItems: number; onCart: () => void; onAdmin: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[72px] flex items-center justify-between gap-5">
          <BrandMark />

          <nav className="hidden lg:flex items-center gap-1 rounded-2xl bg-slate-50 p-1 border border-slate-100">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-sm">Beranda</button>
            <button onClick={() => document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-red-600 transition-colors">Produk</button>
            <button onClick={() => document.getElementById('kategori')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-red-600 transition-colors">Kategori</button>
            <button onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-red-600 transition-colors">Tentang</button>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={onAdmin} title="Admin Panel">
              <Shield className="h-4.5 w-4.5" />
            </Button>
            <Button variant="outline" className="relative h-10 gap-2 rounded-xl border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600" onClick={onCart}>
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-semibold">Keranjang</span>
              {totalItems > 0 && <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center bg-red-600 text-white text-[10px] rounded-full">{totalItems}</Badge>}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function HeroSection({ onShop }: { onShop: () => void }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-y-0 right-0 w-[45%] hidden lg:block bg-gradient-to-br from-red-600 via-red-600 to-orange-500" />
      <div className="absolute right-[30%] top-0 hidden lg:block h-full w-44 bg-red-600 -skew-x-[18deg] translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-center">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-3.5 py-2 text-xs font-bold text-red-600 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> Supply Partner Anda
            </div>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-[58px] font-black leading-[1.02] tracking-[-0.035em] text-slate-950">
              Semua Kebutuhan
              <span className="block text-red-600">Bahan Baku Franchise</span>
              <span className="block">Dalam Satu Tempat.</span>
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-slate-700">
              <span>Mudah</span><i className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>Cepat</span><i className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>Aman</span><i className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>Terpercaya</span>
            </div>
            <p className="mt-4 max-w-xl text-slate-500 leading-relaxed">
              Sistem pemesanan bahan baku untuk mitra franchise. Pantau ketersediaan stok dan buat pesanan dengan cepat dari satu tempat.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={onShop} className="h-12 rounded-xl bg-red-600 hover:bg-red-700 px-6 text-white font-bold shadow-lg shadow-red-600/20 gap-2">
                <ShoppingCart className="h-4.5 w-4.5" /> Mulai Belanja <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={onShop} variant="outline" className="h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 px-6 font-bold gap-2">
                <Search className="h-4 w-4" /> Lihat Produk
              </Button>
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[420px]">
            <div className="absolute inset-0 rounded-[32px] lg:rounded-none bg-gradient-to-br from-red-600 via-red-600 to-orange-500 lg:bg-none overflow-hidden">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[28px] border-white/10" />
              <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-orange-400/30 blur-2xl" />
            </div>
            <div className="relative h-full min-h-[360px] lg:min-h-[420px] p-6 sm:p-8 flex items-center">
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="col-span-2 rounded-3xl bg-white/95 backdrop-blur shadow-2xl p-5 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center"><Warehouse className="h-8 w-8 text-red-600" /></div>
                  <div><p className="text-xs font-bold text-red-600 uppercase tracking-wider">Jagad Distribution Hub</p><p className="text-xl font-black text-slate-900 mt-1">Stok Terjaga, Bisnis Melaju.</p><p className="text-xs text-slate-500 mt-1">Distribusi bahan baku untuk jaringan franchise</p></div>
                </div>
                <div className="rounded-3xl bg-slate-950 text-white p-5 shadow-xl">
                  <Boxes className="h-7 w-7 text-red-400" />
                  <p className="mt-5 text-3xl font-black">LIVE</p><p className="text-xs text-slate-400 mt-1">Stok dipantau real-time</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-xl">
                  <Truck className="h-7 w-7 text-red-600" />
                  <p className="mt-5 text-xl font-black text-slate-900">Fast Delivery</p><p className="text-xs text-slate-500 mt-1">Pengiriman cepat & terjadwal</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-white/15 border border-white/20 px-4 py-3 text-white flex items-center gap-3">
                  <MapPin className="h-4 w-4" /><span className="text-sm font-semibold">Supply Network • Franchise Fried Chicken</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesBar() {
  const features = [
    { icon: Truck, label: 'Pengiriman Cepat', desc: 'Same-day / Next-day', badge: 'FAST' },
    { icon: PackageCheck, label: 'Stok Terjamin', desc: 'Real-time tracking', badge: 'LIVE' },
    { icon: ShieldCheck, label: 'Produk Terjaga', desc: 'Kualitas terjamin', badge: '100%' },
    { icon: Clock3, label: 'Order 24/7', desc: 'Kapan saja', badge: 'ONLINE' },
  ]
  return (
    <div className="relative z-20 -mt-1 bg-white border-y border-slate-100 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
          {features.map(f => (
            <div key={f.label} className="flex items-center gap-3 px-2 sm:px-5 py-4">
              <div className="h-11 w-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0"><f.icon className="h-5 w-5 text-red-600" /></div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{f.label}</p><span className="hidden xl:inline text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{f.badge}</span></div><p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryStrip() {
  const categories = [
    { icon: Wheat, label: 'Tepung' },
    { icon: Soup, label: 'Saus & Bumbu' },
    { icon: Drumstick, label: 'Ayam & Daging' },
    { icon: BottleWine, label: 'Minyak' },
    { icon: Package, label: 'Beras & Karbo' },
    { icon: Boxes, label: 'Kemasan' },
  ]
  return (
    <section id="kategori" className="bg-[#f5f7fb] pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Belanja lebih cepat</p><h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">Kategori Produk</h3></div>
          <button onClick={() => document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-1">Lihat Semua <ArrowRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categories.map(c => (
            <button key={c.label} onClick={() => document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' })} className="group rounded-2xl border border-slate-200 bg-white px-3 py-4 sm:py-5 text-center shadow-sm hover:border-red-200 hover:shadow-md transition-all">
              <div className="mx-auto h-11 w-11 rounded-2xl bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors"><c.icon className="h-5 w-5 text-slate-600 group-hover:text-red-600" /></div>
              <p className="mt-2 text-[11px] sm:text-xs font-bold text-slate-800">{c.label}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductCatalogSection({ showCheckout, onGoToCheckout }: { showCheckout: boolean; onGoToCheckout: () => void }) {
  const { totalItems } = useCart()
  return (
    <section id="produk" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Produk Pilihan</p><h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">Katalog Bahan Baku</h3><p className="text-sm text-slate-500 mt-1">Pilih kebutuhan operasional cabang Anda</p></div>
        {totalItems > 0 && !showCheckout && (
          <Button className="gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" onClick={onGoToCheckout}>
            <ShoppingCart className="h-4 w-4" /><span className="hidden sm:inline">Checkout</span><span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold">{totalItems}</span>
          </Button>
        )}
      </div>
      <ProductGrid />
    </section>
  )
}

function FloatingCartButton({ totalPrice, onClick }: { totalPrice: number; onClick: () => void }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:hidden bg-gradient-to-t from-[#f5f7fb] via-[#f5f7fb] to-transparent pt-8">
      <Button className="w-full h-12 gap-2 bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-600/30 text-white font-bold" onClick={onClick}>
        <ShoppingCart className="h-5 w-5" /><span>Lihat Keranjang</span><span className="ml-auto font-black tabular-nums text-sm bg-white/20 px-2 py-0.5 rounded-lg">{formatRupiah(totalPrice)}</span>
      </Button>
    </div>
  )
}

function Footer() {
  return (
    <footer id="footer" className="mt-auto bg-slate-950 text-white border-t-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-7 md:grid-cols-[1.1fr_1fr_auto] md:items-center">
          <BrandMark dark />
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">Mitra penyedia bahan baku franchise fried chicken dengan sistem pemesanan yang cepat, terukur, dan mudah digunakan.</p>
          <div className="md:text-right"><p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Jagad Stockis</p><p className="text-xs text-slate-500 mt-2">© {new Date().getFullYear()} All rights reserved.</p></div>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return <CartProvider><PageContent /></CartProvider>
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
