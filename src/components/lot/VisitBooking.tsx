"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Warehouse, X } from "lucide-react";
import { money } from "@/lib/format";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n/client";
import {
  BOOKING_DAYS,
  DEPOSIT_THRESHOLD_CENTS,
  LEAD_HOURS,
  VISIT_MINUTES,
  amountDueNow,
  formatVisit,
  visitCalendar,
  type VisitDay,
} from "@/lib/visits";

type Props = {
  lot: { slug: string; title: string; priceCents: number; available: number };
  /** ISO start times already taken by other visits. */
  booked: string[];
  signedIn: boolean;
  location: string;
};

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Group bookable days into Mon–Fri weeks for the calendar grid (null = not bookable / outside range). */
function toWeeks(days: VisitDay[], tag = "en-US") {
  const byDate = new Map(days.map((d) => [d.date, d]));
  if (!days.length) return [];
  const first = new Date(`${days[0].date}T12:00:00Z`);
  const monday = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * 86_400_000);
  const weeks: { key: string; days: ({ date: string; day: number; month: string; info: VisitDay | undefined })[] }[] = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getTime() + (w * 7 + i) * 86_400_000);
      const date = d.toISOString().slice(0, 10);
      row.push({ date, day: d.getUTCDate(), month: d.toLocaleString(tag, { month: "short", timeZone: "UTC" }), info: byDate.get(date) });
    }
    if (row.every((r) => r.date > days[days.length - 1].date)) break;
    weeks.push({ key: row[0].date, days: row });
  }
  return weeks;
}

/**
 * "Book a warehouse visit" on the lot page: a button that opens a calendar popup (Mon–Fri, ≥45 h ahead, 50-minute
 * visits), then continues to /checkout/visit where the buyer pays the deposit (35% for $600+) or the full amount.
 */
export function VisitBooking({ lot, booked, signedIn, location }: Props) {
  const router = useRouter();
  const { t: tr, locale, lh } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setNow(new Date());
  }, [open]);

  const days = useMemo(() => (now ? visitCalendar(now, booked) : []), [now, booked]);
  const weeks = useMemo(() => toWeeks(days, locale === "es" ? "es-US" : "en-US"), [days, locale]);
  const pages = Math.max(1, Math.ceil(weeks.length / 3));
  const shown = weeks.slice(page * 3, page * 3 + 3);
  const day = days.find((d) => d.date === date);
  const total = lot.priceCents * qty;
  const { deposit, dueNowCents } = amountDueNow(total);

  // Esc closes, focus moves into the dialog and back to the button on close, page scroll is locked.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],select,[tabindex='0']")];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  const next = slot ? `${lh("/checkout/visit")}?lot=${encodeURIComponent(lot.slug)}&qty=${qty}&at=${encodeURIComponent(slot)}` : "";
  const go = () => {
    if (!slot) return;
    router.push(signedIn ? next : `${lh("/login")}?next=${encodeURIComponent(next)}`);
  };

  return (
    <>
      <button ref={openerRef} type="button" onClick={() => setOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#245a40] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss" aria-haspopup="dialog">
        <Warehouse aria-hidden className="h-4 w-4" /> {tr("Warehouse pickup · book a visit")}
      </button>
      <p className="text-center text-xs text-muted">{tr("Choose a weekday visit (Mon–Fri) and pick up in {place}.", { place: location })}</p>

      {open && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)} data-lenis-prevent>
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="visit-title"
              className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-5 sm:rounded-3xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="visit-title" className="font-display text-xl font-bold sm:text-2xl">{tr("Book a warehouse visit")}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {tr("Weekday appointments begin at least {hours} hours from now. Each visit is {minutes} minutes.", { hours: LEAD_HOURS, minutes: VISIT_MINUTES })}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand hover:bg-line" aria-label={tr("Close")}>
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-sand p-4">
                <p className="label">{tr("Selected product")}</p>
                <p className="font-semibold">{lot.title}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span>{tr("{price} per lot", { price: money(lot.priceCents) })}</span>
                  {lot.available > 1 && (
                    <label className="flex items-center gap-2">
                      {tr("Quantity")}
                      <Select value={String(qty)} onChange={(e) => setQty(Number(e.target.value))} className="input w-20 py-1.5" aria-label={tr("Quantity")}>
                        {Array.from({ length: Math.min(lot.available, 20) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </label>
                  )}
                </div>
              </div>

              {/* Calendar: Monday–Friday, three weeks at a time */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-semibold"><CalendarDays aria-hidden className="h-4 w-4 text-signal" /> {tr("Visit date")}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="grid h-9 w-9 place-items-center rounded-full bg-sand hover:bg-line disabled:opacity-40" aria-label={tr("Earlier weeks")}>
                      <ChevronLeft aria-hidden className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="grid h-9 w-9 place-items-center rounded-full bg-sand hover:bg-line disabled:opacity-40" aria-label={tr("Later weeks")}>
                      <ChevronRight aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div role="grid" aria-label={tr("Choose a visit date")} className="grid grid-cols-5 gap-1.5 text-center">
                  {WEEK.map((w) => <div key={w} role="columnheader" className="pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{tr(w)}</div>)}
                  {shown.flatMap((w) =>
                    w.days.map((d) => {
                      const free = d.info?.slots.some((s) => s.available);
                      const selected = date === d.date;
                      return (
                        <button
                          key={d.date}
                          type="button"
                          role="gridcell"
                          disabled={!free}
                          aria-selected={selected}
                          aria-label={`${d.info?.weekday ? tr(d.info.weekday) : ""} ${d.month} ${d.day}${free ? "" : tr(", unavailable")}`}
                          data-autofocus={!date && free && !days.find((x) => x.date < d.date && x.slots.some((s) => s.available)) ? true : undefined}
                          onClick={() => { setDate(d.date); setSlot(null); }}
                          className={`flex h-14 flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                            selected ? "bg-signal font-bold text-white" : free ? "border border-[#cfd4dc] bg-white font-semibold hover:border-signal hover:bg-signal/5" : "cursor-not-allowed bg-sand/60 text-muted/60"
                          }`}
                        >
                          <span className="text-[10px] uppercase leading-none opacity-80">{d.month}</span>
                          <span className="text-base leading-tight">{d.day}</span>
                        </button>
                      );
                    }),
                  )}
                </div>
                <p className="mt-3 text-sm">
                  <span className="text-muted">{tr("Visit date")}: </span>
                  <span className="font-semibold">{slot ? formatVisit(slot, locale) : day ? formatVisit(day.slots[0].iso, locale).split(" · ")[0] : tr("No date selected")}</span>
                </p>
              </div>

              {/* Times */}
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-2 font-semibold"><Clock aria-hidden className="h-4 w-4 text-signal" /> {tr("Time")}</p>
                {!day ? (
                  <p className="rounded-xl bg-sand p-3 text-sm text-muted">{tr("Select a weekday to see available times.")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {day.slots.map((s) => (
                      <button
                        key={s.iso}
                        type="button"
                        disabled={!s.available}
                        aria-pressed={slot === s.iso}
                        onClick={() => setSlot(s.iso)}
                        className={`h-11 rounded-xl text-sm transition-colors ${
                          slot === s.iso ? "bg-ink font-bold text-white" : s.available ? "border border-[#cfd4dc] bg-white font-semibold hover:border-signal" : "cursor-not-allowed bg-sand/60 text-muted/60 line-through"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment summary */}
              <div className="mt-6 rounded-2xl bg-sand p-4 text-sm">
                <div className="flex justify-between gap-3"><span>{tr("Order total ({qty} × {price})", { qty, price: money(lot.priceCents) })}</span><span className="font-semibold">{money(total)}</span></div>
                <div className="mt-1 flex justify-between gap-3 text-base font-bold">
                  <span>{tr(deposit ? "Pay now (35% deposit)" : "Pay now (full amount)")}</span>
                  <span className="text-signal-dark">{money(dueNowCents)}</span>
                </div>
                {deposit && <div className="flex justify-between gap-3 text-muted"><span>{tr("Balance at your visit")}</span><span>{money(total - dueNowCents)}</span></div>}
                <p className="mt-3 text-xs leading-relaxed text-ink/75">
                  {tr("Orders of {amount} or more require a refundable 35% payment to confirm the visit. Orders below {amount} must be paid in full. The payment is refundable if the product does not match after inspection. Visits can be booked up to {days} days ahead.", { amount: money(DEPOSIT_THRESHOLD_CENTS), days: BOOKING_DAYS })}
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost">{tr("Cancel")}</button>
                <button type="button" onClick={go} disabled={!slot} className="btn-primary">
                  {tr("Continue to order & payment")}
                </button>
              </div>
              {!signedIn && slot && <p className="mt-2 text-right text-xs text-muted">{tr("You'll sign in first, then come straight back to payment.")}</p>}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
