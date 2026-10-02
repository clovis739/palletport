import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getStore } from "@/lib/store";
import { LotCard } from "@/components/LotCard";
import { Photo } from "@/components/Photo";
import { PHOTOS, LOT_SIZE_PHOTOS } from "@/content/photos";
import { SiteImage } from "@/components/content/SiteImage";
import { HeroBackground } from "@/components/content/HeroBackground";
import { categoryImage, getVisibleCategories } from "@/lib/catalog";
import { CONDITIONS, LOT_SIZES } from "@/lib/format";
import { COLLECTIONS } from "@/lib/collections";
import { getPublishedGuides, getPublishedPosts } from "@/lib/content";
import { getSettings, homeSectionOrder, rebrandText, type HomeSectionKey } from "@/lib/settings";
import { resolveImageRef } from "@/lib/imageRef";
import { NextIcon } from "@/components/Icons";
import { SmartLink } from "@/components/NavDropdown";
import { CountUp } from "@/components/motion/CountUp";
import { MapPin } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { SiteFaq } from "@/components/content/SiteFaq";
import { GoogleReviews } from "@/components/content/GoogleReviews";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";

export const dynamic = "force-dynamic";

const HOME_TITLE = "PalletPort — Liquidation Pallets & Truckloads";

export async function generateMetadata() {
  const { seo, business } = await getSettings();
  return pageMetadata({
    title: rebrandText(HOME_TITLE, business.name),
    absoluteTitle: true,
    description: seo.defaultDescription || undefined,
    path: "/",
  });
}

const lotInclude = { category: true, seller: true } as const;
/** Lots per page in the paginated home sections ("Recently added" ?recent=, "Best value" ?value=). */
const HOME_PER_PAGE = 8;

/** Full-bleed sections carry their own padding; plain container sections share spacing with neighbours. */
const BANDS = new Set<HomeSectionKey>(["categories", "howItWorks"]);
const CARD_GROUP = new Set<HomeSectionKey>(["recentlySold", "aboutCard", "contactCard"]);
const STAT_COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

type Unit = { kind: "single"; key: HomeSectionKey } | { kind: "collections"; guides: boolean } | { kind: "cards"; keys: HomeSectionKey[] };
type UnitKind = "band" | "plain" | "cards" | "blog" | null;


function Head({ title, subtitle, link, h2 = "font-display text-2xl font-bold sm:text-3xl" }: { title: string; subtitle?: string; link?: ReactNode; h2?: string }) {
  if (!link && !subtitle) return <h2 className={`mb-6 ${h2}`}>{title}</h2>;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      {subtitle ? (
        <div>
          <h2 className={h2}>{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      ) : (
        <h2 className={h2}>{title}</h2>
      )}
      {link}
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ recent?: string; value?: string }> }) {
  const sp = await searchParams;
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [active, categories, store, recentlySold, settings, posts, guides] = await Promise.all([
    db.lot.findMany({ where: { status: "ACTIVE" }, include: lotInclude, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    getVisibleCategories(),
    getStore(),
    db.lot.findMany({ where: { status: "SOLD_OUT" }, include: lotInclude, orderBy: { createdAt: "desc" }, take: 4 }),
    getSettings(),
    getPublishedPosts(),
    getPublishedGuides(),
  ]);
  // This list already drives best value; reuse it to avoid six additional catalog queries.
  const inStock = active.length;
  const newThisWeek = active.filter(lot => lot.createdAt >= weekAgo).length;
  const retailValue = active.reduce((sum, lot) => sum + lot.msrpCents, 0);
  const home = settings.home;
  const sec = home.sections;
  // "Recently added": every in-stock lot, newest first, paginated with ?recent=.
  const recentPage = pageParam(sp.recent, pageCount(inStock, HOME_PER_PAGE));
  const recent = active.slice((recentPage - 1) * HOME_PER_PAGE, recentPage * HOME_PER_PAGE);
  // "Best value": in-stock lots priced lowest against their manifest retail (not the first page of new ones), paginated with ?value=.
  const newest = new Set(active.slice(0, HOME_PER_PAGE).map((l) => l.id));
  const valueAll = active.filter((l) => !newest.has(l.id)).sort((a, b) => a.priceCents / a.msrpCents - b.priceCents / b.msrpCents);
  const valuePage = pageParam(sp.value, pageCount(valueAll.length, HOME_PER_PAGE));
  const bestValue = valueAll.slice((valuePage - 1) * HOME_PER_PAGE, valuePage * HOME_PER_PAGE);
  // Each section's pager keeps the other section's page.
  const keep = { recent: recentPage > 1 ? recentPage : undefined, value: valuePage > 1 ? valuePage : undefined };
  const sizeCount = (k: string) => active.filter(lot => lot.lotSize === k).length;

  const stats: [ReactNode, string][] = [];
  if (home.stats.liveAuctions) stats.push([<CountUp key="n" value={inStock} />, "lots in stock"]);
  if (home.stats.endingHour) stats.push([<CountUp key="n" value={newThisWeek} />, "new this week"]);
  if (home.stats.retailValue) stats.push([<CountUp key="n" value={retailValue} format="money" />, "retail value listed"]);
  if (home.stats.typicalPrice && home.stats.typicalPriceValue) stats.push([home.stats.typicalPriceValue, home.stats.typicalPriceLabel]);

  // Enabled sections in display order, grouped into layout units (collections + guides and the
  // recently-sold / about / contact cards share a row when they are next to each other).
  const keys = homeSectionOrder(home).filter((k) => sec[k].enabled);
  const units: Unit[] = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k === "collections") {
      const withGuides = keys[i + 1] === "guides";
      units.push({ kind: "collections", guides: withGuides });
      if (withGuides) i++;
    } else if (CARD_GROUP.has(k)) {
      const run: HomeSectionKey[] = [k];
      while (i + 1 < keys.length && CARD_GROUP.has(keys[i + 1])) run.push(keys[++i]);
      units.push({ kind: "cards", keys: run });
    } else units.push({ kind: "single", key: k });
  }
  const kindOf = (u: Unit | undefined): UnitKind => (!u ? null : u.kind === "cards" ? "cards" : u.kind === "single" && BANDS.has(u.key) ? "band" : u.kind === "single" && u.key === "blog" ? "blog" : "plain");
  /** Top padding for a plain section: its own when it follows a band (or opens the page), else the neighbour's bottom padding. */
  const top = (prev: UnitKind) => (prev === null || prev === "band" ? "pt-12" : "");

  const aboutCard = (
    <Link key="aboutCard" href="/about" className="group card block p-5 sm:p-6 transition">
      <p className="label">{sec.aboutCard.title}</p>
      <p className="font-display text-xl font-bold">{store.name}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin aria-hidden className="h-4 w-4" /> Warehouse in {store.location}</p>
      <p className="mt-3 text-sm text-ink/75">{sec.aboutCard.subtitle || store.bio}</p>
      <span className="mt-4 inline-flex items-center font-semibold text-signal-dark">About us<NextIcon /></span>
    </Link>
  );
  const contactCard = (
    <Link key="contactCard" href="/contact" className="group card block bg-sand p-5 sm:p-6 transition">
      <p className="font-display text-lg font-bold">{sec.contactCard.title}</p>
      {sec.contactCard.subtitle && <p className="mt-1 text-sm text-ink/70">{sec.contactCard.subtitle}</p>}
      <span className="mt-4 inline-flex items-center font-semibold text-signal-dark">Contact our team<NextIcon /></span>
    </Link>
  );
  const guideChips = (className: string) => (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold">{sec.guides.title}</span>
      {guides.map((g) => (
        <Link key={g.slug} href={`/guides/${g.slug}`} className="rounded-full bg-white px-3 py-1.5 text-sm">{g.title}</Link>
      ))}
      {sec.guides.subtitle && <span className="basis-full text-sm text-muted">{sec.guides.subtitle}</span>}
    </div>
  );

  function renderSingle(key: HomeSectionKey, prev: UnitKind, next: UnitKind): ReactNode {
    const s = sec[key];
    switch (key) {
      case "closingSoon":
        return (
          <section key={key} id="recently-added" className={`container-pp scroll-mt-24 pb-12 ${top(prev)}`}>
            <Head title={s.title} subtitle={s.subtitle} link={<Link href="/lots" className="text-sm font-semibold text-signal-dark hover:underline">See all new lots<NextIcon /></Link>} />
            {recent.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recent.map((l, i) => <LotCard key={l.id} lot={l} priority={recentPage === 1 && i < 2} />)}</div>
            ) : (
              <p className="card p-6 text-center text-muted">No lots in stock right now. New pallets are listed every week.</p>
            )}
            <Pager base="/" params={keep} param="recent" hash="recently-added" page={recentPage} perPage={HOME_PER_PAGE} total={inStock} className="mt-8" />
          </section>
        );
      case "lotSizes":
        return (
          <section key={key} className={`container-pp pb-12 ${top(prev)}`}>
            <Head title={s.title} subtitle={s.subtitle} />
            <div className="grid gap-4 md:grid-cols-3">
              {([["CASE", "/case-packs"], ["PALLET", "/pallets"], ["TRUCKLOAD", "/truckloads"]] as const).map(([k, href]) => (
                <Link key={k} href={href} className="group card flex items-center gap-4 overflow-hidden p-4 transition">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-32"><Photo photo={PHOTOS[LOT_SIZE_PHOTOS[k]]} width={128} ratio={4 / 3} sizes="128px" className="h-full w-full transition duration-300 group-hover:scale-105" /></div>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold group-hover:text-signal-dark sm:text-xl">{LOT_SIZES[k].plural}</p>
                    <p className="text-sm text-muted">{LOT_SIZES[k].note}</p>
                    <p className="mt-1 text-xs font-semibold">{sizeCount(k)} in stock<NextIcon /></p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      case "categories":
        return (
          <section key={key} >
            <div className="container-pp py-12">
              <Head title={s.title} subtitle={s.subtitle} link={<Link href="/categories" className="text-sm font-semibold text-signal-dark hover:underline">All categories<NextIcon /></Link>} />
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {categories.map((c) => (
                  <Link key={c.id} href={`/c/${c.slug}`} className="group card flex items-center gap-3 p-3 transition">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"><SiteImage src={categoryImage(c)} alt="" width={56} ratio={1} sizes="56px" className="h-full w-full transition duration-300 group-hover:scale-110" /></div>
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold">{c.name}</p>
                      <p className="text-xs text-muted">{c.lotCount} lots</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      case "buyNow":
        return (
          <section key={key} id="best-value" className={`container-pp scroll-mt-24 pb-12 ${top(prev)}`}>
            <Head title={s.title} subtitle={s.subtitle} link={<Link href="/lots?sort=value" className="text-sm font-semibold text-signal-dark hover:underline">More great value<NextIcon /></Link>} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{bestValue.map((l) => <LotCard key={l.id} lot={l} />)}</div>
            <Pager base="/" params={keep} param="value" hash="best-value" page={valuePage} perPage={HOME_PER_PAGE} total={valueAll.length} className="mt-8" />
          </section>
        );
      case "howItWorks":
        return (
          <section key={key} className="bg-ink text-white">
            <div className="container-pp grid grid-cols-1 gap-8 py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">{s.title}</h2>
                {s.subtitle && <p className="mt-3 text-white/70">{s.subtitle}</p>}
                {home.howItWorksCta.label && <SmartLink href={home.howItWorksCta.href} className="btn-primary mt-6">{home.howItWorksCta.label}</SmartLink>}
              </div>
              <ol className="grid gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-1 lg:grid-cols-3">
                {home.howItWorksSteps.map((step, i) => (
                  <li key={i} className="rounded-2xl bg-white/5 p-5">
                    <span className="font-display text-sm font-bold text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-white/65">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );
      case "conditions":
        return (
          <section key={key} id="conditions" className={`container-pp pb-12 ${top(prev)}`}>
            <Head title={s.title} subtitle={s.subtitle} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(CONDITIONS).map(([k, c]) => (
                <Link key={k} href={`/lots?condition=${k}`} className="card p-4 transition">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.tone}`}>{c.label}</span>
                  <p className="mt-3 text-sm text-ink/75">{c.note}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      case "guides":
        return (
          <section key={key} className={`container-pp pb-12 ${top(prev)}`}>
            {guideChips("")}
          </section>
        );
      case "blog":
        return (
          <section key={key} className={`container-pp ${prev === "cards" ? "pt-14" : top(prev)} ${next ? "pb-12" : ""}`}>
            <Head title={s.title} subtitle={s.subtitle} h2="font-display text-2xl font-bold" link={<Link href="/blog" className="text-sm font-semibold text-signal-dark hover:underline">Read the blog<NextIcon /></Link>} />
            <div className="grid gap-5 md:grid-cols-3">
              {posts.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="card p-5">
                  <p className="label">{p.category}</p>
                  <p className="font-display text-lg font-bold leading-snug">{p.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  }

  function renderUnit(u: Unit, i: number): ReactNode {
    const prev = kindOf(units[i - 1]);
    const next = kindOf(units[i + 1]);
    if (u.kind === "single") return renderSingle(u.key, prev, next);
    if (u.kind === "collections") {
      const s = sec.collections;
      return (
        <section key="collections" className={`container-pp pb-12 ${top(prev)}`}>
          <Head title={s.title} subtitle={s.subtitle} link={<Link href="/collections" className="text-sm font-semibold text-signal-dark hover:underline">All collections<NextIcon /></Link>} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.slice(0, 4).map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="rounded-2xl p-5 transition hover:-translate-y-0.5" style={{ background: `hsl(${c.hue} 45% 92%)` }}>
                <p className="font-display text-lg font-bold">{c.title}</p>
                <p className="text-sm text-ink/70">{c.tagline}</p>
              </Link>
            ))}
          </div>
          {u.guides && guideChips("mt-6")}
        </section>
      );
    }
    // Recently sold + about/contact cards.
    const sold = u.keys.includes("recentlySold");
    const cards = u.keys.filter((k) => k !== "recentlySold").map((k) => (k === "aboutCard" ? aboutCard : contactCard));
    const s = sec.recentlySold;
    const soldBlock = (
      <div className="min-w-0">
        {s.subtitle ? (
          <>
            <h2 className="mb-2 font-display text-2xl font-bold">{s.title}</h2>
            <p className="mb-6 text-sm text-muted">{s.subtitle}</p>
          </>
        ) : (
          <h2 className="mb-6 font-display text-2xl font-bold">{s.title}</h2>
        )}
        {recentlySold.length ? (
          <div className="grid gap-5 sm:grid-cols-2">{recentlySold.map((l) => <LotCard key={l.id} lot={l} />)}</div>
        ) : (
          <p className="card p-5 sm:p-6 text-sm text-muted">Sold-out lots will appear here.</p>
        )}
      </div>
    );
    const pad = `${top(prev)} ${next === "blog" || next === null ? "pb-6" : "pb-12"}`;
    if (sold && cards.length)
      return (
        <section key="cards" className={`container-pp grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] ${pad}`}>
          {soldBlock}
          <aside className="min-w-0 space-y-6">{cards}</aside>
        </section>
      );
    if (sold) return <section key="cards" className={`container-pp ${pad}`}>{soldBlock}</section>;
    return <section key="cards" className={`container-pp grid gap-6 md:grid-cols-2 ${pad}`}>{cards}</section>;
  }

  return (
    <>
      {/* Hero: search-first */}
      <section className="relative overflow-hidden bg-ink text-white">
        <HeroBackground refStr={home.heroPhoto} />
        {/* Hero gradient (left → right): solid navy behind the text, fading so the warehouse photo shows on the right. */}
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-signal-dark/40" />
        <div data-hero className="container-pp relative py-10 sm:py-14 md:py-20">
          {home.heroEyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{home.heroEyebrow}</p>}
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.1] sm:text-5xl sm:leading-[1.05] lg:text-6xl">{home.heroTitle}</h1>
          {home.heroSubtitle && <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">{home.heroSubtitle}</p>}
          <form action="/search" className="mt-6 flex max-w-2xl gap-2 rounded-full border-2 border-white bg-white p-1.5 transition-[box-shadow] focus-within:ring-4 focus-within:ring-signal/40 sm:mt-8">
            <input name="q" type="search" aria-label="Search lots" placeholder={home.heroSearchPlaceholder || "Search lots"} className="min-w-0 flex-1 rounded-full bg-transparent px-3 text-base text-ink outline-none sm:px-4" />
            <button className="btn-primary shrink-0 px-5 sm:px-6">Search</button>
          </form>
          {home.heroLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {home.heroLinks.map((l, i) => (
                <SmartLink key={`${l.href}-${i}`} href={l.href} className="rounded-full px-4 py-2 font-semibold hover:bg-white/10">{l.label}</SmartLink>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Live stats strip */}
      {home.stats.enabled && stats.length > 0 && (
        <section className="bg-white">
          <div className={`container-pp grid grid-cols-2 gap-y-4 py-4 text-center md:gap-y-0 ${STAT_COLS[stats.length]}`}>
            {stats.map(([n, l]) => (
              <div key={l} className="min-w-0 px-2">
                <p className="break-words font-display text-xl font-bold sm:text-2xl">{n}</p>
                <p className="text-xs text-muted">{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {units.map(renderUnit)}

      <GoogleReviews business={settings.business} />
      <SiteFaq page="home" />
    </>
  );
}
