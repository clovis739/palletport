import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { FaqsForm } from "./FaqsForm";

export const metadata = { title: "FAQs" };

export default async function FaqsSettingsPage() {
  const { seller } = await requireStaff("site", "/dashboard/site/faqs");
  const { faqs } = await getStoredSettings();
  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions and answers shown at the bottom of the homepage, the about page and the blog. They're also sent to search engines as FAQ structured data."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="faqs" />}
      />
      <FaqsForm initial={faqs} storeName={seller.name} storeLocation={seller.location} />
    </>
  );
}
