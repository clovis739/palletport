import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { BusinessForm } from "./BusinessForm";

export const metadata = { title: "Business profile" };

export default async function BusinessPage() {
  const { seller } = await requireStaff("site", "/dashboard/site/business");
  const { business } = await getStoredSettings();
  return (
    <>
      <PageHeader
        title="Business profile"
        description="How customers reach you. Shown in the footer, on the Contact page and in search results. Empty fields are hidden."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="business" />}
      />
      {/* The store record (commerce) is the source of the store name and location: edit both here. */}
      <BusinessForm initial={{ ...business, photos: [...(business.photos ?? []), "", "", "", "", "", ""].slice(0, 6), name: seller.name, storeLocation: seller.location }} />
    </>
  );
}
