import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { CheckoutSettingsForm } from "./CheckoutSettingsForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutSettingsPage() {
  await requireStaff("site", "/dashboard/site/checkout");
  const { checkout } = await getStoredSettings();
  return (
    <>
      <PageHeader
        title="Checkout"
        description="Payment methods buyers can choose, and the fields they fill in at checkout. Changes apply to new orders as soon as you save."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="checkout" />}
      />
      <CheckoutSettingsForm initial={checkout} />
    </>
  );
}
