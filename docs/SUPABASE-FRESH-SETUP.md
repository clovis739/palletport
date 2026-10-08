# Fresh Supabase setup

This imports the local public catalog and creates one ADMIN. It imports no former users, orders, reviews, carts, sessions, audit logs or private settings. It does not erase Neon. The application continues to use Prisma and its existing authentication.

## Prepare the project

1. Create a new Supabase PostgreSQL project. In API settings, **disable the Data API**, since this application accesses PostgreSQL from its server using Prisma. Keep it disabled before creating tables.
2. Copy the transaction pooler URL (port 6543) into local `.env` as `DATABASE_URL`. For this Prisma 6 project, add `pgbouncer=true&connection_limit=2&sslmode=require` to its query parameters.
3. Set `DATABASE_URL_UNPOOLED` to the session pooler URL (port 5432), or the direct URL when IPv6 is available. Both URLs must refer to the same new project. Use the same server credential and keep it private.
4. Set `FRESH_ADMIN_EMAIL`, `FRESH_ADMIN_PASSWORD` (at least 12 characters), and optionally `FRESH_ADMIN_NAME` and `FRESH_BUSINESS_NAME` locally. These are application login credentials, separate from the database password. Generate a new `AUTH_SECRET` to invalidate old login cookies.

Official connection instructions: [Supabase with Prisma](https://supabase.com/docs/guides/database/prisma). The current guide also covers a dedicated Prisma database role. This repository keeps its existing Prisma 6 schema configuration rather than adopting Prisma 7 configuration.

## Import

The locally generated, Git-ignored `prisma/fresh-catalog.json` contains 593 listings, category records, manifests, cleaned local image paths and full warehouse addresses. It is only needed for one-time setup and verification, and is not required for deployment or runtime. Generate it with `npm.cmd run catalog:prepare-fresh` when the local original export is available. 456 SKUs are recovered from the local Merchant feed; other SKUs are generated once and kept in the snapshot. 136 original products have no assigned product gallery and retain their category fallback photo. Supplier listings contain 457 assigned galleries. This snapshot reflects local files, not a final live Neon export: past admin edits and live stock changes may differ. Review prices, availability and business/policy settings before launch.

```powershell
npm.cmd run db:fresh:check
# Only after .env points at the NEW Supabase project:
npm.cmd run db:push
npm.cmd run db:fresh
npm.cmd run db:fresh:verify
```

The bootstrap checks every application table and refuses a nonempty database. It runs the import in a transaction, creates one admin, enables RLS on application tables, and revokes Data API roles' table privileges. It never deletes records or imports demo accounts. Server connections must use the table owner or a suitable privileged Prisma role. Do not run `db:seed` or `setup`: those older demo commands delete existing application data.

After success, remove `FRESH_ADMIN_PASSWORD` from `.env`, log in, review the business profile, checkout, shipping and returns settings, and verify product/cart/order/admin flows. Existing settings start from defaults; prior customizations are not copied. Photos remain local assets, with existing Cloudinary configuration retained for uploads.

## Deployment

Set both new database URLs and the new `AUTH_SECRET` in the hosting environment. Do not deploy bootstrap credentials. Test before redirecting production traffic, then regenerate the Merchant feed and sitemap with their export commands. Database provisioning and a live login/checkout test must succeed before declaring the migration complete.

Public browsing currently uses the query caching and pagination changes. Serving the entire catalog independently of PostgreSQL is a separate, unfinished change; generating this import snapshot does not switch public pages to static storage.

## Rebuilding the snapshot

`npm.cmd run catalog:prepare-fresh` rebuilds from the local original `prisma/export.json` (ignored/private), the three supplier snapshots, Merchant feed and approved photo mappings. Only public category/product/manifest fields are allowlisted. Existing snapshot SKUs are retained. This command is not needed on deployment.
