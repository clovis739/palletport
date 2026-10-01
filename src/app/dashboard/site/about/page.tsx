import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { linkSuggestions } from "../_components/linkSuggestions";
import { LinkSuggestionsProvider } from "../_components/fields";
import { AboutForm } from "./AboutForm";

export const metadata = { title: "About page" };

export default async function AboutSettingsPage() {
  const { seller } = await requireStaff("site", "/dashboard/site/about");
  const [{ about }, groups] = await Promise.all([getStoredSettings(), linkSuggestions()]);
  const photos = [...about.heroPhotos, "", "", "", ""].slice(0, 4);
  return (
    <>
      <PageHeader
        title="About page"
        description="Every text and photo on /about. The numbers and the “Who buys from us” guide cards stay live."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="about" />}
      />
      <LinkSuggestionsProvider groups={groups}>
        <AboutForm initial={{ ...about, heroPhotos: photos }} storeName={seller.name} storeLocation={seller.location} />
      </LinkSuggestionsProvider>
    </>
  );
}
