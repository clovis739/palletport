import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";

// Exercise the real guard with an isolated transaction/row-lock fixture.
// No production accounts, inventory, payments or orders are changed.
const require = createRequire(import.meta.url);
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  return name === "server-only" ? {} : originalLoad.call(this, name, ...args);
};
const { guardOrderPlacement, findBlockingOrder, ORDER_LIMIT_MESSAGE } = require("../src/lib/order-placement.ts");
Module._load = originalLoad;

function fixture(initial = [], users = ["buyer", "other"]) {
  const orders = [...initial];
  const locks = new Map();
  const events = [];
  const order = {
    async findFirst({ where }) {
      events.push(`read:${where.userId}`);
      return orders.find(row => row.userId === where.userId && row.status !== where.status.not) ?? null;
    },
  };
  return {
    orders, events, order,
    async transaction(body) {
      let unlock;
      const staged = [];
      const tx = {
        order,
        async $queryRaw(strings, userId) {
          assert.match(strings.join("?"), /WHERE "id" = \? FOR UPDATE$/);
          events.push(`lock-request:${userId}`);
          const previous = locks.get(userId) ?? Promise.resolve();
          const current = new Promise(resolve => { unlock = resolve; });
          locks.set(userId, current);
          await previous;
          events.push(`locked:${userId}`);
          return users.includes(userId) ? [{ id: userId }] : [];
        },
        create(status = "PENDING", userId = "buyer") {
          const row = { id: `order-${orders.length}`, number: "TEST", userId, status };
          staged.push(row);
          return row;
        },
      };
      try {
        const result = await body(tx);
        orders.push(...staged);
        return result;
      } finally {
        unlock?.();
      }
    },
  };
}

for (const status of ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "UNKNOWN"]) {
  const db = fixture([{ userId: "buyer", status }]);
  await assert.rejects(db.transaction(async tx => {
    await guardOrderPlacement(tx, "buyer");
    assert.fail("Rejected orders must never reach writes");
  }), { message: ORDER_LIMIT_MESSAGE });
  assert.deepEqual(db.events, ["lock-request:buyer", "locked:buyer", "read:buyer"]);
}
for (const initial of [[], [{ userId: "buyer", status: "CANCELLED" }], [{ userId: "other", status: "PENDING" }]]) {
  const db = fixture(initial);
  assert.equal(await findBlockingOrder(db, "buyer"), null);
  await db.transaction(async tx => { await guardOrderPlacement(tx, "buyer"); tx.create(); });
  assert.equal(db.orders.filter(row => row.userId === "buyer" && row.status !== "CANCELLED").length, 1);
}
const mixed = fixture([{ userId: "buyer", status: "CANCELLED" }, { userId: "buyer", status: "DELIVERED" }]);
await assert.rejects(mixed.transaction(tx => guardOrderPlacement(tx, "buyer")), { message: ORDER_LIMIT_MESSAGE });
const missing = fixture([], []);
await assert.rejects(missing.transaction(tx => guardOrderPlacement(tx, "buyer")), /sign in again/);
assert.ok(!missing.events.includes("read:buyer"));

// Regular checkout and visit booking use the same guard and account lock.
// Hold the first transaction open until the second has actually requested its lock.
const concurrent = fixture();
let entered;
const firstEntered = new Promise(resolve => { entered = resolve; });
let release;
const releaseFirst = new Promise(resolve => { release = resolve; });
const checkout = concurrent.transaction(async tx => {
  await guardOrderPlacement(tx, "buyer");
  entered();
  await releaseFirst;
  tx.create();
});
await firstEntered;
const visit = concurrent.transaction(async tx => {
  await guardOrderPlacement(tx, "buyer");
  tx.create("CONFIRMED");
});
const visitResult = assert.rejects(visit, { message: ORDER_LIMIT_MESSAGE });
assert.equal(concurrent.events.filter(event => event === "lock-request:buyer").length, 2);
assert.equal(concurrent.events.filter(event => event === "read:buyer").length, 1);
release();
await Promise.all([checkout, visitResult]);
assert.equal(concurrent.orders.length, 1);

// Cancellation and deletion each reopen ordering, but another remaining order blocks it.
concurrent.orders[0].status = "CANCELLED";
await concurrent.transaction(async tx => { await guardOrderPlacement(tx, "buyer"); tx.create(); });
concurrent.orders.splice(0);
await concurrent.transaction(async tx => { await guardOrderPlacement(tx, "buyer"); tx.create(); });
assert.equal(concurrent.orders.length, 1);
console.log("Order placement checks passed: statuses, account isolation, cancellation, deletion and simultaneous submissions.");
