import "server-only";
import { db } from "./db";

/**
 * PalletPort is a single-seller store: every lot is sold by the company from its own warehouse.
 * Internally that company is one row in the Seller table, owned by the admin account.
 */
export async function getStore() {
  const store =
    (await db.seller.findFirst({ where: { user: { role: "ADMIN" } }, orderBy: { createdAt: "asc" } })) ??
    (await db.seller.findFirst({ orderBy: { createdAt: "asc" } }));
  if (store) return store;
  // First run with an empty database: create the store record.
  return db.seller.create({
    data: {
      name: process.env.STORE_NAME ?? "PalletPort",
      slug: "store",
      location: process.env.WAREHOUSE_LOCATION ?? "Columbus, OH",
      bio: "Manifested liquidation pallets sold direct from our own warehouse.",
      verified: true,
      pickup: false, // pickup is by appointment on request; turn on in Business settings to offer it at checkout
    },
  });
}
