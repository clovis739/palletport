/**
 * Warehouse visits (pickup appointments). Pure helpers shared by the booking modal (client) and the server.
 *
 * Rules:
 * - Monday–Friday only, in the warehouse's time zone (America/New_York).
 * - The earliest bookable visit starts at least LEAD_HOURS (45 h) from now; visits can be booked BOOKING_DAYS ahead.
 * - Each visit lasts VISIT_MINUTES (50 min). Visits start on the hour, SLOT_HOURS (9:00 → last start 16:00).
 * - One booking per slot (a slot is taken by any non-cancelled order with that visitAt).
 * - Payment up front: orders of $600+ pay a refundable 35% deposit; smaller orders pay in full.
 */

export const VISIT_TZ = "America/New_York";
export const VISIT_MINUTES = 50;
export const LEAD_HOURS = 45;
export const BOOKING_DAYS = 28;
export const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
export const DEPOSIT_RATE = 0.35;
export const DEPOSIT_THRESHOLD_CENTS = 60_000;

const WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

type Parts = { year: number; month: number; day: number; hour: number; minute: number; weekday: string };

function partsInTz(d: Date, tz = VISIT_TZ): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour % 24, minute: +p.minute, weekday: p.weekday };
}

/** The UTC instant of a wall-clock time in the warehouse time zone (handles daylight saving). */
export function zonedToUtc(date: string, hour: number, minute = 0): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const p = partsInTz(new Date(guess));
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asIfUtc - guess));
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (p: Parts) => `${p.year}-${pad(p.month)}-${pad(p.day)}`;

export type VisitSlot = { iso: string; label: string; available: boolean };
export type VisitDay = { date: string; weekday: string; day: number; month: string; slots: VisitSlot[] };

/** Bookable weekdays (with their slots) from now until BOOKING_DAYS ahead. `booked` = ISO strings of taken slots. */
export function visitCalendar(now: Date, booked: Iterable<string> = []): VisitDay[] {
  const taken = new Set([...booked].map((s) => new Date(s).toISOString()));
  const earliest = now.getTime() + LEAD_HOURS * 3_600_000;
  const out: VisitDay[] = [];
  for (let i = 0; i <= BOOKING_DAYS; i++) {
    const p = partsInTz(new Date(now.getTime() + i * 86_400_000));
    if (!WEEKDAYS.has(p.weekday)) continue;
    const date = dateKey(p);
    if (out.some((d) => d.date === date)) continue;
    const slots = SLOT_HOURS.map((h) => {
      const at = zonedToUtc(date, h);
      const iso = at.toISOString();
      return { iso, label: slotLabel(h), available: at.getTime() >= earliest && !taken.has(iso) };
    });
    if (slots.every((s) => startMs(s) < earliest)) continue; // the whole day is inside the 45-hour lead time
    out.push({
      date,
      weekday: p.weekday,
      day: p.day,
      month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: VISIT_TZ }).format(zonedToUtc(date, 12)),
      slots,
    });
  }
  return out;
}

const startMs = (s: VisitSlot) => new Date(s.iso).getTime();

function slotLabel(h: number) {
  const end = h * 60 + VISIT_MINUTES;
  const fmt = (mins: number) => {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${((hh + 11) % 12) + 1}:${pad(mm)}${hh < 12 ? "am" : "pm"}`;
  };
  return `${fmt(h * 60)}–${fmt(end)}`;
}

/** Server-side check that an ISO start time is a real, bookable slot. Returns an error message or null. */
export function checkVisitSlot(iso: string, now: Date, booked: Iterable<string> = []): string | null {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "Choose a visit time";
  const p = partsInTz(t);
  if (!WEEKDAYS.has(p.weekday)) return "Visits are Monday to Friday only";
  if (p.minute !== 0 || !SLOT_HOURS.includes(p.hour)) return "Choose one of the listed visit times";
  if (t.getTime() < now.getTime() + LEAD_HOURS * 3_600_000) return `Visits must be booked at least ${LEAD_HOURS} hours ahead`;
  if (t.getTime() > now.getTime() + (BOOKING_DAYS + 1) * 86_400_000) return `Visits can be booked up to ${BOOKING_DAYS} days ahead`;
  const taken = new Set([...booked].map((s) => new Date(s).toISOString()));
  if (taken.has(t.toISOString())) return "That time has just been booked. Please choose another.";
  return null;
}

/** Amount to pay now: a 35% deposit for orders of $600 or more, otherwise the full amount. */
export function amountDueNow(totalCents: number) {
  const deposit = totalCents >= DEPOSIT_THRESHOLD_CENTS;
  return { deposit, dueNowCents: deposit ? Math.round(totalCents * DEPOSIT_RATE) : totalCents };
}

/** "Tuesday, Oct 7 · 10:00am–10:50am ET" */
export function formatVisit(iso: string | Date, locale: "en" | "es" = "en") {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { weekday: "long", month: "short", day: "numeric", timeZone: VISIT_TZ }).format(d);
  return `${day} · ${slotLabel(partsInTz(d).hour)} ET`;
}
