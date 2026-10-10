import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "docs/CLOUDINARY-IMAGE-UPLOAD.json"), "utf8"));
const urls = {};
for (const image of manifest.images) {
  if (image.status !== "uploaded" || !/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\//.test(image.secureUrl)) throw new Error("Invalid uploaded image entry");
  for (const path of image.localPaths) {
    if (!path.startsWith("public/images/") || path.includes("..") || path.includes("\\")) throw new Error("Invalid local image path");
    const hash = createHash("sha256").update(await readFile(resolve(root, path))).digest("hex");
    if (hash !== image.hash) throw new Error(`Upload does not match current image: ${path}. Upload the changed file before regenerating.`);
    urls[path.replace(/^public/, "")] = image.secureUrl;
  }
}
const photosPath = resolve(root, "src/content/source-photos.json");
const photos = JSON.parse(await readFile(photosPath, "utf8"));
for (const photo of photos) {
  delete photo.cdnSrc;
  if (urls[photo.src]) photo.cdnSrc = urls[photo.src];
}
await writeFile(resolve(root, "src/content/project-image-cdn.json"), JSON.stringify(urls, null, 2) + "\n");
await writeFile(photosPath, JSON.stringify(photos, null, 2) + "\n");
console.log(`Mapped ${Object.keys(urls).length} verified paths and ${photos.filter(p => p.cdnSrc).length} stock photos. No database changes or uploads.`);
