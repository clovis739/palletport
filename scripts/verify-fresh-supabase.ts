/** Read-only verification of a completed fresh import. Never print credentials. */
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

async function main() {
  const db = new PrismaClient(); // Verify the app's transaction pooler, too.
  try {
    const expected = JSON.parse(readFileSync('prisma/fresh-catalog.json', 'utf8'));
    const [users, products, orders, manifests] = await Promise.all([
      db.user.findMany({ select: { email: true, role: true, passwordHash: true } }),
      db.lot.findMany({ include: { category: true, manifest: true } }),
      db.order.count(), db.manifestItem.count(),
    ]);
    assert.equal(users.length, 1);
    assert.equal(users[0].email, process.env.FRESH_ADMIN_EMAIL);
    assert.equal(users[0].role, 'ADMIN');
    assert.match(users[0].passwordHash, /^\$2[aby]\$12\$/);
    const passwordProvided = Boolean(process.env.FRESH_ADMIN_PASSWORD);
    if (passwordProvided) assert(await bcrypt.compare(process.env.FRESH_ADMIN_PASSWORD!, users[0].passwordHash));
    assert.equal(orders, 0);
    assert.equal(products.length, expected.products.length);
    assert.equal(manifests, expected.products.reduce((sum: number, p: any) => sum + p.manifest.length, 0));
    const bySlug = new Map(products.map(p => [p.slug, p]));
    for (const p of expected.products) {
      const actual = bySlug.get(p.slug)!;
      for (const key of ['sku', 'title', 'description', 'condition', 'priceCents', 'available', 'status', 'shipsFrom'] as const) assert.equal(actual[key], p[key]);
      assert.equal(actual.images, p.images.join('\n'));
      assert.equal(actual.category.slug, p.categorySlug);
      assert.equal(actual.source, '');
      assert.equal(actual.manifest.length, p.manifest.length);
    }
    for (const model of Prisma.dmmf.datamodel.models) {
      const name = `public."${model.dbName || model.name}"`;
      const [row] = await db.$queryRaw<{ rls: boolean; anon: boolean; authenticated: boolean }[]>`
        SELECT relrowsecurity AS rls,
          has_table_privilege('anon', ${name}, 'SELECT,INSERT,UPDATE,DELETE') AS anon,
          has_table_privilege('authenticated', ${name}, 'SELECT,INSERT,UPDATE,DELETE') AS authenticated
        FROM pg_class WHERE oid = ${name}::regclass`;
      assert(row.rls && !row.anon && !row.authenticated);
    }
    console.log(`Verified ${products.length} products, ${manifests} manifest rows, one admin${passwordProvided ? ' with a working password' : ' with a secure password hash'}, zero orders, and RLS/API restrictions on all application tables using the app pooler.`);
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Fresh database verification failed; no secrets logged.'); process.exitCode = 1; });
