import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import { withWarehouseAddress } from '../src/lib/warehouse';
import { cleanProductPhotos } from '../src/lib/product-photos';

type Product = { externalSku: string; slug: string; title: string; description: string; categorySlug: string; priceCents: number; originalPriceCents: number | null; condition: string; conditionText: string; available: number; lotSize: string; palletCount?: number; units: number; weightLbs: number; shipsFrom: string; delivery: string; brand: string; images: string[]; supplier: string; url: string };
const goldstack = process.argv.includes("--goldstack");
const snapshot = JSON.parse(readFileSync(goldstack ? "prisma/goldstack-products.json" : "prisma/supplier-products.json", "utf8")) as { total: number; products: Product[] };
if (snapshot.products.length !== snapshot.total || new Set(snapshot.products.map(p => p.externalSku)).size !== snapshot.total) throw new Error("Incomplete product snapshot");
for (const product of snapshot.products) {
  if (!product.description || !product.title || product.priceCents <= 0 || !product.images.length) throw new Error(`Incomplete product ${product.externalSku}`);
  if (/Gold\s*stack|Jax Wholesale|USA Pallet Liquidators|Liquidation\s*Stock|https?:\/\//i.test(product.description)) throw new Error(`Public description contains supplier attribution: ${product.externalSku}`);
}
async function main() {
if (process.argv.includes("--check")) {
  console.log(`Validated ${snapshot.total} products, descriptions, prices, images and specifications.`);
} else {
  const db = new PrismaClient();
  try {
    const seller = await db.seller.findUniqueOrThrow({ where: { slug: "store" } });
    const categories = new Map((await db.category.findMany({ select: { id: true, slug: true } })).map(c => [c.slug, c.id]));
    if (!categories.has("general-merchandise")) throw new Error("Catalog categories missing");
    const existing = await db.lot.findMany({ where: { externalSku: { in: snapshot.products.map(p => p.externalSku) } } });
    writeFileSync(goldstack ? "prisma/goldstack-import-backup.json" : "prisma/supplier-import-backup.json", JSON.stringify({ savedOn: "2026-10-02", lots: existing }, null, 2) + "\n");
    let created = 0, updated = 0;
    for (const product of snapshot.products) {
      const data = {
        title: product.title, description: withWarehouseAddress(product.description, seller.location), condition: product.condition,
        priceCents: product.priceCents, msrpCents: 0, units: product.units, weightLbs: product.weightLbs,
        shipsFrom: seller.location, available: product.available,
        lotSize: product.lotSize, brand: product.brand.slice(0, 60), images: cleanProductPhotos(product.images).join("\n"),
        ...(product.palletCount === undefined ? {} : { palletCount: product.palletCount }),
        source: "", externalUrl: product.url, sourceCondition: product.conditionText || "Condition to be confirmed",
        sourceDelivery: withWarehouseAddress(product.delivery, seller.location), sourceOriginalPriceCents: product.originalPriceCents,
        categoryId: categories.get(product.categorySlug) ?? categories.get("general-merchandise")!,
        sellerId: seller.id, status: product.available > 0 ? "ACTIVE" : "SOLD_OUT",
      };
      const previous = existing.find(lot => lot.externalSku === product.externalSku);
      if (previous) { await db.lot.update({ where: { id: previous.id }, data }); updated++; }
      else { await db.lot.create({ data: { ...data, externalSku: product.externalSku, slug: product.slug } }); created++; }
    }
    // Remove supplier attribution from existing imported descriptions, preserving product facts.
    const jax = goldstack ? [] : await db.lot.findMany({ where: { externalUrl: { startsWith: "https://jaxwholesaleliquidation.com/" } }, select: { id: true, description: true, source: true } });
    if (!goldstack) writeFileSync("prisma/jax-attribution-backup.json", JSON.stringify(jax, null, 2) + "\n");
    for (const lot of jax) {
      const description = lot.description.replace(/Jax Wholesale\s*(?:&|and)?\s*Liquidation/gi, "our store").replace(/https?:\/\/jaxwholesaleliquidation\.com\/\S*/gi, "");
      await db.lot.update({ where: { id: lot.id }, data: { source: "", description } });
    }
    const verified = await db.lot.count({ where: { externalSku: { in: snapshot.products.map(p => p.externalSku) } } });
    if (verified !== snapshot.total) throw new Error(`Database check failed: ${verified}/${snapshot.total}`);
    console.log(`Created ${created}, updated ${updated}, verified ${verified} additional products. Removed attribution from ${jax.length} existing Jax listings.`);
    writeFileSync(goldstack ? "docs/GOLDSTACK-IMPORT-RESULT.json" : "docs/PRODUCT-IMPORT-RESULT.json", JSON.stringify({ date: "2026-10-02", created, updated, verified, jaxListings: jax.length }, null, 2) + "\n");
  } finally { await db.$disconnect(); }
}
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
