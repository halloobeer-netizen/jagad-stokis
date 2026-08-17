import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRODUCTS = [
  { namaProduk: 'Ayam Potong Whole (1kg)', satuan: 'kg', harga: 32000, stok: 500, isActive: true },
  { namaProduk: 'Ayam Paha (10pcs)', satuan: 'pack', harga: 45000, stok: 200, isActive: true },
  { namaProduk: 'Ayam Dada (10pcs)', satuan: 'pack', harga: 55000, stok: 180, isActive: true },
  { namaProduk: 'Ayam Sayap (10pcs)', satuan: 'pack', harga: 38000, stok: 250, isActive: true },
  { namaProduk: 'Ayam Ori', satuan: 'ekor', harga: 42000, stok: 150, isActive: true },
  { namaProduk: 'Tepung Terigu Protein Sedang (25kg)', satuan: 'karung', harga: 135000, stok: 100, isActive: true },
  { namaProduk: 'Tepung Beras (5kg)', satuan: 'karung', harga: 45000, stok: 80, isActive: true },
  { namaProduk: 'Bumbu Marinasi (1kg)', satuan: 'pack', harga: 28000, stok: 300, isActive: true },
  { namaProduk: 'Saus Sambal (1L)', satuan: 'botol', harga: 22000, stok: 200, isActive: true },
  { namaProduk: 'Minyak Goreng (18L)', satuan: 'jerigen', harga: 195000, stok: 60, isActive: true },
  { namaProduk: 'Nasi (10kg)', satuan: 'karung', harga: 75000, stok: 150, isActive: true },
  { namaProduk: 'Es Batu (10kg)', satuan: 'karung', harga: 15000, stok: 0, isActive: false },
  { namaProduk: 'Mie Goreng (40pcs)', satuan: 'karton', harga: 85000, stok: 90, isActive: true },
  { namaProduk: 'Tahu Goreng (1kg)', satuan: 'pack', harga: 18000, stok: 120, isActive: true },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Hapus semua produk lama, lalu insert ulang
  const deleted = await prisma.product.deleteMany()
  console.log(`🗑️  Hapus ${deleted.count} produk lama`)

  const result = await prisma.product.createMany({ data: PRODUCTS })
  console.log(`✅ ${result.count} produk berhasil ditambahkan`)

  console.log('🎉 Seeding selesai!')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
