# PROJECT HANDOVER — JAGAD STOKIS (GITHUB-BASED)

## Repository
- Repository: `halloobeer-netizen/jagad-stokis`
- Branch: `main`
- Project: Jagad Stockis
- Type: Full-stack franchise supply, inventory, ordering & admin platform

## Source of Truth
This handover is based on the current GitHub repository. Repository and database state are the source of truth.

## Verified Stack
- Next.js 16
- React 19
- TypeScript
- Prisma 6.11.1
- PostgreSQL via `DATABASE_URL`
- NextAuth
- Tailwind CSS 4
- Radix UI
- Lucide React
- Zustand
- Zod
- React Hook Form
- TanStack React Query
- TanStack Table
- Recharts
- Framer Motion

## Repository Structure
Important root items include:
- `.env.example`
- `README.md`
- `package.json`
- `next.config.ts`
- `prisma/`
- `src/`
- `.zscripts/`
- `Caddyfile`

## Product Direction
README defines Jagad Stockis as:
- product catalog
- stock availability
- shopping cart
- ordering workflow
- admin dashboard
- product management
- inventory management
- order management
- partner/franchise management
- secure admin access

## Verified Prisma Models

### Product
Fields:
- namaProduk
- satuan
- harga
- stok
- isActive
- timestamps

### Partner
Fields:
- kodeMitra (unique)
- namaCabang
- namaPic
- whatsapp
- alamat
- pinHash
- isActive
- timestamps

This confirms partner/franchise account functionality is part of the real database model.

### Order
Fields:
- kodeMitra
- namaCabang
- namaPic
- whatsapp
- alamat
- catatan
- totalHarga
- status
- paymentMethod
- paymentStatus
- paymentVerifiedAt
- createdAt

Defaults:
- status = `menunggu`
- paymentMethod = `cod`
- paymentStatus = `belum_bayar`

### OrderItem
Fields:
- orderId
- productId
- jumlah
- hargaSatuan
- subtotal

### PaymentProof
Fields:
- orderId
- mimeType
- fileName
- fileData (Bytes)
- createdAt

There is a one-to-one relationship between Order and PaymentProof.

## Important Business Facts from Schema

### Partner Authentication / Identity
The real schema contains `kodeMitra` and `pinHash`.

Do not assume customer flow is fully anonymous. Audit current source code before changing partner access.

### Payments
The real schema supports:
- payment method
- payment status
- payment verification timestamp
- payment proof

Do not remove this flow in favor of a simpler checkout without checking current implementation.

### Inventory
`Product.stok` is the active inventory quantity.

All stock mutations must be transaction-safe where possible.

### Order Integrity
Order items are relational and deleted when an order is deleted due to cascade.

Be cautious with destructive order deletion.

## Environment Variables
`.env.example` exists.

Before deployment or integration:
- inspect actual variable names
- never expose secrets
- never commit real credentials

## Database Safety
Scripts include:
- `db:push`
- `db:migrate`
- `db:seed`
- `db:reset`

Never run `db:reset` on production without explicit approval.

Do not:
- wipe products
- wipe partners
- reset real stock
- delete orders
- delete payment proof data

## Stock Rules
When an order is confirmed/created, audit how stock changes today before altering logic.

Safe desired pattern:

validate stock
→ create order
→ create order items
→ decrement stock
→ commit

Use a database transaction if current code supports it.

Never allow negative stock unintentionally.

## Payment Proof
Payment proof is stored in the database as `Bytes`.

This can increase DB size significantly.

Do not migrate it to object storage automatically. First audit:
- current upload size limits
- Vercel/request limits
- DB usage
- current UI expectations

If migration is later requested, preserve existing proofs.

## Authentication
NextAuth is installed.

Partner also has `pinHash`.

Audit whether:
- NextAuth is admin-only
- partners authenticate by kodeMitra/PIN
- sessions are separated

Do not merge auth flows without understanding them.

## Current Development Priority
1. Verify product catalog
2. Verify partner flow
3. Verify cart
4. Verify checkout
5. Verify stock mutation
6. Verify order status
7. Verify payment flow
8. Verify payment proof
9. Verify admin dashboard
10. Verify production build

## Mandatory Audit for Next
Before coding, report:

1. `src/` architecture
2. Route structure
3. Admin auth
4. Partner auth
5. Product APIs
6. Partner APIs
7. Cart state
8. Checkout implementation
9. Order creation transaction
10. Stock decrement logic
11. Payment method handling
12. Payment proof upload/read flow
13. Admin order management
14. Environment variable requirements
15. Build/deploy status
16. Security risks
17. Data integrity risks
18. Smallest safe next task

## Locked Principles
- Product, Partner, Order, OrderItem, PaymentProof are existing production concepts.
- `kodeMitra` is unique.
- Partner PIN is stored as hash.
- Payment flow exists in the schema.
- Payment proof exists in the schema.
- Inventory is database-backed.
- Do not replace database or auth without explicit instruction.
- Do not rebuild the project.
- Repository + DB are source of truth.

## Correct Continuation Flow

READ REPO
→ AUDIT SCHEMA
→ AUDIT AUTH
→ AUDIT PRODUCT/STOCK
→ AUDIT PARTNER
→ AUDIT CART/CHECKOUT
→ AUDIT PAYMENT
→ TEST
→ FIX SMALLEST ROOT CAUSE
→ COMMIT
→ DEPLOY
