import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { linkSuggestions } from "../_components/linkSuggestions";
import { LinkSuggestionsProvider } from "../_components/fields";
import { ContactForm } from "./ContactForm";

export const metadata = { title: "Contact page" };

export default async function ContactSettingsPage() {
  const { seller } = await requireStaff("site", "/dashboard/site/contact");
  const [{ contact }, groups] = await Promise.all([getStoredSettings(), linkSuggestions()]);
  return (
    <>
      <PageHeader
        title="Contact page"
        description="The text on /contact. Email, phone, WhatsApp, address, hours, pickup note and warehouse photos come from the Business profile."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="contact" />}
      />
      <LinkSuggestionsProvider groups={groups}>
        <ContactForm initial={contact} storeName={seller.name} storeLocation={seller.location} />
      </LinkSuggestionsProvider>
    </>
  );
}
