# Product catalog import

Imported on 2026-10-02 into the configured store database:

| Catalog | Products |
|---|---:|
| Existing Jax catalog | 244 |
| Liquidation Stock liquidation-pallet collection | 40 |
| USA Pallet Liquidators public catalog | 75 |
| Total imported listings | 359 |

Existing non-imported listings were retained. The 115 additional listings have product titles, original descriptions assembled from available product facts, photos, prices, availability, categories, and available specification or assortment details. Descriptions preserve published quantities and ranges without promoting approximate counts to exact unit counts. No unpublished manifests, shipping weights, warehouse locations, or stock quantities were invented.

Liquidation Stock lists prices in EUR. Its prices were converted to USD at 1 EUR = 1.1298 USD, with the exchange-rate date 2026-10-01. The original prices, currency, and exchange-rate metadata remain in the internal snapshot. Public prices are USD. Availability defaults to a single listed lot when the catalog confirms availability but does not expose an exact stock count.

Faire's supplied pages returned HTTP 403. Complete product descriptions and wholesale prices could not be retrieved, so no incomplete Faire product listings were added. These are recorded as unavailable in the import report.

## Files and commands

- `prisma/supplier-products.json`: normalized product facts and internal provenance.
- `docs/PRODUCT-IMPORT-RESULT.json`: database import results.
- `docs/PRODUCT-IMAGE-IMPORT.json`: gallery-image download results.
- `prisma/supplier-import-backup.json` and `prisma/jax-attribution-backup.json`: local rollback records, excluded from Git.

```powershell
npm run catalog:fetch-suppliers
node scripts/localize-product-images.mjs
npm run catalog:check-suppliers
npm run catalog:import-suppliers
```

The import uses stable external IDs and updates matching imported listings. It does not delete existing listings. Fetching and localization require network access. Review the exchange rate and availability before refreshing live pricing. The additional galleries contain 357 verified product-image files; one undersized image was omitted.

Supplier attribution is retained internally through original URLs and snapshots. Public Source facts, source filters, photo attribution displays, and the credits page were removed. Import scripts write an empty public-facing source field for these listings.
