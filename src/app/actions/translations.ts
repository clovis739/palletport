"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { TRANSLATIONS_KEY, getSavedTranslations } from "@/i18n/server";
import { ES } from "@/i18n/es";

export type TranslationsState = { error?: string; ok?: string; savedAt?: number } | undefined;

const MAX_ENTRIES = 5000;
const MAX_LEN = 4000;

/**
 * Saves the owner's Spanish text (Admin → Site settings → Translations). The form sends every English → Spanish
 * pair the owner changed or added; pairs equal to the built-in translation or left empty are dropped.
 */
export async function saveTranslations(_: TranslationsState, fd: FormData): Promise<TranslationsState> {
  const { user } = await requireStaff("site", "/dashboard/site/translations");
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("payload") ?? "{}"));
  } catch {
    return { error: "The form could not be read. Reload the page and try again." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "The form could not be read. Reload the page and try again." };

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const en = k.trim();
    const es = typeof v === "string" ? v.trim() : "";
    if (!en || !es) continue;
    if (en.length > MAX_LEN || es.length > MAX_LEN) return { error: `“${en.slice(0, 60)}…” is too long (max ${MAX_LEN} characters).` };
    if (ES[en] === es) continue; // same as the built-in translation
    out[en] = es;
  }
  if (Object.keys(out).length > MAX_ENTRIES) return { error: `Too many translations (max ${MAX_ENTRIES}).` };

  const before = await getSavedTranslations();
  const json = JSON.stringify(out);
  await db.siteSetting.upsert({
    where: { key: TRANSLATIONS_KEY },
    create: { key: TRANSLATIONS_KEY, value: json, updatedById: user?.id ?? null },
    update: { value: json, updatedById: user?.id ?? null },
  });
  const changed = new Set([...Object.keys(before), ...Object.keys(out)].filter((k) => before[k] !== out[k])).size;
  await logAudit(user, "site.translations.update", TRANSLATIONS_KEY, `${changed} translation${changed === 1 ? "" : "s"} changed`);
  revalidatePath("/", "layout");
  return { ok: "Translations saved", savedAt: Date.now() };
}
