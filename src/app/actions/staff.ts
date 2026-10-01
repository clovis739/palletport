"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ROLES, ROLE_INFO, STAFF_ROLES, asRole, isStaff } from "@/lib/permissions";
import { withFlash } from "@/components/admin/flashUrl";

/**
 * Staff management (owner only: the "staff" permission). Rules:
 *  - you can't change or remove your own role;
 *  - the last ADMIN (owner) can't be demoted or removed.
 */

export type StaffState = { error?: string; ok?: string; tempPassword?: string; email?: string; savedAt?: number } | undefined;

const staffRole = z.enum(STAFF_ROLES);

const newSchema = z.object({
  mode: z.literal("new"),
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  role: staffRole,
});
const promoteSchema = z.object({
  mode: z.literal("promote"),
  email: z.string().trim().toLowerCase().email("Enter the customer's email").max(200),
  role: staffRole,
});

function tempPassword() {
  // 14 URL-safe characters, no look-alikes.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function addStaff(_: StaffState, formData: FormData): Promise<StaffState> {
  const { user } = await requireStaff("staff", "/dashboard/staff");
  const raw = Object.fromEntries(formData);
  if (raw.mode === "promote") {
    const p = promoteSchema.safeParse(raw);
    if (!p.success) return { error: p.error.issues[0].message };
    const target = await db.user.findUnique({ where: { email: p.data.email } });
    if (!target) return { error: "No account with that email. Use “Create account” instead." };
    if (isStaff(target.role)) return { error: `${target.email} is already ${ROLE_INFO[asRole(target.role)].label}. Change their role in the list.` };
    await db.user.update({ where: { id: target.id }, data: { role: p.data.role } });
    await logAudit(user, "staff.role", target.email, `${target.role} → ${p.data.role}`);
    revalidatePath("/dashboard/staff");
    return { ok: `${target.name} is now ${ROLE_INFO[p.data.role].label}.`, savedAt: Date.now() };
  }
  const n = newSchema.safeParse(raw);
  if (!n.success) return { error: n.error.issues[0].message };
  if (await db.user.findUnique({ where: { email: n.data.email }, select: { id: true } })) {
    return { error: "An account with that email exists. Use “Promote existing customer” instead." };
  }
  const password = tempPassword();
  const created = await db.user.create({
    data: { name: n.data.name, email: n.data.email, role: n.data.role, passwordHash: await bcrypt.hash(password, 10) },
  });
  await logAudit(user, "staff.create", created.email, n.data.role);
  revalidatePath("/dashboard/staff");
  return { ok: `Account created for ${created.name}.`, tempPassword: password, email: created.email, savedAt: Date.now() };
}

function back(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return /^\/dashboard\/(staff|customers)(\/|$|\?)/.test(s) ? s : "/dashboard/staff";
}

/** Shared role change used by the staff list and the customer page (owner only). */
async function applyRole(formData: FormData, forced?: string) {
  const { user } = await requireStaff("staff", "/dashboard/staff");
  const to = back(formData.get("back"));
  const role = forced ?? String(formData.get("role") ?? "");
  const id = String(formData.get("userId") ?? "");
  if (!(ROLES as readonly string[]).includes(role)) redirect(withFlash(to, "Choose a valid role", "error"));
  if (id === user.id) redirect(withFlash(to, "You can't change your own role.", "error"));
  const target = await db.user.findUnique({ where: { id } });
  if (!target) redirect(withFlash(to, "User not found", "error"));
  if (asRole(target.role) === role) redirect(withFlash(to, "Role unchanged", "info"));
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = await db.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) redirect(withFlash(to, "This is the last owner account — make someone else Owner first.", "error"));
  }
  await db.user.update({ where: { id }, data: { role } });
  await logAudit(user, role === "BUYER" && isStaff(target.role) ? "staff.remove" : "staff.role", target.email, `${target.role} → ${role}`);
  revalidatePath("/dashboard/staff");
  revalidatePath(`/dashboard/customers/${id}`);
  redirect(withFlash(to, role === "BUYER" ? `${target.name} no longer has admin access` : `${target.name} is now ${ROLE_INFO[asRole(role)].label}`));
}

export async function changeRole(formData: FormData) {
  await applyRole(formData);
}

export async function removeStaff(formData: FormData) {
  await applyRole(formData, "BUYER");
}
