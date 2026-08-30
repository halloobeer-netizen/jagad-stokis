# PROJECT HANDOVER — JAGAD STOKIS

## 1. Project Overview

**Project Name:** JAGAD Stokis  
**Repository:** `Latihan-Jagad-Stokis`  
**Project Type:** Web application pemesanan bahan baku franchise fried chicken  
**Status:** Active Development / Production Stabilization  
**Primary Purpose:** Memudahkan mitra melakukan repeat order bahan baku, sementara admin dapat mengelola stok dan pesanan.

Project ini adalah project yang sudah berjalan dan **BUKAN project baru**.

Developer atau AI yang mengambil alih project wajib melakukan audit repository terlebih dahulu dan tidak membangun ulang aplikasi dari nol.

---

## 2. Core Business Flow

Alur utama yang sudah ditetapkan:

```text
Mitra membuka website
        ↓
Pilih produk
        ↓
Masukkan ke cart
        ↓
Checkout
        ↓
Isi data toko + Kode Mitra
        ↓
Order dibuat
        ↓
Admin menerima notifikasi WhatsApp
        ↓
Stok berkurang otomatis
```

Konsep awal tidak mewajibkan login pelanggan.

Sistem mendukung banyak cabang / mitra dengan harga produk yang sama.

---

## 3. Existing Technology Direction

Teknologi yang sudah digunakan dalam project:

- Next.js
- Prisma
- PostgreSQL
- Neon
- GitHub
- Vercel
- WhatsApp integration melalui Wablas
- Z.ai / coding agent pernah digunakan selama development

Repository aktual adalah source of truth untuk versi package dan struktur implementasi.

Jangan melakukan upgrade major framework atau Prisma tanpa audit kompatibilitas terlebih dahulu.

---

## 4. Existing Main Features

Fitur yang sudah pernah dibuat:

### Customer / Partner Side
- Daftar produk
- Produk bahan baku
- Shopping cart
- Checkout
- Pengisian data toko
- Kode Mitra
- Order processing

### Admin Side
- Admin panel
- Input / pengelolaan stok
- Melihat pesanan
- Inventory / stock management
- Order management

### Integration
- Notifikasi WhatsApp admin
- Integrasi Wablas

---

## 5. Seed Product Data

Database sebelumnya berhasil diisi dengan seed sekitar:

**14 produk bahan baku**

Sebelum mengubah data seed:

1. Periksa database production.
2. Periksa file seed.
3. Jangan overwrite stok atau produk nyata tanpa instruksi eksplisit.

---

## 6. Database

Database yang digunakan:

**PostgreSQL / Neon**

Prisma digunakan sebagai ORM / database layer.

Pada development sebelumnya:

- Neon database berhasil dibuat.
- `db push` pernah berhasil.
- Seed produk pernah berhasil.

Namun koneksi database production pernah menjadi masalah utama.

---

## 7. Important Known Production Issue

Status terakhir belum dianggap stabil penuh.

Endpoint:

```text
/api/products
```

pernah menghasilkan:

```text
HTTP 500
```

Beberapa penyebab / konflik yang pernah ditemukan:

- `DATABASE_URL` masih berupa placeholder pada suatu tahap.
- Inkompatibilitas `@prisma/adapter-neon` versi 7 dengan Prisma Client versi 6.
- Breaking changes Prisma 7.
- Kebutuhan menggunakan pooled Neon connection yang cocok untuk Vercel/serverless.

Perbaikan pernah dicoba, tetapi endpoint masih sempat error.

**Jangan langsung meng-upgrade Prisma.**

Audit versi package aktual:

```bash
npm list prisma
npm list @prisma/client
npm list @prisma/adapter-neon
```

dan periksa `package.json` serta lockfile.

---

## 8. Production URL

Project pernah berhasil online di:

```text
https://jagad-stockis.vercel.app
```

Sebelum menganggap deployment masih aktif/stabil, cek deployment terbaru di Vercel.

---

## 9. GitHub

Repository:

```text
Latihan-Jagad-Stokis
```

Sebelum coding:

```bash
git status
git log --oneline
```

Periksa branch dan commit terbaru.

Jangan menghapus Git history.

---

## 10. Environment Variables

Environment variables yang pernah digunakan / diarahkan di Vercel mencakup:

```text
DATABASE_URL
ADMIN_PASSWORD
WABLAS_*
NEXT_PUBLIC_ADMIN_WA
```

Nama aktual harus diverifikasi dari source code.

Jangan memasukkan secret asli ke repository.

Jangan expose:

- database credential
- password admin
- Wablas token
- API key
- secret key

---

## 11. WhatsApp Integration

Integrasi WhatsApp sebelumnya menggunakan:

**Wablas**

Target workflow:

```text
Checkout success
      ↓
Order tersimpan
      ↓
Notification service
      ↓
WhatsApp admin
```

Jika WhatsApp gagal:

- order tidak boleh hilang,
- transaksi tetap harus tercatat,
- error notification harus ditangani terpisah.

Jangan menjadikan keberhasilan WhatsApp sebagai syarat agar order tersimpan.

---

## 12. Inventory Principle

Ketika order valid dibuat:

```text
Order created
      ↓
Order items recorded
      ↓
Stock adjusted
```

Stock tidak boleh negatif kecuali business rule memang mengizinkan.

Idealnya perubahan order dan stock menggunakan database transaction bila stack aktual mendukung.

---

## 13. Static Product Fallback

Pada tahap troubleshooting sebelumnya pernah diputuskan bahwa:

**data statis dapat digunakan sebagai fallback jangka pendek agar website tetap dapat digunakan saat database production bermasalah.**

Fallback bukan pengganti database final.

Jika fallback masih ada di repository:

- jangan hapus sebelum database production stabil,
- tandai jelas source data,
- pastikan tidak menyebabkan data stock palsu dianggap production stock.

---

## 14. Database Migration Direction

Pernah ada rencana menengah untuk mempertimbangkan:

**Supabase**

Namun ini bukan instruksi untuk langsung migrasi.

Current repository dan database production tetap harus diaudit dahulu.

Jangan memindahkan Neon → Supabase tanpa instruksi eksplisit terbaru.

Prioritas saat takeover:

**stabilkan koneksi database production yang ada terlebih dahulu.**

---

## 15. Admin Authentication

Project menggunakan / pernah menggunakan:

```text
ADMIN_PASSWORD
```

Sebelum mengganti sistem auth:

- audit implementasi admin login,
- audit middleware,
- audit session/cookie handling.

Jangan mengganti auth hanya karena ada library lain yang lebih modern.

---

## 16. Main Development Priority

Urutan prioritas:

### Priority 1
Pastikan build repository terbaru berhasil.

### Priority 2
Perbaiki koneksi database production.

### Priority 3
Pastikan `/api/products` tidak lagi 500.

### Priority 4
Pastikan daftar produk mengambil data benar.

### Priority 5
Test cart + checkout.

### Priority 6
Test order tersimpan ke database.

### Priority 7
Test stock berkurang dengan benar.

### Priority 8
Test admin dashboard.

### Priority 9
Test notifikasi WhatsApp.

### Priority 10
Baru lanjut fitur tambahan.

---

## 17. Recommended Takeover Audit

AI / developer baru harus melakukan:

```text
PROJECT AUDIT

1. Framework and package versions
2. Repository folder structure
3. Prisma version
4. Prisma schema
5. Neon connection configuration
6. DATABASE_URL usage
7. Product API
8. Cart flow
9. Checkout API
10. Order transaction logic
11. Stock reduction logic
12. Admin authentication
13. WhatsApp integration
14. Vercel configuration
15. Current build/deployment errors
16. Recommended smallest next fix
```

Jangan langsung melakukan refactor besar.

---

## 18. Important Safety Rules

Dilarang tanpa izin eksplisit:

```text
DROP DATABASE
DROP TABLE
TRUNCATE
prisma migrate reset
delete all products
delete all orders
reset production stock
```

Jangan menjalankan destructive migration di production.

---

## 19. UI / UX Direction

Pertahankan tampilan yang sudah stabil.

Fokus UI:

- mudah digunakan mitra,
- proses repeat order cepat,
- produk mudah dilihat,
- cart mudah dipahami,
- checkout sederhana,
- admin dashboard praktis.

Jangan redesign seluruh website hanya untuk memperbaiki backend.

---

## 20. Locked / Preserved Decisions

Anggap keputusan ini sebagai arah yang harus dipertahankan sampai ada instruksi baru:

- JAGAD Stokis adalah sistem repeat order bahan baku franchise fried chicken.
- Customer/mitra dapat memilih produk → cart → checkout.
- Checkout menggunakan data toko dan Kode Mitra.
- Tidak perlu memaksakan login customer pada flow utama saat ini.
- Sistem mendukung banyak cabang/mitra.
- Harga produk sama sesuai katalog.
- Admin mengelola stok dan pesanan.
- Stock diarahkan berkurang otomatis setelah order valid.
- Admin menerima notifikasi WhatsApp.
- GitHub + Vercel digunakan dalam deployment.
- Neon/PostgreSQL adalah database yang pernah digunakan.
- Database production stabilization adalah prioritas.
- Jangan rebuild fitur yang sudah bekerja.

---

## 21. Correct Workflow

```text
READ REPOSITORY
↓
AUDIT
↓
RUN LOCALLY
↓
IDENTIFY CURRENT ERROR
↓
FIX SMALLEST ROOT CAUSE
↓
TEST DATABASE
↓
TEST PRODUCT API
↓
TEST CHECKOUT
↓
TEST STOCK
↓
TEST WHATSAPP
↓
COMMIT
↓
DEPLOY
```

Bukan:

```text
DELETE
↓
REBUILD EVERYTHING
```

---

## 22. Final Instruction

This is an existing production-oriented project.

Treat the latest GitHub repository, current Vercel deployment, and active database as the source of truth.

Preserve working features.

The immediate engineering goal is to make the existing ordering, inventory, database, admin, and WhatsApp workflow stable before adding unnecessary new features.
