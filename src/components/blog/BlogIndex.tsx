import Link from "next/link";
import type { ContentArticle } from "@/lib/content";
import { blocksText } from "@/lib/blocks";
import { allPosts, blogCategories, categorySlug } from "@/lib/blog";
import { PostCard } from "./PostCard";
import { BlogSidebar } from "./BlogSidebar";
import { NextIcon, PrevIcon } from "@/components/Icons";
import { getI18n } from "@/i18n/server";

const PER_PAGE = 6;

export async function BlogIndex({ category, tag, q, page, basePath }: { category?: string; tag?: string; q?: string; page: number; basePath: string }) {
  const [all, categories, { t: tr, lh, locale }] = await Promise.all([allPosts(), blogCategories(), getI18n()]);
  let posts: ContentArticle[] = all;
  if (category) posts = posts.filter((p) => p.category === category);
  if (tag) posts = posts.filter((p) => p.tags?.includes(tag));
  if (q) {
    const t = q.toLowerCase();
    posts = posts.filter((p) => [p.title, p.excerpt, ...(p.tags ?? []), blocksText(p.blocks)].join(" ").toLowerCase().includes(t));
  }
  const filtered = !!(category || tag || q);
  const featured = !filtered && page === 1 ? posts.find((p) => p.featured) ?? posts[0] : undefined;
  const rest = featured ? posts.filter((p) => p !== featured) : posts;
  const pages = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  const shown = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const qs = (n: number) => {
    const p = new URLSearchParams();
    if (tag) p.set("tag", tag);
    if (q) p.set("q", q);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return lh(s ? `${basePath}?${s}` : basePath);
  };

  return (
    <>
      <section >
        <div className="container-pp py-8 sm:py-12">
          <nav className="mb-2 text-xs text-muted">
            <Link href={lh("/")} className="hover:underline">{tr("Home")}</Link> / <Link href={lh("/blog")} className="hover:underline">{tr("Blog")}</Link>
            {category && <> / {tr(category)}</>}
          </nav>
          <h1 className="break-words font-display text-3xl font-bold sm:text-5xl">{category ? tr(category) : tag ? `#${tag}` : q ? tr("Search: “{q}”", { q }) : tr("The Loading Dock")}</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            {filtered ? tr(posts.length === 1 ? "{n} article" : "{n} articles", { n: posts.length }) : tr("Guides and market insights for buying and reselling liquidation inventory.")}
          </p>
          {locale === "es" && (
            <p className="mt-3 inline-block rounded-lg bg-white px-3 py-2 text-xs text-ink/75">{tr("Blog articles are available in English only.")}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={lh("/blog")} className={`rounded-full px-4 py-2 text-sm font-semibold ${!category ?"bg-ink text-white":"bg-white"}`}>{tr("All articles")}</Link>
            {categories.map((c) => (
              <Link key={c} href={lh(`/blog/category/${categorySlug(c)}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === c ?"bg-ink text-white":"bg-white"}`}>{tr(c)}</Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-pp grid grid-cols-1 gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          {featured && <PostCard post={featured} size="lg" />}
          {shown.length > 0 ? (
            <>
              <h2 className="font-display text-xl font-bold">{tr(featured ? "Latest articles" : "Articles")}</h2>
              <div className="grid gap-6 sm:grid-cols-2">{shown.map((p) => <PostCard key={p.slug} post={p} />)}</div>
            </>
          ) : (
            !featured && (
              <div className="card p-8 sm:p-12 text-center">
                <p className="font-display text-lg font-semibold">{tr("No articles found")}</p>
                <p className="mt-1 text-sm text-muted">{tr("Try another topic or browse all articles.")}</p>
                <Link href={lh("/blog")} className="btn-primary mt-5">{tr("All articles")}</Link>
              </div>
            )
          )}
          {pages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={tr("Pagination")}>
              {page > 1 && <Link href={qs(page - 1)} className="btn-ghost"><PrevIcon />{tr("Newer")}</Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={qs(n)} aria-current={n === page ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${n === page ? "bg-ink text-white" : "hover:bg-sand"}`}>{n}</Link>
              ))}
              {page < pages && <Link href={qs(page + 1)} className="btn-ghost">{tr("Older")}<NextIcon /></Link>}
            </nav>
          )}
        </div>
        <BlogSidebar activeCategory={category} activeTag={tag} />
      </div>
    </>
  );
}
