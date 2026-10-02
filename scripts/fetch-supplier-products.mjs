// Fetch public supplier catalog facts and generate original product descriptions.
import { readFile, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const decode = s => String(s ?? "").replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;|&quot;|&apos;|&nbsp;|&lt;|&gt;/g, m => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' ','&lt;':'<','&gt;':'>'}[m]));
const plain = s => decode(String(s ?? "").replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const clean = s => plain(s).replace(/Jax Wholesale\s*(?:&|and)?\s*Liquidation|USA Pallet Liquidators|Liquidation\s*Stock|Faire(?: marketplace)?/gi, "").replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+\.\w+/g, "").replace(/\s+/g, " ").trim();
async function get(url) { const r = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r; }
function facts(html) {
  const out = new Map();
  const add = (label, value) => {
    label = clean(label).replace(/:$/, ""); value = clean(value);
    if (label && value && label.length < 65 && value.length < 240 && !/source|supplier|contact|price|cost|saving|profit|revenue|retail value|resale value/i.test(label)) out.set(label, value);
  };
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(m => m[1]);
    if (cells.length === 2) add(cells[0], cells[1]);
  }
  for (const m of html.matchAll(/<(?:strong|b)\b[^>]*>([^<]{1,65}:)\s*<\/(?:strong|b)>([\s\S]*?)(?=<br\b|<\/(?:p|li)|<(?:strong|b)\b)/gi)) add(m[1], m[2]);
  for (const segment of html.replace(/<br\b[^>]*>|<\/(?:p|li|h[1-6])>/gi, '\n').split('\n')) {
    const line = plain(segment);
    const match = line.match(/^([\w ()/&-]{1,55}):\s*(.+)$/);
    if (match && match[1].split(' ').length <= 7) add(match[1], match[2]);
  }
  return Object.fromEntries(out);
}
function category(title, labels) {
  const text = `${title} ${labels}`.toLowerCase();
  for (const [pattern, slug] of [[/video game|playstation|nintendo|xbox|\bps5\b/,'video-games'],[/\btvs?\b|television/,'tvs-home-theater'],[/iphone|phone|laptop|macbook/,'phones-computers'],[/dewalt|milwaukee|ryobi|tool|ridgid/,'tools-hardware'],[/shoe|sneaker|boot|footwear|crocs/,'shoes'],[/clothing|apparel|jeans|jersey|jackets|hoodie|lingerie/,'apparel'],[/beauty|cosmetic|perfume|lotion|makeup|body wash/,'health-beauty'],[/toy|baby|doll/,'toys-baby'],[/jewelry|watch|handbag|accessories/,'accessories-jewelry'],[/grocery|beverage|drink|food/,'grocery-beverages'],[/sport|fitness|fishing/,'sports-outdoors'],[/bedding|textile|detergent|towel|wipes/,'household-essentials'],[/kitchen|cookware/,'home-kitchen'],[/appliance|fridge|washer/,'appliances'],[/furniture/,'furniture'],[/automotive|tires/,'automotive'],[/christmas|halloween/,'seasonal'],[/electronics|gadgets/,'electronics']]) if(pattern.test(text)) return slug;
  return 'general-merchandise';
}
function describe(product) {
  const rows = Object.entries(product.specifications).map(([label, value]) => `${label}: ${value}`);
  return `${product.title}. This wholesale ${product.lotSize === 'TRUCKLOAD' ? 'load' : product.lotSize === 'CASE' ? 'assortment' : 'pallet'} is offered for resale.\n\n${rows.length ? 'Product specifications\n' + rows.join('\n') : 'The listed product name identifies the assortment; an itemized specification has not been provided.'}${product.items.length ? '\n\nAssortment examples\n' + product.items.map(item => `- ${item}`).join('\n') : ''}\n\nReview the images and condition details before ordering. Confirm the final assortment, quantities and delivery arrangements when specific items are required.`;
}
const report = [];
const products = [];
const sourcePhotos = JSON.parse(await readFile(new URL('src/content/source-photos.json', root), 'utf8'));
const localImages = new Map(sourcePhotos.map(p => [p.sourceUrl.split('?')[0], p.src]));
const images = list => [...new Set(list.filter(Boolean).map(url => localImages.get(url.split('?')[0]) ?? url))];
const fx = await (await get('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')).json();
const cart = await (await get('https://liquidationstock.com/cart.js')).json();
if (cart.currency !== 'EUR' || !(fx.rates.USD > 0)) throw new Error('Unverified Shopify currency or exchange rate');
for (let page = 1; page <= 20; page++) {
  const url = `https://liquidationstock.com/collections/liquidation-pallets/products.json?limit=250&page=${page}`;
  const data = await (await get(url)).json();
  if (!Array.isArray(data.products)) throw new Error('Invalid Shopify response');
  for (const p of data.products) for (const v of p.variants) {
    const title = clean(p.title + (v.title === 'Default Title' ? '' : ` — ${v.title}`));
    const specifications = facts(p.body_html);
    const items = [...new Set([...p.body_html.matchAll(/class="pallet-text"[^>]*>([\s\S]*?)<\/div>/gi)].map(m => clean(m[1])).filter(Boolean))];
    const product = { supplier: 'Liquidation Stock', externalSku: `LS-${v.id}`, originalSku: v.sku, url: `https://liquidationstock.com/products/${p.handle}`, slug: `ls-${p.handle}-${v.id}`, title, categorySlug: category(title, p.tags.join(' ')), originalCurrency: 'EUR', originalPrice: Number(v.price), exchangeRate: fx.rates.USD, exchangeDate: fx.date, priceCents: Math.round(Number(v.price) * fx.rates.USD * 100), originalPriceCents: v.compare_at_price ? Math.round(Number(v.compare_at_price) * fx.rates.USD * 100) : null, inStock: v.available, available: v.available ? 1 : 0, condition: 'MIXED', conditionText: 'Untested mixed liquidation inventory', lotSize: 'PALLET', units: 0, weightLbs: v.grams > 0 ? Math.round(v.grams / 453.59237) : 0, shipsFrom: '', delivery: '', brand: '', specifications, items, images: images(p.images.map(image => image.src)), variants: p.options };
    product.description = describe(product); products.push(product);
  }
  report.push({ url, products: data.products.length });
  if (data.products.length < 250) break;
}
let expected = 0;
for (let page = 1; page <= 30; page++) {
  const url = `https://usapalletliquidators.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
  const response = await get(url); expected = Number(response.headers.get('x-wp-total'));
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid WooCommerce response');
  for (const p of data) {
    if (p.prices.currency_code !== 'USD') throw new Error(`Unsupported currency: ${p.prices.currency_code}`);
    const title = clean(p.name), specifications = facts(p.description);
    for (const attribute of p.attributes) specifications[clean(attribute.name)] = attribute.terms.map(t => clean(t.name)).join(', ');
    const quantity = specifications.Quantity ?? specifications['Unit Count'] ?? '';
    const exactQuantity = /^\d+\s*(?:pieces|units|pairs|items|bottles|cans)?$/i.test(quantity) ? Number.parseInt(quantity) : 0;
    const conditionText = specifications.Condition ?? specifications['Inventory Type'] ?? '';
    const condition = /return/i.test(conditionText) ? (/overstock|new/i.test(conditionText) ? 'MIXED' : 'CUSTOMER_RETURN') : /new|sealed/i.test(conditionText) ? 'NEW' : /shelf/i.test(conditionText) ? 'SHELF_PULL' : 'MIXED';
    const units = p.prices.currency_minor_unit;
    const assortment = [...new Set([...p.description.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(m => clean(m[1])).filter(text => text.length <= 90 && text.split(' ').length <= 12 && !/profit|margin|reseller|business|customer|source|supplier|shipping|delivery|retail|guarantee|price|cost|contact|\bwe\b|\bour\b|\byou\b/i.test(text)))];
    const product = { supplier: 'USA Pallet Liquidators', externalSku: `USA-${p.id}`, originalSku: p.sku, url: p.permalink, slug: `usa-${p.slug}`, title, categorySlug: category(title, p.categories.map(c => c.name).join(' ')), originalCurrency: 'USD', originalPrice: Number(p.prices.price) / 10 ** units, priceCents: Math.round(Number(p.prices.price) * 100 / 10 ** units), originalPriceCents: Number(p.prices.regular_price) > Number(p.prices.price) ? Math.round(Number(p.prices.regular_price) * 100 / 10 ** units) : null, inStock: p.is_in_stock, available: p.is_in_stock ? (p.low_stock_remaining ?? 1) : 0, condition, conditionText, lotSize: /truckload/i.test(title) ? 'TRUCKLOAD' : /mystery box/i.test(title) ? 'CASE' : 'PALLET', units: exactQuantity, weightLbs: 0, shipsFrom: '', delivery: specifications.Shipping ?? '', brand: specifications.Brand ?? '', specifications, items: assortment, images: images(p.images.map(i => i.src)), variants: p.variations, dimensions: p.dimensions };
    product.description = describe(product); products.push(product);
  }
  report.push({ url, products: data.length });
  if (data.length < 100) break;
}
if (products.filter(p => p.supplier === 'USA Pallet Liquidators').length !== expected) throw new Error('Incomplete WooCommerce catalog');
report.push({ url: 'https://www.faire.com/category/New%20Products', status: 'blocked', reason: 'HTTP 403; wholesale pricing and complete product details unavailable' });
report.push({ url: 'https://www.faire.com/en-gb/discover/liquidation-pallets', status: 'blocked', reason: 'HTTP 403; no complete purchasable records imported' });
if (new Set(products.map(p => p.externalSku)).size !== products.length || products.some(p => !p.description || p.priceCents <= 0 || !p.images.length)) throw new Error('Incomplete normalized products');
await writeFile(new URL('prisma/supplier-products.json', root), JSON.stringify({ fetchedOn: '2026-10-02', exchange: fx, reports: report, total: products.length, products }, null, 2) + '\n');
console.log(`Saved ${products.length} products with original descriptions and available specifications.`);
