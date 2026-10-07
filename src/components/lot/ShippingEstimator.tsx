"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { estimateShipments, MODE_LABEL, validZip, type ShipLine } from "@/lib/shipping";
import { useI18n } from "@/i18n/client";
import { translateShipNote } from "@/i18n/config";

function usd(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(c / 100);
}

export function ShippingEstimator({ line, defaultZip, pickup }: { line: ShipLine; defaultZip?: string | null; pickup: boolean }) {
  const { t, lh } = useI18n();
  const [zip, setZip] = useState(defaultZip ?? "");
  const [dock, setDock] = useState(false);
  const [residential, setResidential] = useState(false);
  const [method, setMethod] = useState<"FREIGHT" | "PICKUP">("FREIGHT");
  const ok = validZip(zip);
  const est = useMemo(
    () => (ok || method === "PICKUP" ? estimateShipments([line], { toZip: zip, method, liftgate: !dock, residential }, line.priceCents)[0] : null),
    [ok, zip, method, dock, residential, line],
  );

  return (
    <div className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="font-display font-bold">{t("Estimate shipping")}</p>
        <span className="min-w-0 truncate text-xs text-muted">{t("From {place}", { place: line.shipsFrom })}</span>
      </div>
      {pickup && (
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-sand p-1 text-xs font-semibold">
          {(["FREIGHT", "PICKUP"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} className={`min-h-9 rounded-md py-1.5 ${method === m ?"bg-white":"text-muted"}`}>
              {t(m === "FREIGHT" ? "Deliver" : "Pickup by appt.")}
            </button>
          ))}
        </div>
      )}
      {method === "FREIGHT" && (
        <>
          <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder={t("Delivery ZIP code")} inputMode="numeric" maxLength={10} className="input" aria-label={t("Delivery ZIP code")} />
          {line.lotSize !== "CASE" && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <label className="flex min-h-8 items-center gap-2"><input type="checkbox" checked={dock} onChange={(e) => setDock(e.target.checked)} className="accent-signal" /> {t("Loading dock")}</label>
              <label className="flex min-h-8 items-center gap-2"><input type="checkbox" checked={residential} onChange={(e) => setResidential(e.target.checked)} className="accent-signal" /> {t("Residential")}</label>
            </div>
          )}
        </>
      )}
      {est ? (
        <div className="rounded-lg bg-sand/60 p-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-semibold">{t(MODE_LABEL[est.mode])}</span>
            <span className="font-display text-xl font-bold">{est.totalCents ? usd(est.totalCents) : t("Free")}</span>
          </div>
          {est.accessorialCents > 0 && <p className="text-xs text-muted">{t("Includes {amount} in liftgate/residential fees", { amount: usd(est.accessorialCents) })}</p>}
          <p className="mt-1 text-xs text-muted">{t(est.transitDays)}</p>
          {est.notes.map((n) => <p key={n} className="mt-1 text-xs text-ink/70">{translateShipNote(n, t)}</p>)}
        </div>
      ) : (
        <p className="text-xs text-muted">{t("Enter a 5-digit ZIP to see an estimate. Final freight is confirmed at checkout.")}</p>
      )}
      {!pickup && (
        <p className="text-xs text-muted">
          {t("Warehouse pickup in {place} is by appointment only.", { place: line.shipsFrom })}{" "}
          <Link href={lh("/contact?topic=pickup")} className="font-semibold text-signal-dark underline-offset-2 hover:underline">{t("Request it through Contact")}</Link> {t("before checkout.")}
        </p>
      )}
    </div>
  );
}
