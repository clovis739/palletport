// Offline validation: npm run photos:check
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { PHOTOS, LOT_TOPICS, photoSrc } from "../src/content/photos.ts";
import { lotImages } from "../src/lib/lotImages.ts";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("src/content/source-photos.json", root), "utf8"));
const excluded = JSON.parse(await readFile(new URL("scripts/excluded-source-photos.json", root), "utf8"));
assert.equal(new Set(manifest.map(p => p.id)).size, manifest.length, "Duplicate manifest IDs");
const ids = new Set(manifest.map(p => p.id));
for (const photo of manifest) {
  assert(photo.src.startsWith("/images/catalog/"), "Image must use local catalog storage");
  assert(!photo.src.includes(".."), "Image path must stay inside catalog storage");
  const metadata = await sharp(await readFile(new URL(`public${photo.src}`, root))).metadata();
  assert.equal(metadata.format, photo.src.endsWith('.png') ? 'png' : 'webp');
  assert.equal(metadata.width, photo.width);
  assert.equal(metadata.height, photo.height);
  assert(metadata.width >= 200 && metadata.height >= 150, `Undersized image ${photo.id}`);
  assert(!excluded.some(p => p.id === photo.id), `Excluded image ${photo.id} reintroduced`);
}
for (const photo of [...Object.values(PHOTOS), ...LOT_TOPICS.flatMap(topic => topic.photos)]) {
  assert(ids.has(photo.id), `Missing referenced image ${photo.id}`);
  assert.equal(photoSrc(photo), photo.src);
}
for (const title of ["TV pallet", "Jewelry and watches", "Lawn mower", "Wireless headphones", "Toothbrush personal care", "Garden patio furniture", "Unspecified assortment"]) {
  const images = lotImages({ slug: "validation-lot", title, images: "" });
  assert(images.length > 0, `Empty placeholder gallery: ${title}`);
  assert(images.every(image => image.stock && image.src.startsWith("/images/catalog/")));
  assert.equal(new Set(images.map(image => image.src)).size, images.length, `Repeated gallery image: ${title}`);
}
const upload = lotImages({ slug: "validation-lot", title: "TV pallet", images: "/media/lots/upload.jpg" });
assert.deepEqual(upload.map(image => ({ src: image.src, stock: image.stock })), [{ src: "/media/lots/upload.jpg", stock: false }]);
console.log(`PASS: ${manifest.length} verified files, ${Object.keys(PHOTOS).length} image keys, distinct placeholder galleries, and uploaded-photo precedence.`);
