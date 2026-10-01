import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { requestSiteUrl } from "@/lib/site-url";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { SeoForm } from "./SeoForm";

export const metadata = { title: "SEO defaults" };

export default async function SeoSettingsPage() {
  await requireStaff("site", "/dashboard/site/seo");
  const { seo } = await getStoredSettings();
  const aiAllowed = process.env.ALLOW_AI_CRAWLERS?.trim().toLowerCase() !== "false";
  return (
    <>
      <PageHeader
        title="SEO defaults"
        description="The title and description search engines and social networks use when a page doesn't set its own, plus the title pattern every page follows."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="seo" />}
      />
      <SeoForm initial={{ ...seo, ogImage: seo.ogImage ?? "" }} host={(await requestSiteUrl()).replace(/^https?:\/\//, "")} aiAllowed={aiAllowed} />
    </>
  );
}
