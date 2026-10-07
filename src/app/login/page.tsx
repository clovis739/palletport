import Link from "next/link";
import { AuthForm } from "./AuthForm";
import { privateMetadataT } from "@/lib/seo";
import { getBrand } from "@/lib/brand";
import { getI18n } from "@/i18n/server";

export const generateMetadata = () => privateMetadataT("Sign in");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; expired?: string }> }) {
  const brand = await getBrand();
  const { t, lh } = await getI18n();
  const { next = "/", reset, expired } = await searchParams;
  return (
    <div className="container-pp grid max-w-md py-10 sm:py-16">
      <h1 className="font-display text-3xl font-bold">{t("Welcome back")}</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{t("Sign in to your account.")}</p>
      {expired && (
        <p className="mb-4 rounded-lg bg-amber-100 p-3 text-sm font-medium text-amber-900">{t("Your session expired. Sign in again to continue — nothing you saved was lost.")}</p>
      )}
      {reset && <p className="mb-4 rounded-lg bg-moss/10 p-3 text-sm font-medium text-moss">{t("Password updated. Sign in with your new password.")}</p>}
      <AuthForm mode="login" next={next} />
      <p className="mt-6 text-center text-sm">
        {t("New to {brand}?", { brand })} <Link href={`${lh("/register")}?next=${encodeURIComponent(next)}`} className="font-semibold text-signal-dark hover:underline">{t("Create an account")}</Link>
      </p>
    </div>
  );
}
