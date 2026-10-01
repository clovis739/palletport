import { ProgramPage } from "@/components/ProgramPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Truckload & volume liquidation buying",
  description:
    "Retail chains, exporters and wholesalers buying 10+ truckloads a month get dedicated sourcing, consolidated freight and custom terms from our warehouse.",
  path: "/volume-buyers",
});

export default function VolumeBuyers() {
  return (
    <ProgramPage
      eyebrow="For multi-store and high-volume buyers" title="Buy by the truckload, on your terms" hue={215} topic="VOLUME"
      lead="Retail chains, exporters and wholesalers buying 10+ truckloads a month get dedicated sourcing, consolidated freight and custom payment terms."
      formTitle="Talk to our sourcing team" formCta="Request a call" bodyLabel="Categories, monthly volume and delivery locations"
      benefits={[
        ["Dedicated sourcing", "We reserve recurring loads from our inbound supply for you."],
        ["Consolidated freight", "We build mixed truckloads to your spec from our warehouse."],
        ["Custom terms", "Net 60/90 and invoice billing for approved accounts."],
        ["Multi-location delivery", "Split orders across stores or warehouses."],
      ]}
      steps={["Share your categories, grades and monthly volume.", "We prepare a trial load to your spec.", "Recurring orders run on a schedule with one invoice."]}
      faqs={[
        ["Is there a minimum?", "The program is designed for buyers purchasing roughly 10 or more truckloads a month."],
        ["Can you handle export paperwork?", "We can connect you with freight forwarders; we provide weights, dimensions and commercial invoices."],
      ]}
    />
  );
}
