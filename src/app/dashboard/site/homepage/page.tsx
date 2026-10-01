import { requireStaff } from "@/lib/auth";
import { getStoredSettings, homeSectionOrder } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { linkSuggestions } from "../_components/linkSuggestions";
import { LinkSuggestionsProvider } from "../_components/fields";
import { HomeForm } from "./HomeForm";

export const metadata = { title: "Homepage" };

export default async function HomepageSettingsPage() {
  await requireStaff("site", "/dashboard/site/homepage");
  const [{ home }, groups] = await Promise.all([getStoredSettings(), linkSuggestions()]);
  return (
    <>
      <PageHeader
        title="Homepage"
        description="The hero, the live stats strip and every section below it. Lots, categories and counts stay live; you control the words, the photo, what shows and in which order."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="home" />}
      />
      <LinkSuggestionsProvider groups={groups}>
        <HomeForm initial={{ ...home, order: homeSectionOrder(home) }} />
      </LinkSuggestionsProvider>
    </>
  );
}
