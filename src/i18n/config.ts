/**
 * Languages. English is the default and lives at the normal URLs; Spanish lives under /es (e.g. /es/lots).
 * The middleware strips /es, renders the same page with the x-locale header, and remembers the choice in a cookie.
 * Pure module (safe in client and server code).
 */
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "pp_locale";
export const LOCALE_HEADER = "x-locale";
export const LOCALE_LABEL: Record<Locale, string> = { en: "English", es: "Español" };
export const LOCALE_SHORT: Record<Locale, string> = { en: "EN", es: "ES" };
/** BCP-47 tags for <html lang>, hreflang and Open Graph. */
export const LOCALE_TAG: Record<Locale, string> = { en: "en-US", es: "es-US" };

export const isLocale = (v: unknown): v is Locale => v === "en" || v === "es";

/** "/es/lots" → "/lots"; "/es" → "/". Leaves English paths alone. */
export function stripLocale(path: string): string {
  if (path === "/es") return "/";
  if (path.startsWith("/es/")) return path.slice(3);
  if (path.startsWith("/es?") || path.startsWith("/es#")) return `/${path.slice(3)}`;
  return path;
}

/** Paths that are never localized: admin, APIs, feeds, files. */
export function isLocalizablePath(path: string): boolean {
  const p = path.split(/[?#]/)[0];
  if (/^\/(dashboard|api|_next|media|__)/.test(p)) return false;
  if (/^\/(sitemap\.xml|robots\.txt|merchant-feed\.xml|llms\.txt|manifest\.webmanifest|opengraph-image|logo\.png|icon\.svg|favicon\.ico)/.test(p)) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(p)) return false;
  return true;
}

/** Internal link for a locale: ("/lots", "es") → "/es/lots". External links, anchors and admin paths are returned unchanged. */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const clean = stripLocale(href);
  if (locale === "en" || !isLocalizablePath(clean)) return clean;
  return clean === "/" ? "/es" : clean.startsWith("/?") || clean.startsWith("/#") ? `/es${clean.slice(1)}` : `/es${clean}`;
}

/** Replaces {name} placeholders. */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type Dictionary = Record<string, string>;
export type TFunction = (text: string, vars?: Record<string, string | number>) => string;

/** Translation function for a dictionary: unknown strings fall back to the English text. */
export function makeT(dict: Dictionary | null): TFunction {
  return (text, vars) => interpolate((dict && dict[text]) || text, vars);
}

/** Translates every string inside a value that has a translation (used for admin-edited settings text). */
export function translateDeep<T>(value: T, dict: Dictionary | null): T {
  if (!dict) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return dict[v] ?? dict[v.trim()] ?? v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, k === "href" || k === "url" || k === "id" ? x : walk(x)]));
    }
    return v;
  };
  return walk(value) as T;
}

/** Messages built with numbers or names inside them (shipping notes, promo and referral messages). */
const DYNAMIC: [RegExp, string, string[]][] = [
  [/^Spend at least (\$[\d,.]+) to use that code$/, "Spend at least {amount} to use that code", ["amount"]],
  [/^Add (\$[\d,.]+) more to get your \$100 referral welcome discount \(orders of \$1,000\+\)\.$/, "Add {amount} more to get your $100 referral welcome discount (orders of $1,000+).", ["amount"]],
  [/^Promo (.+)$/, "Promo {code}", ["code"]],
  [/^Enter: (.+)$/, "Enter: {field}", ["field"]],
  [/^Visits must be booked at least (\d+) hours ahead$/, "Visits must be booked at least {n} hours ahead", ["n"]],
  [/^Visits can be booked up to (\d+) days ahead$/, "Visits can be booked up to {n} days ahead", ["n"]],
  [/^Only (\d+) of this lot (?:is|are) in stock$/, "Only {n} of this lot in stock", ["n"]],
  [/^Only (\d+) in stock\.$/, "Only {n} in stock.", ["n"]],
  [/^Too many attempts\. Please wait (\d+) seconds and try again\.$/, "Too many attempts. Please wait {n} seconds and try again.", ["n"]],
  [/^Too many attempts\. Please wait (\d+) minutes and try again\.$/, "Too many attempts. Please wait {n} minutes and try again.", ["n"]],
  [/^"(.+)" is no longer available in that quantity$/, "\"{title}\" is no longer available in that quantity", ["title"]],
  [/^(.+) has a (\$[\d,.]+) minimum order$/, "{name} has a {amount} minimum order", ["name", "amount"]],
];

export function translateMessage(text: string, t: TFunction): string {
  if (!text) return text;
  for (const [re, key, names] of DYNAMIC) {
    const m = text.match(re);
    if (m) return t(key, Object.fromEntries(names.map((n, i) => [n, m[i + 1]])));
  }
  return translateShipNote(text, t);
}

/** Shipping notes from lib/shipping (one of them carries the warehouse and load size). */
export function translateShipNote(note: string, t: TFunction): string {
  const m = note.match(/^Pickup by appointment at our warehouse in (.+)\. We'll email you to book a time; bring a truck or trailer sized for (\d+) (pallet|case)s?\.$/);
  if (!m) return t(note);
  const n = Number(m[2]);
  const unit = t(m[3] === "pallet" ? (n === 1 ? "pallet" : "pallets") : n === 1 ? "case" : "cases");
  return t("Pickup by appointment at our warehouse in {place}. We'll email you to book a time; bring a truck or trailer sized for {n} {unit}.", { place: m[1], n, unit });
}
