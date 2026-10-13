import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { categoryFromSlug } from "@/lib/blog";
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getT } from "@/i18n/server";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const c = await categoryFromSlug(slug);
  if (!c) return { title: "Blog", robots: { index: false } };
  return pageMetadata({
    title: (await getT())("{category} — liquidation reselling blog", { category: (await getT())(c) }),
    description: (await getT())("{category} from The Loading Dock, the PalletPort blog for businesses that buy and resell liquidation pallets, truckloads and case packs.", { category: (await getT())(c) }),
    path: `/blog/category/${slug}`,
  });
}

export default async function BlogCategoryPage({ params, searchParams }: { params: Params; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const category = await categoryFromSlug(slug);
  if (!category) notFound();
  const { page } = await searchParams;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: category, path: `/blog/category/${slug}` }])} />
      <BlogIndex category={category} page={Math.max(1, Number(page) || 1)} basePath={`/blog/category/${slug}`} />
    </>
  );
}
