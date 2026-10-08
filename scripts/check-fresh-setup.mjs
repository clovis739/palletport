import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const catalog = JSON.parse(readFileSync('prisma/fresh-catalog.json', 'utf8'));
assert.equal(catalog.products.length, 593);
assert.equal(catalog.products.filter(p => p.images.length).length, 457);
for (const key of ['slug', 'sku']) assert.equal(new Set(catalog.products.map(p => p[key])).size, 593);
const categories = new Set(catalog.categories.map(c => c.slug));
for (const category of catalog.categories) assert.equal(typeof category.hidden, 'boolean');
for (const p of catalog.products) {
  assert.equal(typeof p.featured, 'boolean');
  assert(categories.has(p.categorySlug));
  assert.match(p.sku, /^PP-[0-9A-F]{12}$/);
  assert.equal(p.shipsFrom, '1150 Corrugated Way, Columbus, OH 43201, USA');
  for (const image of p.images) assert(image.startsWith('/') && existsSync(`public${image}`));
}
const forbidden = new Set(['passwordHash', 'email', 'userId', 'orders', 'shipAddress', 'phone', 'referredBy']);
function checkKeys(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) { assert(!forbidden.has(key), `Private field: ${key}`); checkKeys(child); }
}
checkKeys(catalog);
function reject(env, message) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/bootstrap-supabase.ts', '--apply'], { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 20_000 });
  assert.equal(result.status, 1, result.stderr);
  assert(result.stderr.includes(message), result.stderr);
  assert(!result.stderr.includes('fake-secret'));
}
const url = ref => `postgresql://postgres.${ref}:fake-secret@aws-0-test.pooler.supabase.com:5432/postgres`;
reject({ DATABASE_URL: 'postgresql://user:fake-secret@host.neon.tech/db', DATABASE_URL_UNPOOLED: url('aaa') }, 'must target your new Supabase');
reject({ DATABASE_URL: url('aaa'), DATABASE_URL_UNPOOLED: url('bbb') }, 'same Supabase project');
reject({ DATABASE_URL: url('aaa'), DATABASE_URL_UNPOOLED: url('aaa'), FRESH_ADMIN_EMAIL: '', FRESH_ADMIN_PASSWORD: '' }, 'Set FRESH_ADMIN_EMAIL');
console.log('Fresh catalog validation and pre-connection safety guards passed. No database was contacted.');
