import { readdir, readFile, mkdir, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const raw = (process.env.CLOUDINARY_URL || "").trim().replace(/^CLOUDINARY_URL\s*=\s*/, "");
const match = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)\/?$/);
const cfg = {
  key: match?.[1] || process.env.CLOUDINARY_API_KEY,
  secret: match?.[2] || process.env.CLOUDINARY_API_SECRET,
  cloud: match?.[3] || process.env.CLOUDINARY_CLOUD_NAME,
  folder: (process.env.CLOUDINARY_FOLDER || "palletport").replace(/^\/+|\/+$/g, ""),
};
if (!cfg.key || !cfg.secret || !cfg.cloud) throw new Error("Cloudinary credentials are missing or invalid. Set CLOUDINARY_URL or the three CLOUDINARY_* settings.");
const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif", ".ico": "image/x-icon" };
const assets = new Map();
let files = 0;
let bytes = 0;
async function inventory(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await inventory(file); continue; }
    if (!entry.isFile() || !types[path.extname(file).toLowerCase()]) continue;
    const data = await readFile(file);
    const hash = createHash("sha256").update(data).digest("hex");
    const localPath = path.relative(root, file).replaceAll("\\", "/");
    files++; bytes += data.length;
    if (assets.has(hash)) assets.get(hash).localPaths.push(localPath);
    else assets.set(hash, { hash, localPaths: [localPath], bytes: data.length, publicId: `${cfg.folder}/project-images/${hash}` });
  }
}
await inventory(path.join(root, "public"));
await inventory(path.join(root, "uploads"));
console.log(JSON.stringify({ cloud: cfg.cloud, folder: `${cfg.folder}/project-images`, files, uniqueImages: assets.size, totalMB: Math.round(bytes / 1048576), mode: process.argv.includes("--upload") ? "upload" : "inventory" }));
if (!process.argv.includes("--upload")) process.exit(0);

const workDir = path.join(root, "tmp", "cloudinary-upload");
await mkdir(workDir, { recursive: true });
const log = path.join(workDir, `${cfg.cloud}-progress.jsonl`);
const completed = new Map();
try {
  for (const line of (await readFile(log, "utf8")).split("\n").filter(Boolean)) {
    try { const item = JSON.parse(line); if (item.secureUrl && item.cloud === cfg.cloud) completed.set(item.publicId, item); } catch { /* Ignore an interrupted final line. */ }
  }
} catch (error) { if (error.code !== "ENOENT") throw error; }
const sanitize = message => {
  let safe = String(message);
  for (const value of [cfg.secret, cfg.key]) if (value) safe = safe.replaceAll(value, "[redacted]");
  return safe;
};
const limitArg = process.argv.find(arg => arg.startsWith("--limit="));
const queue = [...assets.values()].filter(asset => !completed.has(asset.publicId)).slice(0, limitArg ? Number(limitArg.split("=")[1]) : undefined);
let cursor = 0, uploaded = 0, stop = false;
const failures = [];
async function upload(asset) {
  const file = path.join(root, asset.localPaths[0]);
  const data = await readFile(file);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const params = { public_id: asset.publicId, overwrite: "false", timestamp: String(Math.floor(Date.now() / 1000)) };
      const signature = createHash("sha1").update(Object.keys(params).sort().map(key => `${key}=${params[key]}`).join("&") + cfg.secret).digest("hex");
      const form = new FormData();
      form.set("file", new Blob([data], { type: types[path.extname(file).toLowerCase()] }), path.basename(file));
      for (const [key, value] of Object.entries(params)) form.set(key, value);
      form.set("api_key", cfg.key); form.set("signature", signature);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/image/upload`, { method: "POST", body: form, signal: AbortSignal.timeout(60000) });
      const result = await res.json();
      if (!res.ok || !result.secure_url) {
        const error = new Error(sanitize(`Upload ${res.status}: ${result.error?.message || "No image URL returned"}`));
        error.fatal = [401, 403, 420].includes(res.status) || /quota|credit|limit exceeded/i.test(result.error?.message || "");
        error.permanent = res.status >= 400 && res.status < 500 && res.status !== 429;
        throw error;
      }
      if (!result.secure_url.startsWith(`https://res.cloudinary.com/${cfg.cloud}/`)) throw new Error("Unexpected image delivery host returned");
      const record = { cloud: cfg.cloud, publicId: asset.publicId, hash: asset.hash, secureUrl: result.secure_url, assetId: result.asset_id, bytes: result.bytes, width: result.width, height: result.height, existing: !!result.existing, uploadedAt: new Date().toISOString() };
      await appendFile(log, JSON.stringify(record) + "\n");
      completed.set(asset.publicId, record);
      uploaded++;
      if (uploaded % 25 === 0 || queue.length < 25) console.log(`Uploaded ${uploaded}/${queue.length}; total verified records ${completed.size}/${assets.size}`);
      return;
    } catch (error) {
      if (error.fatal) stop = true;
      if (error.permanent || attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}
await Promise.all(Array.from({ length: 4 }, async () => {
  while (!stop && cursor < queue.length) {
    const asset = queue[cursor++];
    try { await upload(asset); } catch (error) {
      failures.push({ localPaths: asset.localPaths, message: sanitize(error.message) });
      console.error(`Failed ${asset.localPaths[0]}: ${sanitize(error.message)}`);
      if (failures.length >= 10) stop = true;
    }
  }
}));
const mappings = [...assets.values()].map(asset => ({ ...asset, ...(completed.get(asset.publicId) || {}), status: completed.has(asset.publicId) ? "uploaded" : "pending" }));
const report = { generatedAt: new Date().toISOString(), cloud: cfg.cloud, folder: `${cfg.folder}/project-images`, files, uniqueImages: assets.size, uploadedImages: mappings.filter(item => item.status === "uploaded").length, pendingImages: mappings.filter(item => item.status === "pending").length, failures, images: mappings };
await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(path.join(root, "docs", "CLOUDINARY-IMAGE-UPLOAD.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ uploadedThisRun: uploaded, uploadedImages: report.uploadedImages, pendingImages: report.pendingImages, failures: failures.length, report: "docs/CLOUDINARY-IMAGE-UPLOAD.json" }));
if (failures.length) process.exitCode = 1;
