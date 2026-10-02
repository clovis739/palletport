import { db } from '../src/lib/db';

async function main() {
  for (let round = 1; round <= 2; round++) {
    const started = Date.now();
    const [lots, store] = await Promise.all([
      db.lot.findMany({ where: { status: 'ACTIVE' }, include: { category: true, seller: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      db.seller.findFirst({ where: { user: { role: 'ADMIN' } }, orderBy: { createdAt: 'asc' } }),
      db.category.findMany(),
      db.lot.groupBy({ by: ['categoryId'], where: { status: 'ACTIVE' }, _count: { _all: true } }),
      db.lot.groupBy({ by: ['subcategoryId'], where: { status: 'ACTIVE', NOT: { subcategoryId: null } }, _count: { _all: true } }),
      db.lot.findMany({ where: { status: 'SOLD_OUT' }, include: { category: true, seller: true }, take: 4 }),
      db.siteSetting.findMany({ select: { key: true, value: true } }),
      db.contentEntry.count({ where: { type: 'POST' } }),
      db.contentEntry.count({ where: { type: 'GUIDE' } }),
    ]);
    if (!lots.length || !store) throw new Error('Expected store and in-stock products');
    console.log(`Homepage database reads passed: round ${round}, ${lots.length} active products, ${Date.now() - started}ms.`);
  }
}
main().catch(error => {
  console.error('Database check failed:', error?.code ?? error?.name ?? 'Unknown error');
  process.exitCode = 1;
}).finally(() => db.$disconnect());
