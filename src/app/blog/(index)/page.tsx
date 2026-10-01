import { BlogIndex } from "@/components/blog/BlogIndex";
import { pageMetadata } from "@/lib/seo";
import { SiteFaq } from "@/components/content/SiteFaq";

// Canonical is always /blog; blog search results (?q=) are kept out of the index.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return pageMetadata({
    title: "The Loading Dock — liquidation reselling blog",
    description:
      "Buying guides, market reports and reseller stories: how to read a manifest, what LTL freight really costs, pricing a lot and what's selling into Q4.",
    path: "/blog",
    noIndex: !!q?.trim(),
  });
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string; q?: string; page?: string; category?: string }> }) {
  const { tag, q, page } = await searchParams;
  const pageNo = Math.max(1, Number(page) || 1);
  const query = q?.trim() || undefined;
  return (
    <>
      <BlogIndex tag={tag} q={query} page={pageNo} basePath="/blog" />
      {/* FAQ on the main blog page only (not on search, tag or page 2+ views). */}
      {!query && !tag && pageNo === 1 && <SiteFaq page="blog" />}
    </>
  );
}
