import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { cachedPublic } from "@/lib/public-cache";
import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale, localizeHref, makeT, type Dictionary, type Locale, type TFunction } from "./config";
import { ES } from "./es";
import { ES_EMAIL } from "./es-email";

/** Saved Spanish translations from Admin → Site settings → Translations (key "i18n.es"): English text → Spanish. */
export const TRANSLATIONS_KEY = "i18n.es";

/** The current request's language (set by the middleware for /es URLs). Outside a request: English. */
export const getLocale = cache(async (): Promise<Locale> => {
  try {
    const v = (await headers()).get(LOCALE_HEADER);
    return isLocale(v) ? v : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
});

/** Owner-edited translations stored in the database (override the built-in ones). */
export const getSavedTranslations = cache(async (): Promise<Dictionary> => {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: TRANSLATIONS_KEY }, select: { value: true } });
    if (!row) return {};
    const v = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
    return v && typeof v === "object" ? (v as Dictionary) : {};
  } catch {
    return {};
  }
});

const getPublicTranslations = cachedPublic(async () => {
  const row = await db.siteSetting.findUnique({ where: { key: TRANSLATIONS_KEY }, select: { value: true } });
  const value = row ? JSON.parse(row.value) : {};
  return value && typeof value === "object" ? value as Dictionary : {};
}, "spanish-translations");

/** Spanish dictionary: built-in translations + the owner's own (owner wins). */
export const getSpanishDictionary = cache(async (): Promise<Dictionary> => {
  const saved = await getPublicTranslations().catch(() => ({} as Dictionary));
  const clean = Object.fromEntries(Object.entries(saved).filter(([, v]) => typeof v === "string" && v.trim()));
  const merged: Dictionary = { ...ES, ...clean };
  // Follow a business rename: "About PalletPort" → "About <new name>" in both the English key and the Spanish text.
  try {
    const { getPublicStoredSettings, rebrandText } = await import("@/lib/settings");
    const brand = (await getPublicStoredSettings()).business.name;
    return Object.fromEntries(Object.entries(merged).map(([k, v]) => [rebrandText(k, brand), rebrandText(v, brand)]));
  } catch {
    return merged;
  }
});

/** Dictionary for the current request (null in English). */
export const getDictionary = cache(async (): Promise<Dictionary | null> => ((await getLocale()) === "es" ? getSpanishDictionary() : null));

/** t("English text", { vars }) for server components, plus lh("/path") for locale-aware links. */
export const getI18n = cache(async (): Promise<{ locale: Locale; t: TFunction; lh: (href: string) => string }> => {
  const locale = await getLocale();
  const dict = await getDictionary();
  return { locale, t: makeT(dict), lh: (href: string) => localizeHref(href, locale) };
});

/** The dictionary sent to the browser: email-only text is left out to keep pages light. */
export const getClientDictionary = cache(async (): Promise<Dictionary | null> => {
  const dict = await getDictionary();
  if (!dict) return null;
  const emailOnly = new Set(Object.keys(ES_EMAIL).filter((k) => !(k in CLIENT_SHARED)));
  return Object.fromEntries(Object.entries(dict).filter(([k]) => !emailOnly.has(k)));
});
/** Email keys that pages use too. */
const CLIENT_SHARED: Record<string, true> = { "Order": true, "Order total": true, "Items": true, "Shipping": true, "Discount": true, "Yes": true, "No": true, "Status": true, "Delivered": true, "Shipped": true, "Cancelled": true, "Available": true, "Not available": true };

/** t() for a given language outside the current request (e.g. emails to a customer who uses Spanish). */
export async function getTFor(locale: Locale): Promise<TFunction> {
  return makeT(locale === "es" ? await getSpanishDictionary() : null);
}

export async function getT(): Promise<TFunction> {
  return (await getI18n()).t;
}
