# Jax product catalog snapshot

`prisma/jax-products.json` contains the 244 products listed at https://jaxwholesaleliquidation.com/products when fetched on 2026-09-29. Each record has its source URL, SKU, name, category, current and crossed-out prices where shown, condition, stock count, warehouse, delivery text, full product description, and image URLs. The source can change; the snapshot is a point-in-time copy.

To refresh and validate it:

```powershell
npm run catalog:fetch-jax
npx tsx scripts/import-jax-products.ts --check
```

To import it after configuring PostgreSQL and creating the database tables:

```powershell
npx prisma db push
npm run catalog:import-jax
npm run catalog:publish-jax
```

The importer matches products by source SKU, creates new listings as **drafts**, updates matching drafts, and skips published listings. It does not delete existing products. It uses the store seller and maps source categories to PalletPort's current taxonomy. The source does not consistently provide a full manifest, verified retail value, shipping weight, or an exact per-lot unit count, so those fields remain zero and need review before publication. Source photos are stored as links to the source site; copy them to approved storage before relying on them for a live catalog.

The configured PostgreSQL database was updated with the five optional source fields in `scripts/jax-schema-diff.sql`, then the snapshot was imported and published on 2026-09-29. All 244 imported records are active; the 136 pre-existing lots were retained. A deployment using a separate database needs the schema change and import there too. Do not place database credentials in this document or commit `.env`.
