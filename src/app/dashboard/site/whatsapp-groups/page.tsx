import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { WhatsAppGroupsForm } from "./WhatsAppGroupsForm";

export const metadata = { title: "WhatsApp groups" };

export default async function WhatsAppGroupsPage() {
  await requireStaff("site", "/dashboard/site/whatsapp-groups");
  const { whatsappGroups } = await getStoredSettings();
  return (
    <>
      <PageHeader
        title="WhatsApp groups"
        description="The “Join our WhatsApp groups” popup and the Join bar above the header. Paste a new invite link and save: the site uses it straight away."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="whatsappGroups" />}
      />
      <WhatsAppGroupsForm initial={whatsappGroups} />
    </>
  );
}
