// Fetch the public Jax catalog into a reviewable, repeatable JSON snapshot.
// Usage: node scripts/fetch-jax-products.mjs
import { writeFile, readFile } from "node:fs/promises";

const BASE = "https://jaxwholesaleliquidation.com";
const OUT = new URL("../prisma/jax-products.json", import.meta.url);

function decode(value = "") {
  return value.replace(/&#(\d+);|&#x([\da-f]+);|&([a-z]+);/gi, (_, decimal, hex, named) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " }[named.toLowerCase()] ?? _;
  });
}
function plain(value = "") {
  return decode(value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}
function match(html, regex) { return html.match(regex)?.[1] ?? ""; }
async function fetchHtml(url) {
  for (let attempt = 1; attempt <= 7; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "PalletPortCatalogImport/1.0" }, signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.text();
    } catch (error) {
      if (attempt === 7) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}
function parseProduct(url, html) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const graph = scripts.map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).find((x) => x?.["@graph"]);
  const structured = graph?.["@graph"]?.find((x) => x["@type"] === "Product");
  const facts = Object.fromEntries([...html.matchAll(/<dt>([^<]+)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)].map((m) => [plain(m[1]), plain(m[2])]));
  const description = plain(match(html, /<article id="tab-description"[\s\S]*?<div class="entry-content is-layout-constrained">([\s\S]*?)<\/div>/));
  const images = [...new Set([
    ...(structured?.image ?? []),
    ...[...html.matchAll(/<a href="(https:\/\/jaxwholesaleliquidation\.com\/media\/product-images\/[^"]+)" target="_blank"/g)].map((m) => m[1]),
  ])];
  const price = Number(structured?.offers?.price ?? match(html, /<meta itemprop="price" content="([\d.]+)"/));
  const oldPrice = Number(match(html, /<del aria-hidden="true">[\s\S]*?<bdi>[\s\S]*?<\/span>([\d,.]+)<\/bdi>/).replaceAll(",", ""));
  const sku = structured?.sku ?? plain(match(html, /<strong>SKU:<\/strong>\s*([^<]+)/));
  if (!structured?.name || !sku || !Number.isFinite(price) || price <= 0 || !description) throw new Error(`Incomplete product: ${url}`);
  return {
    url, slug: new URL(url).pathname.split("/").pop(), sku, title: structured.name,
    category: structured.category ?? plain(match(html, /<strong>Category:<\/strong>\s*([^<]+)/)),
    priceCents: Math.round(price * 100), originalPriceCents: oldPrice > price ? Math.round(oldPrice * 100) : null,
    condition: facts.Condition ?? "", available: Number.parseInt(facts.Available ?? "", 10) || 0,
    warehouse: facts.Warehouse ?? "", delivery: facts.Delivery ?? "",
    description, images, inStock: /InStock$/i.test(structured.offers?.availability ?? ""),
  };
}

const first = await fetchHtml(`${BASE}/products`);
const total = Number(match(first, /Showing\s+\d+-\d+\s+of\s+(\d+)\s+results/));
if (!total) throw new Error("Could not read catalog count");
const pages = Math.ceil(total / 12);
const lists = [first];
for (let page = 2; page <= pages; page++) lists.push(await fetchHtml(`${BASE}/products?page=${page}`));
const urls = [...new Set(lists.flatMap((html) => [...html.matchAll(/<a class="jax-card-media" href="(https:\/\/jaxwholesaleliquidation\.com\/products\/[^\"]+)"/g)].map((m) => m[1])))];
if (urls.length !== total) throw new Error(`Catalog has ${total} results but found ${urls.length} URLs`);
console.log(`Found ${urls.length} products across ${pages} pages.`);
let previous;
try { previous = JSON.parse(await readFile(OUT, "utf8")); } catch { previous = null; }
const products = new Map((previous?.products ?? []).map((p) => [p.url, p]));
const remaining = urls.filter((url) => !products.has(url));
for (let i = 0; i < remaining.length; i += 3) {
  const batch = await Promise.all(remaining.slice(i, i + 3).map(async (url) => parseProduct(url, await fetchHtml(url))));
  for (const product of batch) products.set(product.url, product);
  await writeFile(OUT, JSON.stringify({ source: `${BASE}/products`, fetchedAt: new Date().toISOString(), total, products: [...products.values()] }, null, 2) + "\n");
  console.log(`Fetched ${products.size}/${urls.length}`);
}
if (new Set([...products.values()].map((p) => p.sku)).size !== products.size) throw new Error("Duplicate SKUs in source catalog");
await writeFile(OUT, JSON.stringify({ source: `${BASE}/products`, fetchedAt: new Date().toISOString(), total, products: urls.map((url) => products.get(url)) }, null, 2) + "\n");
console.log(`Wrote ${OUT.pathname}`);
