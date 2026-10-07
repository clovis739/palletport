import Link from "next/link";
import { ProgramPage } from "@/components/ProgramPage";
import { pageMetadata } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export const generateMetadata = () => pageMetadata({
  title: "Warehouse Days: buying events & lot drops",
  description:
    "Online buying events where we release batches of manifested lots at once. Join the list to get dates. Warehouse visits are by appointment only.",
  path: "/events",
});

export default async function Events() {
  const { t, lh } = await getI18n();
  return (
    <ProgramPage
      eyebrow="Events" title="Warehouse Days" hue={330} topic="EVENTS"
      lead="Buying events where we release a batch of manifested lots at the same time. Join the list and we'll email you the dates. We don't run a walk-in store; visits to our warehouse are by appointment only."
      formTitle="Get event invites" formCta="Notify me" bodyLabel="What do you buy? (categories, lot sizes)"
      benefits={[
        ["Batch releases", "A group of lots goes live together, so you can plan a full load."],
        ["Manifests first", "Every event lot has its manifest and condition grade on the lot page."],
        ["Freight by ZIP", "Each lot shows a delivery estimate for your ZIP before you order."],
        ["Pickup by appointment", "Want to collect instead? Book a weekday pickup visit from the lot page."],
      ]}
      extra={
        <div className="mt-14">
          <h2 className="mb-3 font-display text-2xl font-bold">{t("Upcoming")}</h2>
          <p className="card p-5 text-sm text-muted">
            {t("No events are scheduled right now. Join the list above and we'll email you when the next one is set. Questions about visiting the warehouse?")}{" "}
            <Link href={lh("/contact?topic=pickup")} className="font-semibold text-signal-dark hover:underline">{t("Contact us")}</Link>.
          </p>
        </div>
      }
    />
  );
}
