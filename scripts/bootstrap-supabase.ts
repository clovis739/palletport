import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DEFAULTS, SETTINGS_KEYS } from '../src/lib/settings-schema';
import { defaultContentRows } from '../src/lib/content-model';
import { WAREHOUSE_ADDRESS } from '../src/lib/warehouse';

class SetupError extends Error {}
async function main() {
  const catalog = JSON.parse(readFileSync('prisma/fresh-catalog.json', 'utf8'));
  if (catalog.version !== 1 || !catalog.products.length) throw new Error('Missing validated fresh catalog');
  if (!process.argv.includes('--apply')) {
    console.log(`Ready to import ${catalog.products.length} products and create exactly one new admin. Check mode does not connect to a database.`);
    return;
  }
  // This command can never run against Neon or an existing populated application.
  const projectRefs: string[] = [];
  for (const key of ['DATABASE_URL', 'DATABASE_URL_UNPOOLED']) {
    let url: URL;
    try { url = new URL(process.env[key] || ''); } catch { throw new SetupError(`Configure ${key} locally first`); }
    if (!/^(postgres|postgresql):$/.test(url.protocol) || !/(\.pooler\.supabase\.com|\.supabase\.co)$/.test(url.hostname) || url.searchParams.get('schema') && url.searchParams.get('schema') !== 'public') throw new SetupError(`${key} must target your new Supabase public schema`);
    const ref = url.hostname.endsWith('.pooler.supabase.com') ? decodeURIComponent(url.username).split('.').at(-1) : url.hostname.match(/^db\.([^.]+)\.supabase\.co$/)?.[1];
    if (!ref || !/^[a-z0-9]+$/.test(ref)) throw new SetupError(`Invalid project reference in ${key}`);
    projectRefs.push(ref);
  }
  if (projectRefs[0] !== projectRefs[1]) throw new SetupError('Both database URLs must target the same Supabase project');
  const email = (process.env.FRESH_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.FRESH_ADMIN_PASSWORD || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) throw new SetupError('Set FRESH_ADMIN_EMAIL and a FRESH_ADMIN_PASSWORD of at least 12 characters locally');
  const brand = process.env.FRESH_BUSINESS_NAME?.trim() || 'Palle Liquidation-US';
  const hash = await bcrypt.hash(password, 12);
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL_UNPOOLED });
  try {
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(80421623)`;
      for (const model of Prisma.dmmf.datamodel.models) {
        const table = model.dbName || model.name;
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw new Error('Invalid table identifier');
        const [row] = await tx.$queryRawUnsafe<{ populated: boolean }[]>(`SELECT EXISTS(SELECT 1 FROM public."${table}" LIMIT 1) AS populated`);
        if (row.populated) throw new SetupError(`Refusing to overwrite a populated database (${model.name})`);
        await tx.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY`);
        await tx.$executeRawUnsafe(`REVOKE ALL ON TABLE public."${table}" FROM anon, authenticated`);
      }
      const admin = await tx.user.create({ data: { email, name: process.env.FRESH_ADMIN_NAME?.trim() || 'Store administrator', role: 'ADMIN', passwordHash: hash } });
      const seller = await tx.seller.create({ data: { userId: admin.id, name: brand, slug: 'store', location: WAREHOUSE_ADDRESS, bio: 'Wholesale liquidation inventory.', pickup: true } });
      const categories = new Map<string, string>(), subs = new Map<string, string>();
      for (const data of catalog.categories) { const c = await tx.category.create({ data }); categories.set(c.slug, c.id); }
      for (const { categorySlug, ...data } of catalog.subcategories) { const s = await tx.subcategory.create({ data: { ...data, categoryId: categories.get(categorySlug)! } }); subs.set(s.slug, s.id); }
      const manifests: Prisma.ManifestItemCreateManyInput[] = [];
      const products: Prisma.LotCreateManyInput[] = catalog.products.map(({ categorySlug, subcategorySlug, manifest, images, ...data }: any) => {
        const id = randomUUID();
        for (const item of manifest) manifests.push({ ...item, lotId: id });
        return { ...data, id, source: '', views: 0, images: images.join('\n'), sellerId: seller.id, categoryId: categories.get(categorySlug)!, subcategoryId: subcategorySlug ? subs.get(subcategorySlug) : null };
      });
      for (let offset = 0; offset < products.length; offset += 100) await tx.lot.createMany({ data: products.slice(offset, offset + 100) });
      if (manifests.length) await tx.manifestItem.createMany({ data: manifests });
      for (const key of SETTINGS_KEYS) {
        const value = key === 'business' ? { ...DEFAULTS.business, name: brand, logoAccent: '', addressStreet: '1150 Corrugated Way', addressCity: 'Columbus', addressRegion: 'OH', addressPostal: '43201', country: 'US' } : DEFAULTS[key];
        await tx.siteSetting.create({ data: { key, value: JSON.stringify(value) } });
      }
      await tx.contentEntry.createMany({ data: defaultContentRows() });
    }, { timeout: 180_000, maxWait: 15_000 });
    console.log(`Created ${catalog.products.length} products and one admin. No old accounts, orders or reviews were imported.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => {
  if (error instanceof SetupError) console.error(error.message);
  else {
    console.error('Fresh setup failed. No password or connection string is logged.');
    console.error('Diagnostic:', error?.name || 'unknown', error?.code || 'no Prisma code');
    const details = String(error?.message || '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(line => /^(Unknown argument|Argument `[^`]+`|Invalid value for argument|Transaction API error:|Error in connector:)/.test(line.trim()));
    for (const line of details) console.error(line.trim().slice(0, 250));
  }
  process.exitCode = 1;
});
