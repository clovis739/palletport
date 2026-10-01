import { ProgramPage } from "@/components/ProgramPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Affiliate program for reseller communities",
  description:
    "Creators, coaches and reseller communities can earn a commission on the first 12 months of purchases from businesses they refer to PalletPort.",
  path: "/affiliates",
});

export default function Affiliates() {
  return (
    <ProgramPage
      eyebrow="Partners" title="Earn by sending resellers to PalletPort" hue={150} topic="AFFILIATE"
      lead="Creators, coaches and communities in the reselling space can earn a commission on the first 12 months of purchases from businesses they refer."
      formTitle="Apply to be an affiliate" formCta="Apply" bodyLabel="Where's your audience? (channel links, community size)"
      benefits={[
        ["2% of purchases", "On referred buyers' orders for their first 12 months."],
        ["Monthly payouts", "Paid by ACH once you pass $50."],
        ["Custom codes", "Give your audience a first-order discount."],
        ["Real-time dashboard", "Track sign-ups and earnings."],
      ]}
      faqs={[
        ["Who can apply?", "Anyone with an audience of resellers — YouTube, TikTok, newsletters, Facebook groups, podcasts or courses."],
        ["Is this different from buyer referrals?", "Yes. Every buyer can refer other businesses from their account for a one-time credit; affiliates earn ongoing commission."],
      ]}
    />
  );
}
