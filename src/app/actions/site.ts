"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { logAudit, type AuditActor } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  aboutSchema,
  announcementSchema,
  businessSchema,
  faqsSchema,
  getStoredSettings,
  homeSchema,
  isSettingsKey,
  navigationSchema,
  resetSetting,
  saveSetting,
  seoSchema,
  type SettingsKey,
  type SettingsMap,
} from "@/lib/settings";
import { withFlash } from "@/components/admin/flashUrl";

/**
 * Site settings actions (owner only — perm "site"). Each editor form posts its whole settings group as JSON
 * in a hidden `payload` field; we validate with the group's zod schema (plus stricter checks below), save with
 * saveSetting() (which stores, logs "settings.save" and revalidates every page) and log "site.<area>.update".
 */

export type SiteFormState =
  | { error?: string; ok?: string; fieldErrors?: Record<string, string>; savedAt?: number }
  | undefined;

const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;
const phone = (msg = "Enter a valid phone number (digits, spaces, + ( ) - only)") =>
  z.string().trim().refine((v) => v === "" || (PHONE_RE.test(v) && (v.match(/\d/g)?.length ?? 0) >= 7), msg);
const httpsUrl = z.string().trim().refine((v) => /^https:\/\/[^\s/]+\.[^\s]+$/i.test(v), "Use a full https:// link");

const businessForm = businessSchema.extend({
  phone: phone(),
  whatsapp: phone("Enter the WhatsApp number with country code, e.g. +1 614 555 0100").optional(),
  socialLinks: z.array(z.object({ label: z.string().trim().min(1, "Every link needs a label").max(40), href: httpsUrl })).max(12, "Up to 12 social links"),
  /** Written to the store record (commerce uses it) — e.g. "Columbus, OH". */
  storeLocation: z.string().trim().min(2, "Enter the warehouse location, e.g. Columbus, OH").max(80),
});

const announcementForm = announcementSchema.superRefine((a, ctx) => {
  if (a.enabled && !a.text) ctx.addIssue({ code: "custom", path: ["text"], message: "Enter the announcement text (or turn the bar off)" });
  if (a.href && !a.linkLabel) ctx.addIssue({ code: "custom", path: ["linkLabel"], message: "Add a label for the link" });
  if (a.text.length > 160) ctx.addIssue({ code: "custom", path: ["text"], message: "Keep it under 160 characters" });
});

const seoForm = seoSchema.superRefine((s, ctx) => {
  if (s.defaultTitle.length > 70) ctx.addIssue({ code: "custom", path: ["defaultTitle"], message: "Keep the title under 70 characters" });
  if (s.defaultDescription.length > 200) ctx.addIssue({ code: "custom", path: ["defaultDescription"], message: "Keep the description under 200 characters" });
});

const AREA_PATHS: Record<SettingsKey, string> = {
  business: "/dashboard/site/business",
  navigation: "/dashboard/site/navigation",
  announcement: "/dashboard/site/announcement",
  home: "/dashboard/site/homepage",
  about: "/dashboard/site/about",
  faqs: "/dashboard/site/faqs",
  seo: "/dashboard/site/seo",
};

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const key = i.path.join(".") || "_";
    if (!(key in out)) out[key] = i.message;
  }
  return out;
}

function readPayload(fd: FormData): unknown {
  const raw = fd.get("payload");
  if (typeof raw !== "string" || raw.length > 200_000) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function invalid(error: z.ZodError): SiteFormState {
  const errs = fieldErrors(error);
  const n = Object.keys(errs).length;
  return { error: n === 1 ? `Check the highlighted field: ${Object.values(errs)[0]}` : `Check the ${n} highlighted fields.`, fieldErrors: errs };
}

/** Top-level keys whose value changed (for the activity log detail). */
function changedKeys(before: object, after: object) {
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  return Object.keys({ ...b, ...a }).filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]));
}

async function store<K extends SettingsKey>(key: K, value: SettingsMap[K], user: AuditActor, okText: string): Promise<SiteFormState> {
  const before = (await getStoredSettings())[key];
  const r = await saveSetting(key, value, user);
  if (!r.ok) return { error: r.error };
  const changed = changedKeys(before, value);
  await logAudit(user, `site.${key}.update`, key, changed.length ? `Changed: ${changed.join(", ")}` : "No changes");
  return { ok: okText, savedAt: Date.now() };
}

export async function saveBusiness(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user, seller } = await requireStaff("site", AREA_PATHS.business);
  const parsed = businessForm.safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  const { storeLocation, ...business } = parsed.data;
  const res = await store("business", business, user, "Business profile saved");
  if (res?.error) return res;
  if (seller.name !== business.name || seller.location !== storeLocation) {
    await db.seller.update({ where: { id: seller.id }, data: { name: business.name, location: storeLocation } });
    await logAudit(user, "store.update", business.name, `name, location → ${storeLocation}`);
    revalidatePath("/", "layout");
  }
  return res;
}

export async function saveNavigation(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user } = await requireStaff("site", AREA_PATHS.navigation);
  const parsed = navigationSchema
    .superRefine((n, ctx) => {
      if (n.header.length > 16) ctx.addIssue({ code: "custom", path: ["header"], message: "Up to 16 header links" });
      n.header.forEach((h, i) => {
        if ((h.children?.length ?? 0) > 12) ctx.addIssue({ code: "custom", path: ["header", i, "children"], message: "Up to 12 dropdown links" });
      });
      if (n.footerColumns.length > 5) ctx.addIssue({ code: "custom", path: ["footerColumns"], message: "Up to 5 footer columns" });
      if (n.footerBlurb.length > 400) ctx.addIssue({ code: "custom", path: ["footerBlurb"], message: "Keep the blurb under 400 characters" });
    })
    .safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  const nav = parsed.data;
  // Drop empty dropdowns so the header renders a plain link.
  nav.header = nav.header.map(({ children, ...h }) => (children?.length ? { ...h, children } : h));
  return store("navigation", nav, user, "Navigation saved");
}

export async function saveAnnouncement(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user } = await requireStaff("site", AREA_PATHS.announcement);
  const parsed = announcementForm.safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  return store("announcement", parsed.data, user, "Announcement bar saved");
}

export async function saveHome(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user } = await requireStaff("site", AREA_PATHS.home);
  const parsed = homeSchema.safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  return store("home", parsed.data, user, "Homepage saved");
}

export async function saveAbout(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user } = await requireStaff("site", AREA_PATHS.about);
  const parsed = aboutSchema.safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  const about = { ...parsed.data, heroPhotos: parsed.data.heroPhotos.filter(Boolean), mission: { ...parsed.data.mission, paragraphs: parsed.data.mission.paragraphs.filter(Boolean) } };
  return store("about", about, user, "About page saved");
}

export async function saveFaqs(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user } = await requireStaff("site", AREA_PATHS.faqs);
  const parsed = faqsSchema.safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  return store("faqs", parsed.data, user, "FAQs saved");
}

export async function saveSeo(_: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { user } = await requireStaff("site", AREA_PATHS.seo);
  const parsed = seoForm.safeParse(readPayload(fd));
  if (!parsed.success) return invalid(parsed.error);
  return store("seo", parsed.data, user, "SEO defaults saved");
}

/** Resets one settings area to DEFAULTS (form field `area`). Business reset leaves the store name/location alone. */
export async function resetArea(fd: FormData): Promise<void> {
  const { user } = await requireStaff("site", "/dashboard/site");
  const area = String(fd.get("area") ?? "");
  const back = String(fd.get("back") ?? "") === "area" && isSettingsKey(area) ? AREA_PATHS[area] : "/dashboard/site";
  if (!isSettingsKey(area)) redirect(withFlash("/dashboard/site", "Unknown settings area", "error"));
  await resetSetting(area, user);
  await logAudit(user, `site.${area}.reset`, area);
  redirect(withFlash(back, "Restored the default settings"));
}
