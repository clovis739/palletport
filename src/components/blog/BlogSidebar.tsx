import Link from "next/link";
import { allPosts, allTags, blogCategories, categorySlug } from "@/lib/blog";
import { InquiryForm } from "@/components/InquiryForm";
import { PostCard } from "./PostCard";
import { NextIcon } from "@/components/Icons";

export async function BlogSidebar({ activeCategory, activeTag }: { activeCategory?: string; activeTag?: string }) {
  const [posts, categories, tags] = await Promise.all([allPosts(), blogCategories(), allTags()]);
  return (
    <aside className="min-w-0 space-y-8">
      <form action="/blog" className="flex gap-2">
        <input name="q" placeholder="Search articles" className="input rounded-full" aria-label="Search articles" />
        <button className="btn-dark shrink-0 px-4">Go</button>
      </form>
      <div>
        <p className="label">Categories</p>
        <ul className="space-y-1">
          {categories.map((c) => {
            const n = posts.filter((p) => p.category === c).length;
            return (
              <li key={c}>
                <Link href={`/blog/category/${categorySlug(c)}`} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-sand ${activeCategory === c ? "bg-sand font-semibold" : ""}`}>
                  <span>{c}</span><span className="text-xs text-muted">{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="label">Popular topics</p>
        <div className="flex flex-wrap gap-2">
          {tags.map(([t, n]) => (
            <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className={`rounded-full px-3 py-1 text-xs font-medium ${activeTag === t ?"bg-ink text-white":"bg-white"}`}>
              {t} <span className="opacity-60">{n}</span>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Latest</p>
        <div className="space-y-1">{posts.slice(0, 4).map((p) => <PostCard key={p.slug} post={p} size="sm" />)}</div>
      </div>
      <div className="rounded-2xl bg-ink p-5 text-white">
        <p className="font-display text-lg font-bold">The Monday Manifest</p>
        <p className="mb-3 text-sm text-white/70">New lots, market notes and one buying tip every week.</p>
        <InquiryForm topic="NEWSLETTER" dark submitLabel="Subscribe" fields={[]} />
      </div>
      <Link href="/lots" className="group block rounded-2xl bg-signal p-5 text-white">
        <p className="font-display text-lg font-bold">Ready to start buying?</p>
        <p className="text-sm text-white/85">Browse every lot in stock, at fixed prices.</p>
        <span className="mt-2 inline-block font-semibold transition group-hover:translate-x-1">Shop lots<NextIcon /></span>
      </Link>
    </aside>
  );
}
