import Link from "next/link";
import { Building2, ChevronRight, ShoppingCart } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { StoreSettingsForm } from "./StoreSettingsForm";

export const metadata = { title: "Store settings" };

export default async function StoreSettingsPage() {
  const { seller } = await requireAdmin("/dashboard/settings");
  return (
    <>
      <PageHeader title="Store settings" description="Checkout rules, delivery options and the store bio. Owner only." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <StoreSettingsForm minOrder={seller.minOrderCents / 100} pickup={seller.pickup} bio={seller.bio} />
        </Card>
        <div className="min-w-0 space-y-4">
          <Link href="/dashboard/site/business" className="group flex items-start gap-3 rounded-2xl bg-white p-5 transition focus-visible:outline-2 focus-visible:outline-signal">
            <Building2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
            <span className="min-w-0 flex-1">
              <span className="block font-display font-bold">Store name &amp; warehouse location</span>
              <span className="mt-1 block text-sm text-muted">Moved to Site settings → Business profile, together with contact details, hours and social links.</span>
            </span>
            <ChevronRight aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted group-hover:text-ink" />
          </Link>
          <div className="rounded-2xl bg-sand p-5 text-sm">
            <p className="flex items-center gap-2 font-display font-bold"><ShoppingCart aria-hidden className="h-4 w-4" /> Pricing</p>
            <p className="mt-1 text-ink/75">Every lot sells at a fixed price. Price and quantity in stock are set per lot in the lot editor, or inline from the lots table.</p>
          </div>
        </div>
      </div>
    </>
  );
}
