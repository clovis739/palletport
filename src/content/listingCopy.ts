// Buyer-facing intro and FAQ copy for the listing pages (/pallets, /truckloads, /case-packs, /lots).
// `{location}` is replaced with the warehouse city from the store record when the page renders.
// Keep answers factual: they are also published as FAQPage structured data.

export type ListingKey = "pallets" | "truckloads" | "case-packs" | "lots";

export type ListingCopy = {
  /** One short line under the page title, above the grid. */
  lead: string;
  /** Heading for the fuller copy below the grid. */
  heading: string;
  /** 2–3 short paragraphs. */
  intro: string[];
  /** Key facts shown beside the intro on desktop, below it on mobile. */
  facts: [label: string, value: string][];
  /** Related pages. */
  links: [label: string, href: string][];
  faqs: { q: string; a: string }[];
};

const PICKUP_FAQ = {
  q: "Can I pick up from your warehouse instead?",
  a: "Yes, by appointment at our warehouse in {location}. Book a warehouse visit from any lot page: pick a weekday (Monday to Friday) and a 50-minute time at least 45 hours ahead. Orders of $600 or more pay a refundable 35% deposit to confirm; smaller orders pay in full. There's no walk-in store.",
};

export const LISTING_COPY: Record<ListingKey, ListingCopy> = {
  pallets: {
    lead: "Standard 48×40 pallets of returns, shelf pulls and overstock, shipped by LTL freight.",
    heading: "Buying liquidation pallets",
    intro: [
      "A pallet lot is one or a few standard 48×40 pallets of customer returns, shelf pulls or overstock, stretch-wrapped in our warehouse in {location}. It's the size most bin stores, discount shops and online resellers buy week to week: enough stock to fill shelves, small enough to unload with a pallet jack.",
      "Every lot page has the full manifest with SKUs, quantities and retail values, plus the condition grade, unit count and price per unit. Read it before you order, and judge the lot by what those items sell for in your market rather than by the retail total.",
      "Pallets ship by LTL (less-than-truckload) freight. Enter your ZIP on any lot page for a delivery estimate. No loading dock? Leave the dock box unticked at checkout and the carrier brings a liftgate truck to lower the pallet to the ground.",
    ],
    facts: [
      ["Size", "Standard 48×40 pallets, one or a few per lot"],
      ["Delivery", "LTL freight, with liftgate if you have no dock"],
      ["Manifest", "SKUs, quantities and retail values on every lot"],
      ["Pricing", "One fixed price per lot, shown up front"],
    ],
    links: [["How freight and delivery work", "/help/freight-and-delivery"], ["How to order", "/how-to-buy"], ["Stocking a bin store", "/guides/bin-stores"]],
    faqs: [
      {
        q: "What's on a liquidation pallet?",
        a: "Exactly what the manifest lists. Each lot page shows the SKUs, quantities, retail values and condition grade, so you can see the mix before you order.",
      },
      {
        q: "What do I need to receive a pallet?",
        a: "A loading dock, or a liftgate delivery plus a pallet jack or helpers to move the pallet once it's on the ground. The lot page lists the pallet count and weight so you can plan ahead.",
      },
      {
        q: "How is freight priced?",
        a: "Enter your ZIP on the lot page for an estimate. The final amount is confirmed at checkout and depends on the number of pallets, the distance, and whether you need liftgate or residential delivery.",
      },
      {
        q: "What if the pallet doesn't match the manifest?",
        a: "If the order doesn't match its written listing in a material way, contact us within 15 days of pickup or delivery with photos. See our Return & Refund Policy. Note any visible damage on the delivery receipt before you sign.",
      },
      PICKUP_FAQ,
    ],
  },

  truckloads: {
    lead: "Full trailers of 18–26 pallets for volume buyers. A loading dock and forklift are required.",
    heading: "Buying a full truckload",
    intro: [
      "A truckload is a full trailer of 18 to 26 pallets sold as one lot. Truckloads suit buyers who move volume: multi-location bin stores, discount chains, wholesalers, and exporters filling containers. You take the whole load in one purchase, so the manifest matters even more than it does on a single pallet.",
      "Truckloads ship on a 53-foot trailer, and you'll need a loading dock and a forklift to receive one. There's no liftgate option for a full trailer. Before you order, check that you have floor space for every pallet and people to unload on delivery day. Enter your ZIP on the lot page to see a freight estimate and transit time.",
      "Not ready for a full trailer? Buy several pallet lots in one order and they ship together as a single freight shipment. If you have questions about weights, pallet counts or unloading, ask us from the lot page before you commit.",
    ],
    facts: [
      ["Size", "18–26 pallets on a 53-foot trailer"],
      ["Receiving", "Loading dock and forklift required"],
      ["Freight", "Estimate by ZIP on every lot page"],
      ["Who buys", "Multi-store operators, wholesalers, exporters"],
    ],
    links: [["Exporting liquidation goods", "/guides/exporters"], ["Volume & enterprise buyers", "/volume-buyers"], ["How freight and delivery work", "/help/freight-and-delivery"]],
    faqs: [
      {
        q: "Do I need a loading dock for a truckload?",
        a: "Yes. A full trailer needs a loading dock and a forklift to unload. If you don't have both, buy pallet lots instead, which can ship by liftgate truck, or have the load delivered to a warehouse that can receive it.",
      },
      {
        q: "How many pallets are in a truckload?",
        a: "Our truckloads carry 18 to 26 pallets. The exact pallet count, total weight and full manifest are on each lot page.",
      },
      {
        q: "Can I have a truckload delivered to my freight forwarder?",
        a: "Yes. We deliver to any US address with a dock, so exporters can send a load straight to their forwarder or consolidator. Ask us early if you need weights or pallet details for your container plan.",
      },
      {
        q: "How do I pay for a truckload?",
        a: "By card, wire/ACH, or Net 30 if you're a verified reseller. Card orders are confirmed right away; wire/ACH and Net 30 orders once we've reviewed them.",
      },
    ],
  },

  "case-packs": {
    lead: "Sealed cartons shipped by parcel. The lowest-risk way to start or to test a new category.",
    heading: "Why start with case packs",
    intro: [
      "A case pack is one or a few sealed cartons of returns, shelf pulls or overstock, sold by the case and shipped by parcel carrier. It's the lowest-risk way into liquidation: a smaller spend, no freight to book, and no dock, forklift or pallet jack needed at your end.",
      "Case packs are also a good way to test a category before you commit to a pallet. Buy a case of phone accessories or cosmetics, list or shelve it, and see how quickly it sells and how many units turn out unsellable. The manifest tells you what's inside, so you can price items before the box arrives.",
      "Cases ship to business or home addresses. If you add a case pack to an order that also includes pallets, it rides along on the pallet shipment instead of going separately.",
    ],
    facts: [
      ["Size", "One or a few sealed cartons"],
      ["Delivery", "Parcel carrier, no dock needed"],
      ["Good for", "First-time buyers and testing a category"],
      ["Manifest", "Item list and retail values on every lot"],
    ],
    links: [["Sourcing for online resale", "/guides/online-resellers"], ["Selling at flea markets", "/guides/flea-market-vendors"], ["How to order", "/how-to-buy"]],
    faqs: [
      {
        q: "How are case packs shipped?",
        a: "By parcel carrier in sealed cartons. You don't need a dock or liftgate, and you can follow the order from your Orders page.",
      },
      {
        q: "Can case packs go to a home address?",
        a: "Yes. Parcel delivery works for business and residential addresses. The residential surcharge only applies to pallet and truckload freight.",
      },
      {
        q: "Are case packs a good first purchase?",
        a: "They're the easiest place to start. The spend is smaller, delivery is simple, and you learn how a category sells before buying it by the pallet.",
      },
      {
        q: "Can I combine case packs with a pallet order?",
        a: "Yes. When your order includes pallets, case packs ride along on the same freight shipment.",
      },
    ],
  },

  lots: {
    lead: "Every lot in stock, from single case packs to full truckloads, each at one fixed price.",
    heading: "Browsing all of our inventory",
    intro: [
      "This page lists every lot in stock at our warehouse in {location}: case packs to full truckloads, across all categories, each at a fixed price. Start here when you want to see everything, then narrow it down with the filters for category, condition, lot size, source and price.",
      "Each card shows the condition grade, unit count, price per unit, percent of retail and the price you pay. Open a lot for the full manifest, condition notes and a freight estimate for your ZIP, then add it to your cart.",
      "Sort by lowest percent of retail to surface the cheapest lots relative to their manifest value, or by price. Newly listed lots also appear on New arrivals.",
    ],
    facts: [
      ["Lot sizes", "Case packs, pallets and truckloads"],
      ["Pricing", "Fixed prices, no bidding"],
      ["Conditions", "New, shelf pull, customer return, mixed, salvage"],
      ["Ships from", "Our own warehouse in {location}"],
    ],
    links: [["New arrivals", "/new"], ["All categories", "/categories"], ["How it works", "/how-it-works"]],
    faqs: [
      {
        q: "Are prices fixed?",
        a: "Yes. Every lot has one listed price, with no bidding. Add it to your cart and check out; freight to your ZIP is added at checkout, and you can see an estimate on the lot page first.",
      },
      {
        q: "What do the condition grades mean?",
        a: "New/Overstock is unopened retail stock. Shelf pulls came off store shelves and may have stickers or box wear. Customer returns are untested and include working, cosmetic and defective items. Mixed is a blend, and salvage is damaged or for parts.",
      },
      {
        q: "What does percent of retail mean?",
        a: "It's the lot price divided by the total retail value on the manifest. It's a useful way to compare lots, but retail value isn't resale value, so check what the items actually sell for.",
      },
      {
        q: "Where do lots ship from?",
        a: "Every lot is ours and ships from our warehouse in {location}. Pallets go by LTL freight, truckloads on a full trailer and case packs by parcel. Pickup is by appointment: book a weekday visit from the lot page.",
      },
    ],
  },
};

/** Replaces `{location}` in every string with the warehouse city. */
export function localizeListingCopy(copy: ListingCopy, location: string): ListingCopy {
  const f = (s: string) => s.split("{location}").join(location);
  return {
    lead: f(copy.lead),
    heading: f(copy.heading),
    intro: copy.intro.map(f),
    facts: copy.facts.map(([l, v]): [string, string] => [f(l), f(v)]),
    links: copy.links,
    faqs: copy.faqs.map((x) => ({ q: f(x.q), a: f(x.a) })),
  };
}
