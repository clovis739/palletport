# PalletPort

A wholesale marketplace for liquidation pallets. Resellers browse manifested lots from verified sellers, check out with card, wire or Net 30, and track freight. Sellers open a store, list pallets with a pasted manifest, and move orders through fulfilment.

**Stack:** Next.js 15 (App Router, Server Actions) · React 19 · Prisma + SQLite (swap to Postgres for production) · Tailwind CSS v4 · JWT cookie sessions (`jose`) · `bcryptjs`

## Quick start

```bash
cp .env.example .env          # then set AUTH_SECRET (openssl rand -base64 32)
npm install
npm run setup                 # creates the SQLite DB and seeds sample data
                              # (after pulling schema changes: npx prisma db push --force-reset && npm run db:seed)
npm run dev                   # http://localhost:3000
```

Demo logins (password `password123`):
- Buyer: `buyer@palletport.test`
- Seller: `seller1@palletport.test` … `seller4@palletport.test`

## What's included (58 pages)

| Area | Routes |
|---|---|
| Discovery | `/` home · `/lots` search + filters (category, subcategory, condition, price, seller values, seller, sort) · `/categories` · `/c/[slug]` category landing · `/new` new arrivals · `/trending` · `/collections` + `/collections/[slug]` · `/sellers` directory · `/sellers/[slug]` storefront (follow, message, reviews, offers) · `/lots/[slug]` lot detail (manifest, save, message seller, reviews) |
| Buyer | `/register` (business type, referral codes) · `/login` · `/forgot-password` · `/reset-password/[token]` · `/cart` (promo codes, seller minimums) · `/checkout` · `/orders` · `/orders/[id]` (tracking, cancel, reorder, reviews) · `/messages` + `/messages/[id]` |
| Account | `/account` profile & address · `/account/verification` resale certificate (unlocks Net 30) · `/account/favorites` saved lots + followed sellers · `/account/referrals` · `/account/security` |
| Seller hub | `/sell` onboarding · `/dashboard` overview · `/dashboard/orders` (status + tracking) · `/dashboard/lots` · `/dashboard/new` · `/dashboard/lots/[id]` edit/delete · `/dashboard/customers` · `/dashboard/promotions` · `/dashboard/analytics` · `/dashboard/payouts` · `/dashboard/settings` · `/sell/refer` · `/sell/resources` |
| Learn | `/how-it-works` · `/help` + `/help/[slug]` (searchable) · `/blog` + `/blog/[slug]` · `/reports` · `/guides` + `/guides/[slug]` (by store type) |
| Programs | `/pro` membership · `/volume-buyers` · `/affiliates` · `/events` (Warehouse Days) · `/integrations` — each with an application form |
| Company & legal | `/about` · `/contact` · `/legal/[slug]` (terms, privacy, cookies, returns & disputes, prohibited items, IP, accessibility) · `/site-map` · `/sitemap.xml` · `/robots.txt` |
| Admin | `/dashboard` — owner + staff back office (orders, lots, content, media, site settings). `/admin` redirects to `/dashboard/inbox`. See docs/ADMIN.md |

Demo logins (password `password123`): `buyer@palletport.test` (verified, has orders, a review, a message thread), `pending@palletport.test` (certificate awaiting review), `seller1@palletport.test`…`seller6@palletport.test`, `admin@palletport.test`.

Demo promo codes: `WELCOME10` (first order), `FREIGHT150` ($150 off $2,500+), `RIVERSIDE5` (seller code).

Content (help articles, blog posts, guides, policies, collections) lives in `src/content/*.ts` and `src/lib/collections.ts` — edit those files to change copy; pages regenerate from them. **Have a lawyer review `src/content/legal.ts` before launch.**

## Project layout

```
prisma/schema.prisma      data model (User, Seller, Category, Lot, ManifestItem, CartItem, Order, OrderItem)
prisma/seed.ts            8 categories, 29 subcategories, 6 sellers, ~38 lots, orders, reviews, promos, messages
src/app/                  pages (App Router)
src/app/actions/          server actions: auth, account, cart, orders, promo, seller, social, inquiry, admin
src/content/              help, blog, guides and legal copy
src/components/           Header, Footer, LotCard, PalletArt (generated illustrations), etc.
src/lib/                  db client, session/auth helpers, pricing + freight rules
src/middleware.ts         redirects signed-out users away from protected routes
```

## Before going live

1. **Database** – change `provider` in `schema.prisma` to `postgresql` and point `DATABASE_URL` at a hosted Postgres (Neon, Supabase, RDS). Run `npx prisma migrate dev` to start using migrations.
2. **Payments** – card checkout is stubbed (see `TODO(payments)` in `src/app/actions/orders.ts`). Add Stripe PaymentIntents + a webhook route; consider Stripe Connect for seller payouts.
3. **Photos** – lots render a generated pallet illustration. Add an `images` table and upload to S3/R2/Cloudinary.
4. **Freight** – flat $175/pallet with free freight over $7,500 (`src/lib/format.ts`). Replace with a real LTL quote API.
5. **Buyer verification** – add resale-certificate upload and an admin approval step before enabling Net 30.
6. **Email** – order confirmations and seller notifications (Resend, Postmark).
7. Rate-limit the login route and add password reset.

## Deploy

Works on Vercel or any Node host. Set `DATABASE_URL` and `AUTH_SECRET`, then `npm run build && npm start`.
