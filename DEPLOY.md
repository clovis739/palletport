# Deploying PalletPort to Vercel + Neon

The app runs on **Vercel** (hosting), with **Neon** (Postgres database) and **Vercel Blob** (uploaded photos).
Your PC keeps working as the development copy, using its own Neon database branch.

## 1. One-time: install the new package

```powershell
npm install @vercel/blob
```

## 2. Create the database (Neon)

1. Sign in at vercel.com → **Storage** → **Create Database** → **Neon** (free plan). Name it `palletport`.
2. In Neon, open the project → **Branches**. Keep `main` for the live site and create a branch `dev` for your PC.
3. For the **dev** branch click **Connect** and copy two connection strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct / unpooled** → `DATABASE_URL_UNPOOLED`
4. Put both in your local `.env` (replace the old `file:./dev.db` line):

```env
DATABASE_URL="postgresql://…-pooler….neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://….neon.tech/neondb?sslmode=require"
```

## 3. Create the tables and copy your data (on your PC)

Stop `npm run dev` first (Windows locks Prisma's files while it runs), then:

```powershell
npx prisma generate
npx prisma db push                 # creates every table in the dev branch
npx tsx scripts/import-data.ts     # copies prisma/export.json (your old SQLite data) into it
npm run dev
```

`prisma/export.json` was made from your SQLite `dev.db` with `python scripts/export-sqlite.py`. Re-run that
first if you changed data since. (Or start fresh with `npm run db:seed` instead of the import.)

When the dev branch looks right, load the **main** branch the same way: temporarily point `.env` at main's two
URLs, run `npx prisma db push` and `npx tsx scripts/import-data.ts`, then point `.env` back at dev.

## 4. Put the code on GitHub

Create a **private** repository and push the project. These are git-ignored and must stay out of it:
`.env`, `prisma/*.db`, `prisma/export.json`, `uploads/`, `node_modules/`, `.next/`.

## 5. Create the Vercel project

1. vercel.com → **Add New → Project** → import the GitHub repository (Next.js is detected; keep the defaults).
2. Before the first deploy, open **Storage** in the project and connect:
   - the **Neon** database (main branch) → sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
   - a new **Blob** store → sets `BLOB_READ_WRITE_TOKEN`
3. **Settings → Environment Variables**, add:
   - `AUTH_SECRET` = a new long random string (not the one in your `.env`)
   - `STORE_WHATSAPP` (optional), and `APP_URL=https://yourdomain.com` once you have a domain
4. **Deploy.** `npm install` runs `prisma generate` automatically; the build is `next build`.

## 6. After the first deploy

- Sign in at `/login` with the admin account and **change the password** (the demo accounts use `password123`).
- Delete or change the other demo accounts, and replace the sample lots with real stock.
- Add your domain: project → **Settings → Domains**.
- Schema changes later: `npx prisma db push` against dev, test, then against main, then deploy.

## Notes

- **Uploads:** on Vercel, photos go to Blob (`BLOB_READ_WRITE_TOKEN`). Without it the admin shows
  "Photo storage isn't set up yet". Locally (no token) files still go to `uploads/`.
- **Size limits:** Vercel accepts requests up to 4.5 MB. Lot photos are shrunk in the browser (1600px, about
  380 KB each) so 10 fit in one save; media library files are limited to 4 MB each.
- **Plan:** Vercel's free Hobby plan is for non-commercial use; a live store needs Pro.
- **Payments:** card payments are recorded but not charged until Stripe is connected.

## Google: Merchant Center, Search Console, Business Profile

- **Sitemap:** `https://yourdomain.com/sitemap.xml` (already listed in robots.txt). Submit it in Google Search Console.
- **Merchant Center feed:** `https://yourdomain.com/merchant-feed.xml`. In Merchant Center → Products → Add products → *Add products from a file* → enter the URL and fetch daily. Only in-stock lots **with their own uploaded photos** are included (stock photos aren't allowed by Google). Set shipping and returns in Merchant Center.
- **Google reviews + map:** in Admin → Site settings → Business profile, fill the street address, the **Google Place ID** and the **Google profile link**. Optional Vercel env vars:
  - `GOOGLE_PLACES_API_KEY` — Places API (New) key; shows your live star rating and latest reviews (paid API after Google's monthly free credit; results refresh hourly).
  - `GOOGLE_MAPS_EMBED_KEY` — Maps Embed API key (free); without it a keyless map embed is used.
  Restrict both keys in Google Cloud (API + your domain).
