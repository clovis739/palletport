import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide } from "@/lib/content";
import { getCollection } from "@/lib/collections";
import { db } from "@/lib/db";
import { Blocks } from "@/components/content/Blocks";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { LotCard } from "@/components/LotCard";
import { canPreview, PREVIEW_ROBOTS } from "@/lib/preview";
import { imageRefUrl } from "@/lib/blog";
import { JsonLd, breadcrumbJsonLd, pageMetadata, sectionsText } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const g = await getGuide(slug, { preview });
  if (!g) return { title: "Guide not found", robots: { index: false } };
  const img = g.source === "db" ? imageRefUrl(g.meta.cover) : undefined;
  const md = await pageMetadata({
    title: g.meta.seoTitle || `${g.title} — buying guide`,
    description: g.meta.seoDescription || `${g.excerpt} ${sectionsText(g.body)}`,
    path: `/guides/${slug}`,
    image: img?.url,
    imageAlt: img?.alt,
    noIndex: !!g.meta.noindex,
  });
  return preview ? { ...md, robots: PREVIEW_ROBOTS } : md;
}

export default async function GuidePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const g = await getGuide(slug, { preview });
  if (!g) notFound();
  const categories = g.categories ?? [];
  const lots = categories.length
    ? await db.lot.findMany({
        where: { status: "ACTIVE", category: { slug: { in: categories } } },
        include: { category: true, seller: true },
        orderBy: { views: "desc" },
        take: 4,
      })
    : [];
  const collection = g.collection ? getCollection(g.collection) : undefined;
  return (
    <>
      {preview && <PreviewBanner id={g.id} status={g.status} />}
      <JsonLd data={breadcrumbJsonLd([{ name: "Guides", path: "/guides" }, { name: g.title, path: `/guides/${g.slug}` }])} />
      <section style={{ background: `hsl(${g.hue ?? 24} 45% 93%)` }}>
        <div className="container-pp py-8 sm:py-12">
          <nav className="mb-2 text-xs text-muted"><Link href="/guides" className="hover:underline">Guides</Link></nav>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{g.title}</h1>
          <p className="mt-2 max-w-xl text-ink/70">{g.excerpt}</p>
        </div>
      </section>
      <div className="container-pp grid grid-cols-1 gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 max-w-2xl"><Blocks blocks={g.blocks} size="sm" /></div>
        {collection && (
          <aside className="card h-fit min-w-0 p-5">
            <p className="label">Recommended collection</p>
            <p className="font-display text-lg font-bold">{collection.title}</p>
            <p className="text-sm text-muted">{collection.tagline}</p>
            <Link href={`/collections/${collection.slug}`} className="btn-dark mt-4 w-full">Shop the collection</Link>
          </aside>
        )}
      </div>
      {lots.length > 0 && (
        <section className="container-pp pb-6">
          <h2 className="mb-4 font-display text-2xl font-bold">Popular lots for this store type</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{lots.map((l) => <LotCard key={l.id} lot={l} />)}</div>
        </section>
      )}
    </>
  );
}
