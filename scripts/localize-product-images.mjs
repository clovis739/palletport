import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const root = new URL('../', import.meta.url);
const folder = new URL('public/images/products/', root);
await mkdir(folder, { recursive: true });
const snapshotFile = process.argv.includes('--goldstack') ? 'prisma/goldstack-products.json' : 'prisma/supplier-products.json';
const reportFile = process.argv.includes('--goldstack') ? 'docs/GOLDSTACK-IMAGE-IMPORT.json' : 'docs/PRODUCT-IMAGE-IMPORT.json';
const snapshot = JSON.parse(await readFile(new URL(snapshotFile, root), 'utf8'));
const urls = [...new Set(snapshot.products.flatMap(p => p.images).filter(url => /^https:\/\//.test(url)))];
const saved = new Map(), failed = [];
for (let offset = 0; offset < urls.length; offset += 8) {
  await Promise.all(urls.slice(offset, offset + 8).map(async url => {
    const id = createHash('sha256').update(url).digest('hex').slice(0, 16);
    try {
      let buffer;
      try { buffer = await readFile(new URL(`${id}.webp`, folder)); }
      catch {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`Invalid image response (${response.status})`);
        const input = Buffer.from(await response.arrayBuffer());
        if (input.length > 25 * 1024 * 1024) throw new Error('Oversized image');
        buffer = await sharp(input).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      }
      const metadata = await sharp(buffer).metadata();
      if (metadata.width < 200 || metadata.height < 150) throw new Error('Undersized image');
      await writeFile(new URL(`${id}.webp`, folder), buffer);
      saved.set(url, `/images/products/${id}.webp`);
    } catch(error) { failed.push({ url, reason: error.message }); }
  }));
  console.log(`Verified ${Math.min(offset + 8, urls.length)}/${urls.length} product images`);
}
const rejected = new Set(failed.map(image => image.url));
for (const product of snapshot.products) {
  const verified = product.images.map(url => saved.get(url) ?? url).filter(url => !rejected.has(url));
  if (!verified.length) throw new Error(`No verified product images: ${product.externalSku}`);
  product.images = verified;
}
await writeFile(new URL(snapshotFile, root), JSON.stringify(snapshot, null, 2) + '\n');
const totalLocal = new Set(snapshot.products.flatMap(product => product.images).filter(url => url.startsWith('/images/products/'))).size;
await writeFile(new URL(reportFile, root), JSON.stringify({ saved: totalLocal, failed }, null, 2) + '\n');
console.log(`Saved ${saved.size} local product images; ${failed.length} unavailable.`);
