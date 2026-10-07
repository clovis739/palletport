"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { FormState } from "./auth";
import { LIMITS, clientIp, rateLimit } from "@/lib/rateLimit";
import { emailConfigured, sendEmail } from "@/lib/email";
import { passwordResetEmailHtml } from "@/lib/email-layout";

export type OkState = { error?: string; ok?: string } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  businessName: z.string().trim().min(2, "Enter your business name"),
  businessType: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  shipAddress: z.string().trim().optional(),
  shipCity: z.string().trim().optional(),
  shipRegion: z.string().trim().optional(),
  shipPostal: z.string().trim().optional(),
  shipCountry: z.string().trim().optional(),
});

export async function updateProfile(_: OkState, formData: FormData): Promise<OkState> {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: session.userId }, data: parsed.data });
  revalidatePath("/account");
  return { ok: "Saved" };
}

const certSchema = z.object({
  certNumber: z.string().trim().min(4, "Enter your resale / tax-exempt certificate number"),
  certState: z.string().trim().min(2, "Enter the issuing state"),
});

export async function submitCertificate(_: OkState, formData: FormData): Promise<OkState> {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/verification");
  const parsed = certSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // TODO(files): accept a PDF/photo of the certificate and store it in object storage.
  await db.user.update({ where: { id: session.userId }, data: { ...parsed.data, certStatus: "PENDING" } });
  revalidatePath("/account/verification");
  return { ok: "Submitted — we usually review certificates within one business day." };
}

const pwSchema = z.object({
  current: z.string().min(1, "Enter your current password"),
  password: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changePassword(_: OkState, formData: FormData): Promise<OkState> {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/security");
  const parsed = pwSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(parsed.data.current, user.passwordHash))) return { error: "Current password is incorrect" };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) } });
  return { ok: "Password updated" };
}

export async function requestPasswordReset(_: OkState, formData: FormData): Promise<OkState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email" };
  const rl = rateLimit(`reset:${await clientIp()}`, LIMITS.passwordReset.max, LIMITS.passwordReset.windowMs);
  if (!rl.ok) return { error: rl.message };
  if (!emailConfigured() || !process.env.APP_URL) return { error: "Password reset email is temporarily unavailable. Please contact support." };
  const user = await db.user.findUnique({ where: { email } });
  const ok = "If an account exists for that email, a reset link is on its way.";
  if (!user) return { ok };
  const reset = await db.passwordReset.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  try {
    const { getI18n } = await import("@/i18n/server");
    const { t, locale } = await getI18n();
    const url = new URL(`${locale === "es" ? "/es" : ""}/reset-password/${reset.token}`, process.env.APP_URL);
    await sendEmail({
      to: user.email,
      subject: t("Reset your PalletPort password"),
      text: `${t("You requested a password reset for your PalletPort account.")}\n\n${t("Reset your password")}: ${url.toString()}\n\n${t("This link expires in one hour. If you did not request this, you can ignore this email.")}`,
      html: passwordResetEmailHtml(url.toString(), t, locale),
      idempotencyKey: `password-reset/${reset.token}`,
    });
  } catch {
    console.warn("Password reset email could not be sent.");
    // Preserve the same response for existing and unknown accounts.
  }
  return { ok };
}

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  const reset = await db.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return { error: "This reset link has expired. Request a new one." };
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
    db.passwordReset.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}
