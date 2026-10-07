import Module, { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Run the same server-only sitemap generator outside an HTTP request.
const base = new URL(process.env.APP_URL || "http://localhost");
if (base.protocol !== "https:" || /^(localhost|127\.0\.0\.1)$/.test(base.hostname)) {
  throw new Error("Set APP_URL to the public HTTPS store domain before exporting");
}
const load = Module._load;
Module._load = function (id, parent, isMain) {
  if (id === "server-only") return {};
  if (id === "next/headers") return { headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) };
  return load.call(this, id, parent, isMain);
};
const require = createRequire(import.meta.url);
const { db } = require("../src/lib/db.ts");
try {
  const sitemap = require("../src/app/sitemap.ts").default;
  const entries = await sitemap();
  assert.equal(entries.length, new Set(entries.map(entry => entry.url)).size, "Duplicate sitemap URLs");
  for (const entry of entries) {
    const url = new URL(entry.url);
    assert.equal(url.origin, base.origin, "Unexpected sitemap domain");
    assert.equal(url.search, "", "Filtered URLs must not be indexed");
    assert.ok(!/^\/(?:es\/)?(?:dashboard|account|cart|checkout|orders|login|register|search|reports)(?:\/|$)/.test(url.pathname), "Private, search or redirect URL in sitemap");
    for (const image of entry.images || []) assert.equal(new URL(image).protocol, "https:");
  }
  const xml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.map(entry => [
      '<url>', `<loc>${xml(entry.url)}</loc>`,
      ...(entry.lastModified ? [`<lastmod>${xml(new Date(entry.lastModified).toISOString())}</lastmod>`] : []),
      ...Object.entries(entry.alternates?.languages || {}).map(([language, href]) => `<xhtml:link rel="alternate" hreflang="${xml(language)}" href="${xml(href)}"/>`),
      ...(entry.images || []).map(image => `<image:image><image:loc>${xml(image)}</image:loc></image:image>`),
      '</url>',
    ].join('')).join('\n') + '\n</urlset>\n';
  await mkdir("docs", { recursive: true });
  await writeFile("docs/sitemap.xml", body);
  const report = {
    generatedAt: new Date().toISOString(), sitemapUrl: `${base.origin}/sitemap.xml`,
    urls: entries.length, productUrls: entries.filter(entry => /^\/(es\/)?lots\//.test(new URL(entry.url).pathname)).length,
    entriesWithImages: entries.filter(entry => entry.images?.length).length,
    imageReferences: entries.reduce((sum, entry) => sum + (entry.images?.length || 0), 0),
  };
  await writeFile("docs/SITEMAP-REPORT.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  Module._load = load;
  await db.$disconnect();
}
