import "server-only";
import { headers } from "next/headers";

// Simple in-memory sliding-window limiter. Good for a single server; use Redis/Upstash
// (same interface) when you run more than one instance.
const buckets = new Map<string, number[]>();

export type Limit = { ok: true } | { ok: false; retryAfterSec: number; message: string };

export function rateLimit(key: string, max: number, windowMs: number): Limit {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    const retryAfterSec = Math.ceil((windowMs - (now - hits[0])) / 1000);
    buckets.set(key, hits);
    return { ok: false, retryAfterSec, message: `Too many attempts. Please wait ${retryAfterSec < 60 ? `${retryAfterSec} seconds` : `${Math.ceil(retryAfterSec / 60)} minutes`} and try again.` };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10000) {
    // Opportunistic cleanup so memory can't grow unbounded.
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return { ok: true };
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export const LIMITS = {
  login: { max: 8, windowMs: 10 * 60 * 1000 },
  register: { max: 5, windowMs: 60 * 60 * 1000 },
  passwordReset: { max: 3, windowMs: 15 * 60 * 1000 },
  inquiry: { max: 5, windowMs: 10 * 60 * 1000 },
  message: { max: 30, windowMs: 60 * 1000 },
  checkout: { max: 10, windowMs: 10 * 60 * 1000 },
  download: { max: 30, windowMs: 60 * 1000 },
} as const;
