"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CreditCard, Landmark } from "lucide-react";
import { bookVisit } from "@/app/actions/visits";
import { SubmitButton } from "@/components/SubmitButton";
import { useI18n } from "@/i18n/client";

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
  const { t, lh } = useI18n();
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lotId" value={lotId} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="at" value={at} />
      {state?.error && <p role="alert" className="rounded-xl bg-rust/10 p-3 text-sm font-medium text-rust">{state.error}</p>}

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">{t("Who is collecting?")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="collectorName">{t("Full name")}</label>
            <input id="collectorName" name="collectorName" defaultValue={defaultName} className="input" required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="phone">{t("Phone (for the day of the visit)")}</label>
            <input id="phone" name="phone" type="tel" defaultValue={defaultPhone} className="input" autoComplete="tel" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">{t("Notes (vehicle, trailer, helpers…)")}</label>
          <textarea id="notes" name="notes" rows={3} maxLength={500} className="input" placeholder={t("e.g. Box truck with liftgate, 2 people")} />
        </div>
      </section>

      <section className="card space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">{t("Payment")}</h2>
        <p className="text-sm text-muted">{deposit ? t("Pay the 35% deposit now ({amount}) and the balance at your visit.", { amount: dueNowLabel }) : t("Pay the full amount now ({amount}).", { amount: dueNowLabel })}</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cfd4dc] bg-white p-4 has-[:checked]:border-signal has-[:checked]:bg-signal/5">
          <input type="radio" name="paymentMethod" value="CARD" defaultChecked className="mt-1 h-4 w-4 accent-signal" />
          <span>
            <span className="flex items-center gap-2 font-semibold"><CreditCard aria-hidden className="h-4 w-4" /> {t("Card")}</span>
            <span className="text-sm text-muted">{t("Pay {amount} now. Your visit is confirmed straight away.", { amount: dueNowLabel })}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cfd4dc] bg-white p-4 has-[:checked]:border-signal has-[:checked]:bg-signal/5">
          <input type="radio" name="paymentMethod" value="WIRE" className="mt-1 h-4 w-4 accent-signal" />
          <span>
            <span className="flex items-center gap-2 font-semibold"><Landmark aria-hidden className="h-4 w-4" /> {t("Wire / ACH")}</span>
            <span className="text-sm text-muted">{t("We send payment details. The visit is confirmed once {amount} arrives.", { amount: dueNowLabel })}</span>
          </span>
        </label>
      </section>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 shrink-0 accent-signal" required />
        <span>
          {t("I understand the visit is confirmed once the payment above is received, and that the payment is refundable if the product doesn't match its listing after inspection. See")}{" "}
          <Link href={lh("/legal/returns-and-disputes")} className="font-semibold text-signal-dark hover:underline">{t("Return & Refund Policy")}</Link>.
        </span>
      </label>

      <SubmitButton className="btn-primary w-full py-3.5 text-base sm:w-auto sm:px-10" pendingText={t("Booking…")}>
        {t("Book visit · {amount} due now", { amount: dueNowLabel })}
      </SubmitButton>
    </form>
  );
}
