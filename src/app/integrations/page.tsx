import { ProgramPage } from "@/components/ProgramPage";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({
  title: "Integrations",
  description:
    "Turn manifests into inventory without retyping. We're building point-of-sale, marketplace and accounting integrations — tell us which you use.",
  path: "/integrations",
});

const TOOLS = [
  ["Point of sale", "Push manifest lines into your POS as draft inventory with suggested prices."],
  ["Online marketplaces", "Export listings-ready CSVs for the marketplaces you sell on."],
  ["Accounting", "Sync PalletPort invoices and payments to your books."],
  ["Spreadsheets", "Download any manifest as CSV, or import manifests to list in bulk."],
];

export default function Integrations() {
  return (
    <ProgramPage
      eyebrow="Tools" title="Connect PalletPort to the tools you run on" hue={250} topic="INTEGRATIONS"
      lead="Turn manifests into inventory without retyping. We're building integrations with point-of-sale, marketplace and accounting tools — tell us which you use."
      formTitle="Request an integration" formCta="Send request" bodyLabel="Which tools do you use today?"
      benefits={TOOLS.map(([a, b]) => [a, b] as [string, string])}
      faqs={[["Is there an API?", "A read-only lots and orders API is on the roadmap. Request access through the form and we'll reach out when it's in beta."]]}
    />
  );
}
