import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'node:fs';
import { withWarehouseAddress } from '../src/lib/warehouse';
const snapshot = JSON.parse(readFileSync('prisma/goldstack-products.json', 'utf8'));
const db = new PrismaClient();
async function main() {
  const products = await db.lot.findMany({ where: { externalSku: { startsWith: 'GS-' } } });
  const errors: string[] = [];
  for (const expected of snapshot.products) {
    const actual = products.find(p => p.externalSku === expected.externalSku);
    if (!actual) { errors.push(`Missing ${expected.externalSku}`); continue; }
    for (const field of ['title', 'description', 'priceCents', 'units', 'palletCount', 'lotSize', 'condition'] as const) {
      const value = field === 'description' ? withWarehouseAddress(expected.description, actual.shipsFrom) : expected[field];
      if (actual[field] !== value) errors.push(`${expected.externalSku}: ${field} mismatch`);
    }
    if (!/^PP-[A-F0-9]{12}$/.test(actual.sku)) errors.push(`${expected.externalSku}: Invalid branded SKU`);
    if (actual.source || /Gold\s*stack|https?:\/\//i.test(actual.description)) errors.push(`${expected.externalSku}: Public source attribution`);
    if (actual.images !== expected.images.join('\n')) errors.push(`${expected.externalSku}: Gallery mismatch`);
    for (const path of expected.images) if (!path.startsWith('/images/products/') || !existsSync(`public${path}`)) errors.push(`${expected.externalSku}: Missing local image`);
  }
  const skus = await db.lot.findMany({ select: { sku: true } });
  if (skus.some(p => !p.sku) || new Set(skus.map(p => p.sku)).size !== skus.length) errors.push('Missing or duplicate catalog SKUs');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ verifiedProducts: products.length, catalogTotal: skus.length, localImages: new Set(snapshot.products.flatMap((p: {images: string[]}) => p.images)).size, uniqueBrandedSkus: true, publicSourceTags: 0 }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
