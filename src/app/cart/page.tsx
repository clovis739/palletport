import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { updateCartItem } from "@/app/actions/cart";
import { applyPromo, removePromo } from "@/app/actions/promo";
import { LotThumb } from "@/components/lot/LotThumb";
import { ConditionBadge } from "@/components/ConditionBadge";
import { FREE_FREIGHT_THRESHOLD_CENTS, money } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Cart");

export default async function CartPage() {
  const user = await requireUser("/cart");
  const cart = await getCart(user.id);
  const toFree = FREE_FREIGHT_THRESHOLD_CENTS - cart.subtotalCents;

  if (cart.items.length === 0) {
    return (
      <div className="container-pp grid place-items-center py-16 sm:py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Find a pallet that fits your store.</p>
        <Link href="/lots" className="btn-primary mt-6">Browse lots</Link>
      </div>
    );
  }

  // Everything ships together from our warehouse (grouped by location in case you add more warehouses).
  const bySeller = new Map<string, typeof cart.items>();
  for (const i of cart.items) {
    const list = bySeller.get(i.lot.shipsFrom) ?? [];
    list.push(i);
    bySeller.set(i.lot.shipsFrom, list);
  }

  return (
    <div className="container-pp py-10">
      <h1 className="mb-6 font-display text-3xl font-bold">Cart</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {[...bySeller.entries()].map(([seller, items]) => (
            <div key={seller} className="card overflow-hidden">
              <div className="bg-sand/50 px-4 py-3 text-sm font-semibold sm:px-5">Ships from our warehouse in {seller}</div>
              <ul >
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                    <Link href={`/lots/${i.lot.slug}`} className="w-20 shrink-0 self-start overflow-hidden rounded-xl sm:w-28">
                      <LotThumb lot={i.lot} />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link href={`/lots/${i.lot.slug}`} className="block break-words font-display font-semibold hover:underline">{i.lot.title}</Link>
                      <p className="font-display text-lg font-bold sm:hidden">{money(i.unitCents * i.quantity)}</p>
                      {!i.purchasable && <p className="text-xs font-semibold text-rust">No longer available — remove it to continue</p>}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <ConditionBadge condition={i.lot.condition} />
                        <span>{i.lot.units.toLocaleString()} units · {i.lot.palletCount} pallet{i.lot.palletCount > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <form action={updateCartItem}>
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="quantity" value={i.quantity - 1} />
                          <button className="grid h-10 w-10 place-items-center rounded-full sm:h-8 sm:w-8" aria-label="Decrease"><Minus aria-hidden className="h-4 w-4" /></button>
                        </form>
                        <span className="w-6 text-center font-semibold">{i.quantity}</span>
                        <form action={updateCartItem}>
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="quantity" value={i.quantity + 1} />
                          <button disabled={i.quantity >= i.lot.available} className="grid h-10 w-10 place-items-center rounded-full disabled:opacity-40 sm:h-8 sm:w-8" aria-label="Increase"><Plus aria-hidden className="h-4 w-4" /></button>
                        </form>
                        <form action={updateCartItem} className="ml-3">
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="quantity" value={0} />
                          <button className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-rust hover:underline sm:min-h-0"><Trash2 aria-hidden className="h-3.5 w-3.5" /> Remove</button>
                        </form>
                      </div>
                    </div>
                    <p className="hidden shrink-0 font-display text-lg font-bold sm:block">{money(i.unitCents * i.quantity)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <aside className="card h-fit min-w-0 space-y-4 p-5 sm:p-6 lg:sticky lg:top-40">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{money(cart.subtotalCents)}</dd></div>
            {cart.discountCents > 0 && (
              <div className="flex justify-between text-moss"><dt>Promo {cart.promoCode}</dt><dd className="font-semibold">−{money(cart.discountCents)}</dd></div>
            )}
            <div className="flex justify-between gap-3"><dt>Est. freight{cart.freightOpts.toZip ? ` to ${cart.freightOpts.toZip}` : ""}</dt><dd className="font-semibold">{cart.shippingCents ? money(cart.shippingCents) : "Free"}</dd></div>
            <div className="flex justify-between pt-2 text-base"><dt className="font-semibold">Total</dt><dd className="font-display font-bold">{money(cart.totalCents)}</dd></div>
          </dl>
          {toFree > 0 && (
            <p className="rounded-lg bg-sand p-3 text-xs">Add <strong>{money(toFree)}</strong> more to unlock free freight.</p>
          )}
          {cart.promo && !cart.promo.ok ? (
            <p className="text-xs font-medium text-rust">{cart.promoCode}: {cart.promo.error}</p>
          ) : null}
          {cart.promoCode ? (
            <form action={removePromo} className="flex items-center justify-between gap-3 rounded-lg bg-sand px-3 py-2 text-xs">
              <span className="min-w-0 break-words">Code <strong className="font-mono">{cart.promoCode}</strong>{cart.promo?.ok ? ` — ${cart.promo.description}` : ""}</span>
              <button className="shrink-0 py-1 font-semibold text-rust">Remove</button>
            </form>
          ) : (
            <form action={applyPromo} className="flex gap-2">
              <input name="code" placeholder="Promo code" className="input py-2 uppercase" aria-label="Promo code" />
              <button className="btn-ghost shrink-0 py-2">Apply</button>
            </form>
          )}
          {cart.minimumsUnmet.length > 0 && (
            <div className="rounded-lg bg-amber-100 p-3 text-xs text-amber-900">
              {cart.minimumsUnmet.map((m) => (
                <p key={m.name}>Add {money(m.min - m.total)} more to reach our {money(m.min)} minimum order.</p>
              ))}
            </div>
          )}
          {cart.unavailable.length > 0 ? (
            <button disabled className="btn-primary w-full py-3">Remove unavailable lots to check out</button>
          ) : cart.minimumsUnmet.length > 0 ? (
            <button disabled className="btn-primary w-full py-3">Reach the minimum order to check out</button>
          ) : (
            <Link href="/checkout" className="btn-primary w-full py-3">Continue to checkout</Link>
          )}
          <Link href="/lots" className="block text-center text-sm font-semibold text-muted hover:text-ink">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
