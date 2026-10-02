# PalletPort product SKUs

Every product has a stable, unique SKU in the form `PP-8F2A6C91D4B7`. `PP` identifies PalletPort; the twelve hexadecimal characters are randomly generated from a database UUID.

The `Lot.sku` field is required and protected by a unique index. Its database default generates a SKU for every new product, including admin-created products, seed data, and imports. Product updates leave the SKU unchanged. Supplier identifiers remain in `externalSku` for internal import matching.

Product details, product structured data, search, and Merchant Center IDs use the PalletPort SKU. Item SKUs in manifests continue to identify the individual merchandise items.

To apply this additive schema change to another configured database:

```powershell
node --env-file=.env --import tsx scripts/add-product-skus.ts
npx prisma generate
```

The migration preserves existing SKUs and supplier IDs and verifies that every product has a unique branded SKU.
