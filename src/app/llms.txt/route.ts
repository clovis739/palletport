import { db } from "@/lib/db";
import { getStore } from "@/lib/store";
import { CONDITIONS, FREE_FREIGHT_THRESHOLD_CENTS, LOT_SIZES, SHIPPING_PER_PALLET_CENTS, money } from "@/lib/format";
import { COLLECTIONS } from "@/lib/collections";
import { getHelpArticles, getLegalPages, getPublishedGuides, getPublishedPages, getPublishedPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import { formatAddress } from "@/components/ContactDetails";

// llms.txt (https://llmstxt.org): a plain-language map of the site, generated from live data.
// Every fact here is already published elsewhere on the site; nothing is written only for machines.
export const revalidate = 3600;

export async function GET() {
  const listed = <T extends { meta: { noindex?: boolean } }>(list: T[]) => list.filter((a) => !a.meta.noindex);
  const [posts, guides, help, legal, pages] = await Promise.all([
    getPublishedPosts().then(listed),
    getPublishedGuides().then(listed),
    getHelpArticles().then(listed),
    getLegalPages().then(listed),
    getPublishedPages().then(listed),
  ]);
  const [store, categories, sizes] = await Promise.all([
    getStore(),
    db.category.findMany({ where: { hidden: false }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { name: true, slug: true, blurb: true, _count: { select: { lots: { where: { status: "ACTIVE" } } } } } }),
    db.lot.groupBy({ by: ["lotSize"], where: { status: "ACTIVE" }, _count: true }),
  ]);
  const link = (title: string, path: string, note?: string) => `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;
  const business = await getSetting("business");
  const count = (k: string) => sizes.find((s) => s.lotSize === k)?._count ?? 0;

  const lines = [
    `# ${store.name}`,
    "",
    `> ${store.bio}`,
    "",
    `${store.name} is a single seller: every lot is owned by us and ships from our own warehouse in ${store.location}. Buyers are businesses that resell goods — bin stores, discount shops, online resellers, flea-market vendors, refurbishers and exporters.`,
    "",
    "## What we sell",
    "",
    ...Object.entries(LOT_SIZES).map(([k, s]) => `- ${s.plural}: ${s.note} (${count(k)} listed now)`),
    "",
    "Condition grades:",
    ...Object.values(CONDITIONS).map((c) => `- ${c.label}: ${c.note}`),
    "",
    "Categories:",
    ...categories.map((c) => link(c.name, `/c/${c.slug}`, `${c.blurb} (${c._count.lots} active lots)`)),
    "",
    "## How buying works",
    "",
    "- Every lot has one fixed price (no auctions or bidding). Add lots to the cart and check out; freight is added at checkout.",
    "- Every lot page shows its manifest (SKUs, quantities and retail values), condition grade, units, percent of retail and price per unit.",
    "- Payment: card, wire/ACH, or Net 30 for verified resellers. Card orders are confirmed immediately.",
    `- Freight: most lots ship LTL, estimated at ${money(SHIPPING_PER_PALLET_CENTS)} per pallet and free on orders over ${money(FREE_FREIGHT_THRESHOLD_CENTS)}. Most pallets arrive in 3–7 business days.`,
    store.pickup
      ? `- Warehouse pickup in ${store.location} is by appointment: choose pickup at checkout and we email you to book a time. There is no walk-in store.`
      : `- Warehouse pickup in ${store.location} is by appointment: book a weekday (Mon–Fri) 50-minute visit from any lot page, at least 45 hours ahead. Orders of $600+ pay a refundable 35% deposit to confirm; smaller orders pay in full. There is no walk-in store.`,
    "- Returns: requests within 15 days of pickup or delivery, approved in writing before anything is sent back; buyer pays return freight unless the error is ours. See the Return & Refund Policy (/legal/returns-and-disputes).",
    "",
    "## Contact",
    "",
    link("Contact form", "/contact", "questions about a lot, an order or bulk buying, and pickup appointment requests"),
    // Business facts: Admin → Site → Business profile (`business` settings, STORE_* env as fallback).
    ...(business.email ? [`- Email: ${business.email}`] : []),
    ...(business.salesEmail ? [`- Sales email: ${business.salesEmail}`] : []),
    ...(business.phone ? [`- Phone: ${business.phone}`] : []),
    ...(business.whatsapp ? [`- WhatsApp: ${business.whatsapp}`] : []),
    ...(business.addressStreet ? [`- Warehouse address: ${formatAddress(business)} (pickup by appointment only)`] : []),
    ...(business.hours ? [`- Hours: ${business.hours}`] : []),
    ...business.socialLinks.map((l) => `- ${l.label}: ${l.href}`),
    "",
    "## Key pages",
    "",
    link("Home", "/"),
    link("All lots", "/lots"),
    link("Pallets", "/pallets"),
    link("Truckloads", "/truckloads"),
    link("Case packs", "/case-packs"),
    link("Liquidation pallets in Columbus, Ohio", "/liquidation-pallets-columbus-ohio", "our warehouse, delivery across Ohio and the Midwest, and pickup by appointment"),
    link("All categories", "/categories"),
    link("How to order", "/how-to-buy"),
    link("How it works", "/how-it-works"),
    link("About us", "/about"),
    link("Volume & enterprise buyers", "/volume-buyers"),
    "",
    "## Collections",
    "",
    ...COLLECTIONS.map((c) => link(c.title, `/collections/${c.slug}`, c.tagline)),
    "",
    "## Buying guides",
    "",
    ...guides.map((g) => link(g.title, `/guides/${g.slug}`, g.excerpt)),
    "",
    "## Help center",
    "",
    ...help.map((h) => link(h.title, `/help/${h.slug}`, h.excerpt)),
    "",
    "## Blog",
    "",
    link("The Loading Dock (blog)", "/blog"),
    ...posts.slice(0, 20).map((p) => link(p.title, `/blog/${p.slug}`, p.excerpt)),
    "",
    "## Policies",
    "",
    ...legal.map((l) => link(l.title, `/legal/${l.slug}`)),
    ...(pages.length ? ["", "## More pages", "", ...pages.map((pg) => link(pg.title, `/p/${pg.slug}`, pg.excerpt || undefined))] : []),
    "",
    "## Optional",
    "",
    link("Sitemap (XML)", "/sitemap.xml"),
    link("Site map", "/site-map"),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
