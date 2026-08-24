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

// ── Fonnte config (server-side only) ──────────────────
// Mendukung nama env yang sudah dipakai di Vercel (FOONTE_*)
// sekaligus ejaan resmi FONNTE_* agar tetap kompatibel.
const FONNTE_TOKEN = process.env.FOONTE_TOKEN || process.env.FONNTE_TOKEN || ''
const FONNTE_ADMIN_PHONE = process.env.FOONTE_ADMIN_PHONE || process.env.FONNTE_ADMIN_PHONE || ''
const FONNTE_API_URL = 'https://api.fonnte.com/send'

// Fallback untuk link manual jika suatu saat dibutuhkan lagi.
const ADMIN_WHATSAPP =
  process.env.NEXT_PUBLIC_ADMIN_WA ||
  process.env.FOONTE_ADMIN_PHONE ||
  process.env.FONNTE_ADMIN_PHONE ||
  ''

/**
 * Kirim notifikasi pesanan baru otomatis ke WhatsApp Admin via Fonnte.
 * Dipanggil dari API route setelah order berhasil tersimpan.
 * Error tidak dilempar kembali agar checkout customer tetap berhasil.
 */
export async function sendFonnteNotification(payload: WhatsAppOrderPayload): Promise<void> {
  if (!FONNTE_TOKEN || !FONNTE_ADMIN_PHONE) {
    console.warn('[Fonnte] FOONTE_TOKEN/FONNTE_TOKEN atau FOONTE_ADMIN_PHONE/FONNTE_ADMIN_PHONE belum dikonfigurasi')
    return
  }

  const target = FONNTE_ADMIN_PHONE.replace(/[^0-9]/g, '')
  const message = formatOrderMessage(payload)

  try {
    const body = new URLSearchParams()
    body.set('target', target)
    body.set('message', message)
    body.set('countryCode', '62')

    const res = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: FONNTE_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
    })

    const text = await res.text().catch(() => '')

    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }

    if (!res.ok) {
      console.error(`[Fonnte] HTTP ${res.status}: ${text}`)
      return
    }

    if (data && data.status === false) {
      console.error('[Fonnte] API menolak pengiriman:', data)
      return
    }

    console.log('[Fonnte] Notifikasi pesanan berhasil dikirim/diterima API', data ?? text)
  } catch (error) {
    console.error('[Fonnte] Gagal mengirim notifikasi:', error)
  }
}

/**
 * Format pesanan ke template WhatsApp.
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
    lines.push(`- ${item.namaProduk} : ${item.jumlah} ${item.satuan} × ${formatRupiah(item.hargaSatuan)} = ${formatRupiah(item.subtotal)}`)
  }

  lines.push('')
  lines.push(`Total      : *${formatRupiah(payload.totalHarga)}*`)
  lines.push(`Waktu      : ${waktu}`)

  return lines.join('\n')
}

/**
 * Link manual tetap tersedia sebagai fallback internal, tetapi UI checkout
 * tidak lagi menampilkan tombol kirim WhatsApp.
 */
export function generateWhatsAppLink(payload: WhatsAppOrderPayload): string {
  const message = formatOrderMessage(payload)
  const encoded = encodeURIComponent(message)
  const phone = ADMIN_WHATSAPP.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${encoded}`
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
