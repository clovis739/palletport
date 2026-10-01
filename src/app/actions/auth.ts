"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { LIMITS, clientIp, rateLimit } from "@/lib/rateLimit";
import { sendWelcomeEmail } from "@/lib/status-email";

export type FormState = { error?: string } | undefined;

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "/";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

async function startSession(user: { id: string; role: string; name: string }) {
  const token = await signSession({ userId: user.id, role: user.role, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  businessName: z.string().trim().min(2, "Enter your business name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessType: z.string().trim().optional(),
  ref: z.string().trim().optional(),
});

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const rl = rateLimit(`register:${await clientIp()}`, LIMITS.register.max, LIMITS.register.windowMs);
  if (!rl.ok) return { error: rl.message };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, businessName, email, password, businessType, ref } = parsed.data;

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "An account with that email already exists" };

  const user = await db.user.create({
    data: {
      name,
      businessName,
      email,
      businessType: businessType || null,
      referredBy: ref && (await db.user.findUnique({ where: { referralCode: ref } })) ? ref : null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  await startSession(user);
  await sendWelcomeEmail(user);
  redirect(safeNext(formData.get("next")));
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rl = rateLimit(`login:${await clientIp()}:${email}`, LIMITS.login.max, LIMITS.login.windowMs);
  if (!rl.ok) return { error: rl.message };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect" };
  }
  await startSession(user);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
