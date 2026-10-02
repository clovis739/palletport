"use client";
import { ProductPhoto } from "@/components/lot/ProductPhoto";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { placeOrder } from "@/app/actions/orders";
import { SubmitButton } from "@/components/SubmitButton";
import { estimateShipments, freightTotal, MODE_LABEL, validZip, type ShipLine } from "@/lib/shipping";
import { NextIcon, PathSep } from "@/components/Icons";
import { PaymentSelect, type PaymentOption } from "@/components/checkout/PaymentSelect";
import type { CheckoutCustomField, CheckoutFieldSetting, PaymentIcon } from "@/lib/settings-schema";

type Item = {
  id: string; slug: string; title: string; hue: number; img: string; sellerId: string; sellerName: string;
  lotSize: string; condition: string; units: number; quantity: number; unitCents: number;
};
type Defaults = { shipName: string; shipAddress: string; shipCity: string; shipRegion: string; shipPostal: string; shipCountry: string; phone: string };

function usd(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(c / 100);
}

/** What the checkout page passes in from Admin → Site settings → Checkout (enabled methods only, in order). */
export type CheckoutConfig = {
  paymentTitle: string;
  methods: { id: string; name: string; description: string; icon: PaymentIcon; logo: string }[];
  fields: { phone: CheckoutFieldSetting; poNumber: CheckoutFieldSetting; notes: CheckoutFieldSetting };
  customFields: CheckoutCustomField[];
};

function Step({ n, title, children, aside, className = "" }: { n: number; title: string; children: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-3 font-display text-lg font-bold">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-sm text-white">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function CheckoutForm(props: {
  items: Item[];
  shipLines: ShipLine[];
  subtotalCents: number;
  discountCents: number;
  promoCode: string;
  /** "Promo SAVE10", "Referral reward", … */
  discountLabel?: string;
  pickupAvailable: boolean;
  net30Approved: boolean;
  taxExempt: boolean;
  email: string;
  defaults: Defaults;
  config: CheckoutConfig;
}) {
  const { items, shipLines, subtotalCents, discountCents, promoCode, discountLabel, pickupAvailable, net30Approved, taxExempt, email, defaults, config } = props;
  const paymentOptions: PaymentOption[] = config.methods.map((m) => ({
    ...m,
    locked: m.id === "NET30" && !net30Approved,
    lockedNote: "Verify your business to unlock (Account → Business verification).",
  }));
  const { phone: phoneField, poNumber: poField, notes: notesField } = config.fields;
  const [state, action] = useActionState(placeOrder, undefined);
  const [zip, setZip] = useState(defaults.shipPostal);
  const [method, setMethod] = useState<"FREIGHT" | "PICKUP">("FREIGHT");
  const [dock, setDock] = useState(false);
  const [residential, setResidential] = useState(false);
  const [payment, setPayment] = useState(() => paymentOptions.find((o) => !o.locked)?.id ?? "");

  const hasFreight = items.some((i) => i.lotSize !== "CASE");
  const shipments = useMemo(
    () => estimateShipments(shipLines, { toZip: zip, method, liftgate: !dock, residential }, subtotalCents),
    [shipLines, zip, method, dock, residential, subtotalCents],
  );
  const freight = freightTotal(shipments);
  const zipOk = validZip(zip) || method === "PICKUP";
  const total = subtotalCents - discountCents + freight;
  const bySeller = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of items) m.set(i.sellerId, [...(m.get(i.sellerId) ?? []), i]);
    return [...m.entries()];
  }, [items]);

  return (
    <form action={action} className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* On phones this wrapper dissolves so the order summary can sit just above the final step. */}
      <div className="contents lg:col-start-1 lg:row-start-1 lg:block lg:min-w-0 lg:space-y-5">
        <Step n={1} title="Delivery address" aside={<span className="min-w-0 break-all text-xs text-muted">{email}</span>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="shipName">Business / receiving name</label><input id="shipName" name="shipName" defaultValue={defaults.shipName} className="input" required autoComplete="organization" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="shipAddress">Street address</label><input id="shipAddress" name="shipAddress" defaultValue={defaults.shipAddress} className="input" required autoComplete="street-address" /></div>
            <div><label className="label" htmlFor="shipCity">City</label><input id="shipCity" name="shipCity" defaultValue={defaults.shipCity} className="input" required autoComplete="address-level2" /></div>
            <div><label className="label" htmlFor="shipRegion">State</label><input id="shipRegion" name="shipRegion" defaultValue={defaults.shipRegion} className="input" required autoComplete="address-level1" /></div>
            <div>
              <label className="label" htmlFor="shipPostal">ZIP code</label>
              <input id="shipPostal" name="shipPostal" value={zip} onChange={(e) => setZip(e.target.value)} className="input" required inputMode="numeric" autoComplete="postal-code" />
              {!validZip(zip) && zip.length > 0 && <p className="mt-1 text-xs text-rust">Enter a 5-digit ZIP to price freight.</p>}
            </div>
            <div><label className="label" htmlFor="shipCountry">Country</label><input id="shipCountry" name="shipCountry" defaultValue={defaults.shipCountry} className="input" required autoComplete="country-name" /></div>
          </div>
        </Step>

        <Step n={2} title="Delivery method">
          <div className={`grid gap-3 ${pickupAvailable ? "sm:grid-cols-2" : ""}`}>
            <label className={`min-w-0 cursor-pointer rounded-xl p-4 ${method ==="FREIGHT"?"bg-sand/50":""}`}>
              <input type="radio" name="deliveryMethod" value="FREIGHT" checked={method === "FREIGHT"} onChange={() => setMethod("FREIGHT")} className="sr-only" />
              <span className="block font-semibold">Ship to me</span>
              <span className="text-sm text-muted">{hasFreight ? "LTL freight or truckload to your address" : "Parcel delivery"}</span>
            </label>
            {pickupAvailable && (
              <label className={`min-w-0 cursor-pointer rounded-xl p-4 ${method ==="PICKUP"?"bg-sand/50":""}`}>
                <input type="radio" name="deliveryMethod" value="PICKUP" checked={method === "PICKUP"} onChange={() => setMethod("PICKUP")} className="sr-only" />
                <span className="block font-semibold">Warehouse pickup by appointment</span>
                <span className="text-sm text-muted">No freight charge. We&apos;ll email you to book a time; bring a truck or trailer that fits your order.</span>
              </label>
            )}
          </div>
          {!pickupAvailable && (
            <p className="mt-3 text-xs text-muted">
              Want to collect instead? Warehouse pickup{shipLines[0]?.shipsFrom ? ` in ${shipLines[0].shipsFrom}` : ""} is available by appointment only.{" "}
              <Link href="/contact?topic=pickup" className="font-semibold text-signal-dark underline-offset-2 hover:underline">Request it through Contact</Link> before you place your order.
            </p>
          )}
          {method === "FREIGHT" && hasFreight && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="flex items-start gap-2 rounded-lg p-3 text-sm">
                <input type="checkbox" name="dockAccess" checked={dock} onChange={(e) => setDock(e.target.checked)} className="mt-0.5 accent-signal" />
                <span><span className="font-semibold">I have a loading dock</span><span className="block text-xs text-muted">Otherwise a liftgate truck is booked (+$75 per shipment)</span></span>
              </label>
              <label className="flex items-start gap-2 rounded-lg p-3 text-sm">
                <input type="checkbox" name="residential" checked={residential} onChange={(e) => setResidential(e.target.checked)} className="mt-0.5 accent-signal" />
                <span><span className="font-semibold">Residential address</span><span className="block text-xs text-muted">Home or farm delivery (+$95 per shipment)</span></span>
              </label>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {shipments.map((s) => (
              <div key={s.sellerId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand/50 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">From our warehouse <span className="font-normal text-muted">· {s.shipsFrom}</span></p>
                  <p className="text-xs text-muted">{MODE_LABEL[s.mode]}{s.pallets ? ` · ${s.pallets} pallet${s.pallets > 1 ? "s" : ""}` : ""} · {s.weightLbs.toLocaleString()} lbs · {s.transitDays}</p>
                  {s.notes.map((n) => <p key={n} className="text-xs text-ink/70">{n}</p>)}
                </div>
                <p className="font-display font-bold">{!zipOk ? "—" : s.totalCents ? usd(s.totalCents) : "Free"}</p>
              </div>
            ))}
          </div>
        </Step>

        <Step n={3} title={config.paymentTitle}>
          <PaymentSelect name="paymentMethod" options={paymentOptions} value={payment} onChange={setPayment} />
          {paymentOptions.some((o) => o.locked) && (
            <a href="/account/verification" className="mt-2 inline-block text-xs font-semibold text-signal-dark hover:underline">Verify your business to unlock Net 30 terms<NextIcon /></a>
          )}
          {payment === "CARD" && (
            <div className="mt-4 rounded-xl p-4 text-sm text-muted">
              Card entry appears here once Stripe is connected (see README<PathSep />Payments). For now, orders are recorded and marked confirmed.
            </div>
          )}
          {(poField.show || phoneField.show) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {poField.show && (
                <div><label className="label" htmlFor="poNumber">{poField.label}</label><input id="poNumber" name="poNumber" maxLength={40} required={poField.required} placeholder={poField.placeholder || undefined} className="input" /></div>
              )}
              {phoneField.show && (
                <div><label className="label" htmlFor="phone">{phoneField.label}</label><input id="phone" name="phone" defaultValue={defaults.phone} required={phoneField.required} placeholder={phoneField.placeholder || undefined} className="input" inputMode="tel" autoComplete="tel" /></div>
              )}
            </div>
          )}
          {config.customFields.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {config.customFields.map((cf) => (
                <div key={cf.id} className={cf.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="label" htmlFor={`cf_${cf.id}`}>{cf.label}</label>
                  {cf.type === "textarea" ? (
                    <textarea id={`cf_${cf.id}`} name={`cf_${cf.id}`} rows={2} maxLength={500} required={cf.required} placeholder={cf.placeholder || undefined} className="input" />
                  ) : (
                    <input id={`cf_${cf.id}`} name={`cf_${cf.id}`} maxLength={200} required={cf.required} placeholder={cf.placeholder || undefined} className="input" />
                  )}
                </div>
              ))}
            </div>
          )}
          {notesField.show && (
            <div className="mt-4"><label className="label" htmlFor="notes">{notesField.label}</label><textarea id="notes" name="notes" rows={2} maxLength={500} required={notesField.required} className="input" placeholder={notesField.placeholder || undefined} /></div>
          )}
        </Step>

        <Step n={4} title="Review & place order" className="max-lg:order-last">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 shrink-0 accent-signal" />
            <span>
              I understand liquidation lots are sold <strong>as-is</strong> according to their condition grade, manifests may vary slightly, and I agree to the{" "}
              <a href="/legal/terms" target="_blank" className="font-semibold text-signal-dark underline">Terms</a> and{" "}
              <a href="/legal/returns-and-disputes" target="_blank" className="font-semibold text-signal-dark underline">Return & Refund Policy</a>.
            </span>
          </label>
          {state?.error && <p className="mt-4 rounded-lg bg-rust/10 p-3 text-sm font-medium text-rust">{state.error}</p>}
          <div className="mt-5 lg:hidden">
            <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="Placing order…">Place order · {usd(total)}</SubmitButton>
          </div>
        </Step>
      </div>

      {/* Summary */}
      <aside className="h-fit min-w-0 space-y-4 lg:col-start-2 lg:row-start-1 lg:[@media(min-height:560px)]:sticky lg:[@media(min-height:560px)]:top-[148px] lg:[@media(min-height:560px)]:max-h-[calc(100dvh-164px)] lg:[@media(min-height:560px)]:overflow-y-auto lg:[@media(min-height:560px)]:overscroll-contain">
        <div className="card overflow-hidden">
          <div className="bg-sand/50 px-4 py-3 sm:px-5">
            <h2 className="font-display font-bold">Order summary</h2>
            <p className="text-xs text-muted">{items.reduce((a, i) => a + i.quantity, 0)} lot{items.length === 1 && items[0].quantity === 1 ? "" : "s"}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {bySeller.map(([sid, list]) => (
              <div key={sid} className="px-4 py-3 sm:px-5">
                
                {list.map((i) => (
                  <div key={i.id} className="flex gap-3 py-1.5">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md"><ProductPhoto src={i.img} alt="" width={64} height={48} loading="lazy" decoding="async" className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2 font-medium leading-snug">{i.title}</p>
                      <p className="text-xs text-muted">{i.quantity > 1 ? `${i.quantity} × ` : ""}{`${i.units.toLocaleString()} units`}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{usd(i.unitCents * i.quantity)}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <dl className="space-y-2 px-4 py-4 text-sm sm:px-5">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{usd(subtotalCents)}</dd></div>
            {discountCents > 0 && <div className="flex justify-between text-moss"><dt>{discountLabel || `Promo ${promoCode}`}</dt><dd>−{usd(discountCents)}</dd></div>}
            <div className="flex justify-between"><dt>{method === "PICKUP" ? "Warehouse pickup" : "Freight"}</dt><dd>{!zipOk ? "Enter ZIP" : freight ? usd(freight) : "Free"}</dd></div>
            <div className="flex justify-between gap-3"><dt>Sales tax</dt><dd className="text-right">{taxExempt ? "Exempt (certificate on file)" : "Calculated on invoice"}</dd></div>
            <div className="flex justify-between pt-3 text-base font-bold"><dt>Total</dt><dd className="font-display text-xl">{usd(total)}</dd></div>
          </dl>
          <div className="hidden p-5 lg:block">
            <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="Placing order…">Place order</SubmitButton>
            <p className="mt-2 text-center text-[11px] text-muted">You'll be able to track your shipment from your orders page.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-sand/60 p-4 text-xs text-ink/75">
          <p className="font-semibold text-ink">Buyer protection</p>
          <p className="mt-1">If the order doesn't match its written listing in a material way, contact us within 15 days of pickup or delivery with photos. See our Return & Refund Policy.</p>
        </div>
      </aside>
    </form>
  );
}
