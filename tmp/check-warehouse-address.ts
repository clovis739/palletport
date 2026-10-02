import assert from 'node:assert/strict';
import { stateOf } from '../src/lib/format';
import { WAREHOUSE_ADDRESS, withWarehouseAddress } from '../src/lib/warehouse';
import { estimateShipments } from '../src/lib/shipping';
assert.equal(stateOf(WAREHOUSE_ADDRESS), 'OH');
assert.equal(stateOf('Columbus, OH'), 'OH');
assert.equal(stateOf('Dallas, TX 75201, USA'), 'TX');
for (const text of ['FOB: North Carolina', 'Warehouse: Jacksonville, FL Open: Mon–Sat', 'Warehouse Locations: Texas, Georgia, Indiana H2: Details', 'FOB Location: DFW (Dallas/Fort Worth).']) {
  const updated = withWarehouseAddress(text, WAREHOUSE_ADDRESS);
  assert.ok(updated.includes(WAREHOUSE_ADDRESS));
  assert.equal(withWarehouseAddress(updated, WAREHOUSE_ADDRESS), updated);
}
const line = { sellerId:'store',sellerName:'PalletPort',shipsFrom:WAREHOUSE_ADDRESS,lotSize:'PALLET',palletCount:1,weightLbs:500,quantity:1,priceCents:10000 };
const opts = {toZip:'90001',method:'FREIGHT' as const,liftgate:false,residential:false};
assert.deepEqual(estimateShipments([line],opts,10000).map(s=>[s.zone,s.totalCents]),estimateShipments([{...line,shipsFrom:'Columbus, OH'}],opts,10000).map(s=>[s.zone,s.totalCents]));
console.log('Address replacement and Ohio shipping calculation checks passed.');
