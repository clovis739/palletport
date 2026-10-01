"use server";

import { requestSiteUrl } from "@/lib/site-url";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isStaff } from "@/lib/permissions";

/** Customer management for staff with the "customers" permission. See /dashboard/customers/[id]. */

export type CustomerState = { error?: string; ok?: string; savedAt?: number; link?: string; expiresAt?: string } | undefined;

const opt = z.string().trim().max(200).optional().transform((v) => (v ? v : null));

const customerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  phone: opt,
  businessName: opt,
  businessType: opt,
  shipAddress: opt,
  shipCity: opt,
  shipRegion: opt,
  shipPostal: opt,
  shipCountry: opt,
});

/** Only the owner may edit or reset staff accounts (a manager must not be able to take over the owner). */
function guardTarget(actor: { id: string; role: string }, target: { id: string; role: string }) {
  if (isStaff(target.role) && actor.role !== "ADMIN" && actor.id !== target.id) return "Only the owner can change staff accounts.";
  return null;
}

export async function updateCustomer(_: CustomerState, formData: FormData): Promise<CustomerState> {
  const { user } = await requireStaff("customers", "/dashboard/customers");
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const target = await db.user.findUnique({ where: { id: d.id } });
  if (!target) return { error: "Customer not found" };
  const denied = guardTarget(user, target);
  if (denied) return { error: denied };
  if (d.email !== target.email) {
    const taken = await db.user.findUnique({ where: { email: d.email }, select: { id: true } });
    if (taken && taken.id !== target.id) return { error: "Another account already uses that email" };
  }
  const { id, ...data } = d;
  const changed = (Object.keys(data) as (keyof typeof data)[]).filter((k) => (data[k] ?? null) !== ((target as Record<string, unknown>)[k] ?? null));
  if (!changed.length) return { ok: "No changes", savedAt: Date.now() };
  await db.user.update({ where: { id }, data });
  await logAudit(user, "customer.update", d.email, changed.join(", "));
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath("/dashboard/customers");
  return { ok: "Customer saved", savedAt: Date.now() };
}

export async function setCustomerPro(formData: FormData) {
  const { user } = await requireStaff("customers", "/dashboard/customers");
  const id = String(formData.get("id") ?? "");
  const pro = formData.get("pro") === "1";
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return;
  await db.user.update({ where: { id }, data: { isPro: pro } });
  await logAudit(user, "customer.pro", target.email, pro ? "Pro on" : "Pro off");
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath("/dashboard/customers");
}

const RESET_HOURS = 24;

/**
 * Creates a one-time password-reset link (PasswordReset token, valid 24 h) for staff to send to the customer
 * themselves. There is no email service yet, so the link is only shown to the admin.
 */
export async function createResetLink(_: CustomerState, formData: FormData): Promise<CustomerState> {
  const { user } = await requireStaff("customers", "/dashboard/customers");
  const id = String(formData.get("id") ?? "");
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return { error: "Customer not found" };
  const denied = guardTarget(user, target);
  if (denied) return { error: denied };
  const expires = new Date(Date.now() + RESET_HOURS * 3600 * 1000);
  // Invalidate older unused links so only the newest one works.
  await db.passwordReset.updateMany({ where: { userId: id, usedAt: null }, data: { expiresAt: new Date() } });
  const reset = await db.passwordReset.create({ data: { userId: id, expiresAt: expires } });
  const origin = await requestSiteUrl();
  await logAudit(user, "customer.reset", target.email, `link valid ${RESET_HOURS}h`);
  return { ok: "Reset link created", link: `${origin}/reset-password/${reset.token}`, expiresAt: expires.toISOString(), savedAt: Date.now() };
}
