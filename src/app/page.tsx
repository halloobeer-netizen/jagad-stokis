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
  CheckCircle2,
  Shield,
  Flame,
  Clock,
  PackageCheck,
  Download,
} from 'lucide-react'

// ── Page Content (inside CartProvider) ───────────────
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

  function handleNewOrder() {
    setSuccessOrder(null)
    setCheckoutMode(false)
  }

  // ── Admin Mode ──────────────────────────────────
  if (adminMode) {
    return <AdminPanel onBack={() => setAdminMode(false)} />
  }

  // ── Success State ────────────────────────────────
  if (successOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/80">
        <Header cartOpen={cartOpen} setCartOpen={setCartOpen} totalItems={totalItems} onAdmin={() => setAdminMode(true)} />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <OrderSuccess order={successOrder} onNewOrder={handleNewOrder} />
        </main>
        <Footer />
        <CartSheet open={cartOpen} onOpenChange={setCartOpen} onCheckout={handleGoToCheckout} />
      </div>
    )
  }

  // ── Main App State ───────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/80">
      <Header cartOpen={cartOpen} setCartOpen={setCartOpen} totalItems={totalItems} onAdmin={() => setAdminMode(true)} />

      {/* Hero */}
      <HeroSection />

      {/* Features Bar */}
      <FeaturesBar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Product Catalog */}
        <ProductCatalogSection
          showCheckout={checkoutMode}
          onGoToCheckout={handleGoToCheckout}
        />

        {/* Checkout Form */}
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

      {/* Floating Cart (mobile) */}
      {totalItems > 0 && !checkoutMode && !successOrder && (
        <FloatingCartButton totalPrice={totalPrice} onClick={() => setCartOpen(true)} />
      )}

      <Footer />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onCheckout={handleGoToCheckout} />
    </div>
  )
}

// ── Sub-sections ─────────────────────────────────────

function Header({ cartOpen, setCartOpen, totalItems, onAdmin }: {
  cartOpen: boolean
  setCartOpen: (v: boolean) => void
  totalItems: number
  onAdmin: () => void
}) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md shadow-red-600/20">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide leading-tight text-gray-900">
                JAGAD <span className="text-red-600">STOCKIS</span>
              </h1>
              <p className="text-[11px] text-gray-400 hidden sm:block font-medium tracking-wider uppercase">
                Franchise Fried Chicken Supply
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={onAdmin}
              title="Admin Panel"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative gap-2 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Keranjang</span>
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-[10px] rounded-full shadow-sm">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-300 blur-3xl opacity-30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
            <Flame className="h-3.5 w-3.5 text-orange-200" />
            <span className="text-white/90 text-xs font-semibold tracking-wide uppercase">
              Franchise Fried Chicken
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Pemesanan Bahan Baku
            <span className="block mt-1 text-orange-200">Mitra Franchise</span>
          </h2>
          <p className="mt-4 text-white/75 text-sm sm:text-base max-w-md leading-relaxed">
            Pesan bahan baku untuk cabang Anda dengan mudah dan cepat. Stok terjaga, pengiriman tepat waktu.
          </p>
          <div className="mt-6">
            <a
              href="/api/download"
              className="inline-flex items-center gap-2 bg-white text-red-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-md text-sm"
            >
              <Download className="h-4 w-4" />
              Download Project (ZIP)
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesBar() {
  const features = [
    { icon: Truck, label: 'Pengiriman Cepat', desc: 'Same-day delivery' },
    { icon: PackageCheck, label: 'Stok Terjamin', desc: 'Real-time tracking' },
    { icon: Clock, label: '24/7 Order', desc: 'Kapan saja' },
  ]

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 py-4">
          {features.map(f => (
            <div key={f.label} className="flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <f.icon className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{f.label}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductCatalogSection({ showCheckout, onGoToCheckout }: {
  showCheckout: boolean
  onGoToCheckout: () => void
}) {
  const { totalItems } = useCart()
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Katalog Produk</h3>
          <p className="text-sm text-gray-500 mt-1">
            Pilih bahan baku yang Anda butuhkan
          </p>
        </div>
        {totalItems > 0 && !showCheckout && (
          <Button
            className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all hover:shadow-lg hover:shadow-red-600/30"
            onClick={onGoToCheckout}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Checkout</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-semibold">{totalItems}</span>
          </Button>
        )}
      </div>
      <ProductGrid />
    </section>
  )
}

function FloatingCartButton({ totalPrice, onClick }: { totalPrice: number; onClick: () => void }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:hidden bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8">
      <Button
        className="w-full h-12 gap-2 bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-600/30 text-white font-semibold"
        onClick={onClick}
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Lihat Keranjang</span>
        <span className="ml-auto font-bold tabular-nums text-sm bg-white/20 px-2 py-0.5 rounded-lg">{formatRupiah(totalPrice)}</span>
      </Button>
    </div>
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

// ── Root Page ────────────────────────────────────────
export default function HomePage() {
  return (
    <CartProvider>
      <PageContent />
    </CartProvider>
  )
}

// ── Helpers ──────────────────────────────────────────
function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
