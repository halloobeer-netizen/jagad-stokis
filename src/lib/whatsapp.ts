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
const WABLAS_API_HOST = process.env.WABLAS_API_HOST || ''
const WABLAS_TOKEN = process.env.WABLAS_TOKEN || ''
const WABLAS_ADMIN_PHONE = process.env.WABLAS_ADMIN_PHONE || ''

// Fallback admin number untuk wa.me link (client-side)
const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WA || process.env.WABLAS_ADMIN_PHONE || ''

// ── Wablas API ─────────────────────────────────────────

/**
 * Kirim notifikasi pesanan baru ke WhatsApp Admin via Wablas.
 * Dipanggil dari server-side (API route) setelah order tersimpan.
 * Jika gagal, hanya log error — tidak throw.
 */
export async function sendWablasNotification(payload: WhatsAppOrderPayload): Promise<void> {
  if (!WABLAS_API_HOST || !WABLAS_TOKEN || !WABLAS_ADMIN_PHONE) {
    console.warn('[Wablas] WABLAS_API_HOST, WABLAS_TOKEN, atau WABLAS_ADMIN_PHONE belum dikonfigurasi')
    return
  }

  const message = formatOrderMessage(payload)
  const url = `${WABLAS_API_HOST.replace(/\/+$/, '')}/api/send-message`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WABLAS_TOKEN,
      },
      body: JSON.stringify({
        phone: WABLAS_ADMIN_PHONE,
        message,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[Wablas] HTTP ${res.status}: ${text}`)
      return
    }

    const data = await res.json().catch(() => null)
    console.log('[Wablas] Notifikasi terkirim', data)
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
