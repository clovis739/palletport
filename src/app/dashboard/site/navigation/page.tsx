import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStoredSettings, headerTones } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { AreaActions } from "../_components/areas";
import { linkSuggestions } from "../_components/linkSuggestions";
import { LinkSuggestionsProvider } from "../_components/fields";
import { NavigationForm } from "./NavigationForm";

export const metadata = { title: "Navigation" };

export default async function NavigationPage() {
  await requireStaff("site", "/dashboard/site/navigation");
  const [{ navigation }, groups, categories] = await Promise.all([
    getStoredSettings(),
    linkSuggestions(),
    db.category.findMany({ orderBy: { name: "asc" }, select: { name: true } }).catch(() => []),
  ]);
  // Show the effective style of each header link (older saves have no explicit tone).
  const tones = headerTones(navigation.header);
  const initial = {
    ...navigation,
    mobileExtra: navigation.mobileExtra ?? [],
    header: navigation.header.map((h, i) => ({ ...h, tone: tones[i], children: h.children ?? [] })),
  };
  return (
    <>
      <PageHeader
        title="Navigation"
        description="Menus in the header, the mobile drawer and the footer. Drag rows or use the arrows to reorder."
        back={{ href: "/dashboard/site", label: "Site settings" }}
        actions={<AreaActions area="navigation" />}
      />
      <LinkSuggestionsProvider groups={groups}>
        <NavigationForm initial={initial} categories={categories.map((c) => c.name)} />
      </LinkSuggestionsProvider>
    </>
  );
}
