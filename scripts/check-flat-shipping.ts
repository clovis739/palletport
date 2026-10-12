import assert from 'node:assert/strict';
import { estimateShipments, freightTotal, type ShipLine } from '../src/lib/shipping';
const line: ShipLine = { sellerId:'one',sellerName:'Store',shipsFrom:'Columbus, OH',lotSize:'PALLET',palletCount:2,weightLbs:600,quantity:1,priceCents:40000 };
for (const lotSize of ['PALLET','TRUCKLOAD','CASE']) {
  for (const toZip of ['43201','90210','10001']) {
    for (const subtotal of [40000,750000,1000000]) {
      const shipments = estimateShipments([{...line,lotSize,quantity:3}],{toZip,method:'FREIGHT',liftgate:true,residential:true},subtotal);
      assert.equal(freightTotal(shipments),10000);
      assert.equal(shipments[0].accessorialCents,0);
    }
  }
}
const mixed = [line,{...line,sellerId:'two',lotSize:'CASE'},{...line,sellerId:'three',lotSize:'TRUCKLOAD'}];
assert.equal(freightTotal(estimateShipments(mixed,{method:'FREIGHT',toZip:'90210',liftgate:true,residential:true},1000000)),10000);
assert.equal(freightTotal(estimateShipments(mixed,{method:'PICKUP',liftgate:true,residential:true},50000)),0);
assert.equal(freightTotal(estimateShipments([],{method:'FREIGHT',liftgate:false,residential:false},0)),0);
console.log('Flat shipping checks passed: all product types, ZIPs, thresholds, multiple shipments, surcharges, pickup and empty carts.');
