// Optional: self-host the Unsplash stock photos instead of loading them from Unsplash's CDN.
//   node scripts/download-photos.mjs
// then add NEXT_PUBLIC_LOCAL_PHOTOS=1 to .env and restart `npm run dev`.
import { mkdir, writeFile, readFile } from "node:fs/promises";

const src = await readFile(new URL("../src/content/photos.ts", import.meta.url), "utf8");
const ids = [...src.matchAll(/p\("([0-9]+-[0-9a-f]+)"/g)].map((m) => m[1]);
const dir = new URL("../public/images/stock/", import.meta.url);
await mkdir(dir, { recursive: true });
let ok = 0;
for (const id of ids) {
  const res = await fetch(`https://images.unsplash.com/photo-${id}?auto=format&fm=jpg&fit=crop&w=1600&q=75`);
  if (!res.ok) { console.error(`✗ ${id} (${res.status})`); continue; }
  await writeFile(new URL(`${id}.jpg`, dir), Buffer.from(await res.arrayBuffer()));
  ok++; console.log(`✓ ${id}`);
}
console.log(`\nSaved ${ok}/${ids.length} photos to public/images/stock. Set NEXT_PUBLIC_LOCAL_PHOTOS=1 to use them.`);
