/** Build a public-only snapshot; never copy users, orders, passwords or settings from the old export. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { cleanProductPhotos } from '../src/lib/product-photos';
import { WAREHOUSE_ADDRESS, withWarehouseAddress } from '../src/lib/warehouse';

const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const old = read('prisma/export.json');
const previous = existsSync('prisma/fresh-catalog.json') ? read('prisma/fresh-catalog.json') : { products: [] };
const skus = new Map<string, string>(previous.products.map((p: any) => [p.slug, p.sku]));
const savedPrices = new Map<string, any>(previous.products.filter((p: any) => p.compareAtPriceCents > 0).map((p: any) => [p.slug, p]));
const feed = readFileSync('docs/merchant-feed.xml', 'utf8');
for (const item of feed.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
  const slug = item[1].match(/<g:link>[^<]*\/lots\/([^<]+)<\/g:link>/)?.[1];
  const sku = item[1].match(/<g:id>([^<]+)<\/g:id>/)?.[1];
  if (slug && sku) skus.set(slug, sku);
}
const photoMap = new Map<string, string>(read('src/content/source-photos.json').map((p: any) => [p.sourceUrl, p.src]));
const cleanText = (text: string) => withWarehouseAddress(text || '', WAREHOUSE_ADDRESS)
  .replace(/Jax Wholesale\s*(?:&|and)?\s*Liquidation/gi, 'our store')
  .replace(/https?:\/\/jaxwholesaleliquidation\.com\/\S*/gi, '')
  .split('\n').filter(line => !/^(display|flex-wrap|gap|justify-content|width|text-align|border|padding|border-radius|height|margin-top|font-size|font-style|font-weight|color|border-collapse|margin|table-layout|vertical-align|background-color):/.test(line)).join('\n');
const photos = (images: string | string[]) => cleanProductPhotos(cleanProductPhotos(images).map(url => photoMap.get(url) || url));
function jaxCategory(p: any) {
  const title = p.title.toLowerCase(), category = p.category.toLowerCase();
  for (const [pattern, slug] of [[/video game|nintendo|playstation|xbox/, 'video-games'], [/power tool|dewalt|milwaukee|ryobi|hand tool/, 'tools-hardware'], [/television|\btv\b/, 'tvs-home-theater']] as const) if (pattern.test(title)) return slug;
  for (const [pattern, slug] of [[/truckload/, 'general-merchandise'], [/shoe|footwear/, 'shoes'], [/bedding|linen/, 'household-essentials'], [/apparel|women|men|kids|swimwear/, 'apparel'], [/accessor/, 'accessories-jewelry'], [/toy|baby/, 'toys-baby'], [/sport/, 'sports-outdoors'], [/season|christmas|halloween/, 'seasonal']] as const) if (pattern.test(category)) return slug;
  return 'general-merchandise';
}
const categoryById = new Map(old.Category.map((c: any) => [c.id, c.slug]));
const subById = new Map(old.Subcategory.map((s: any) => [s.id, s.slug]));
const products: any[] = old.Lot.map((p: any) => ({
  slug: p.slug, title: p.title, description: cleanText(p.description), condition: p.condition,
  priceCents: p.priceCents, msrpCents: p.msrpCents, units: p.units, palletCount: p.palletCount,
  weightLbs: p.weightLbs, available: p.available, status: p.status, featured: Boolean(p.featured),
  lotSize: p.lotSize, brand: p.brand || '', images: photos(p.images),
  categorySlug: categoryById.get(p.categoryId), subcategorySlug: subById.get(p.subcategoryId) || null,
  manifest: old.ManifestItem.filter((m: any) => m.lotId === p.id).map((m: any) => ({ sku: m.sku, name: m.name, qty: m.qty, unitMsrpCents: m.unitMsrpCents })),
}));
for (const file of ['prisma/jax-products.json', 'prisma/supplier-products.json', 'prisma/goldstack-products.json']) {
  const snapshot = read(file);
  if (snapshot.products.length !== snapshot.total) throw new Error(`Incomplete snapshot: ${file}`);
  const jax = file.includes('jax-');
  for (const p of snapshot.products) products.push({
    slug: jax ? `jax-${p.slug}` : p.slug, title: p.title, description: cleanText(p.description),
    condition: jax ? /salvage/i.test(p.condition) ? 'SALVAGE' : /return/i.test(p.condition) ? 'CUSTOMER_RETURN' : /shelf.pull/i.test(p.condition) ? 'SHELF_PULL' : /new|sealed/i.test(p.condition) ? 'NEW' : 'MIXED' : p.condition,
    priceCents: p.priceCents, msrpCents: 0, units: p.units || 0, weightLbs: p.weightLbs || 0,
    palletCount: p.palletCount ?? 1, available: p.inStock === false ? 0 : p.available,
    status: p.inStock === false || p.available === 0 ? 'SOLD_OUT' : 'ACTIVE', featured: false,
    lotSize: jax ? /truckload|\bload\b/i.test(`${p.category} ${p.title}`) ? 'TRUCKLOAD' : /case pack|\bcase\b|mystery box/i.test(p.title) ? 'CASE' : 'PALLET' : p.lotSize,
    brand: p.brand || '', images: photos(p.images), categorySlug: jax ? jaxCategory(p) : p.categorySlug,
    subcategorySlug: null, externalSku: jax ? p.sku : p.externalSku, externalUrl: p.url,
    sourceCondition: jax ? p.condition : p.conditionText, sourceDelivery: cleanText(p.delivery), sourceOriginalPriceCents: p.originalPriceCents,
    manifest: [],
  });
}
for (const p of products) {
  p.sku = skus.get(p.slug) || `PP-${randomBytes(6).toString('hex').toUpperCase()}`;
  const saved = savedPrices.get(p.slug);
  if (saved) { p.priceCents = saved.priceCents; p.compareAtPriceCents = saved.compareAtPriceCents; }
  p.shipsFrom = WAREHOUSE_ADDRESS;
  if (!p.title || !p.description || !p.categorySlug || p.priceCents <= 0) throw new Error(`Incomplete product: ${p.slug}`);
  for (const image of p.images) if (!image.startsWith('/') || image.includes('..') || !existsSync(`public${image}`)) throw new Error(`Unverified local photo: ${p.slug}`);
}
for (const key of ['slug', 'sku', 'externalSku']) {
  const values = products.map(p => p[key]).filter(Boolean);
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${key}`);
}
// Category fields are explicitly allowlisted, too.
const categories = old.Category.map(({ name, slug, blurb, hue, group, position, image, hidden }: any) => ({ name, slug, blurb, hue, group, position, image, hidden: Boolean(hidden) }));
const subcategories = old.Subcategory.map(({ name, slug, position, categoryId }: any) => ({ name, slug, position, categorySlug: categoryById.get(categoryId) }));
writeFileSync('prisma/fresh-catalog.json', JSON.stringify({ version: 1, categories, subcategories, products }, null, 2) + '\n');
console.log(`Prepared ${products.length} products; ${products.filter(p => !p.images.length).length} retain category fallback photos. No customer data included.`);
