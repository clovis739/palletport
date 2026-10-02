/**
 * Google Analytics 4 helpers (safe to import from client components).
 * The tag itself is loaded by <GoogleAnalytics /> in the root layout, only when a Measurement ID is set
 * (Admin → Site → SEO, or NEXT_PUBLIC_GA_MEASUREMENT_ID) and never for signed-in staff.
 */

export const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

/** The Measurement ID to use, or null when analytics is off. Settings win over the env var. */
export function gaMeasurementId(fromSettings?: string | null): string | null {
  const id = (fromSettings || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim().toUpperCase();
  return GA_ID_PATTERN.test(id) ? id : null;
}

export type GaItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_category2?: string;
};

export type GaParams = Record<string, unknown> & { currency?: "USD"; value?: number; items?: GaItem[] };

/** Cents → dollars with 2 decimals, as GA expects. */
export const gaMoney = (cents: number) => Math.round(cents) / 100;

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/** Sends a GA4 event. A no-op when analytics isn't loaded (no ID, staff, or the visitor opted out). */
export function gaEvent(name: string, params: GaParams = {}) {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  if (typeof w.gtag !== "function") return;
  w.gtag("event", name, params);
}
