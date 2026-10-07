import Link from "next/link";
import { AuthForm } from "../login/AuthForm";
import { CircleCheck } from "lucide-react";
import { privateMetadataT } from "@/lib/seo";
import { findReferrer } from "@/lib/referrals";
import { getI18n } from "@/i18n/server";

export const generateMetadata = () => privateMetadataT("Create an account");

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; ref?: string }> }) {
  const { next = "/lots", ref = "" } = await searchParams;
  const referrer = ref ? await findReferrer(ref) : null;
  const { t, lh } = await getI18n();
  return (
    <div className="container-pp grid max-w-5xl items-start gap-8 py-10 sm:py-16 md:grid-cols-2 md:gap-10">
      <div className="min-w-0 space-y-5">
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">{t("Buy wholesale pallets for your business")}</h1>
        <ul className="space-y-3 text-sm text-ink/80">
          {[
            "Full manifests on every lot — no mystery boxes",
            "Pay by card, wire, or Net 30 once approved",
            "Free freight on orders over $7,500",
            "Every pallet sorted and manifested in our own warehouse",
          ].map((x) => (
            <li key={x} className="flex gap-2"><CircleCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-signal" />{t(x)}</li>
          ))}
        </ul>
      </div>
      <div className="min-w-0">
        {referrer ? (
          <p className="mb-3 rounded-lg bg-moss/10 p-3 text-sm font-medium text-moss">{t("You were referred by another business. You'll get $100 off your first order of $1,000 or more, automatically at checkout.")}</p>
        ) : ref ? (
          <p className="mb-3 rounded-lg bg-sand p-3 text-sm">{t("That referral link isn't valid. Check it with the business that shared it. You can still create your account.")}</p>
        ) : null}
        <AuthForm mode="register" next={next} referral={referrer?.referralCode ?? ""} />
        <p className="mt-6 text-center text-sm">
          {t("Already have an account?")} <Link href={`${lh("/login")}?next=${encodeURIComponent(next)}`} className="font-semibold text-signal-dark hover:underline">{t("Sign in")}</Link>
        </p>
      </div>
    </div>
  );
}
