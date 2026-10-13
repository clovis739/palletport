import Link from "next/link";
import { allPosts, allTags, blogCategories, categorySlug } from "@/lib/blog";
import { InquiryForm } from "@/components/InquiryForm";
import { PostCard } from "./PostCard";
import { NextIcon } from "@/components/Icons";
import { getI18n } from "@/i18n/server";

export async function BlogSidebar({ activeCategory, activeTag }: { activeCategory?: string; activeTag?: string }) {
  const [posts, categories, tags, { t, lh }] = await Promise.all([allPosts(), blogCategories(), allTags(), getI18n()]);
  return (
    <aside className="min-w-0 space-y-8">
      <form action={lh("/blog")} className="flex gap-2">
        <input name="q" placeholder={t("Search articles")} className="input rounded-full" aria-label={t("Search articles")} />
        <button className="btn-dark shrink-0 px-4">{t("Go")}</button>
      </form>
      <div>
        <p className="label">{t("Categories")}</p>
        <ul className="space-y-1">
          {categories.map((c) => {
            const n = posts.filter((p) => p.category === c).length;
            return (
              <li key={c}>
                <Link href={lh(`/blog/category/${categorySlug(c)}`)} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-sand ${activeCategory === c ? "bg-sand font-semibold" : ""}`}>
                  <span>{t(c)}</span><span className="text-xs text-muted">{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="label">{t("Popular topics")}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map(([tg, n]) => (
            <Link key={tg} href={lh(`/blog?tag=${encodeURIComponent(tg)}`)} className={`rounded-full px-3 py-1 text-xs font-medium ${activeTag === tg ?"bg-ink text-white":"bg-white"}`}>
              {tg} <span className="opacity-60">{n}</span>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="label">{t("Latest")}</p>
        <div className="space-y-1">{posts.slice(0, 4).map((p) => <PostCard key={p.slug} post={p} size="sm" />)}</div>
      </div>
      <div className="rounded-2xl bg-ink p-5 text-white">
        <p className="font-display text-lg font-bold">{t("The Monday Manifest")}</p>
        <p className="mb-3 text-sm text-white/70">{t("New lots, market notes and one buying tip every week.")}</p>
        <InquiryForm topic="NEWSLETTER" dark submitLabel="Subscribe" fields={[]} />
      </div>
      <Link href={lh("/lots")} className="group block rounded-2xl bg-signal p-5 text-white">
        <p className="font-display text-lg font-bold">{t("Ready to start buying?")}</p>
        <p className="text-sm text-white/85">{t("Browse every lot in stock, at fixed prices.")}</p>
        <span className="mt-2 inline-block font-semibold transition group-hover:translate-x-1">{t("Shop lots")}<NextIcon /></span>
      </Link>
    </aside>
  );
}
