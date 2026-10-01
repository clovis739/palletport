import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { LotCard } from "@/components/LotCard";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
const PER_PAGE = 24;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return { title: "Collection not found", robots: { index: false } };
  return pageMetadata({
    title: c.title,
    description: `${c.tagline} A curated collection of manifested liquidation lots, updated as new pallets are listed.`,
    path: `/collections/${slug}`,
  });
}

export default async function CollectionPage({ params, searchParams }: { params: Params; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) notFound();
  const where = { ...c.where, status: "ACTIVE" as const };
  const total = await db.lot.count({ where });
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const lots = await db.lot.findMany({
    where,
    include: { category: true, seller: true },
    orderBy: [c.orderBy ?? { createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });
  const others = COLLECTIONS.filter((x) => x.slug !== c.slug).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Collections", path: "/collections" }, { name: c.title, path: `/collections/${c.slug}` }]),
          itemListJsonLd(c.title, lots),
        ]}
      />
      <section style={{ background: `hsl(${c.hue} 45% 92%)` }}>
        <div className="container-pp py-12">
          <nav className="mb-2 text-xs text-muted"><Link href="/collections" className="hover:underline">Collections</Link> / {c.title}</nav>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{c.title}</h1>
          <p className="mt-1 max-w-xl text-ink/70">{c.tagline}</p>
          <p className="mt-3 text-sm font-semibold">{total} lots</p>
        </div>
      </section>
      <div className="container-pp py-10">
        {lots.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{lots.map((l) => <LotCard key={l.id} lot={l} />)}</div>
            <Pager base={`/collections/${c.slug}`} page={page} perPage={PER_PAGE} total={total} />
          </>
        ) : (
          <p className="card p-6 sm:p-10 text-center text-muted">No lots in this collection right now.</p>
        )}
        <h2 className="mb-4 mt-14 font-display text-xl font-bold">More collections</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {others.map((o) => (
            <Link key={o.slug} href={`/collections/${o.slug}`} className="rounded-2xl p-4 font-display font-semibold hover:underline" style={{ background: `hsl(${o.hue} 45% 92%)` }}>{o.title}</Link>
          ))}
        </div>
      </div>
    </>
  );
}
