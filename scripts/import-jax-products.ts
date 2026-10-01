import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Product = {
  url: string; slug: string; sku: string; title: string; category: string;
  priceCents: number; originalPriceCents: number | null; condition: string;
  available: number; warehouse: string; delivery: string; description: string;
  images: string[]; inStock: boolean;
};
const file = JSON.parse(readFileSync(join(process.cwd(), "prisma/jax-products.json"), "utf8")) as { products: Product[]; total: number };
if (!Array.isArray(file.products) || file.products.length !== file.total) throw new Error("Incomplete Jax catalog snapshot");
if (new Set(file.products.map((p) => p.sku)).size !== file.products.length) throw new Error("Duplicate source SKUs");
for (const product of file.products) {
  if (!product.sku || !product.url.startsWith("https://jaxwholesaleliquidation.com/products/") || !product.title || !product.description || product.priceCents <= 0) {
    throw new Error(`Invalid source product: ${product.sku}`);
  }
}
if (process.argv.includes("--check")) {
  console.log(`Validated ${file.products.length} distinct products for import.`);
  process.exit(0);
}

function categorySlug(product: Product) {
  const category = product.category.toLowerCase();
  const title = product.title.toLowerCase();
  if (/video game|nintendo|playstation|xbox/.test(title)) return "video-games";
  if (/power tool|dewalt|milwaukee|ryobi|hand tool/.test(title)) return "tools-hardware";
  if (/television|\btv\b/.test(title)) return "tvs-home-theater";
  if (/truckload/.test(category)) return "general-merchandise";
  if (/shoe|footwear/.test(category)) return "shoes";
  if (/bedding|linen/.test(category)) return "household-essentials";
  if (/apparel|women|men|kids|swimwear/.test(category)) return "apparel";
  if (/accessor/.test(category)) return "accessories-jewelry";
  if (/toy|baby/.test(category)) return "toys-baby";
  if (/sport/.test(category)) return "sports-outdoors";
  if (/season|christmas|halloween/.test(category)) return "seasonal";
  return "general-merchandise";
}
function condition(value: string) {
  if (/salvage/i.test(value)) return "SALVAGE";
  if (/return/i.test(value)) return "CUSTOMER_RETURN";
  if (/shelf.pull/i.test(value)) return "SHELF_PULL";
  if (/new|sealed/i.test(value)) return "NEW";
  return "MIXED";
}
function lotSize(product: Product) {
  if (/truckload|\bload\b/i.test(`${product.category} ${product.title}`)) return "TRUCKLOAD";
  if (/case pack|\bcase\b|mystery box/i.test(product.title)) return "CASE";
  return "PALLET";
}

async function main() {
const prisma = new PrismaClient();
try {
  const seller = await prisma.seller.findUnique({ where: { slug: "store" } });
  if (!seller) throw new Error("Store seller is missing. Set up the database before importing products.");
  const categories = new Map((await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  if (!categories.has("general-merchandise")) throw new Error("Store categories are missing. Seed the catalog first.");
  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const product of file.products) {
    const data = {
      title: product.title,
      description: product.description,
      condition: condition(product.condition),
      priceCents: product.priceCents,
      msrpCents: 0, // Source sale/list price is not an estimated retail value.
      units: 0, // Source does not consistently publish an exact per-lot unit count.
      weightLbs: 0, // Source does not consistently publish a shipping weight.
      shipsFrom: product.warehouse || "Warehouse location unconfirmed",
      available: product.inStock ? product.available : 0,
      lotSize: lotSize(product),
      source: "Jax Wholesale & Liquidation",
      images: product.images.join("\n"),
      externalSku: product.sku,
      externalUrl: product.url,
      sourceCondition: product.condition,
      sourceDelivery: product.delivery,
      sourceOriginalPriceCents: product.originalPriceCents,
      categoryId: categories.get(categorySlug(product)) ?? categories.get("general-merchandise")!,
      sellerId: seller.id,
    };
    const existing = await prisma.lot.findUnique({ where: { externalSku: product.sku }, select: { id: true, status: true } });
    if (existing) {
      if (existing.status === "DRAFT") {
        await prisma.lot.update({ where: { id: existing.id }, data });
        updated++;
      } else skipped++;
    } else {
      await prisma.lot.create({ data: { ...data, slug: `jax-${product.slug}`, status: "DRAFT" } });
      created++;
    }
  }
  console.log(`Imported ${created} new drafts, updated ${updated} drafts, skipped ${skipped} published listings.`);
} finally {
  await prisma.$disconnect();
}
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
