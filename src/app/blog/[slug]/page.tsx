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
import { BookOpen, ChevronDown } from "lucide-react";
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
  const initials = author.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("");

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
      <header className="bg-sand/70">
        <div className="container-pp py-6 sm:py-10 lg:py-14">
          <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-ink hover:underline">Home</Link><span aria-hidden>/</span>
            <Link href="/blog" className="hover:text-ink hover:underline">Blog</Link>
            {post.category && <><span aria-hidden>/</span><Link href={`/blog/category/${categorySlug(post.category)}`} className="hover:text-ink hover:underline">{post.category}</Link></>}
          </nav>
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div className="min-w-0">
              {post.category && <Link href={`/blog/category/${categorySlug(post.category)}`} className="mb-4 inline-flex min-h-9 items-center rounded-full bg-white px-4 text-xs font-semibold text-signal-dark">{post.category}</Link>}
              <h1 className="text-balance break-words font-display text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl xl:text-5xl">{post.title}</h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">{post.excerpt}</p>
              <div className="mt-7 flex items-center gap-3">
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-white">{initials}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{author.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {post.date && <time dateTime={post.date}>{formatDate(post.date, "long")}</time>}
                    <span className="inline-flex items-center gap-1.5"><BookOpen aria-hidden className="h-3.5 w-3.5" />{readMins} min read</span>
                    {post.updated && post.updated !== post.date && <span>Updated <time dateTime={post.updated}>{formatDate(post.updated, "long")}</time></span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl bg-sand sm:rounded-3xl">
              <SiteImage src={cover} alt={post.title} width={960} ratio={4 / 3} sizes="(max-width: 1023px) calc(100vw - 48px), (max-width: 1280px) 46vw, 560px" priority className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="container-pp grid grid-cols-1 gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16 xl:gap-24">
        <article className="min-w-0 w-full max-w-[720px] lg:justify-self-center">
          {/* TOC (phones, tablets and small laptops) */}
          {toc.length > 0 && (
            <details className="group mb-6 rounded-2xl bg-sand lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
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

          <Blocks blocks={post.blocks} className="sm:text-[17px] leading-[1.85] [&_h2]:pt-6 [&_h2]:leading-snug [&_h3]:pt-3 [&_li]:pl-1 [&_figure]:py-3" />

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
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-white">{initials}</span>
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

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-[160px] lg:h-fit">
          {toc.length > 0 && <nav className="hidden rounded-2xl bg-sand p-5 lg:block" aria-label="On this page">
            <p className="mb-3 text-sm font-semibold">On this page</p>
            <ol className="max-h-[45vh] space-y-1 overflow-y-auto text-sm" data-lenis-prevent>
              {toc.map((item, index) => <li key={item.id}><a href={`#${item.id}`} className="flex min-h-10 items-start gap-3 rounded-lg px-2 py-2 leading-relaxed text-muted hover:bg-white hover:text-ink"><span aria-hidden className="mt-0.5 shrink-0 text-xs text-signal-dark">{String(index + 1).padStart(2, "0")}</span>{item.h}</a></li>)}
            </ol>
          </nav>}
          <ShareBar title={post.title} />
          {!!post.tags?.length && <div><p className="mb-3 text-sm font-semibold">Topics</p><div className="flex flex-wrap gap-2">{post.tags.map(tag => <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="inline-flex min-h-9 items-center rounded-full bg-sand px-3 text-xs font-medium hover:bg-ink hover:text-white">{tag}</Link>)}</div></div>}

          <div className="rounded-2xl bg-sand p-5 text-sm">
            <p className="font-display font-bold">New to liquidation?</p>
            <p className="mt-1 text-ink/75">Our ordering guide covers checkout, payment options, freight and delivery.</p>
            <Link href="/how-to-buy" className="mt-3 inline-block font-semibold text-signal-dark hover:underline">How to order<NextIcon /></Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-sand/50">
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
