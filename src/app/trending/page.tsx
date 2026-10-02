import Link from "next/link";
import { db } from "@/lib/db";
import { LotCard } from "@/components/LotCard";
import { COLLECTIONS } from "@/lib/collections";
import { TrendingUp } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { NextIcon } from "@/components/Icons";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";
import { getBrand } from "@/lib/brand";

export const generateMetadata = () => pageMetadata({
  title: "Most-viewed and most-saved liquidation lots",
  description:
    "The open liquidation lots resellers view and save most, plus popular searches such as air fryers, power tools and earbuds. A quick read on buyer demand.",
  path: "/trending",
});
export const dynamic = "force-dynamic";

const SEARCHES = ["air fryer", "power tools", "earbuds", "office chair", "sneakers", "baby monitor", "smart home", "truckload", "cosmetics", "patio"];

const PER_PAGE = 8;

export default async function Trending({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const brand = await getBrand();
  const total = await db.lot.count({ where: { status: "ACTIVE" } });
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const [mostViewed, mostSaved] = await Promise.all([
    db.lot.findMany({ where: { status: "ACTIVE" }, include: { category: true, seller: true }, orderBy: [{ views: "desc" }, { id: "desc" }], skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    db.lot.findMany({ where: { status: "ACTIVE", favorites: { some: {} } }, include: { category: true, seller: true, _count: { select: { favorites: true } } }, orderBy: { favorites: { _count: "desc" } }, take: 4 }),
  ]);

  return (
    <div className="container-pp space-y-14 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Trending on {brand}</h1>
        <p className="text-muted">What resellers are looking at, saving and searching for this week.</p>
      </header>

      <section>
        <h2 className="label">Popular searches</h2>
        <div className="flex flex-wrap gap-2">
          {SEARCHES.map((q) => (
            <Link key={q} href={`/lots?q=${encodeURIComponent(q)}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium"><TrendingUp aria-hidden className="mr-1.5 inline-block h-4 w-4 align-[-0.2em] text-signal" />{q}</Link>
          ))}
        </div>
      </section>

      <section id="most-viewed" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">Most viewed</h2>
          <Link href="/lots?sort=popular" className="text-sm font-semibold text-signal-dark hover:underline">Browse by popularity<NextIcon /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{mostViewed.map((l) => <LotCard key={l.id} lot={l} />)}</div>
        <Pager base="/trending" hash="most-viewed" page={page} perPage={PER_PAGE} total={total} className="mt-8" />
      </section>

      {mostSaved.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">Most saved</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{mostSaved.map((l) => <LotCard key={l.id} lot={l} />)}</div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">Hot collections</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.slice(0, 4).map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} className="rounded-2xl p-5 transition hover:-translate-y-0.5" style={{ background: `hsl(${c.hue} 45% 92%)` }}>
              <p className="font-display text-lg font-bold">{c.title}</p>
              <p className="text-sm text-ink/70">{c.tagline}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
