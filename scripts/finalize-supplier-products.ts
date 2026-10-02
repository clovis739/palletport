import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { withWarehouseAddress } from '../src/lib/warehouse';
type Product = { externalSku: string; images: string[]; conditionText: string; title: string; description: string; priceCents: number };
const products = (JSON.parse(readFileSync("prisma/supplier-products.json", "utf8")) as { products: Product[] }).products;
for (const product of products) {
  if (!product.images.length || product.images.some(path => !path.startsWith("/images/") || !existsSync(`public${path}`))) throw new Error(`Unverified local gallery: ${product.externalSku}`);
}
async function main() {
  const db = new PrismaClient();
  try {
    for (let offset = 0; offset < products.length; offset += 8) {
      await Promise.all(products.slice(offset, offset + 8).map(product => db.lot.update({ where: { externalSku: product.externalSku }, data: { images: product.images.join("\n"), sourceCondition: product.conditionText } })));
    }
    const lots = await db.lot.findMany({ where: { externalSku: { in: products.map(product => product.externalSku) } }, select: { externalSku: true, title: true, description: true, shipsFrom: true, priceCents: true, source: true, sourceCondition: true, images: true } });
    if (lots.length !== products.length) throw new Error("Missing imported listings");
    for (const product of products) {
      const lot = lots.find(lot => lot.externalSku === product.externalSku)!;
      if (lot.title !== product.title || lot.description !== withWarehouseAddress(product.description, lot.shipsFrom) || lot.priceCents !== product.priceCents || lot.source || lot.images !== product.images.join("\n") || lot.sourceCondition !== product.conditionText) throw new Error(`Database differs from snapshot: ${product.externalSku}`);
    }
    const result = JSON.parse(readFileSync("docs/PRODUCT-IMPORT-RESULT.json", "utf8"));
    result.verifiedLocalGalleries = lots.length;
    result.productImageFiles = new Set(products.flatMap(product => product.images).filter(path => path.startsWith("/images/products/"))).size;
    writeFileSync("docs/PRODUCT-IMPORT-RESULT.json", JSON.stringify(result, null, 2) + "\n");
    console.log(`Verified all ${lots.length} complete imported records and local galleries against the database.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
