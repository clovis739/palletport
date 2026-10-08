import assert from 'node:assert/strict';
import { z } from 'zod';
import { productPriceFields, salePriceCents, updateProductFob } from '../src/lib/product-pricing';
import { purchasePrice } from '../src/lib/format';

assert.equal(salePriceCents(10000), 6500);
assert.equal(salePriceCents(12345), 8024);
assert.throws(() => salePriceCents(0));
const schema = z.object(productPriceFields);
assert.equal(schema.parse({price: '65.00', originalPrice: '100.00'}).originalPrice, 100);
for (const price of [-1, 0, Infinity, NaN, 999999999]) assert(!schema.safeParse({price}).success);
assert(!schema.safeParse({price: 10, originalPrice: -10}).success);
const text = 'Product facts\nFOB: old address\nQuantity: 100\nPickup at old address';
const changed = updateProductFob(text, 'New warehouse, City, USA', 'old address');
assert.equal(changed, 'Product facts\nFOB: New warehouse, City, USA\nQuantity: 100\nPickup at New warehouse, City, USA');
assert.equal(updateProductFob(changed, 'New warehouse, City, USA', 'old address'), changed);
assert.equal(purchasePrice({status: 'ACTIVE', priceCents: 6500}), 6500);
assert.equal(purchasePrice({status: 'SOLD_OUT', priceCents: 6500}), null);
console.log('Product sale pricing, input bounds, active checkout price and FOB consistency checks passed.');
