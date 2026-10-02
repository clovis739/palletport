import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const decode = s => String(s ?? '').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;|&quot;|&apos;|&nbsp;/g, m => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' '}[m]));
const plain = s => decode(s.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const clean = s => plain(s).replace(/Gold\s*stack\s*Liquidation|AJ\s*Liquidation/gi, '').replace(/https?:\/\/\S+|\S+@\S+/g, '').replace(/\s+/g, ' ').trim();
function category(text) {
  for (const [re, slug] of [[/playstation|nintendo|xbox|video game/i,'video-games'],[/\btvs?\b|television/i,'tvs-home-theater'],[/phone|laptop|macbook/i,'phones-computers'],[/tool|dewalt|milwaukee|ryobi/i,'tools-hardware'],[/shoe|sneaker|footwear|boot/i,'shoes'],[/clothing|apparel|jersey|skims|yoga|hoodie/i,'apparel'],[/makeup|beauty|cosmetic|perfume|personal care/i,'health-beauty'],[/toy|baby|doll/i,'toys-baby'],[/handbag|jewelry|watch/i,'accessories-jewelry'],[/grocery|food|beverage/i,'grocery-beverages'],[/fitness|sport|outdoor/i,'sports-outdoors'],[/furniture/i,'furniture'],[/kitchen/i,'home-kitchen'],[/appliance/i,'appliances'],[/bedding|household|towel/i,'household-essentials']]) if(re.test(text))return slug;
  return 'general-merchandise';
}
function details(html) {
  const specifications = {};
  const items = [];
  for (const match of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = clean(match[1]);
    const fact = text.match(/^([^:]{1,65}):\s*(.+)$/);
    if (fact && !/supplier|source|retailer|authentic|profit|msrp|price|cost/i.test(fact[1])) specifications[fact[1]] = fact[2];
    else if (text.length <= 180 && !/authentic|guarantee|profit|resale potential|msrp|wholesale price|\$|goldstack|source|ROI|advantage|must.buy|rare availability|massive volume|high.value|excellent|perfect for|ideal for|top.quality|premium quality|why choose/i.test(text)) items.push(text);
  }
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(m => clean(m[1]));
    if (cells.length === 2 && !/source|supplier|retailer|price|cost|profit|msrp/i.test(cells[0])) specifications[cells[0]] = cells[1];
  }
  return { specifications, items: [...new Set(items)] };
}
const products = [], raw = [], reports = [];
const existing = process.argv.includes('--cached') ? JSON.parse(await readFile(new URL('prisma/goldstack-products.json', root), 'utf8')).products : [];
let expected;
for (let page = 1; page <= 30; page++) {
  const url = `https://goldstackliquidation.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
  const response = process.argv.includes('--cached') ? null : await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response) { const list = JSON.parse(await readFile(new URL('prisma/goldstack-raw-products.json', root), 'utf8')); raw.push(...list); expected = list.length; reports.push({ url, products: list.length, cached: true }); break; }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  expected = Number(response.headers.get('x-wp-total'));
  const list = await response.json();
  if (!Array.isArray(list)) throw new Error('Invalid catalog response');
  raw.push(...list); reports.push({ url, products: list.length });
  if (list.length < 100) break;
}
if (raw.length !== expected || new Set(raw.map(p => p.id)).size !== expected) throw new Error('Incomplete catalog');
for (const p of raw) {
  if (p.prices.currency_code !== 'USD') throw new Error('Unsupported currency');
  const title = clean(p.name);
  const { specifications, items } = details(p.description + '\n' + p.short_description);
  const fullText = clean(p.description + ' ' + p.short_description);
  const quantityMatch = fullText.match(/\b(?:approximately\s+|approx\.?\s+)?[\d,]+(?:\s*[–-]\s*[\d,]+)?\s+(?:brand[ -]new\s+(?:apparel\s+|clothing\s+)?)?(?:pieces|units|pairs|items|bottles|packs)(?:\s+per\s+(?:case|pallet|lot))?/i);
  if (!specifications.Quantity && !specifications['Pallet Quantity'] && !specifications['Approximate Quantity'] && quantityMatch) specifications.Quantity = quantityMatch[0];
  const loadCount = fullText.match(/\b\d+\s+(?:pallets|gaylords)(?:\s+per\s+truckload)?/i);
  if (loadCount) specifications['Load packaging'] = loadCount[0];
  if (!specifications.Condition) {
    const condition = fullText.match(/brand[ -]new(?:\s+with\s+(?:original\s+)?(?:retail\s+)?tags)?|customer returns(?:\s*(?:&|and)\s*(?:overstock|shelf.pulls))?|shelf.pulls|open.box|lightly used or like.new/i);
    if (condition) specifications.Condition = condition[0];
  }
  for (const key of Object.keys(specifications)) {
    if (/retail value|msrp|profit|authentic/i.test(key)) delete specifications[key];
    else specifications[key] = specifications[key].replace(/\bauthentic\s*/gi, '');
  }
  for (const attribute of p.attributes) specifications[clean(attribute.name)] = attribute.terms.map(t => clean(t.name)).join(', ');
  const quantity = specifications.Quantity ?? specifications['Pallet Quantity'] ?? '';
  const count = quantity.replaceAll(',', '').replace(/brand[ -]new\s+(?:apparel\s+|clothing\s+)?/i, '').match(/^(\d+)\s*(?:pieces|units|pairs|items|bottles|packs)(?:\s+per\s+(?:case|pallet|lot))?$/i);
  const conditionText = specifications.Condition ?? 'Condition to be confirmed';
  const lotSize = /truckload/i.test(title) || loadCount ? 'TRUCKLOAD' : /case\s?pack|per case/i.test(title + ' ' + quantity) ? 'CASE' : 'PALLET';
  const condition = /return/i.test(conditionText) ? (/new|overstock/i.test(conditionText) ? 'MIXED' : 'CUSTOMER_RETURN') : /salvage/i.test(conditionText) ? 'SALVAGE' : /new|sealed/i.test(conditionText) ? 'NEW' : /shelf/i.test(conditionText) ? 'SHELF_PULL' : 'MIXED';
  const priceCents = Math.round(Number(p.prices.price) * 100 / 10 ** p.prices.currency_minor_unit);
  const product = { supplier: 'Goldstack Liquidation', externalSku: `GS-${p.id}`, originalSku: p.sku, slug: `gs-${p.slug}`, url: p.permalink, title, categorySlug: category(title + ' ' + p.categories.map(c => c.name).join(' ')), specifications, items, priceCents, originalCurrency: 'USD', originalPrice: priceCents / 100, originalPriceCents: Number(p.prices.regular_price) > Number(p.prices.price) ? Math.round(Number(p.prices.regular_price) * 100 / 10 ** p.prices.currency_minor_unit) : null, condition, conditionText, lotSize, units: count ? Number(count[1]) : 0, weightLbs: 0, shipsFrom: '', delivery: specifications.Shipping ?? specifications.Delivery ?? '', available: p.is_in_stock ? (p.low_stock_remaining ?? 1) : 0, inStock: p.is_in_stock, brand: specifications.Brand ?? '', images: [...new Set(p.images.map(i => i.src))], dimensions: p.dimensions, variations: p.variations };
  const parts = [`${title}. This bulk ${lotSize === 'TRUCKLOAD' ? 'load' : lotSize === 'CASE' ? 'case assortment' : 'lot'} is offered as wholesale inventory for resale.`, 'Product details\n' + Object.entries(specifications).map(([k,v]) => `${k}: ${v}`).join('\n')];
  if(items.length)parts.push('Assortment and product characteristics\n' + items.map(item => '- ' + item).join('\n'));
  parts.push('Review the product images together with the stated quantities, sizes and condition. Mixed assortments can vary; confirm the final contents and delivery arrangements when specific items are required.');
  product.description = parts.join('\n\n');
  product.palletCount = loadCount && /pallets/i.test(loadCount[0]) ? Number(loadCount[0].match(/\d+/)[0]) : lotSize === 'PALLET' ? 1 : 0;
  product.shipsFrom = specifications.FOB ?? specifications['Ships From'] ?? '';
  const localized = existing.find(previous => previous.externalSku === product.externalSku);
  if (localized?.images.every(path => path.startsWith('/images/products/'))) product.images = localized.images;
  if (!priceCents || !product.images.length || !p.description) throw new Error(`Incomplete product ${title}`);
  products.push(product);
}
await writeFile(new URL('prisma/goldstack-products.json', root), JSON.stringify({ fetchedOn: '2026-10-02', total: products.length, reports, products }, null, 2) + '\n');
// Keep complete original records internally for later product-detail reviews.
await writeFile(new URL('prisma/goldstack-raw-products.json', root), JSON.stringify(raw, null, 2) + '\n');
console.log(`Fetched all ${products.length} Goldstack products with descriptions and available details.`);
