/**
 * Commerce admin helpers: date ranges, bucketing, order filters/sorting, labels.
 * Pure (no DB access) so pages, route handlers and actions can share them. See docs/ADMIN.md.
 */
import type { Prisma } from "@prisma/client";
import { CI } from "@/lib/dbText";

const DAY = 86400000;

// ---------- Date ranges ----------

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(v: string | undefined, fallback: RangeDays = 30): RangeDays {
  const n = Number(v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : fallback;
}

/** UTC midnight of the given date. */
export function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export type RangeWindow = { days: number; start: Date; end: Date; prevStart: Date; keys: string[] };

/** The last `days` whole days (today included) and the equally long period before it. */
export function rangeWindow(days: number, now = new Date()): RangeWindow {
  const today = startOfDay(now);
  const start = new Date(today.getTime() - (days - 1) * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(start.getTime() + i * DAY)));
  return { days, start, end: now, prevStart, keys };
}

export function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function dayLabel(key: string) {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Sums `value(row)` per day key (rows outside the keys are ignored). */
export function bucketByDay<T>(rows: T[], keys: string[], date: (r: T) => Date, value: (r: T) => number = () => 1) {
  const idx = new Map(keys.map((k, i) => [k, i] as const));
  const out = keys.map(() => 0);
  for (const r of rows) {
    const i = idx.get(dayKey(date(r)));
    if (i !== undefined) out[i] += value(r);
  }
  return out;
}

/** Groups daily values into chunks of `size` days (e.g. weeks for a 90-day range). */
export function chunk(values: number[], size: number) {
  if (size <= 1) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size).reduce((a, b) => a + b, 0));
  return out;
}

export function chunkLabels(keys: string[], size: number) {
  if (size <= 1) return keys.map(dayLabel);
  const out: string[] = [];
  for (let i = 0; i < keys.length; i += size) out.push(`${dayLabel(keys[i])}–${dayLabel(keys[Math.min(keys.length, i + size) - 1])}`);
  return out;
}

/** "+12%" / "−5%" / "new" / "0%" delta for StatCard. */
export function delta(current: number, previous: number, good: "up" | "down" = "up") {
  if (previous === 0 && current === 0) return { value: "0%", trend: "flat" as const, good };
  if (previous === 0) return { value: "new", trend: "up" as const, good };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { value: "0%", trend: "flat" as const, good };
  return { value: `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`, trend: pct > 0 ? ("up" as const) : ("down" as const), good };
}

export function pct(n: number, d: number, digits = 0) {
  if (!d) return "—";
  return `${((n / d) * 100).toFixed(digits)}%`;
}

// ---------- Orders ----------

/** Orders that count as revenue: payment received or card-confirmed, not cancelled. */
export const REVENUE_STATUSES = ["CONFIRMED", "SHIPPED", "DELIVERED"] as const;
export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_LABEL: Record<string, string> = {
  CARD: "Card",
  NET30: "Net 30",
  WIRE: "Wire / ACH",
};

export const DELIVERY_LABEL: Record<string, string> = { FREIGHT: "Freight delivery", PICKUP: "Warehouse pickup" };

export const CARRIERS = ["", "Estes", "Old Dominion", "XPO", "R+L Carriers", "Saia", "FedEx Freight", "UPS", "FedEx", "USPS", "Own truck", "Other"];

export function isPaid(o: { paidAt: Date | null; paymentMethod: string; status: string; dueNowCents?: number; totalCents?: number }) {
  // Warehouse-visit orders with a deposit are only fully paid once the balance is recorded (paidAt).
  if (o.dueNowCents && o.totalCents && o.dueNowCents < o.totalCents) return !!o.paidAt;
  return !!o.paidAt || (o.paymentMethod === "CARD" && o.status !== "CANCELLED");
}

export type OrderFilters = {
  q: string;
  status: string;
  pay: string;
  delivery: string;
  from: string; // YYYY-MM-DD
  to: string;
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

export function parseOrderFilters(sp: SP): OrderFilters {
  const status = one(sp.status).toUpperCase();
  const pay = one(sp.pay).toUpperCase();
  const delivery = one(sp.delivery).toUpperCase();
  const from = one(sp.from);
  const to = one(sp.to);
  return {
    q: one(sp.q).trim().slice(0, 100),
    status: (ORDER_STATUSES as readonly string[]).includes(status) || status === "OPEN" ? status : "",
    pay: PAYMENT_LABEL[pay] ? pay : "",
    delivery: DELIVERY_LABEL[delivery] ? delivery : "",
    from: isDate(from) ? from : "",
    to: isDate(to) ? to : "",
  };
}

export function dateRangeWhere(from: string, to: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
    ...(to ? { lt: new Date(new Date(`${to}T00:00:00Z`).getTime() + DAY) } : {}),
  };
}

export function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const created = dateRangeWhere(f.from, f.to);
  return {
    ...(f.status === "OPEN" ? { status: { in: ["PENDING", "CONFIRMED"] } } : f.status ? { status: f.status } : {}),
    ...(f.pay ? { paymentMethod: f.pay } : {}),
    ...(f.delivery ? { deliveryMethod: f.delivery } : {}),
    ...(created ? { createdAt: created } : {}),
    ...(f.q
      ? {
          OR: [
            { number: { contains: f.q, ...CI } },
            { shipName: { contains: f.q, ...CI } },
            { poNumber: { contains: f.q, ...CI } },
            { user: { name: { contains: f.q, ...CI } } },
            { user: { email: { contains: f.q, ...CI } } },
            { user: { businessName: { contains: f.q, ...CI } } },
            { items: { some: { title: { contains: f.q, ...CI } } } },
          ],
        }
      : {}),
  };
}

export const ORDER_SORTS = { created: "createdAt", total: "totalCents", number: "number", status: "status" } as const;

export function parseSort<K extends string>(sort: string | undefined, dir: string | undefined, allowed: readonly K[], fallback: K) {
  const s = (allowed as readonly string[]).includes(sort ?? "") ? (sort as K) : fallback;
  const d: "asc" | "desc" = dir === "asc" ? "asc" : dir === "desc" ? "desc" : "desc";
  return { sort: s, dir: d };
}

export function parsePage(v: string | undefined) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10000) : 1;
}

/** Builds a query string from params, dropping empty values. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}

export function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formulas, quote everything that needs it.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// ---------- Promotions ----------

export function promoState(p: { active: boolean; expiresAt: Date | null }) {
  if (p.expiresAt && p.expiresAt < new Date()) return { label: "Expired", tone: "muted" as const };
  return p.active ? { label: "Active", tone: "moss" as const } : { label: "Paused", tone: "amber" as const };
}

// ---------- Activity log ----------

export const AUDIT_LABEL: Record<string, string> = {
  "lot.create": "Created a lot",
  "lot.update": "Edited a lot",
  "lot.status": "Changed a lot's status",
  "lot.delete": "Deleted a lot",
  "lot.hide": "Hid a lot (it has orders)",
  "lot.photos": "Added lot photos",
  "lot.featured": "Toggled a featured lot",
  "lot.bulk": "Bulk-updated lots",
  "lot.quick": "Quick-edited a lot",
  "order.status": "Changed an order's status",
  "order.confirm": "Confirmed an order",
  "order.paid": "Marked an order paid",
  "order.shipped": "Marked an order shipped",
  "order.delivered": "Marked an order delivered",
  "order.cancel": "Cancelled an order",
  "order.note": "Updated order notes",
  "order.export": "Exported orders (CSV)",
  "store.update": "Updated store settings",
  "settings.save": "Saved site settings",
  "settings.reset": "Reset site settings",
  "promo.create": "Created a promo code",
  "promo.update": "Edited a promo code",
  "promo.toggle": "Paused / activated a promo code",
  "inbox.certificate": "Reviewed a resale certificate",
  "inbox.handled": "Marked a message handled",
  "inbox.unhandled": "Reopened a message",
  "customer.update": "Edited a customer",
  "customer.pro": "Changed Pro status",
  "customer.reset": "Generated a password-reset link",
  "customer.certificate": "Reviewed a resale certificate",
  "staff.create": "Added a staff member",
  "staff.role": "Changed a role",
  "staff.remove": "Removed staff access",
  "content.create": "Created content",
  "content.update": "Edited content",
  "content.publish": "Published content",
  "content.unpublish": "Unpublished content",
  "content.delete": "Deleted content",
  "content.import": "Imported default content",
  "media.upload": "Uploaded media",
  "media.delete": "Deleted media",
  "media.alt": "Edited media alt text",
  "nav.save": "Saved navigation",
  "home.save": "Saved homepage",
  "seed.run": "Seeded the database",
};

export const AUDIT_AREAS: { value: string; label: string }[] = [
  { value: "order.", label: "Orders" },
  { value: "lot.", label: "Lots" },
  { value: "customer.", label: "Customers" },
  { value: "promo.", label: "Promotions" },
  { value: "inbox.", label: "Inbox" },
  { value: "staff.", label: "Staff" },
  { value: "store.", label: "Store settings" },
  { value: "settings.", label: "Site settings" },
  { value: "content.", label: "Content" },
  { value: "media.", label: "Media" },
  { value: "nav.", label: "Navigation" },
  { value: "home.", label: "Homepage" },
  { value: "seed.", label: "System" },
];

export function auditLabel(action: string) {
  if (AUDIT_LABEL[action]) return AUDIT_LABEL[action];
  const [area, verb = ""] = action.split(".");
  return `${area.charAt(0).toUpperCase()}${area.slice(1)} · ${verb.replace(/[_-]/g, " ")}`;
}
