import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULTS, getStoredSettings, type SettingsKey } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/Badge";
import { SITE_AREAS, ResetAreaButton } from "./_components/areas";

export const metadata = { title: "Site settings" };

function ago(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function SiteSettingsHub() {
  await requireStaff("site", "/dashboard/site");
  const [stored, rows] = await Promise.all([
    getStoredSettings(),
    db.siteSetting.findMany({ where: { NOT: { key: { startsWith: "pref." } } }, select: { key: true, updatedAt: true } }).catch(() => [] as { key: string; updatedAt: Date }[]),
  ]);
  const updated = new Map(rows.map((r) => [r.key, r.updatedAt]));
  const customized = (k: SettingsKey) => JSON.stringify(stored[k]) !== JSON.stringify(DEFAULTS[k]);

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Everything customers see around your lots: contact details, menus, the announcement bar, the homepage, the About page and search defaults. Changes go live as soon as you save."
        actions={
          <Link href="/" target="_blank" rel="noopener" className="btn-ghost py-2">
            <ExternalLink aria-hidden className="h-4 w-4" /> View site
          </Link>
        }
      />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SITE_AREAS.map((a) => {
          const custom = customized(a.key);
          const at = updated.get(a.key);
          return (
            <li key={a.key} className="flex min-w-0 flex-col rounded-2xl bg-white transition-colors">
              <Link href={a.href} className="group flex flex-1 flex-col gap-3 rounded-t-2xl p-4 focus-visible:outline-2 focus-visible:outline-signal sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sand text-ink transition-colors group-hover:bg-signal group-hover:text-white">
                    <a.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <Badge tone={custom ? "moss" : "muted"}>{custom ? "Customized" : "Default"}</Badge>
                </div>
                <div className="min-w-0">
                  <h2 className="flex items-center gap-1 font-display text-base font-bold">
                    {a.title}
                    <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </h2>
                  <p className="mt-1 text-sm text-muted">{a.description}</p>
                </div>
              </Link>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-muted sm:px-5">
                <span>{custom && at ? `Updated ${ago(at)}` : "Using the built-in defaults"}</span>
                {custom && <ResetAreaButton area={a.key} label="Reset" />}
              </div>
            </li>
          );
        })}
      </ul>
      <Link href="/dashboard/site/translations" className="group mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 sm:p-5">
        <span className="min-w-0">
          <span className="flex items-center gap-1 font-display text-base font-bold">Translations (Español)<ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" /></span>
          <span className="mt-1 block text-sm text-muted">The Spanish version of the site at /es: review the Spanish text and add Spanish for the text you wrote yourself.</span>
        </span>
      </Link>
      <p className="mt-6 text-sm text-muted">
        Store checkout options (minimum order, warehouse pickup at checkout, store bio) live in{" "}
        <Link href="/dashboard/settings" className="font-semibold text-signal-dark hover:underline">Store settings</Link>.
      </p>
    </>
  );
}
