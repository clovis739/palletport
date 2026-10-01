import { getStore } from "@/lib/store";
import { getSetting } from "@/lib/settings";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/** Site-wide Organization (OnlineStore) + WebSite JSON-LD, rendered once from the root layout. Contact facts: `business` settings. */
export async function SiteJsonLd() {
  const [store, business] = await Promise.all([getStore(), getSetting("business")]);
  return <JsonLd data={[organizationJsonLd(store, business), websiteJsonLd(store.name)]} />;
}
