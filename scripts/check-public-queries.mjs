import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";

// Isolated DB fixtures; exercise the actual public query helpers and cache adapter.
const require = createRequire(import.meta.url);
const stored = new Map();
const calls = [];
const paths = [];
let clock = 0;
const rows = Array.from({ length: 55 }, (_, i) => ({
  id: `lot-${String(i).padStart(3, "0")}`, slug: `product-${i}`, status: "ACTIVE",
  createdAt: new Date(2026, 0, i + 1), priceCents: (55 - i) * 100,
  msrpCents: (i % 3 + 1) * 10000, lotSize: "PALLET", views: i,
}));
const cacheApi = {
  unstable_cache(fn, keys, opts) {
    return async (...args) => {
      const key = JSON.stringify([keys, args]);
      const previous = stored.get(key);
      if (previous && previous.until > clock) return previous.value;
      const value = await fn(...args);
      stored.set(key, { value, tags: opts.tags, until: clock + opts.revalidate });
      return value;
    };
  },
  revalidateTag(tag) { for (const [key, entry] of stored) if (entry.tags.includes(tag)) stored.delete(key); },
  revalidatePath(...args) { paths.push(args); },
};
const matches = (row, where = {}) => {
  if (where.AND) return where.AND.every(part => matches(row, part));
  if (where.id?.in && !where.id.in.includes(row.id)) return false;
  if (typeof where.status === "string" && row.status !== where.status) return false;
  if (where.status?.in && !where.status.in.includes(row.status)) return false;
  return true;
};
const project = (row, select) => select ? Object.fromEntries(Object.keys(select).map(key => [key, row[key]])) : row;
const db = { lot: {
  async count(args) { calls.push({ op: "count", args }); return rows.filter(row => matches(row, args.where)).length; },
  async findMany(args) {
    calls.push({ op: "findMany", args });
    const out = rows.filter(row => matches(row, args.where));
    for (const order of [...(Array.isArray(args.orderBy) ? args.orderBy : args.orderBy ? [args.orderBy] : [])].reverse()) {
      const [key, direction] = Object.entries(order)[0];
      out.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (direction === "desc" ? -1 : 1));
    }
    return out.slice(args.skip ?? 0, args.take ? (args.skip ?? 0) + args.take : undefined).map(row => project(row, args.select));
  },
  async findUnique(args) {
    calls.push({ op: "findUnique", args });
    return rows.find(row => row.slug === args.where.slug && row.status !== args.where.status.not) ?? null;
  },
} };
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === "server-only") return {};
  if (name === "next/cache") return cacheApi;
  if (name === "./db") return { db };
  return original.call(this, name, ...args);
};
const { cachedPublic, revalidatePath } = require("../src/lib/public-cache.ts");
const { getBrowseProducts, getHomeInventory, getPublicLot, CARD_SELECT } = require("../src/lib/storefront-products.ts");
Module._load = original;

const page2 = await getBrowseProducts({ status: "ACTIVE" }, "price_asc", 2);
assert.equal(page2.total, 55);
assert.equal(page2.lots.length, 24);
assert.equal(page2.lots[0].id, "lot-030");
assert.equal(calls.at(-1).args.skip, 24);
assert.equal(calls.at(-1).args.take, 24);
assert.ok(!CARD_SELECT.description && !CARD_SELECT.manifest);
const afterFirst = calls.length;
assert.deepEqual(await getBrowseProducts({ status: "ACTIVE" }, "price_asc", 2), page2);
assert.equal(calls.length, afterFirst, "Repeat public visits must reuse cache");
const last = await getBrowseProducts({ status: "ACTIVE" }, "new", 999);
assert.equal(last.page, 3);
assert.equal(last.lots.length, 7);
assert.equal(last.lots[0].id, "lot-006");
const value = await getBrowseProducts({ status: "ACTIVE" }, "value", 2);
const expected = [...rows].sort((a, b) => a.priceCents / a.msrpCents - b.priceCents / b.msrpCents).slice(24, 48).map(row => row.id);
assert.deepEqual(value.lots.map(row => row.id), expected, "Value sorting must preserve ratio order after fetching cards");
assert.deepEqual(Object.keys(calls.at(-2).args.select).sort(), ["id", "msrpCents", "priceCents"]);
const inventory = await getHomeInventory();
assert.ok(inventory[0].createdAt instanceof Date);
assert.ok((await getHomeInventory())[0].createdAt instanceof Date, "Cache hits must preserve dates");
assert.ok(!calls.at(-1).args.select.images && !calls.at(-1).args.select.description);
const first = await getPublicLot("product-2");
first.priceCents = 0;
assert.notEqual((await getPublicLot("product-2")).priceCents, 0, "Cache reads return independent objects");
rows[2].status = "DRAFT";
revalidatePath("/", "layout");
assert.deepEqual(paths.at(-1), ["/", "layout"]);
assert.equal(await getPublicLot("product-2"), null, "Unpublished products disappear after invalidation");
const beforeRefresh = calls.length;
await getBrowseProducts({ status: "ACTIVE" }, "price_asc", 2);
assert.ok(calls.length > beforeRefresh, "Inventory mutations invalidate cached results");
clock += 61;
const beforeExpiry = calls.length;
await getBrowseProducts({ status: "ACTIVE" }, "price_asc", 2);
assert.ok(calls.length > beforeExpiry, "TTL expiry refreshes reads");
let attempts = 0;
const flaky = cachedPublic(async () => { if (++attempts === 1) throw new Error("quota"); return "restored"; }, "failure-fixture");
await assert.rejects(flaky(), /quota/);
assert.equal(await flaky(), "restored", "Database failures must not be cached");
const dateRead = cachedPublic(async () => new Date("2026-10-07T12:00:00Z"), "date-fixture");
assert.equal((await dateRead()).toISOString(), "2026-10-07T12:00:00.000Z");
const empty = await getBrowseProducts({ id: { in: [] } }, "new", 999);
assert.equal(empty.page, 1);
assert.equal(empty.total, 0);
assert.deepEqual(empty.lots, []);
console.log("Public query checks passed: cache reuse/expiry/invalidation, date preservation, failure recovery, draft exclusion, DB pagination and value sorting.");
