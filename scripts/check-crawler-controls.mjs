import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === "@/lib/site-url") return { requestSiteUrl: async () => "https://example.com" };
  return load.call(this, name, ...args);
};
const { UNNECESSARY_CRAWLERS, rejectCrawler } = require("../src/lib/crawler-access.ts");
const robots = require("../src/app/robots.ts").default;
const { middleware } = require("../src/middleware.ts");
const { NextRequest } = require("next/server");
Module._load = load;

for (const bot of UNNECESSARY_CRAWLERS) {
  assert.ok(rejectCrawler(`Mozilla/5.0 (compatible; ${bot}/1.0)`, "/es/lots?category=tools", "GET"));
  assert.ok(rejectCrawler(bot.toLowerCase(), "/lots/product-one", "HEAD"));
  assert.ok(!rejectCrawler(bot, "/checkout", "GET"));
  assert.ok(!rejectCrawler(bot, "/es/dashboard", "GET"));
  assert.ok(!rejectCrawler(bot, "/robots.txt", "GET"));
  assert.ok(!rejectCrawler(bot, "/merchant-feed.xml", "GET"));
  assert.ok(!rejectCrawler(bot, "/lots", "POST"));
}
for (const ua of ["Googlebot", "Googlebot-Image", "Storebot-Google", "AdsBot-Google", "Bingbot", "Mozilla/5.0", "", "NotAhrefsBot"]) {
  assert.ok(!rejectCrawler(ua, "/es/lots", "GET"), `${ua} stays accessible`);
}

const policy = await robots();
function allowed(agent, url) {
  const specific = policy.rules.find(r => (Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]).includes(agent));
  const rule = specific ?? policy.rules.find(r => r.userAgent === "*");
  const match = pattern => {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}`).test(url);
  };
  const entries = [
    ...[rule.allow ?? []].flat().map(p => ({ p, allow: true })),
    ...[rule.disallow ?? []].flat().map(p => ({ p, allow: false })),
  ].filter(({ p }) => match(p)).sort((a, b) => b.p.length - a.p.length || Number(b.allow) - Number(a.allow));
  return entries[0]?.allow ?? true;
}
for (const agent of ["Googlebot", "Bingbot", "OAI-SearchBot", "UnknownBot"]) {
  for (const url of ["/lots?category=tools", "/es/lots?category=tools&q=patio", "/es?recent=25&value=57", "/?utm_source=test&value=2", "/es/c/tools?sort=value", "/search?q=air+fryer"]) {
    assert.ok(!allowed(agent, url), `${agent}: filter excluded: ${url}`);
  }
  for (const url of ["/", "/es", "/lots", "/es/lots", "/c/tools", "/es/c/tools", "/lots/product-one", "/es/lots/product-one", "/lots?page=2", "/merchant-feed.xml", "/images/products/test.webp", "/lots/product-one?utm_source=google"]) {
    assert.ok(allowed(agent, url), `${agent}: discovery allowed: ${url}`);
  }
}
assert.ok(!allowed("AhrefsBot", "/lots/product-one"));
assert.equal(policy.sitemap, "https://example.com/sitemap.xml");
const request = new NextRequest("https://example.com/es/lots?category=tools", { headers: { "user-agent": "SemrushBot/1.0" } });
const response = await middleware(request);
assert.equal(response.status, 403);
assert.equal(await response.text(), "Forbidden");
assert.equal(response.headers.get("cache-control"), "private, no-store");
const head = await middleware(new NextRequest("https://example.com/lots", { method: "HEAD", headers: { "user-agent": "AhrefsBot" } }));
assert.equal(head.status, 403);
assert.equal(await head.text(), "");
console.log("Crawler controls passed: EN/ES filter exclusions, product/category/pagination discovery, Google Merchant access, scraper rejection before rendering and private-route exemptions.");
