import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/content";
import { Blocks } from "@/components/content/Blocks";
import { SiteImage } from "@/components/content/SiteImage";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { canPreview, PREVIEW_ROBOTS } from "@/lib/preview";
import { imageRefUrl } from "@/lib/blog";
import { blocksFaq, blocksText } from "@/lib/blocks";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";

/**
 * Custom pages (ContentEntry type PAGE) at /p/<slug>. Published only (staff can preview drafts with ?preview=1).
 * Not linked anywhere by default — add links in Admin → Site → Navigation.
 */
type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const page = await getPage(slug, { preview });
  if (!page) return { title: "Page not found", robots: { index: false } };
  const img = imageRefUrl(page.meta.cover);
  const md = await pageMetadata({
    title: page.meta.seoTitle || page.title,
    description: page.meta.seoDescription || page.excerpt || blocksText(page.blocks),
    path: `/p/${page.slug}`,
    image: img?.url,
    imageAlt: img?.alt,
    noIndex: !!page.meta.noindex,
  });
  return preview ? { ...md, robots: PREVIEW_ROBOTS } : md;
}

export default async function CustomPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const page = await getPage(slug, { preview });
  if (!page) notFound();
  const path = `/p/${page.slug}`;
  const faq = faqJsonLd(blocksFaq(page.blocks));
  return (
    <>
      {preview && <PreviewBanner id={page.id} status={page.status} />}
      <JsonLd
        data={[
          webPageJsonLd("WebPage", page.title, path, page.meta.seoDescription || page.excerpt || undefined),
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: page.title, path }]),
          ...(faq ? [faq] : []),
        ]}
      />
      <header className="bg-sand/50">
        <div className="container-pp max-w-4xl py-8 sm:py-12">
          <nav className="mb-3 text-xs text-muted"><Link href="/" className="hover:underline">Home</Link></nav>
          <h1 className="break-words font-display text-3xl font-bold leading-tight sm:text-5xl">{page.title}</h1>
          {page.excerpt && <p className="mt-4 max-w-2xl text-base text-ink/70 sm:text-lg">{page.excerpt}</p>}
        </div>
      </header>
      <div className="container-pp max-w-4xl py-8 sm:py-10">
        <article className="mx-auto min-w-0 max-w-2xl">
          {page.meta.cover && (
            <SiteImage src={page.meta.cover} width={1000} ratio={16 / 9} sizes="(max-width: 1024px) 100vw, 720px" priority className="mb-8 aspect-[16/9] w-full rounded-2xl" />
          )}
          <Blocks blocks={page.blocks} />
        </article>
      </div>
    </>
  );
}
