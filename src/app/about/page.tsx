import Link from "next/link";
import { BadgeCheck, Boxes, DollarSign, FileText, Leaf, MessageCircle, Package, Receipt, ShieldCheck, ShoppingCart, Star, Store, Tags, TrendingUp, Truck, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getStore } from "@/lib/store";
import { money } from "@/lib/format";
import { getPublishedGuides } from "@/lib/content";
import { getSetting, fillTokens } from "@/lib/settings";
import { Photo } from "@/components/Photo";
import { SiteImage } from "@/components/content/SiteImage";
import { HeroBackground } from "@/components/content/HeroBackground";
import { GUIDE_PHOTOS, photoFor } from "@/content/photos";
import { NextIcon } from "@/components/Icons";
import { SmartLink } from "@/components/NavDropdown";
import { JsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { SiteFaq } from "@/components/content/SiteFaq";
import { GoogleReviews } from "@/components/content/GoogleReviews";

export const generateMetadata = () => pageMetadata({
  title: "About our Columbus-area liquidation warehouse",
  description:
    "PalletPort sells manifested liquidation lots direct from our own warehouse — returns, shelf pulls and overstock by the case, pallet or truckload.",
  path: "/about",
});
export const dynamic = "force-dynamic";

function Arrow() {
  return <NextIcon />;
}

/** Icons stay with each card slot (cycled when the owner adds more cards in Admin → Site → About page). */
const TRANSPARENT_ICONS = [FileText, Tags, Truck, ShieldCheck];
const ADVANTAGE_ICONS = [BadgeCheck, Receipt, TrendingUp];
const THANKS_ICONS = [ShoppingCart, Store, MessageCircle];

export default async function About() {
  const [store, about, guides, buyers, lotsListed, soldLots, retail, units, reviews, avgRating] = await Promise.all([
    getStore(),
    getSetting("about"),
    getPublishedGuides(),
    db.user.count({ where: { role: "BUYER" } }),
    db.lot.count(),
    db.lot.count({ where: { status: "SOLD_OUT" } }),
    db.lot.aggregate({ _sum: { msrpCents: true } }),
    db.lot.aggregate({ _sum: { units: true } }),
    db.review.count(),
    db.review.aggregate({ _avg: { rating: true } }),
  ]);

  const stats: { n: string; label: string; href: string; icon: LucideIcon }[] = [
    { n: lotsListed.toLocaleString(), label: "lots listed", href: "/search", icon: Boxes },
    { n: money(retail._sum.msrpCents ?? 0), label: "retail value listed", href: "/lots?sort=retail", icon: DollarSign },
    { n: (units._sum.units ?? 0).toLocaleString(), label: "units on manifests", href: "/lots?sort=units", icon: Package },
    { n: soldLots.toLocaleString(), label: "lots sold", href: "/lots?sold=1", icon: ShoppingCart },
    { n: buyers.toLocaleString(), label: "registered business buyers", href: "/register", icon: Store },
    { n: reviews ? (avgRating._avg.rating ?? 0).toFixed(1) : `${buyers.toLocaleString()}`, label: reviews ? `average star rating from ${reviews} customer reviews` : "registered buyers", href: "/search", icon: Star },
  ];

  const audiences = guides.map((g) => ({ href: `/guides/${g.slug}`, title: g.title, text: g.excerpt, hue: g.hue ?? 24, slug: g.slug }));

  return (
    <>
      <JsonLd data={webPageJsonLd("AboutPage", `About ${store.name}`, "/about", store.bio)} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <HeroBackground refStr={about.heroBg} />
        {/* Same treatment as the homepage hero: solid navy behind the text, fading so the warehouse shows on the right. */}
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-signal-dark/40" />
        <div className="container-pp relative py-12 sm:py-16 md:py-24">
          <div className="max-w-3xl">
            {about.heroEyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{about.heroEyebrow}</p>}
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.1] sm:text-5xl sm:leading-[1.05] lg:text-6xl">{about.heroTitle}</h1>
            {about.heroIntro && <p className="mt-5 max-w-2xl text-base text-white/75 sm:text-lg">{fillTokens(about.heroIntro, { name: store.name, location: store.location })}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-6 py-3">Get started</Link>
              <Link href="/how-it-works" className="rounded-full px-6 py-3 text-sm font-semibold hover:bg-white/10">How it works</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers — every card links to the matching listing */}
      <section className="container-pp py-10 sm:py-14">
        <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">{about.statsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group card flex items-end justify-between p-5 sm:p-6 transition hover:-translate-y-0.5">
              <div>
                <s.icon aria-hidden className="mb-3 h-6 w-6 text-signal" />
                <p className="font-display text-3xl sm:text-4xl font-bold">{s.n}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
              <span className="text-signal-dark"><Arrow /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section >
        <div className="container-pp grid gap-10 py-10 sm:py-16 md:grid-cols-2">
          <div>
            {about.mission.eyebrow && <p className="label">{about.mission.eyebrow}</p>}
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{about.mission.title}</h2>
          </div>
          <div className="space-y-4 text-ink/80">
            {about.mission.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
            {about.mission.linkLabel && about.mission.linkHref && (
              <SmartLink href={about.mission.linkHref} className="group inline-flex items-center gap-1 font-semibold text-signal-dark">{about.mission.linkLabel} <Arrow /></SmartLink>
            )}
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className={`container-pp grid items-center gap-10 py-10 sm:py-16 ${about.sustainability.photo ? "md:grid-cols-[1fr_1.2fr]" : ""}`}>
        <SiteImage src={about.sustainability.photo} width={720} ratio={1.6} sizes="(max-width: 768px) 100vw, 45vw" className="aspect-[16/10] w-full rounded-2xl" />
        <div>
          <p className="label inline-flex items-center gap-1.5"><Leaf aria-hidden className="h-4 w-4 text-moss" /> {about.sustainability.eyebrow}</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{about.sustainability.title}</h2>
          {about.sustainability.body && <p className="mt-4 text-ink/80">{about.sustainability.body}</p>}
          {about.sustainability.linkLabel && about.sustainability.linkHref && (
            <SmartLink href={about.sustainability.linkHref} className="group mt-5 inline-flex items-center gap-1 font-semibold text-signal-dark">{about.sustainability.linkLabel} <Arrow /></SmartLink>
          )}
        </div>
      </section>

      {/* Transparent buying */}
      <section className="bg-ink text-white">
        <div className="container-pp py-10 sm:py-16">
          {about.transparent.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{about.transparent.eyebrow}</p>}
          <h2 className="mt-2 max-w-2xl font-display text-2xl sm:text-3xl font-bold">{about.transparent.title}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {about.transparent.cards.map((c, i) => {
              const Icon = TRANSPARENT_ICONS[i % TRANSPARENT_ICONS.length];
              const body = (
                <>
                  <Icon aria-hidden className="mb-3 h-6 w-6 text-signal" />
                  <p className="font-display text-lg font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm text-white/65">{c.text}</p>
                  {c.href && <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-signal">Learn more <Arrow /></span>}
                </>
              );
              return c.href ? (
                <SmartLink key={i} href={c.href} className="group rounded-2xl bg-white/5 p-5 transition hover:bg-white/10">{body}</SmartLink>
              ) : (
                <div key={i} className="rounded-2xl bg-white/5 p-5">{body}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who buys */}
      <section className="container-pp py-10 sm:py-16">
        {about.audiences.eyebrow && <p className="label">{about.audiences.eyebrow}</p>}
        <h2 className={`font-display text-2xl sm:text-3xl font-bold ${about.audiences.intro ? "" : "mb-8"}`}>{about.audiences.title}</h2>
        {about.audiences.intro && <p className="mb-8 mt-2 max-w-2xl text-ink/75">{about.audiences.intro}</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <Link key={a.slug} href={a.href} className="group card overflow-hidden transition hover:-translate-y-0.5">
              <Photo photo={photoFor(a.slug, GUIDE_PHOTOS)} width={480} ratio={2} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[16/8] w-full" />
              <div className="p-5">
                <p className="font-display text-lg font-bold group-hover:text-signal-dark">{a.title}</p>
                <p className="mt-1 text-sm text-muted">{a.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-signal-dark">Read the guide <Arrow /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section >
        <div className="container-pp py-10 sm:py-16">
          {about.advantages.eyebrow && <p className="label">{about.advantages.eyebrow}</p>}
          <h2 className="mb-8 font-display text-2xl sm:text-3xl font-bold">{about.advantages.title}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {about.advantages.cards.map((c, i) => {
              const Icon = ADVANTAGE_ICONS[i % ADVANTAGE_ICONS.length];
              return (
                <SmartLink key={i} href={c.href || "/"} className="group card flex flex-col p-5 sm:p-6 transition hover:-translate-y-0.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal text-white"><Icon aria-hidden className="h-5 w-5" /></span>
                  <p className="mt-4 font-display text-xl font-bold">{c.title}</p>
                  <p className="mt-2 flex-1 text-sm text-ink/75">{c.text}</p>
                  {c.cta && <span className="mt-4 inline-flex items-center gap-1 font-semibold text-signal-dark">{c.cta} <Arrow /></span>}
                </SmartLink>
              );
            })}
          </div>
        </div>
      </section>

      <GoogleReviews business={await getSetting("business")} />
      <SiteFaq page="about" />

      {/* Thank you */}
      <section className="container-pp py-10 sm:py-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{about.thanks.title}</h2>
        {about.thanks.body && <p className="mx-auto mt-3 max-w-2xl text-ink/75">{about.thanks.body}</p>}
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {about.thanks.cards.map((c, i) => {
            const Icon = THANKS_ICONS[i % THANKS_ICONS.length];
            return (
              <SmartLink key={i} href={c.href || "/"} className="group card p-5 text-left transition hover:-translate-y-0.5">
                <Icon aria-hidden className="mb-2 h-5 w-5 text-signal" />
                <p className="font-display text-lg font-bold group-hover:text-signal-dark">{c.title} <Arrow /></p>
                <p className="text-sm text-muted">{c.text}</p>
              </SmartLink>
            );
          })}
        </div>
      </section>
    </>
  );
}
