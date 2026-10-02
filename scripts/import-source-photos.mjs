// Import representative catalog photography from the user-supplied suppliers.
// Run: node scripts/import-source-photos.mjs (requires network access).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const photoOverrides = JSON.parse(await readFile(new URL('src/content/product-photo-overrides.json', root), 'utf8'));
const assets = new URL("public/images/catalog/", root);
await mkdir(assets, { recursive: true });
const candidates = new Map();
const exclusions = JSON.parse(await readFile(new URL("scripts/excluded-source-photos.json", root), "utf8"));
const excluded = new Set(exclusions.map(photo => photo.id));
const report = [];
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
function add(src, alt, by, page) {
  if (!src || !alt || /logo|payment|icon|flag/i.test(alt)) return;
  src = new URL(decode(src), page).href;
  if (src.includes("unsplash")) return;
  const url = new URL(src);
  url.searchParams.delete("width"); url.searchParams.delete("height");
  if (by === "Liquidation Stock") url.searchParams.set("width", "1200");
  if (by === "USA Pallet Liquidators") url.pathname = url.pathname.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
  const normalized = url.href;
  const originalPath = `/images/catalog/${createHash('sha256').update(normalized).digest('hex').slice(0,16)}.webp`;
  if (photoOverrides[normalized] === null && !photoOverrides[originalPath]) return;
  if (excluded.has(createHash("sha256").update(normalized).digest("hex").slice(0, 16))) return;
  if (!candidates.has(normalized)) candidates.set(normalized, { sourceUrl: normalized, alt: decode(alt).trim(), by, page });
}
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
async function collect(url, by) {
  try {
    const html = await (await get(url)).text();
    const before = candidates.size;
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const attr = (name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] ?? "";
      const src = attr("src");
      if (by === "USA Pallet Liquidators" && !tag.includes("woocommerce_thumbnail")) continue;
      if (by === "Jax Wholesale & Liquidation" && !src.includes("/media/product-images/")) continue;
      if (by === "Liquidation Stock" && !/\/cdn\/shop\/(files|products|collections)\//.test(src)) continue;
      add(src, attr("alt"), by, url);
    }
    report.push({ url, status: "fetched", added: candidates.size - before });
  } catch (error) { report.push({ url, status: "unavailable", reason: error.message }); }
}
const jax = JSON.parse(await readFile(new URL("prisma/jax-products.json", root), "utf8"));
for (const product of jax.products) {
  for (const src of product.images.slice(0, 2)) add(src, product.title, "Jax Wholesale & Liquidation", product.url);
}
await Promise.all([
  collect("https://jaxwholesaleliquidation.com/category/truckload", "Jax Wholesale & Liquidation"),
  collect("https://jaxwholesaleliquidation.com/category/liquidation-pallets", "Jax Wholesale & Liquidation"),
  ...[1, 2].map(page => collect(`https://liquidationstock.com/collections/liquidation-pallets?page=${page}`, "Liquidation Stock")),
  ...Array.from({ length: 9 }, (_, i) => collect(i ? `https://usapalletliquidators.com/shop/page/${i + 1}/` : "https://usapalletliquidators.com/shop/", "USA Pallet Liquidators")),
]);
// Public Faire discovery-image links, extracted from its indexed discovery page.
// Direct category-page fetching returns HTTP 403; do not bypass access controls.
const faire = JSON.parse(await readFile(new URL("scripts/faire-photo-sources.json", root), "utf8"));
for (const photo of faire) add(photo.src, photo.alt, "Faire marketplace", photo.page);
report.push({ url: "https://www.faire.com/category/New%20Products", status: "unavailable", reason: "HTTP 403; no image records extracted" });
report.push({ url: "https://www.faire.com/en-gb/discover/liquidation-pallets", status: "public indexed image links", added: faire.length });
const photos = [];
const failures = [];
let previous = [];
try { previous = JSON.parse(await readFile(new URL("src/content/source-photos.json", root), "utf8")); } catch { /* First import. */ }
const list = [...candidates.values()];
for (let offset = 0; offset < list.length; offset += 8) {
  await Promise.all(list.slice(offset, offset + 8).map(async candidate => {
    const id = createHash("sha256").update(candidate.sourceUrl).digest("hex").slice(0, 16);
    const filename = `${id}.webp`;
    try {
      const replacement = photoOverrides[`/images/catalog/${filename}`];
      if (replacement) {
        const metadata = await sharp(await readFile(new URL(`public${replacement}`, root))).metadata();
        photos.push({id, ...candidate, src: replacement, width: metadata.width, height: metadata.height});
        return;
      }
      let buffer;
      try { buffer = await readFile(new URL(filename, assets)); }
      catch {
        const response = await get(candidate.sourceUrl);
        if (!response.headers.get("content-type")?.startsWith("image/")) throw new Error("Not an image response");
        const raw = Buffer.from(await response.arrayBuffer());
        if (raw.length > 25 * 1024 * 1024) throw new Error("Image exceeds 25MB");
        buffer = await sharp(raw).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      }
      const metadata = await sharp(buffer).metadata();
      if (metadata.width < 200 || metadata.height < 150) throw new Error("Image is too small");
      await writeFile(new URL(filename, assets), buffer);
      photos.push({ id, ...candidate, src: `/images/catalog/${filename}`, width: metadata.width, height: metadata.height });
    } catch (error) { failures.push({ ...candidate, reason: error.message }); }
  }));
  console.log(`Verified ${Math.min(offset + 8, list.length)}/${list.length} (${photos.length} saved)`);
}
// Keep previously verified files when a source is temporarily unavailable.
for (const photo of previous) {
  if (excluded.has(photo.id)) continue;
  if (photos.some(p => p.id === photo.id)) continue;
  try {
    const buffer = await readFile(new URL(`public${photo.src}`, root));
    const metadata = await sharp(buffer).metadata();
    if (metadata.width >= 200 && metadata.height >= 150) photos.push(photo);
  } catch { /* A missing local file cannot be retained. */ }
}
// Retain reviewed library replacements when supplier images are fetched again.
for (const photo of photos) {
  const replacement = photoOverrides[photo.src];
  if (!replacement) continue;
  const metadata = await sharp(await readFile(new URL(`public${replacement}`, root))).metadata();
  photo.src = replacement; photo.width = metadata.width; photo.height = metadata.height;
}
photos.sort((a, b) => a.by.localeCompare(b.by) || a.id.localeCompare(b.id));
// Never replace the manifest with one that breaks existing saved photo keys.
const catalog = await readFile(new URL("src/content/photos.ts", root), "utf8");
const available = new Set(photos.map(photo => photo.id));
for (const match of catalog.matchAll(/supplierPhoto\("([^"]+)"\)/g)) {
  if (!available.has(match[1])) throw new Error(`Refresh would remove referenced image ${match[1]}; current manifest retained.`);
}
await writeFile(new URL("src/content/source-photos.json", root), JSON.stringify(photos, null, 2) + "\n");
await writeFile(new URL("docs/IMAGE-SOURCE-IMPORT.json", root), JSON.stringify({ indexedOn: "2026-10-02", reports: report, count: photos.length, failures, excluded: exclusions }, null, 2) + "\n");
console.log(`Saved ${photos.length} verified photos; ${failures.length} unavailable images.`);
await import("./index-source-photos.mjs");
