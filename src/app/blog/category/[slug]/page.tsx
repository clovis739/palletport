import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { categoryFromSlug } from "@/lib/blog";
import { JsonLd, SITE_NAME, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const c = await categoryFromSlug(slug);
  if (!c) return { title: "Blog", robots: { index: false } };
  return pageMetadata({
    title: `${c} — liquidation reselling blog`,
    description: `${c} from The Loading Dock, the ${SITE_NAME} blog for businesses that buy and resell liquidation pallets, truckloads and case packs.`,
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
