import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { forbidden, redirect, notFound } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";
import { can, isStaff, type Perm } from "./permissions";

/**
 * The signed-in user (cached per request, so layouts, pages, guards and actions share one query).
 * A validly signed cookie whose account no longer exists (e.g. after the database was reset or the user was
 * removed) counts as signed out, so nothing is ever written against a missing user.
 */
export const getCurrentUser = cache(async () => {
  const store = await cookies();
  const token = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!token) return null;
  return db.user.findUnique({
    where: { id: token.userId },
  });
});

/** Session details of the signed-in user, taken from the database (current role and name), or null. */
export async function getSession() {
  const user = await getCurrentUser();
  return user ? { userId: user.id, role: user.role, name: user.name } : null;
}

export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Owner-only admin pages (business settings, site settings, staff, activity). */
export async function requireAdmin(_next = "/dashboard") {
  // Non-staff (and logged-out visitors) get a plain 404 so the admin's existence is never revealed.
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) notFound();
  if (user.role !== "ADMIN") forbidden();
  const { getStore } = await import("./store");
  return { user, seller: await getStore() };
}

/**
 * Admin pages and actions for staff (ADMIN, MANAGER, EDITOR — see src/lib/permissions.ts).
 * Signed out or not staff → 404 (the admin stays invisible); staff without the permission → 403 (forbidden()).
 * With no `perm`, any staff role passes (used by the admin layout).
 */
export async function requireStaff(perm?: Perm, _next = "/dashboard") {
  // Non-staff (and logged-out visitors) get a plain 404 so the admin's existence is never revealed.
  // Staff without this particular permission see the 403 screen (they already know the admin exists).
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) notFound();
  if (perm && !can(user.role, perm)) forbidden();
  const { getStore } = await import("./store");
  return { user, seller: await getStore() };
}

/** The signed-in staff member, or null (never redirects). For optional UI and best-effort audit logging. */
export async function getStaffUser() {
  const user = await getCurrentUser();
  return user && isStaff(user.role) ? user : null;
}
