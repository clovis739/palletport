import { requireStaff } from "@/lib/auth";
import { getStoredSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { linkSuggestions } from "../_components/linkSuggestions";
import { LinkSuggestionsProvider } from "../_components/fields";
import { AnnouncementForm } from "./AnnouncementForm";

export const metadata = { title: "Announcement bar" };

export default async function AnnouncementPage() {
  await requireStaff("site", "/dashboard/site/announcement");
  const [{ announcement }, groups] = await Promise.all([getStoredSettings(), linkSuggestions()]);
  return (
    <>
      <PageHeader
        title="Announcement bar"
        description="A short message in a strip above the header on every page. Visitors can close it; it comes back for them when you change the text."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="announcement" />}
      />
      <LinkSuggestionsProvider groups={groups}>
        <AnnouncementForm initial={{ ...announcement, mobileText: announcement.mobileText ?? "", href: announcement.href ?? "", linkLabel: announcement.linkLabel ?? "" }} />
      </LinkSuggestionsProvider>
    </>
  );
}
