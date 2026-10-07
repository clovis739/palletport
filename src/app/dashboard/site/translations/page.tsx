import { requireStaff } from "@/lib/auth";
import { getStoredSettings, rebrandText } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { getSavedTranslations } from "@/i18n/server";
import { ES } from "@/i18n/es";
import { ES_CATALOG } from "@/i18n/es-catalog";
import { ES_SHOP } from "@/i18n/es-shop";
import { ES_CHECKOUT } from "@/i18n/es-checkout";
import { ES_ACCOUNT } from "@/i18n/es-account";
import { ES_EMAIL } from "@/i18n/es-email";
import { ES_SITE } from "@/i18n/es-site";
import { ES_GUIDES } from "@/i18n/es-guides";
import { ES_CONTENT } from "@/i18n/es-content";
import { ES_PAGES } from "@/i18n/es-pages";
import { TranslationsForm, type TranslationRow } from "./TranslationsForm";

export const metadata = { title: "Translations" };

/** Settings fields that are links, ids, codes or contact details — never shown as text to translate. */
const SKIP_FIELDS = new Set([
  "href", "url", "id", "icon", "logo", "image", "images", "photo", "photos", "ogImage", "email", "emails", "phone", "phones", "whatsapp",
  "smartsuppKey", "gaMeasurementId", "googleVerification", "addressStreet", "addressCity", "addressRegion", "addressPostal", "country", "location", "storeLocation", "titleTemplate", "accent", "tone", "color", "hue", "mapEmbed", "mapUrl", "logoAccent", "heroBg", "slug", "key", "type",
]);

/** Every piece of text the owner wrote in Site settings (menus, homepage, about, FAQs, …). */
function settingsText(value: unknown, out: Set<string>, field = "") {
  if (typeof value === "string") {
    const s = value.trim();
    if (
      s.length >= 2 && s.length <= 4000 && /\p{L}{2}/u.test(s) &&
      !/^(https?:|\/|#|mailto:|tel:)/i.test(s) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && !SKIP_FIELDS.has(field)
    ) out.add(s);
    return;
  }
  if (Array.isArray(value)) return value.forEach((v) => settingsText(v, out, field));
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) if (!SKIP_FIELDS.has(k)) settingsText(v, out, k);
  }
}

export default async function TranslationsPage() {
  await requireStaff("site", "/dashboard/site/translations");
  const [stored, saved] = await Promise.all([getStoredSettings(), getSavedTranslations()]);
  const brand = stored.business.name;

  const groups: [string, Record<string, string>][] = [
    ["Catalogue", ES_CATALOG],
    ["Shopping", ES_SHOP],
    ["Cart & checkout", ES_CHECKOUT],
    ["Account & orders", ES_ACCOUNT],
    ["Emails", ES_EMAIL],
    ["Site settings text", ES_SITE],
    ["Information pages", ES_PAGES],
    ["Buyer's guides", ES_GUIDES],
    ["Help center & guides", ES_CONTENT],
  ];
  const groupOf = new Map<string, string>();
  for (const [g, dict] of groups) for (const k of Object.keys(dict)) if (!groupOf.has(k)) groupOf.set(k, g);

  const rows: TranslationRow[] = [];
  const seen = new Set<string>();
  // The owner's own text first: settings text that has no Spanish yet, then translations they added themselves.
  const own = new Set<string>();
  settingsText({ ...stored, business: { ...stored.business, name: "" } }, own);
  const builtInLabels = new Set(Object.keys(ES).map((k) => rebrandText(k, brand)));
  for (const text of own) {
    if (builtInLabels.has(text) || seen.has(text)) continue;
    seen.add(text);
    rows.push({ key: text, label: text, builtIn: "", saved: saved[text] ?? "", group: "Your site text" });
  }
  for (const [k, v] of Object.entries(saved)) {
    if (k in ES || seen.has(k)) continue;
    seen.add(k);
    rows.push({ key: k, label: k, builtIn: "", saved: v, group: "Your site text" });
  }
  for (const [k, v] of Object.entries(ES)) {
    rows.push({ key: k, label: rebrandText(k, brand), builtIn: rebrandText(v, brand), saved: saved[k] ?? "", group: groupOf.get(k) ?? "Site & menus" });
  }

  return (
    <>
      <PageHeader
        title="Translations"
        description="The Spanish version of the site (/es). Every built-in text already has a Spanish draft; change any of them here, and add Spanish for the text you wrote yourself in Site settings. Product titles and descriptions stay as you write them."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={
          <a href="/es" target="_blank" rel="noopener" className="btn-ghost py-2">
            View Spanish site
          </a>
        }
      />
      <TranslationsForm rows={rows} groups={["Your site text", "Site & menus", ...groups.map(([g]) => g)]} />
    </>
  );
}
