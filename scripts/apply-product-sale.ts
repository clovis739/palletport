import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { DEFAULTS } from '../src/lib/settings-schema';
import { salePriceCents } from '../src/lib/product-pricing';

const link = 'https://chat.whatsapp.com/LHfSAdo29pV6Y99myA4OXS';
async function main() {
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL_UNPOOLED });
  try {
    const products = await db.lot.findMany({ select: { id: true, slug: true, priceCents: true, compareAtPriceCents: true } });
    const pending = products.filter(p => p.compareAtPriceCents === 0);
    console.log(`${pending.length} products ready for a 35% discount; existing original prices will be preserved.`);
    if (!process.argv.includes('--apply')) return;
    mkdirSync('tmp/product-sale', { recursive: true });
    writeFileSync(`tmp/product-sale/before-${Date.now()}.json`, JSON.stringify(products, null, 2));
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(80421624)`;
      await tx.$executeRaw`UPDATE "Lot" SET "compareAtPriceCents" = "priceCents", "priceCents" = greatest(1, round("priceCents"::numeric * 0.65)::integer) WHERE "compareAtPriceCents" = 0 AND "priceCents" > 0`;
      const old = await tx.siteSetting.findUnique({ where: { key: 'whatsappGroups' } });
      const settings = old ? JSON.parse(old.value) : DEFAULTS.whatsappGroups;
      settings.groups = settings.groups.map((group: any) => ({ ...group, href: link }));
      await tx.siteSetting.upsert({ where: { key: 'whatsappGroups' }, create: { key: 'whatsappGroups', value: JSON.stringify(settings) }, update: { value: JSON.stringify(settings) } });
    }, { timeout: 30_000 });
    const after = await db.lot.findMany({ select: { id: true, priceCents: true, compareAtPriceCents: true } });
    const map = new Map(after.map(p => [p.id, p]));
    for (const p of pending) {
      const saved = map.get(p.id)!;
      if (saved.compareAtPriceCents !== p.priceCents || saved.priceCents !== salePriceCents(p.priceCents)) throw new Error('Price verification failed');
    }
    // Keep the local fresh-start snapshot aligned with the real sale, without compounding discounts.
    const catalog = JSON.parse(readFileSync('prisma/fresh-catalog.json', 'utf8'));
    const bySlug = new Map(products.map(p => [p.slug, map.get(p.id)!]));
    for (const p of catalog.products) { const saved = bySlug.get(p.slug); if (saved) { p.priceCents = saved.priceCents; p.compareAtPriceCents = saved.compareAtPriceCents; } }
    writeFileSync('prisma/fresh-catalog.json', JSON.stringify(catalog, null, 2) + '\n');
    console.log(`Verified ${pending.length} discounted products and updated all WhatsApp group links.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error('Sale update failed:', error?.code || 'check local configuration'); process.exitCode = 1; });
