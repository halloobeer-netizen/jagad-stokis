// ── Types ──────────────────────────────────────────────
export interface WhatsAppOrderPayload {
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  alamat: string
  catatan: string | null
  totalHarga: number
  items: {
    namaProduk: string
    satuan: string
    jumlah: number
    hargaSatuan: number
    subtotal: number
  }[]
  createdAt: string
}

// ── Config (server-side only) ─────────────────────────
const WABLAS_API_HOST = process.env.WABLAS_API_HOST || 'https://wablas.com'
const WABLAS_TOKEN = process.env.WABLAS_TOKEN || ''
const WABLAS_SECRET_KEY = process.env.WABLAS_SECRET_KEY || ''
const WABLAS_ADMIN_PHONE = process.env.WABLAS_ADMIN_PHONE || ''

// Fallback admin number untuk wa.me link (client-side)
const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WA || process.env.WABLAS_ADMIN_PHONE || ''

function getWablasBaseUrl(): string {
  const configured = WABLAS_API_HOST.replace(/\/+$/, '')

  // Host lama smg.wablas.com sempat memutus koneksi TLS dari Vercel.
  // Gunakan endpoint resmi Wablas bila host lama masih tersimpan di env.
  if (!configured || configured.includes('smg.wablas.com')) {
    return 'https://wablas.com'
  }

  return configured
}

// ── Wablas API ─────────────────────────────────────────

/**
 * Kirim notifikasi pesanan baru ke WhatsApp Admin via Wablas.
 * Dipanggil dari server-side (API route) setelah order tersimpan.
 * Jika gagal, hanya log error — tidak throw agar checkout tetap berhasil.
 */
export async function sendWablasNotification(payload: WhatsAppOrderPayload): Promise<void> {
  if (!WABLAS_TOKEN || !WABLAS_SECRET_KEY || !WABLAS_ADMIN_PHONE) {
    console.warn('[Wablas] Konfigurasi WABLAS_TOKEN, WABLAS_SECRET_KEY, atau WABLAS_ADMIN_PHONE belum lengkap')
    return
  }

  const message = formatOrderMessage(payload)
  const authorization = `${WABLAS_TOKEN}.${WABLAS_SECRET_KEY}`
  const phone = WABLAS_ADMIN_PHONE.replace(/[^0-9]/g, '')
  const url = `${getWablasBaseUrl()}/api/v2/send-message`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify({
        data: [
          {
            phone,
            message,
            isGroup: 'false',
            flag: 'instant',
            priority: 'high',
            retry: 3,
          },
        ],
      }),
      cache: 'no-store',
    })

    const text = await res.text().catch(() => '')

    if (!res.ok) {
      console.error(`[Wablas] HTTP ${res.status}: ${text}`)
      return
    }

    let data: unknown = text
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // Biarkan response mentah untuk log diagnostik bila bukan JSON.
    }

    console.log('[Wablas] Notifikasi pesanan diterima API Wablas', data)
  } catch (error) {
    console.error('[Wablas] Gagal mengirim notifikasi:', error)
  }
}

// ── wa.me deep link (client-side) ─────────────────────

/**
 * Format pesanan ke dalam template pesan WhatsApp yang rapi.
 */
export function formatOrderMessage(payload: WhatsAppOrderPayload): string {
  const waktu = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(payload.createdAt))

  const lines: string[] = [
    '🛒 *PESANAN BARU - JAGAD STOCKIS*',
    '',
    `Kode Mitra : ${payload.kodeMitra}`,
    `Cabang     : ${payload.namaCabang}`,
    `PIC        : ${payload.namaPic}`,
    `WhatsApp   : ${payload.whatsapp}`,
    `Alamat     : ${payload.alamat || '-'}`,
  ]

  if (payload.catatan) {
    lines.push(`Catatan    : ${payload.catatan}`)
  }

  lines.push('')
  lines.push('📦 *Detail Pesanan:*')

  for (const item of payload.items) {
    lines.push(`  - ${item.namaProduk} : ${item.jumlah} ${item.satuan}`)
  }

  lines.push('')
  lines.push(`Total      : *${formatRupiah(payload.totalHarga)}*`)
  lines.push(`Waktu      : ${waktu}`)

  return lines.join('\n')
}

/**
 * Generate wa.me deep link (tetap tersedia untuk tombol manual di frontend).
 */
export function generateWhatsAppLink(payload: WhatsAppOrderPayload): string {
  const message = formatOrderMessage(payload)
  const encoded = encodeURIComponent(message)
  const phone = ADMIN_WHATSAPP.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${encoded}`
}

// ── Helper ──────────────────────────────────────────────
function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
