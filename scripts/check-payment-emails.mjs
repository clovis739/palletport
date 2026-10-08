import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

// Entirely isolated: no real database, credentials, recipients or email delivery.
process.env.APP_URL = 'https://example.test';
process.env.EMAIL_TO = 'admin@example.test';
const require = createRequire(import.meta.url);
const sent = [];
let method = { id: 'ZELLE', name: 'Zelle', instructions: 'Use your order number.', logo: '' };
const load = Module._load;
const mocked = {
  '@/lib/email': { emailConfigured: () => true, validEmail: () => true, sendEmail: async mail => { sent.push(mail); } },
  '@/lib/db': { db: {} },
  '@/lib/settings': { getSetting: async () => ({ paymentMethods: [method] }) },
  '@/lib/user-locale': { getUserLocale: async () => 'en' },
  '@/i18n/server': { getTFor: async () => text => text },
};
Module._load = function(request, parent, isMain) {
  if (request === 'server-only') return {};
  if (mocked[request]) return mocked[request];
  return load.call(this, request, parent, isMain);
};
const { notifyStoreOfOrder } = require('../src/lib/order-email.ts');
const { paymentEmailHtml } = require('../src/lib/payment-email.ts');
const { orderShippedEmail, orderDeliveredEmail, orderCancelledEmail } = require('../src/lib/email-templates.ts');
const order = { id: 'fixture', number: 'ORDER-FIXTURE', status: 'PENDING', paymentMethod: 'ZELLE', subtotalCents: 6500, shippingCents: 0, discountCents: 0, totalCents: 6500, dockAccess: true, residential: false, deliveryMethod: 'PICKUP', shipName: 'Buyer', shipAddress: 'Warehouse', shipCity: 'City', shipRegion: 'OH', shipPostal: '43201', shipCountry: 'US', user: {name: 'Buyer', email: 'buyer@example.test'}, items: [{title: 'Product', quantity: 1, priceCents: 6500}] };
await notifyStoreOfOrder(order);
assert.equal(sent.length, 2);
assert.deepEqual(sent.map(m => m.to), ['buyer@example.test', 'admin@example.test']);
for (const mail of sent) assert(mail.html.includes('https://example.test/images/payments/zelle.png'));
for (const [id, file] of [['ZELLE', 'zelle'], ['CHIME', 'chime'], ['APPLE_PAY', 'apple-pay'], ['CARD', 'visa']]) {
  assert(existsSync(`public/images/payments/${file}.png`));
  assert(paymentEmailHtml(id).includes(`${file}.png`));
  assert(!paymentEmailHtml(id).includes('.svg'));
}
assert(paymentEmailHtml('CARD').includes('mastercard.png'));
assert.equal(paymentEmailHtml('WIRE'), '');
assert(!paymentEmailHtml('CHIME', '<script>alert(1)</script>').includes('<script>'));
sent.length = 0;
method = { ...method, logo: '/media/lib/custom.png' };
await notifyStoreOfOrder(order);
for (const mail of sent) {
  assert(mail.html.includes('https://example.test/media/lib/custom.png'));
  assert(!mail.html.includes('/payments/zelle.png'));
}
for (const template of [orderShippedEmail, orderDeliveredEmail, orderCancelledEmail]) assert(template(order).html.includes('/payments/zelle.png'));
assert(orderCancelledEmail(order, { audience: 'team', byBuyer: true }).html.includes('/payments/zelle.png'));
Module._load = load;
console.log('Payment logos verified in customer/admin confirmations and lifecycle templates, including custom overrides, PNG URLs and escaping. No emails sent.');
