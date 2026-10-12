import Link from "next/link";
import { BadgeCheck, Boxes, DollarSign, FileText, Leaf, MessageCircle, Package, Receipt, ShieldCheck, ShoppingCart, Star, Store, Tags, TrendingUp, Truck, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getPublicStore as getStore } from "@/lib/store";
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
import { getI18n } from "@/i18n/server";

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
  const { t, lh } = await getI18n();

  const stats: { n: string; label: string; href: string; icon: LucideIcon }[] = [
    { n: lotsListed.toLocaleString(), label: t("lots listed"), href: lh("/search"), icon: Boxes },
    { n: money(retail._sum.msrpCents ?? 0), label: t("retail value listed"), href: lh("/lots?sort=retail"), icon: DollarSign },
    { n: (units._sum.units ?? 0).toLocaleString(), label: t("units on manifests"), href: lh("/lots?sort=units"), icon: Package },
    { n: soldLots.toLocaleString(), label: t("lots sold"), href: lh("/lots?sold=1"), icon: ShoppingCart },
    { n: buyers.toLocaleString(), label: t("registered business buyers"), href: lh("/register"), icon: Store },
    { n: reviews ? (avgRating._avg.rating ?? 0).toFixed(1) : `${buyers.toLocaleString()}`, label: reviews ? t("average star rating from {n} customer reviews", { n: reviews }) : t("registered buyers"), href: lh("/search"), icon: Star },
  ];

  const heroImage = about.heroPhotos[0] || about.heroBg;
  const audiences = guides.map((g) => ({ href: lh(`/guides/${g.slug}`), title: g.title, text: g.excerpt, hue: g.hue ?? 24, slug: g.slug }));

  return (
    <>
      <JsonLd data={webPageJsonLd("AboutPage", t("About {name}", { name: store.name }), "/about", store.bio)} />
      {/* Hero */}
      <section className="bg-ink text-white">
        <div className={`container-pp grid items-center gap-10 py-10 sm:py-14 ${heroImage ? "lg:grid-cols-[1fr_1fr]" : ""} lg:gap-14 lg:py-20`}>
          <div className="min-w-0">
            {about.heroEyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">{about.heroEyebrow}</p>}
            <h1 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">{about.heroTitle}</h1>
            {about.heroIntro && <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">{fillTokens(about.heroIntro, { name: store.name, location: store.location })}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={lh("/register")} className="btn-primary min-h-12 px-6">{t("Get started")} <Arrow /></Link>
              <Link href={lh("/how-it-works")} className="inline-flex min-h-12 items-center rounded-full bg-white/10 px-6 text-sm font-semibold hover:bg-white/20">{t("How it works")}</Link>
            </div>
          </div>
          {heroImage && <div className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-2xl bg-ink-2 sm:rounded-3xl lg:aspect-[5/6]">
            <HeroBackground refStr={heroImage} sizes="(max-width: 1023px) calc(100vw - 48px), (max-width: 1280px) 46vw, 560px" />
          </div>}
        </div>
      </section>

      {/* Numbers — every card links to the matching listing */}
      <section className="container-pp py-12 sm:py-16">
        <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">{about.statsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group card flex min-w-0 items-end justify-between gap-4 p-5 sm:p-6 transition-colors hover:bg-ink hover:text-white">
              <div>
                <s.icon aria-hidden className="mb-4 h-5 w-5 text-signal" />
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{s.n}</p>
                <p className="mt-2 text-sm text-muted group-hover:text-white/80">{s.label}</p>
              </div>
              <span className="text-signal-dark"><Arrow /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="bg-sand/50">
        <div className="container-pp grid gap-6 py-12 sm:gap-10 sm:py-20 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            {about.mission.eyebrow && <p className="label">{about.mission.eyebrow}</p>}
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{about.mission.title}</h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-ink/80 sm:text-lg">
            {about.mission.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
            {about.mission.linkLabel && about.mission.linkHref && (
              <SmartLink href={about.mission.linkHref} className="group inline-flex items-center gap-1 font-semibold text-signal-dark">{about.mission.linkLabel} <Arrow /></SmartLink>
            )}
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className={`container-pp grid items-center gap-8 py-12 sm:gap-14 sm:py-20 ${about.sustainability.photo ? "md:grid-cols-[1fr_1.2fr]" : ""}`}>
        {about.sustainability.photo && <SiteImage src={about.sustainability.photo} width={720} ratio={4 / 3} sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1280px) 40vw, 500px" className="aspect-[4/3] w-full rounded-2xl sm:rounded-3xl" />}
        <div>
          <p className="label inline-flex items-center gap-1.5"><Leaf aria-hidden className="h-4 w-4 text-moss" /> {about.sustainability.eyebrow}</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{about.sustainability.title}</h2>
          {about.sustainability.body && <p className="mt-4 text-base leading-relaxed text-ink/80 sm:text-lg">{about.sustainability.body}</p>}
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
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {about.transparent.cards.map((c, i) => {
              const Icon = TRANSPARENT_ICONS[i % TRANSPARENT_ICONS.length];
              const body = (
                <>
                  <Icon aria-hidden className="mb-4 h-5 w-5 text-signal" />
                  <p className="font-display text-lg font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/80">{c.text}</p>
                  {c.href && <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-signal">{t("Learn more")} <Arrow /></span>}
                </>
              );
              return c.href ? (
                <SmartLink key={i} href={c.href} className="group rounded-2xl bg-white/10 p-6 transition hover:bg-white/10">{body}</SmartLink>
              ) : (
                <div key={i} className="rounded-2xl bg-white/10 p-6">{body}</div>
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
              <Photo photo={photoFor(a.slug, GUIDE_PHOTOS)} width={480} ratio={4 / 3} sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 46vw, 380px" className="aspect-[4/3] w-full" />
              <div className="p-5">
                <p className="font-display text-lg font-bold group-hover:text-signal-dark">{a.title}</p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">{a.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-signal-dark">{t("Read the guide")} <Arrow /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section className="bg-sand/50">
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
      <section className="container-pp py-14 text-center sm:py-20">
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
