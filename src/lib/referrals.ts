import "server-only";
import { db } from "./db";
import { isPaid } from "./commerce";

/**
 * "Give $100, get $100" referral programme.
 *
 * - The new business (referee) signs up through someone's link (/register?ref=CODE → User.referredBy).
 *   Its first order of $1,000+ (subtotal) gets $100 off automatically  → order.promoCode = REFERRAL_WELCOME_CODE.
 * - The referrer earns a $100 credit once that business's first $1,000+ order is paid, shipped or delivered.
 *   Each credit takes $100 off one later order automatically            → order.promoCode = REFERRAL_REWARD_CODE.
 * - Credits are computed from orders (earned − used), so a cancelled order gives its credit back on its own.
 * - One discount per order: when the buyer applies a promo code, the referral discount waits for a later order.
 */
export const REFERRAL_REWARD_CENTS = 10_000;
export const REFERRAL_MIN_ORDER_CENTS = 100_000;
export const REFERRAL_WELCOME_CODE = "REFERRAL-WELCOME";
export const REFERRAL_REWARD_CODE = "REFERRAL-REWARD";

/** The app client or a transaction client (only the user and order models are used). */
type Client = Pick<typeof db, "user" | "order">;

/** Short, readable, unique code, e.g. "ACMESU-7K2Q" (from the business name). */
export async function newReferralCode(seed: string, client: Client = db): Promise<string> {
  const base = seed.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PP";
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L
  for (let i = 0; i < 8; i++) {
    const tail = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const code = `${base}-${tail}`;
    if (!(await client.user.findUnique({ where: { referralCode: code }, select: { id: true } }))) return code;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}

/** Finds the referrer for a code typed or carried in a link (case-insensitive). */
export async function findReferrer(code: string | undefined | null, client: Client = db) {
  const c = (code ?? "").trim();
  if (!c || c.length > 64) return null;
  return client.user.findFirst({ where: { referralCode: { equals: c, mode: "insensitive" } }, select: { id: true, referralCode: true } });
}

const ORDER_FIELDS = { id: true, status: true, subtotalCents: true, totalCents: true, paidAt: true, paymentMethod: true, dueNowCents: true, createdAt: true } as const;
type O = { status: string; subtotalCents: number; totalCents: number; paidAt: Date | null; paymentMethod: string; dueNowCents: number; createdAt: Date };

/** The referee's qualifying order: its first non-cancelled order with a $1,000+ subtotal. */
function qualifying(orders: O[]) {
  return [...orders].sort((a, b) => +a.createdAt - +b.createdAt).find((o) => o.status !== "CANCELLED" && o.subtotalCents >= REFERRAL_MIN_ORDER_CENTS) ?? null;
}
const settled = (o: O) => o.status !== "CANCELLED" && (isPaid(o) || o.status === "SHIPPED" || o.status === "DELIVERED");

export type ReferralState = "signed_up" | "ordered" | "earned";

/** Everything the referrals page and checkout need for one user. */
export async function referralSummary(userId: string, client: Client = db) {
  const me = await client.user.findUnique({ where: { id: userId }, select: { referralCode: true, referredBy: true } });
  if (!me) return null;
  const [referred, used, myBigOrders, referrer] = await Promise.all([
    client.user.findMany({
      where: { referredBy: me.referralCode, NOT: { id: userId } },
      select: { id: true, name: true, businessName: true, createdAt: true, orders: { select: ORDER_FIELDS } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    client.order.count({ where: { userId, promoCode: REFERRAL_REWARD_CODE, status: { not: "CANCELLED" } } }),
    // A $1,000+ order already placed (and not cancelled) means the welcome discount has been used or missed.
    client.order.count({ where: { userId, status: { not: "CANCELLED" }, subtotalCents: { gte: REFERRAL_MIN_ORDER_CENTS } } }),
    me.referredBy ? findReferrer(me.referredBy, client) : Promise.resolve(null),
  ]);
  const rows = referred.map((r) => {
    const q = qualifying(r.orders as O[]);
    const state: ReferralState = q && settled(q) ? "earned" : q ? "ordered" : "signed_up";
    return { id: r.id, name: r.businessName || r.name, createdAt: r.createdAt, state };
  });
  const earned = rows.filter((r) => r.state === "earned").length;
  return {
    code: me.referralCode,
    referrals: rows,
    earned,
    used,
    creditsAvailable: Math.max(0, earned - used),
    /** Referred by someone else and no $1,000+ order yet: $100 off the first $1,000+ order. */
    welcomeAvailable: !!referrer && referrer.id !== userId && myBigOrders === 0,
  };
}

export type ReferralDiscount = { cents: number; code: string; label: string };

/**
 * The automatic referral discount for an order with this subtotal, or null. Also returns a hint when the buyer
 * has a reward that this order can't use yet (e.g. the welcome discount below $1,000).
 */
export async function referralDiscount(userId: string, subtotalCents: number, client: Client = db): Promise<{ discount: ReferralDiscount | null; hint: string }> {
  const s = await referralSummary(userId, client);
  if (!s || subtotalCents <= 0) return { discount: null, hint: "" };
  if (s.welcomeAvailable) {
    if (subtotalCents >= REFERRAL_MIN_ORDER_CENTS) {
      return { discount: { cents: Math.min(REFERRAL_REWARD_CENTS, subtotalCents), code: REFERRAL_WELCOME_CODE, label: "Referral welcome discount" }, hint: "" };
    }
    return { discount: null, hint: `Add $${((REFERRAL_MIN_ORDER_CENTS - subtotalCents) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} more to get your $100 referral welcome discount (orders of $1,000+).` };
  }
  if (s.creditsAvailable > 0) {
    return { discount: { cents: Math.min(REFERRAL_REWARD_CENTS, subtotalCents), code: REFERRAL_REWARD_CODE, label: "Referral reward" }, hint: "" };
  }
  return { discount: null, hint: "" };
}
