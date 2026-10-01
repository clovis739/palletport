import Link from "next/link";
import type { Article } from "@/content/types";
import type { ContentArticle } from "@/lib/content";
import { SiteImage } from "@/components/content/SiteImage";
import { authorOf, categorySlug, formatDate, postCover, postReadMins } from "@/lib/blog";
import { NextIcon } from "@/components/Icons";

/** Whole card is one link to the post. Category chip is text (not a nested link) to keep markup valid. */
export function PostCard({ post, size = "md" }: { post: Article & Partial<Pick<ContentArticle, "meta" | "blocks">>; size?: "sm" | "md" | "lg" }) {
  const cover = postCover(post);
  const mins = postReadMins(post);
  if (size === "lg") {
    return (
      <Link href={`/blog/${post.slug}`} className="group card grid overflow-hidden transition hover:-translate-y-0.5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SiteImage src={cover} width={900} priority sizes="(max-width: 768px) 100vw, 55vw" className="h-full min-h-56 w-full" />
        <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-signal px-2.5 py-1 font-bold uppercase tracking-wide text-white">Featured</span>
            <span className="font-semibold text-muted">{post.category}</span>
          </div>
          <h2 className="font-display text-2xl font-bold leading-tight group-hover:text-signal-dark sm:text-3xl">{post.title}</h2>
          <p className="mt-3 text-ink/70">{post.excerpt}</p>
          <p className="mt-5 text-xs text-muted">{authorOf(post).name} · {formatDate(post.date)} · {mins} min read</p>
          <span className="mt-5 inline-flex w-fit items-center gap-1 font-semibold text-signal-dark">Read article <NextIcon /></span>
        </div>
      </Link>
    );
  }
  if (size === "sm") {
    return (
      <Link href={`/blog/${post.slug}`} className="group flex gap-3 rounded-xl p-2 transition hover:bg-sand/60">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg"><SiteImage src={cover} width={80} ratio={5 / 4} sizes="80px" className="h-full w-full" /></div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-signal-dark">{post.title}</p>
          <p className="mt-1 text-xs text-muted">{formatDate(post.date)} · {mins} min</p>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/blog/${post.slug}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5">
      <div className="relative">
        <SiteImage src={cover} width={560} ratio={16 / 9} sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" className="aspect-[16/9] w-full" />
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink" data-cat={categorySlug(post.category ?? "")}>{post.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug group-hover:text-signal-dark">{post.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted">
          <span>{formatDate(post.date)} · {mins} min read</span>
          <span className="font-semibold text-signal-dark transition group-hover:translate-x-1">Read<NextIcon /></span>
        </div>
      </div>
    </Link>
  );
}
