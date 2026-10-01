import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
// Pure modules only (no "server-only" imports): the seed runs outside Next.js.
import { defaultContentRows } from "../src/lib/content-model";
import { DEFAULTS, SETTINGS_KEYS } from "../src/lib/settings-schema";
import { TAXONOMY } from "../src/lib/taxonomy";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type SampleLot = {
  slug: string; title: string; category: string; subcategory: string; brand: string; condition: string; lotSize: string;
  palletCount: number; source: string; available: number; featured: boolean; priceCents: number; msrpCents: number;
  units: number; weightLbs: number; daysAgo: number; views: number; description: string;
  manifest: { sku: string; name: string; qty: number; unitMsrpCents: number }[];
};

const prisma = new PrismaClient();

// Catalogue tree: the standard structure in src/lib/taxonomy.ts (edit categories later in Admin → Categories).
// Sample listings for the newer departments live in prisma/sample-lots.json (built by scripts/build-sample-lots.py).

// Your company. Edit these, or change them later in Admin -> Business profile.
const STORE = {
  name: "PalletPort",
  slug: "store",
  location: "Columbus, OH",
  bio: "We buy customer returns, shelf pulls and overstock from major retailers, sort and manifest every pallet in our own Columbus warehouse, and sell direct to resellers.",
  verified: true,
  rating: 4.8,
  minOrderCents: 0,
  pickup: false, // warehouse pickup is by appointment on request, not a checkout option
};

const SOURCES = [
  "Big-box retailer returns",
  "Online marketplace returns",
  "Department store overstock",
  "Home improvement retailer",
  "Warehouse club",
  "Specialty retailer",
  "Manufacturer overstock",
  "Closeout / store closure",
];

const conditions = ["NEW", "SHELF_PULL", "CUSTOMER_RETURN", "MIXED", "SALVAGE"];

const CONDITION_PHRASE: Record<string, string> = {
  NEW: "new, unopened",
  SHELF_PULL: "shelf-pull",
  CUSTOMER_RETURN: "customer-return",
  MIXED: "mixed-condition",
  SALVAGE: "salvage",
};

/**
 * Seeded lot description built from the lot's own generated data, rotating sentence patterns by lot index so
 * listings don't all read the same. Only states what the seed actually generated.
 */
function describeLot(l: {
  index: number; catName: string; lotSize: string; palletCount: number; units: number; condition: string; source: string;
  manifest: { name: string; qty: number; unitMsrpCents: number }[];
}) {
  const top = [...l.manifest].sort((a, b) => b.qty * b.unitMsrpCents - a.qty * a.unitMsrpCents).slice(0, 3);
  const names = top.map((m) => `${m.qty} × ${m.name}`);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] ?? "assorted goods";
  const lines = l.manifest.length;
  const units = l.units.toLocaleString("en-US");
  const cond = CONDITION_PHRASE[l.condition] ?? l.condition.toLowerCase();
  const src = l.source.toLowerCase();
  const cat = l.catName.toLowerCase();
  const size =
    l.lotSize === "CASE" ? "a case pack" : l.lotSize === "TRUCKLOAD" ? `a ${l.palletCount}-pallet truckload` : l.palletCount > 1 ? `${l.palletCount} pallets` : "a single pallet";
  const pack = l.lotSize === "CASE" ? "Ships by parcel in sealed cartons." : "Stretch-wrapped on standard 48×40 pallets.";
  switch (l.index % 4) {
    case 0:
      return `${units} ${cond} ${cat} units packed as ${size}, sourced from ${src}. The biggest lines by retail value are ${list}. All ${lines} manifest lines are listed below, with quantities counted at our dock. ${pack}`;
    case 1:
      return `Headline items: ${list}. This ${cond} ${cat} load came in from ${src} and totals ${units} units across ${lines} manifest lines, packed as ${size}. ${pack}`;
    case 2:
      return `Sourced from ${src}, this is ${size} of ${cond} ${cat} — ${units} units in all. Top retail lines include ${list}; the complete manifest is below. ${pack}`;
    default:
      return `${size.charAt(0).toUpperCase()}${size.slice(1)} of ${cat} (${cond}) from ${src}: ${units} units over ${lines} manifest lines, led by ${list}. Quantities were counted at our dock. ${pack}`;
  }
}

const lotTemplates: Record<string, { title: string; sub: string; items: [string, number][] }[]> = {
  "phones-computers": [
    { title: "Phone Accessories Bulk", sub: "phones-computers-accessories", items: [["USB-C fast charger", 19], ["Braided charging cable 6ft", 14], ["Magnetic phone case", 29], ["Power bank 10000mAh", 34]] },
  ],
  shoes: [
    { title: "Footwear Closeouts", sub: "shoes-athletic-sneakers", items: [["Running sneakers", 90], ["Slip-on loafers", 65], ["Kids sneakers", 40], ["Slides", 25]] },
  ],
  seasonal: [
    { title: "Seasonal Overstock Mix", sub: "seasonal-mixed-seasonal", items: [["Holiday decor", 25], ["Pool floats", 20], ["Halloween costumes", 35], ["Outdoor lights", 30]] },
  ],
  electronics: [
    { title: "Wireless Earbuds & Headphones", sub: "electronics-audio", items: [["True wireless earbuds", 39], ["Over-ear ANC headphones", 129], ["Sport neckband earphones", 29], ["Kids volume-limited headphones", 24]] },
    { title: "Smart Home Starter Mix", sub: "electronics-smart-home", items: [["Smart plug 2-pack", 24], ["Wi-Fi video doorbell", 99], ["Smart bulb 4-pack", 44], ["Indoor security camera", 49]] },
  ],
  "home-kitchen": [
    { title: "Small Kitchen Appliances", sub: "home-kitchen-small-appliances", items: [["Air fryer 5qt", 89], ["Stand blender", 69], ["Drip coffee maker", 49], ["Electric kettle", 34]] },
    { title: "Cookware & Bakeware Overstock", sub: "home-kitchen-cookware", items: [["Nonstick fry pan set", 59], ["Sheet pan 3-pack", 29], ["Dutch oven 6qt", 79], ["Utensil set", 19]] },
    { title: "Home Decor Shelf Pulls", sub: "home-kitchen-home-decor", items: [["Throw pillow", 22], ["Table lamp", 45], ["Wall mirror", 69], ["Faux plant", 29]] },
  ],
  apparel: [
    { title: "Mixed Brand Activewear", sub: "apparel-activewear", items: [["Leggings", 45], ["Performance tee", 28], ["Zip hoodie", 60], ["Running shorts", 32]] },
  ],
  "tools-hardware": [
    { title: "Cordless Power Tool Returns", sub: "tools-hardware-power-tools", items: [["20V drill/driver kit", 129], ["Impact driver", 99], ["Oscillating multi-tool", 89], ["Battery 4Ah", 79]] },
    { title: "Hand Tools & Storage", sub: "tools-hardware-hand-tools", items: [["Socket set 120pc", 69], ["Tool bag", 39], ["Tape measure 25ft", 15], ["Rolling tool chest", 199]] },
  ],
  "toys-baby": [
    { title: "Toy Store Overstock", sub: "toys-baby-toys-games", items: [["Building block set", 49], ["Plush toy", 18], ["Board game", 25], ["RC car", 39]] },
    { title: "Nursery Essentials", sub: "toys-baby-nursery", items: [["Baby monitor", 79], ["Diaper caddy", 22], ["Swaddle 3-pack", 29], ["Bottle warmer", 35]] },
  ],
  "health-beauty": [
    { title: "Beauty & Cosmetics Mix", sub: "health-beauty-cosmetics", items: [["Lipstick", 18], ["Foundation", 32], ["Hair dryer", 59], ["Skincare set", 45]] },
    { title: "Personal Care Shelf Pulls", sub: "health-beauty-personal-care", items: [["Electric toothbrush", 49], ["Beard trimmer", 39], ["Body wash 3-pack", 15], ["Vitamin C serum", 25]] },
  ],
  furniture: [
    { title: "Office Furniture Returns", sub: "furniture-office", items: [["Ergonomic office chair", 249], ["Standing desk frame", 299], ["Bookshelf 5-tier", 89], ["Filing cabinet", 129]] },
    { title: "Patio & Outdoor", sub: "furniture-patio-outdoor", items: [["Folding patio chair", 59], ["Bistro table", 99], ["Outdoor rug 5x7", 69], ["Solar string lights", 29]] },
  ],
  "general-merchandise": [
    { title: "Big-Box Returns Truckload Pallet", sub: "general-merchandise-truckloads", items: [["Assorted household", 25], ["Assorted electronics", 45], ["Assorted toys", 20], ["Assorted home", 30]] },
  ],
};

const conditionDiscount: Record<string, number> = {
  NEW: 0.32,
  SHELF_PULL: 0.26,
  CUSTOMER_RETURN: 0.16,
  MIXED: 0.14,
  SALVAGE: 0.07,
};

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  await prisma.inquiry.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.manifestItem.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@palletport.test", name: "Demo Buyer", businessName: "Main Street Resale", businessType: "Bin store",
      passwordHash, role: "BUYER", certStatus: "APPROVED", certNumber: "OH-99812", certState: "OH",
      shipAddress: "410 Commerce Dr", shipCity: "Dayton", shipRegion: "OH", shipPostal: "45402", shipCountry: "United States",
    },
  });
  await prisma.user.create({
    data: { email: "pending@palletport.test", name: "Pat Pending", businessName: "Weekend Flea Finds", businessType: "Flea market vendor", passwordHash, certStatus: "PENDING", certNumber: "TX-11873", certState: "TX" },
  });
  const admin = await prisma.user.create({
    data: { email: "admin@palletport.test", name: "PalletPort Admin", passwordHash, role: "ADMIN" },
  });
  // Demo staff (see src/lib/permissions.ts): a manager (orders, lots, customers…) and an editor (content, media).
  await prisma.user.create({ data: { email: "manager@palletport.test", name: "Morgan Manager", passwordHash, role: "MANAGER" } });
  await prisma.user.create({ data: { email: "editor@palletport.test", name: "Eddie Editor", passwordHash, role: "EDITOR" } });

  // Other demo business buyers.
  for (const [i, b] of ["Northside Bins", "Flip & Ship LLC", "Second Chance Goods"].entries()) {
    await prisma.user.create({ data: { email: `reseller${i + 1}@palletport.test`, name: b, businessName: b, passwordHash, certStatus: "APPROVED" } });
  }

  const cats = [];
  for (const [ci, c] of TAXONOMY.entries()) {
    cats.push(
      await prisma.category.create({
        data: {
          name: c.name,
          slug: c.slug,
          blurb: c.blurb,
          hue: c.hue,
          group: c.group,
          position: (ci + 1) * 10,
          subcategories: { create: c.subs.map((sub, si) => ({ name: sub.name, slug: sub.slug, position: (si + 1) * 10 })) },
        },
        include: { subcategories: true },
      }),
    );
  }

  // Single-seller store: every lot is sold by the company, from its own warehouse, owned by the admin account.
  const store = await prisma.seller.create({ data: { ...STORE, userId: admin.id } });

  let n = 1;
  for (const cat of cats) {
    const templates = lotTemplates[cat.slug] ?? [];
    for (const t of templates) {
      const sub = cat.subcategories.find((x) => x.slug === t.sub);
      for (let v = 0; v < 2; v++) {
        const seed = n * 7.13;
        const condition = conditions[Math.floor(rand(seed) * conditions.length)];
        const seller = store;
        const sizeRoll = rand(seed + 2);
        const lotSize = sizeRoll < 0.15 ? "CASE" : sizeRoll > 0.82 ? "TRUCKLOAD" : "PALLET";
        const palletCount = lotSize === "TRUCKLOAD" ? 18 + Math.floor(rand(seed + 3) * 9) : lotSize === "CASE" ? 1 : rand(seed + 3) > 0.7 ? 2 + Math.floor(rand(seed + 3) * 3) : 1;
        const scale = lotSize === "CASE" ? 0.12 : palletCount;
        const manifest = t.items.map(([name, msrp], i) => ({
          sku: `PP-${cat.slug.slice(0, 3).toUpperCase()}-${n}${i}`,
          name,
          qty: Math.max(lotSize === "CASE" ? 2 : 4, Math.floor(rand(seed + i + 4) * 60 * scale)),
          unitMsrpCents: msrp * 100,
        }));
        const msrpCents = manifest.reduce((a, m) => a + m.qty * m.unitMsrpCents, 0);
        const units = manifest.reduce((a, m) => a + m.qty, 0);
        const fairCents = Math.round((msrpCents * conditionDiscount[condition]) / 100) * 100;
        const title =
          lotSize === "TRUCKLOAD" ? `${t.title} — Truckload (${palletCount} Pallets)` : lotSize === "CASE" ? `${t.title} — Case Pack` : palletCount > 1 ? `${t.title} — ${palletCount} Pallets` : `${t.title} Pallet`;
        const source = SOURCES[Math.floor(rand(seed + 15) * SOURCES.length)];

        await prisma.lot.create({
          data: {
            slug: `${slugify(title)}-${n}`,
            title,
            description: describeLot({ index: n, catName: cat.name, lotSize, palletCount, units, condition, source, manifest }),
            condition,
            priceCents: fairCents,
            msrpCents,
            units,
            palletCount,
            lotSize,
            source,
            weightLbs: lotSize === "CASE" ? 20 + Math.floor(rand(seed + 9) * 60) : palletCount * (300 + Math.floor(rand(seed + 9) * 500)),
            shipsFrom: seller.location,
            available: 1 + Math.floor(rand(seed + 10) * 4),
            featured: rand(seed + 11) > 0.72,
            categoryId: cat.id,
            subcategoryId: sub?.id,
            views: Math.floor(rand(seed + 12) * 900),
            createdAt: new Date(Date.now() - Math.floor(rand(seed + 13) * 30) * 86400000),
            sellerId: seller.id,
            manifest: { create: manifest },
          },
        });
        n++;
      }
    }
  }

  // ---- sample listings for the newer departments (prisma/sample-lots.json)
  const samples = JSON.parse(readFileSync(join(process.cwd(), "prisma", "sample-lots.json"), "utf8")) as SampleLot[];
  for (const l of samples) {
    const cat = cats.find((c) => c.slug === l.category);
    if (!cat) continue;
    const sub = cat.subcategories.find((x) => x.slug === l.subcategory);
    const { category: _c, subcategory: _s, daysAgo, manifest, ...data } = l;
    await prisma.lot.create({
      data: {
        ...data,
        shipsFrom: store.location,
        status: "ACTIVE",
        categoryId: cat.id,
        subcategoryId: sub?.id,
        sellerId: store.id,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
        manifest: { create: manifest },
      },
    });
    n++;
  }

  // ---- promos
  await prisma.promo.create({ data: { code: "WELCOME10", description: "10% off your first order (up to any size)", percentOff: 10, firstOrderOnly: true } });
  await prisma.promo.create({ data: { code: "FREIGHT150", description: "$150 off orders over $2,500", amountOffCents: 15000, minSubtotalCents: 250000 } });
  await prisma.promo.create({ data: { code: "TRUCKLOAD5", description: "5% off orders over $10,000", percentOff: 5, minSubtotalCents: 1000000 } });

  // ---- a delivered order with review, and an in-flight order, for the demo buyer
  const someLots = await prisma.lot.findMany({ take: 2 });
  const otherLots = await prisma.lot.findMany({ skip: 2, take: 1 });
  const ship = { shipName: "Main Street Resale", shipAddress: "410 Commerce Dr", shipCity: "Dayton", shipRegion: "OH", shipPostal: "45402", shipCountry: "United States" };
  if (someLots[0]) {
    const o1 = await prisma.order.create({
      data: {
        number: "PP-DEMO-001", userId: buyer.id, status: "DELIVERED", paymentMethod: "NET30",
        subtotalCents: someLots[0].priceCents, shippingCents: 17500, totalCents: someLots[0].priceCents + 17500,
        trackingNo: "PRO-448120", createdAt: new Date(Date.now() - 20 * 86400000), ...ship,
        items: { create: [{ lotId: someLots[0].id, sellerId: store.id, title: someLots[0].title, priceCents: someLots[0].priceCents, quantity: 1 }] },
      },
    });
    await prisma.review.create({ data: { orderId: o1.id, userId: buyer.id, sellerId: store.id, rating: 5, body: "Manifest matched what arrived almost exactly. Well wrapped, dock delivery was on time." } });
  }
  if (otherLots[0]) {
    await prisma.order.create({
      data: {
        number: "PP-DEMO-002", userId: buyer.id, status: "SHIPPED", paymentMethod: "CARD",
        subtotalCents: otherLots[0].priceCents, shippingCents: 17500, totalCents: otherLots[0].priceCents + 17500,
        trackingNo: "PRO-551903", createdAt: new Date(Date.now() - 3 * 86400000), ...ship,
        items: { create: [{ lotId: otherLots[0].id, sellerId: store.id, title: otherLots[0].title, priceCents: otherLots[0].priceCents, quantity: 1 }] },
      },
    });
  }
  if (someLots[1]) await prisma.favorite.create({ data: { userId: buyer.id, lotId: someLots[1].id } });


  // CMS: built-in articles → ContentEntry (existing entries are kept, so owner edits survive a re-seed),
  // and a settings row per key holding today's defaults (never overwritten).
  let createdEntries = 0;
  for (const row of defaultContentRows()) {
    const exists = await prisma.contentEntry.findUnique({ where: { type_slug: { type: row.type, slug: row.slug } }, select: { id: true } });
    if (exists) continue;
    await prisma.contentEntry.create({ data: { ...row, updatedById: admin.id } });
    createdEntries++;
  }
  for (const key of SETTINGS_KEYS) {
    await prisma.siteSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(DEFAULTS[key]), updatedById: admin.id }, update: {} });
  }
  await prisma.auditLog.create({ data: { userId: admin.id, userEmail: admin.email, action: "seed.run", target: "database", detail: `${createdEntries} content entries imported` } });

  console.log(`Seeded ${cats.length} categories and ${n - 1} lots for ${store.name}; ${createdEntries} content entries imported.`);
  console.log("Demo logins (password: password123): admin@palletport.test (owner), manager@palletport.test (manager), editor@palletport.test (editor), buyer@palletport.test, pending@palletport.test, reseller1-3@palletport.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
