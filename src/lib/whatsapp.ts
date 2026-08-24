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

export interface WhatsAppStatusPayload {
  kodeMitra: string
  namaCabang: string
  namaPic: string
  whatsapp: string
  totalHarga: number
  status: string
}

const FONNTE_TOKEN = process.env.FOONTE_TOKEN || process.env.FONNTE_TOKEN || ''
const FONNTE_ADMIN_PHONE = process.env.FOONTE_ADMIN_PHONE || process.env.FONNTE_ADMIN_PHONE || ''
const FONNTE_API_URL = 'https://api.fonnte.com/send'

const ADMIN_WHATSAPP =
  process.env.NEXT_PUBLIC_ADMIN_WA ||
  process.env.FOONTE_ADMIN_PHONE ||
  process.env.FONNTE_ADMIN_PHONE ||
  ''

async function sendFonnte(targetPhone: string, message: string, logLabel: string): Promise<boolean> {
  if (!FONNTE_TOKEN) {
    console.warn('[Fonnte] Token belum dikonfigurasi')
    return false
  }

  const target = targetPhone.replace(/[^0-9]/g, '')
  if (!target) {
    console.warn(`[Fonnte] Nomor tujuan ${logLabel} kosong/tidak valid`)
    return false
  }

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
    try { data = text ? JSON.parse(text) : null } catch { data = null }

    if (!res.ok) {
      console.error(`[Fonnte] HTTP ${res.status} (${logLabel}): ${text}`)
      return false
    }
    if (data && data.status === false) {
      console.error(`[Fonnte] API menolak ${logLabel}:`, data)
      return false
    }

    console.log(`[Fonnte] ${logLabel} berhasil dikirim/diterima API`, data ?? text)
    return true
  } catch (error) {
    console.error(`[Fonnte] Gagal mengirim ${logLabel}:`, error)
    return false
  }
}

/** Kirim pesanan baru ke WhatsApp Admin. */
export async function sendFonnteNotification(payload: WhatsAppOrderPayload): Promise<void> {
  if (!FONNTE_ADMIN_PHONE) {
    console.warn('[Fonnte] Nomor WhatsApp admin belum dikonfigurasi')
    return
  }
  await sendFonnte(FONNTE_ADMIN_PHONE, formatOrderMessage(payload), 'notifikasi pesanan admin')
}

/** Kirim perubahan status pesanan langsung ke nomor WhatsApp mitra/PIC. */
export async function sendOrderStatusNotification(payload: WhatsAppStatusPayload): Promise<boolean> {
  return sendFonnte(payload.whatsapp, formatStatusMessage(payload), `notifikasi status ${payload.status} ke mitra`)
}

export function formatStatusMessage(payload: WhatsAppStatusPayload): string {
  const statusCopy: Record<string, { icon: string; title: string; text: string }> = {
    diproses: {
      icon: '⚙️',
      title: 'PESANAN SEDANG DIPROSES',
      text: 'Pesanan Anda sudah diterima dan sedang kami siapkan.',
    },
    dikirim: {
      icon: '🚚',
      title: 'PESANAN SUDAH DIKIRIM',
      text: 'Pesanan Anda sudah dalam perjalanan menuju lokasi.',
    },
    selesai: {
      icon: '✅',
      title: 'PESANAN SELESAI',
      text: 'Pesanan Anda telah selesai. Terima kasih telah berbelanja bersama Jagad Stockis.',
    },
    dibatalkan: {
      icon: '❌',
      title: 'PESANAN DIBATALKAN',
      text: 'Status pesanan Anda telah dibatalkan. Silakan hubungi admin jika membutuhkan informasi lebih lanjut.',
    },
    menunggu: {
      icon: '🕒',
      title: 'PESANAN MENUNGGU KONFIRMASI',
      text: 'Pesanan Anda kembali ke tahap menunggu konfirmasi admin.',
    },
  }

  const cfg = statusCopy[payload.status] || {
    icon: '📦',
    title: 'UPDATE STATUS PESANAN',
    text: `Status pesanan Anda berubah menjadi ${payload.status}.`,
  }

  return [
    `${cfg.icon} *${cfg.title}*`,
    '━━━━━━━━━━━━━━━━━━━━',
    `Halo *${payload.namaPic}*,`,
    '',
    cfg.text,
    '',
    `🏪 Cabang     : *${payload.namaCabang}*`,
    `🏷️ Kode Mitra : ${payload.kodeMitra}`,
    `💰 Total      : *${formatRupiah(payload.totalHarga)}*`,
    `📌 Status     : *${payload.status.toUpperCase()}*`,
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '_Notifikasi otomatis dari Jagad Stockis_',
  ].join('\n')
}

export function formatOrderMessage(payload: WhatsAppOrderPayload): string {
  const waktu = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  }).format(new Date(payload.createdAt))

  const totalQty = payload.items.reduce((sum, item) => sum + item.jumlah, 0)
  const lines: string[] = [
    '🛒 *PESANAN BARU — JAGAD STOCKIS*', '━━━━━━━━━━━━━━━━━━━━', `🏪 *${payload.namaCabang}*`,
    `Kode Mitra : ${payload.kodeMitra}`, `PIC        : ${payload.namaPic}`, `WhatsApp   : ${payload.whatsapp}`,
    `Alamat     : ${payload.alamat || '-'}`,
  ]
  if (payload.catatan) lines.push(`Catatan    : ${payload.catatan}`)
  lines.push('', `📦 *DETAIL PESANAN*  •  ${payload.items.length} produk / ${totalQty} item`, '━━━━━━━━━━━━━━━━━━━━')
  payload.items.forEach((item, index) => {
    lines.push(`${index + 1}. *${item.namaProduk}*`)
    lines.push(`   ${item.jumlah} ${item.satuan} × ${formatRupiah(item.hargaSatuan)} = *${formatRupiah(item.subtotal)}*`)
  })
  lines.push('', '━━━━━━━━━━━━━━━━━━━━', `💰 *TOTAL: ${formatRupiah(payload.totalHarga)}*`, `🕒 ${waktu}`, '', '_Pesanan otomatis dari Jagad Stockis_')
  return lines.join('\n')
}

export function generateWhatsAppLink(payload: WhatsAppOrderPayload): string {
  const encoded = encodeURIComponent(formatOrderMessage(payload))
  const phone = ADMIN_WHATSAPP.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${encoded}`
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
