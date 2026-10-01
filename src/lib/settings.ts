import "server-only";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { logAudit, type AuditActor } from "./audit";
import {
  DEFAULTS,
  SETTINGS_KEYS,
  SETTINGS_SCHEMAS,
  deepMerge,
  isSettingsKey,
  type DeepPartial,
  type SettingsKey,
  type SettingsMap,
} from "./settings-schema";

export * from "./settings-schema";

/**
 * Settings as stored: each DB row deep-merged over DEFAULTS and validated. Invalid JSON or a value that
 * no longer matches its schema falls back to DEFAULTS for that key. No env fallbacks — use this to fill
 * admin forms so owners see exactly what they saved.
 */
export const getStoredSettings = cache(async (): Promise<SettingsMap> => {
  const out: SettingsMap = structuredClone(DEFAULTS);
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await db.siteSetting.findMany({ select: { key: true, value: true } });
  } catch {
    return out; // table not created yet (before `prisma db push`) — defaults keep the site working
  }
  for (const row of rows) {
    if (!isSettingsKey(row.key)) continue;
    setKey(out, row.key, row.value);
  }
  return out;
});

function setKey<K extends SettingsKey>(out: SettingsMap, key: K, raw: string) {
  try {
    const merged = deepMerge(DEFAULTS[key], JSON.parse(raw));
    const parsed = SETTINGS_SCHEMAS[key].safeParse(merged);
    if (parsed.success) out[key] = upgrade(key, parsed.data as SettingsMap[K]);
    else if (process.env.NODE_ENV !== "production") console.warn(`[settings] "${key}" failed validation, using defaults`, parsed.error.issues[0]);
  } catch {
    /* invalid JSON → defaults */
  }
}

/** Saved text that still holds an old default is shown with the current default (the owner never changed it). */
function upgrade<K extends SettingsKey>(key: K, value: SettingsMap[K]): SettingsMap[K] {
  if (key === "home") {
    const s = (value as SettingsMap["home"]).sections.closingSoon;
    const d = DEFAULTS.home.sections.closingSoon;
    if (s.title === "Featured lots") s.title = d.title;
    if (s.subtitle === "Hand-picked lots in stock now.") s.subtitle = d.subtitle;
  }
  return value;
}

const env = (name: string) => process.env[name]?.trim() || "";

/**
 * Effective settings for rendering the site: stored settings with the STORE_* env vars filling any empty
 * business contact fields (STORE_NAME, STORE_EMAIL, STORE_PHONE, STORE_STREET, STORE_POSTAL, STORE_COUNTRY).
 * Cached per request.
 */
export const getSettings = cache(async (): Promise<SettingsMap> => {
  const s = structuredClone(await getStoredSettings());
  const b = s.business;
  if (!b.email) b.email = env("STORE_EMAIL");
  if (!b.phone) b.phone = env("STORE_PHONE");
  if (!b.addressStreet) b.addressStreet = env("STORE_STREET");
  if (!b.addressPostal) b.addressPostal = env("STORE_POSTAL");
  if (!b.country) b.country = env("STORE_COUNTRY");
  if (env("STORE_NAME") && b.name === DEFAULTS.business.name) b.name = env("STORE_NAME");
  return s;
});

/** One settings group, e.g. `const home = await getSetting("home")`. */
export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsMap[K]> {
  return (await getSettings())[key];
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Validates and stores a whole settings group, logs it to the activity log and revalidates every page.
 * Callers must check permissions first (`requireStaff("site")`).
 */
export async function saveSetting<K extends SettingsKey>(key: K, value: SettingsMap[K], user: AuditActor): Promise<SaveResult> {
  const parsed = SETTINGS_SCHEMAS[key].safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.path.length ? `${issue.path.join(" › ")}: ${issue.message}` : issue.message };
  }
  const json = JSON.stringify(parsed.data);
  await db.siteSetting.upsert({
    where: { key },
    create: { key, value: json, updatedById: user?.id ?? null },
    update: { value: json, updatedById: user?.id ?? null },
  });
  await logAudit(user, "settings.save", key);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Merges a partial update over the currently stored value, then saves it (validated). */
export async function patchSetting<K extends SettingsKey>(key: K, patch: DeepPartial<SettingsMap[K]>, user: AuditActor): Promise<SaveResult> {
  const current = (await getStoredSettings())[key];
  return saveSetting(key, deepMerge(current, patch), user);
}

/** Restores a group to DEFAULTS by deleting its row. */
export async function resetSetting(key: SettingsKey, user: AuditActor) {
  await db.siteSetting.deleteMany({ where: { key } });
  await logAudit(user, "settings.reset", key);
  revalidatePath("/", "layout");
}

/** Writes DEFAULTS rows for any missing keys (used by the seed). Never overwrites. */
export async function ensureDefaultSettings() {
  for (const key of SETTINGS_KEYS) {
    const exists = await db.siteSetting.findUnique({ where: { key }, select: { key: true } });
    if (!exists) await db.siteSetting.create({ data: { key, value: JSON.stringify(DEFAULTS[key]) } });
  }
}
