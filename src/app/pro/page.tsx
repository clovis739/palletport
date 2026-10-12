import { ProgramPage } from "@/components/ProgramPage";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({
  title: "PalletPort Pro: membership for weekly pallet buyers",
  absoluteTitle: true,
  description:
    "For resellers who buy every week: $100 shipping per order, 24-hour early access to new lots, Net 60 terms and priority support.",
  path: "/pro",
});

export default function Pro() {
  return (
    <ProgramPage
      eyebrow="Membership" title="PalletPort Pro" hue={24} topic="PRO"
      lead="A membership for resellers who buy every week. Lower freight, first look at new lots and extended payment terms."
      formTitle="Join the Pro waitlist" formCta="Request an invite" bodyLabel="Roughly how many pallets do you buy per month?"
      benefits={[
        ["$100 shipping per order", "One flat delivery fee for your whole order."],
        ["Early access", "See new lots 24 hours before everyone else."],
        ["Net 60 terms", "For approved members with a good payment history."],
        ["Priority support", "A named account manager and same-day replies."],
      ]}
      steps={["Request an invite with your monthly volume.", "We review your order history and verification.", "Pro benefits switch on automatically at checkout."]}
      faqs={[
        ["How much does Pro cost?", "Pricing is being finalized with early members. Join the waitlist to hear first."],
        ["Can I cancel?", "Yes — membership is month to month."],
        ["Do I get better prices on truckloads?", "Pro members get first call on new truckloads and can ask our team for bundle pricing."],
      ]}
    />
  );
}
