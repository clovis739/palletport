import { writeFileSync, mkdirSync } from 'node:fs';
import { db } from '../src/lib/db';
import { WAREHOUSE_ADDRESS, withWarehouseAddress } from '../src/lib/warehouse';

const address = WAREHOUSE_ADDRESS;
async function main() {
  const lots = await db.lot.findMany({ select: { id: true, shipsFrom: true, description: true, sourceDelivery: true } });
  if (process.argv.includes('--inspect')) {
    console.log(JSON.stringify({ products: lots.length, locationLines: [...new Set(lots.flatMap(p => [...p.description.matchAll(/(?:FOB(?: Location)?\s*[: ]|Warehouse Locations?\s*:|Warehouse\s*:|Ships? from\s*:|Ships? FOB\s+)[^\n]{0,160}/gi)].map(m => m[0])))] }, null, 2));
    return;
  }
  const sellers = await db.seller.findMany({ select: { id: true, location: true } });
  mkdirSync('tmp/location-update', { recursive: true });
  writeFileSync('tmp/location-update/backup.json', JSON.stringify({ lots, sellers }, null, 2));
  const changedDescriptions = lots.filter(p => withWarehouseAddress(p.description, address) !== p.description);
  await db.$transaction(async tx => {
    await tx.lot.updateMany({ data: { shipsFrom: address } });
    await tx.seller.updateMany({ data: { location: address } });
    for (const lot of lots) {
      const description = withWarehouseAddress(lot.description, address);
      const sourceDelivery = lot.sourceDelivery === null ? null : withWarehouseAddress(lot.sourceDelivery, address);
      if (description !== lot.description || sourceDelivery !== lot.sourceDelivery) await tx.lot.update({ where: { id: lot.id }, data: { description, sourceDelivery } });
    }
  }, { timeout: 120000, maxWait: 20000 });
  const remaining = await db.lot.count({ where: { NOT: { shipsFrom: address } } });
  const wrongSellers = await db.seller.count({ where: { NOT: { location: address } } });
  if (remaining || wrongSellers) throw new Error('Location verification failed');
  console.log(`Updated and verified ${lots.length} products and ${sellers.length} warehouse records. Corrected addresses in ${changedDescriptions.length} descriptions.`);
}
main().catch(error => { console.error(error?.code ?? error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
