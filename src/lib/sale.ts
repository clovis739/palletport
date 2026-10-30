/**
 * Store-wide sale. While it runs, lots with a higher "original price" (Lot.compareAtPriceCents) show it struck
 * through, with a "% off" badge, and the Google feed sends price + sale_price + sale_price_effective_date.
 * After SALE_END everything switches off by itself: the listed price (Lot.priceCents) is simply the price.
 * To run another sale, change these dates.
 */
export const SALE_START = "2026-10-29T00:00:00-04:00";
/** Owner: the sale ends on January 2 (end of day, US Eastern). */
export const SALE_END = "2027-01-02T23:59:59-05:00";

export function saleActive(now = Date.now()): boolean {
  return now >= Date.parse(SALE_START) && now <= Date.parse(SALE_END);
}

/** The struck-through "original price" to show, or 0 when there is none or the sale has ended. */
export function compareAtPrice(lot: { priceCents: number; compareAtPriceCents?: number | null }, now = Date.now()): number {
  const c = lot.compareAtPriceCents ?? 0;
  return saleActive(now) && c > lot.priceCents ? c : 0;
}
