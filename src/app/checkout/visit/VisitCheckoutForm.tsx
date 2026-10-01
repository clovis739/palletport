"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CreditCard, Landmark } from "lucide-react";
import { bookVisit } from "@/app/actions/visits";
import { SubmitButton } from "@/components/SubmitButton";

export function VisitCheckoutForm({
  lotId,
  qty,
  at,
  defaultName,
  defaultPhone,
  deposit,
  dueNowLabel,
}: {
  lotId: string;
  qty: number;
  at: string;
  defaultName: string;
  defaultPhone: string;
  deposit: boolean;
  dueNowLabel: string;
}) {
  const [state, action] = useActionState(bookVisit, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lotId" value={lotId} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="at" value={at} />
      {state?.error && <p role="alert" className="rounded-xl bg-rust/10 p-3 text-sm font-medium text-rust">{state.error}</p>}

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Who is collecting?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="collectorName">Full name</label>
            <input id="collectorName" name="collectorName" defaultValue={defaultName} className="input" required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (for the day of the visit)</label>
            <input id="phone" name="phone" type="tel" defaultValue={defaultPhone} className="input" autoComplete="tel" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">Notes (vehicle, trailer, helpers…)</label>
          <textarea id="notes" name="notes" rows={3} maxLength={500} className="input" placeholder="e.g. Box truck with liftgate, 2 people" />
        </div>
      </section>

      <section className="card space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Payment</h2>
        <p className="text-sm text-muted">{deposit ? `Pay the 35% deposit now (${dueNowLabel}) and the balance at your visit.` : `Pay the full amount now (${dueNowLabel}).`}</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cfd4dc] bg-white p-4 has-[:checked]:border-signal has-[:checked]:bg-signal/5">
          <input type="radio" name="paymentMethod" value="CARD" defaultChecked className="mt-1 h-4 w-4 accent-signal" />
          <span>
            <span className="flex items-center gap-2 font-semibold"><CreditCard aria-hidden className="h-4 w-4" /> Card</span>
            <span className="text-sm text-muted">Pay {dueNowLabel} now. Your visit is confirmed straight away.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cfd4dc] bg-white p-4 has-[:checked]:border-signal has-[:checked]:bg-signal/5">
          <input type="radio" name="paymentMethod" value="WIRE" className="mt-1 h-4 w-4 accent-signal" />
          <span>
            <span className="flex items-center gap-2 font-semibold"><Landmark aria-hidden className="h-4 w-4" /> Wire / ACH</span>
            <span className="text-sm text-muted">We send payment details. The visit is confirmed once {dueNowLabel} arrives.</span>
          </span>
        </label>
      </section>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 shrink-0 accent-signal" required />
        <span>
          I understand the visit is confirmed once the payment above is received, and that the payment is refundable if the product doesn&apos;t match its listing after inspection. See{" "}
          <Link href="/legal/returns-and-disputes" className="font-semibold text-signal-dark hover:underline">Return &amp; Refund Policy</Link>.
        </span>
      </label>

      <SubmitButton className="btn-primary w-full py-3.5 text-base sm:w-auto sm:px-10" pendingText="Booking…">
        {`Book visit · ${dueNowLabel} due now`}
      </SubmitButton>
    </form>
  );
}
