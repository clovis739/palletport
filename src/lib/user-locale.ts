import "server-only";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/config";

/**
 * Each customer's language, so emails sent later (shipped, delivered, certificate…) use it too.
 * Stored as SiteSetting rows "pref.locale.<userId>" (only for Spanish; English is the default), which keeps the
 * database schema unchanged. Settings loaders skip the "pref." prefix.
 */
export const USER_PREF_PREFIX = "pref.";
const key = (userId: string) => `${USER_PREF_PREFIX}locale.${userId}`;

export async function getUserLocale(userId: string): Promise<Locale> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: key(userId) }, select: { value: true } });
    return row?.value === '"es"' ? "es" : "en";
  } catch {
    return "en";
  }
}

/** Remembers the language the customer is using right now (called on sign-up, sign-in and checkout). */
export async function rememberUserLocale(userId: string, locale: Locale) {
  try {
    if (locale === "es") {
      await db.siteSetting.upsert({ where: { key: key(userId) }, create: { key: key(userId), value: '"es"' }, update: { value: '"es"' } });
    } else {
      await db.siteSetting.deleteMany({ where: { key: key(userId) } });
    }
  } catch {
    /* preference is best-effort */
  }
}

/** Remembers the current request's language for this user. */
export async function rememberRequestLocale(userId: string) {
  const { getLocale } = await import("@/i18n/server");
  await rememberUserLocale(userId, await getLocale());
}
