import { lotCover } from "@/lib/lotImages";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { CheckoutForm } from "./CheckoutForm";
import { PrevIcon } from "@/components/Icons";
import { Lock } from "lucide-react";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Checkout");

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart(user.id);
  if (cart.items.length === 0 || cart.minimumsUnmet.length > 0 || cart.unavailable.length > 0) redirect("/cart");

  const pickupSellers = [...new Set(cart.items.filter((i) => i.lot.seller.pickup).map((i) => i.lot.sellerId))];
  const allPickup = [...new Set(cart.items.map((i) => i.lot.sellerId))].every((id) => pickupSellers.includes(id));

  return (
    <div className="container-pp py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/cart" className="text-xs text-muted hover:underline"><PrevIcon />Back to cart</Link>
          <h1 className="font-display text-3xl font-bold">Checkout</h1>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock aria-hidden className="h-4 w-4" />
          Secure checkout
        </p>
      </div>
      <CheckoutForm
        items={cart.items.map((i) => ({
          id: i.id,
          slug: i.lot.slug,
          title: i.lot.title,
          hue: i.lot.category.hue,
          img: lotCover(i.lot, 160, 4 / 3).src,
          sellerId: i.lot.sellerId,
          sellerName: i.lot.seller.name,
          lotSize: i.lot.lotSize,
          condition: i.lot.condition,
          units: i.lot.units,
          quantity: i.quantity,
          unitCents: i.unitCents,
        }))}
        shipLines={cart.shipLines}
        subtotalCents={cart.subtotalCents}
        discountCents={cart.discountCents}
        promoCode={cart.promo?.ok ? cart.promoCode : ""}
        pickupAvailable={allPickup}
        net30Approved={user.certStatus === "APPROVED"}
        taxExempt={user.certStatus === "APPROVED"}
        email={user.email}
        defaults={{
          shipName: user.businessName ?? user.name,
          shipAddress: user.shipAddress ?? "",
          shipCity: user.shipCity ?? "",
          shipRegion: user.shipRegion ?? "",
          shipPostal: user.shipPostal ?? "",
          shipCountry: user.shipCountry ?? "United States",
          phone: user.phone ?? "",
        }}
      />
    </div>
  );
}
