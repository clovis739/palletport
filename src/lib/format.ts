export function money(cents: number, opts: { cents?: boolean } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(cents / 100);
}

export function pctOfRetail(priceCents: number, msrpCents: number) {
  if (!msrpCents) return 0;
  return Math.round((priceCents / msrpCents) * 100);
}

export const CONDITIONS: Record<string, { label: string; tone: string; note: string }> = {
  NEW: { label: "New / Overstock", tone: "bg-moss/10 text-moss", note: "Unopened retail overstock in original packaging." },
  SHELF_PULL: { label: "Shelf Pull", tone: "bg-sky-100 text-sky-800", note: "Pulled from store shelves; may have price stickers or light box wear." },
  CUSTOMER_RETURN: { label: "Customer Return", tone: "bg-amber-100 text-amber-800", note: "Returned by shoppers. Untested; expect a mix of working, cosmetic and defective." },
  MIXED: { label: "Mixed Condition", tone: "bg-violet-100 text-violet-800", note: "A blend of new, shelf-pull and returned goods." },
  SALVAGE: { label: "Salvage", tone: "bg-rust/10 text-rust", note: "Damaged or for parts. Sold as-is for repair and resale professionals." },
};

export function conditionLabel(c: string) {
  return CONDITIONS[c]?.label ?? c;
}

export const SHIPPING_PER_PALLET_CENTS = 17500;
export const FREE_FREIGHT_THRESHOLD_CENTS = 750000;

export function shippingFor(subtotalCents: number, pallets: number) {
  if (pallets === 0) return 0;
  if (subtotalCents >= FREE_FREIGHT_THRESHOLD_CENTS) return 0;
  return pallets * SHIPPING_PER_PALLET_CENTS;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const BADGES: Record<string, { label: string; short: string }> = {
  WOMEN_OWNED: { label: "Women-owned", short: "Women-owned" },
  VETERAN_OWNED: { label: "Veteran-owned", short: "Veteran-owned" },
  SMALL_BIZ: { label: "Small business", short: "Small biz" },
  LOCAL_PICKUP: { label: "Warehouse pickup by appointment", short: "Pickup by appt." },
  FAST_SHIP: { label: "Ships within 48 hours", short: "Ships in 48h" },
  TRUCKLOADS: { label: "Sells full truckloads", short: "Truckloads" },
};

export function parseBadges(s: string | null | undefined) {
  return (s ?? "").split(",").map((b) => b.trim()).filter((b) => BADGES[b]);
}

export const BUSINESS_TYPES = [
  "Bin store",
  "Discount / dollar store",
  "Online reseller",
  "Flea market vendor",
  "Pawn / thrift shop",
  "Auction house",
  "Refurbisher / repair shop",
  "Exporter",
  "Other",
];

export function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

// ---------- Liquidation store: lot sizes and sources ----------

export const LOT_SIZES: Record<string, { label: string; plural: string; note: string }> = {
  CASE: { label: "Case pack", plural: "Case packs", note: "Boxes shipped by parcel — the easiest way to start." },
  PALLET: { label: "Pallet", plural: "Pallets", note: "One or a few pallets shipped by LTL freight." },
  TRUCKLOAD: { label: "Truckload", plural: "Truckloads", note: "18–26 pallets on a full trailer for volume buyers." },
};

export const SOURCES = [
  "Big-box retailer returns",
  "Online marketplace returns",
  "Department store overstock",
  "Home improvement retailer",
  "Warehouse club",
  "Specialty retailer",
  "Manufacturer overstock",
  "Closeout / store closure",
];

export const US_STATES = ["AZ", "MN", "NJ", "OH", "TX", "WA"];

export function stateOf(shipsFrom: string) {
  return shipsFrom.split(",").pop()?.trim() ?? "";
}

/** Price a buyer pays for one lot, or null when the lot can't be bought (sold out or draft). */
export function purchasePrice(lot: { status: string; priceCents: number }): number | null {
  return lot.status === "ACTIVE" ? lot.priceCents : null;
}
