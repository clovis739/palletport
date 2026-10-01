import Link from "next/link";
import { AlertTriangle, HardDrive, Images } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs } from "@/components/admin/Tabs";
import { formatBytes, normalizeQuery } from "@/components/admin/media/types";
import { lotPhotos, queryMedia, storageSummary } from "./_lib/media-data";
import { MediaLibrary } from "./MediaLibrary";
import { StockPhotos, stockPhotoCount } from "./StockPhotos";
import { LotPhotos } from "./LotPhotos";

export const metadata = { title: "Media library" };

type SP = { tab?: string; q?: string; type?: string; alt?: string; sort?: string };

export default async function MediaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { user } = await requireStaff("media", "/dashboard/media");
  const tab = sp.tab === "stock" || sp.tab === "lots" ? sp.tab : "library";
  const summary = await storageSummary();

  const tabs = [
    { value: "library", label: "Library", href: "/dashboard/media", count: summary.count },
    { value: "stock", label: "Stock photos", href: "/dashboard/media?tab=stock", count: stockPhotoCount() },
    { value: "lots", label: "Lot photos", href: "/dashboard/media?tab=lots" },
  ];

  return (
    <>
      <PageHeader title="Media library" description="Images for pages, posts and site settings. Upload once, use anywhere." />
      <Tabs items={tabs} current={tab} label="Media sections" className="mb-5" />

      {tab === "library" && <LibraryTab sp={sp} summary={summary} />}
      {tab === "stock" && <StockPhotos />}
      {tab === "lots" && <LotPhotos lots={await lotPhotos()} canEditLots={can(user.role, "lots")} />}
    </>
  );
}

async function LibraryTab({ sp, summary }: { sp: SP; summary: Awaited<ReturnType<typeof storageSummary>> }) {
  const query = normalizeQuery({ q: sp.q, type: sp.type, missingAlt: sp.alt === "missing", sort: sp.sort });
  const initial = await queryMedia(query);
  return (
    <div className="space-y-5">
      <section aria-label="Storage summary" className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Images} label="Images" value={summary.count.toLocaleString("en-US")} hint={summary.byType.map((t) => `${t.count} ${t.ext}`).join(" · ") || "Nothing uploaded yet"} />
        <Stat icon={HardDrive} label="Storage used" value={formatBytes(summary.bytes)} hint={summary.count ? `Avg ${formatBytes(Math.round(summary.bytes / summary.count))} per image` : "uploads/media"} />
        <Stat
          icon={AlertTriangle}
          label="Missing alt text"
          value={summary.missingAlt.toLocaleString("en-US")}
          hint={summary.missingAlt ? "Add descriptions for accessibility and SEO" : "All images described"}
          tone={summary.missingAlt ? "warn" : "ok"}
          href={summary.missingAlt ? "/dashboard/media?alt=missing" : undefined}
        />
      </section>
      <MediaLibrary initial={initial} query={query} />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  href,
}: {
  icon: typeof Images;
  label: string;
  value: string;
  hint: string;
  tone?: "warn" | "ok";
  href?: string;
}) {
  const body = (
    <>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone === "warn" ? "bg-amber-100 text-amber-800" : tone === "ok" ? "bg-moss/10 text-moss" : "bg-sand text-ink/70"}`}>
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        <span className="block font-display text-xl font-bold">{value}</span>
        <span className="block truncate text-xs text-muted">{hint}</span>
      </span>
    </>
  );
  const cls = "flex min-w-0 items-center gap-3 rounded-2xl bg-white p-4";
  return href ? (
    <Link href={href} className={`${cls} focus-visible:outline-2 focus-visible:outline-signal`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
