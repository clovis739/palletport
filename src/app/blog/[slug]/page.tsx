import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteImage } from "@/components/content/SiteImage";
import { Blocks } from "@/components/content/Blocks";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { PostCard } from "@/components/blog/PostCard";
import { ShareBar } from "@/components/blog/ShareBar";
import { authorOf, categorySlug, formatDate, getPost, imageRefUrl, neighbours, postCover, postFaq, postReadMins, postToc, relatedPosts } from "@/lib/blog";
import { canPreview, PREVIEW_ROBOTS } from "@/lib/preview";
import { NextIcon, PrevIcon } from "@/components/Icons";
import { ChevronDown } from "lucide-react";
import { JsonLd, absoluteUrl, articleJsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }) {
  const preview = await canPreview(searchParams);
  const p = await getPost((await params).slug, { preview });
  if (!p) return { title: "Article not found", robots: { index: false } };
  const img = imageRefUrl(postCover(p));
  const md = await pageMetadata({
    title: p.meta.seoTitle || p.title,
    description: p.meta.seoDescription || p.excerpt,
    path: `/blog/${p.slug}`,
    image: img?.url,
    imageAlt: img?.alt,
    type: "article",
    publishedTime: p.date,
    modifiedTime: p.updated ?? p.date,
    authors: [authorOf(p).name],
    noIndex: !!p.meta.noindex,
  });
  return preview ? { ...md, robots: PREVIEW_ROBOTS } : md;
}

export default async function BlogPost({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const post = await getPost(slug, { preview });
  if (!post) notFound();
  const author = authorOf(post);
  const toc = postToc(post);
  const [{ newer, older }, related] = await Promise.all([neighbours(slug), relatedPosts(post)]);
  const faqLd = faqJsonLd(postFaq(post));
  const cover = postCover(post);
  const coverUrl = imageRefUrl(cover)?.url;
  const readMins = postReadMins(post);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(post.category ? [{ name: post.category, path: `/blog/category/${categorySlug(post.category)}` }] : []),
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <>
      {preview && <PreviewBanner id={post.id} status={post.status} />}
      <JsonLd
        data={[
          articleJsonLd(post, { authorName: author.name, image: coverUrl ? absoluteUrl(coverUrl) : undefined }),
          breadcrumbJsonLd(crumbs),
          ...(faqLd ? [faqLd] : []),
        ]}
      />
      <header className="bg-sand/50">
        <div className="container-pp max-w-4xl py-8 sm:py-10">
          <nav className="mb-4 text-xs text-muted">
            <Link href="/" className="hover:underline">Home</Link> / <Link href="/blog" className="hover:underline">Blog</Link>
            {post.category && <> /{" "}<Link href={`/blog/category/${categorySlug(post.category)}`} className="hover:underline">{post.category}</Link></>}
          </nav>
          <div className="mb-3 flex flex-wrap gap-2">
            {post.category && <Link href={`/blog/category/${categorySlug(post.category)}`} className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white hover:bg-ink-2">{post.category}</Link>}
            {post.tags?.map((t) => (
              <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{t}</Link>
            ))}
          </div>
          <h1 className="break-words font-display text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-base text-ink/70 sm:text-lg">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-display text-xs font-bold text-white">PP</span>
            <span>
              <span className="block font-semibold">{author.name}</span>
              <span className="text-xs text-muted">
                {formatDate(post.date, "long")}
                {post.updated && post.updated !== post.date && <> · Updated <time dateTime={post.updated}>{formatDate(post.updated, "long")}</time></>}
                {" "}· {readMins} min read
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="container-pp grid grid-cols-1 gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[200px_minmax(0,1fr)_220px]">
        {/* TOC (desktop) */}
        <aside className="hidden xl:block">
          {toc.length > 0 && (
            <nav className="sticky top-[148px] text-sm" aria-label="On this page">
              <p className="label">On this page</p>
              <ol className="space-y-1.5 pl-3">
                {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="block text-ink/70 hover:text-signal-dark">{t.h}</a></li>)}
              </ol>
            </nav>
          )}
        </aside>

        <article className="min-w-0 max-w-2xl">
          {/* TOC (phones, tablets and small laptops) */}
          {toc.length > 0 && (
            <details className="group mb-6 rounded-2xl bg-white xl:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <nav aria-label="On this page" className="px-4 py-3">
                <ol className="space-y-1 pl-3 text-sm">
                  {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="block py-1 text-ink/70 hover:text-signal-dark">{t.h}</a></li>)}
                </ol>
              </nav>
            </details>
          )}
          <SiteImage src={cover} width={1000} ratio={16 / 9} sizes="(max-width: 1024px) 100vw, 1000px" priority className="mb-8 aspect-[16/9] w-full rounded-2xl" />
          <Blocks blocks={post.blocks} />

          {/* CTA */}
          <Link href="/lots" className="group mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink p-5 text-white sm:p-6">
            <span>
              <span className="block font-display text-xl font-bold">Ready to start buying?</span>
              <span className="text-sm text-white/70">Browse manifested lots from our warehouse, all at fixed prices.</span>
            </span>
            <span className="btn-primary">Browse lots <NextIcon /></span>
          </Link>

          {/* Author */}
          <div className="card mt-8 flex gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-white">PP</span>
            <div className="min-w-0">
              <p className="font-semibold">{author.name} <span className="font-normal text-muted">· {author.role}</span></p>
              <p className="mt-1 text-sm text-ink/75">{author.bio}</p>
            </div>
          </div>

          {/* Prev / next */}
          <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="More articles">
            {older ? (
              <Link href={`/blog/${older.slug}`} className="group card p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted"><PrevIcon />Previous</span>
                <span className="mt-1 block font-display font-bold leading-snug group-hover:text-signal-dark">{older.title}</span>
              </Link>
            ) : <span />}
            {newer && (
              <Link href={`/blog/${newer.slug}`} className="group card p-5 text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Next<NextIcon /></span>
                <span className="mt-1 block font-display font-bold leading-snug group-hover:text-signal-dark">{newer.title}</span>
              </Link>
            )}
          </nav>
        </article>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-[148px] lg:h-fit">
          <ShareBar title={post.title} />
          <div className="rounded-2xl bg-sand p-5 text-sm">
            <p className="font-display font-bold">New to liquidation?</p>
            <p className="mt-1 text-ink/75">Our ordering guide covers checkout, payment options, freight and delivery.</p>
            <Link href="/how-to-buy" className="mt-3 inline-block font-semibold text-signal-dark hover:underline">How to order<NextIcon /></Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section >
          <div className="container-pp py-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h2 className="font-display text-2xl font-bold">Keep reading</h2>
              <Link href="/blog" className="text-sm font-semibold text-signal-dark hover:underline">All articles<NextIcon /></Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">{related.map((p) => <PostCard key={p.slug} post={p} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
