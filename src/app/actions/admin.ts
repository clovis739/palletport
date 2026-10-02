"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can, type Perm } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendCertificateEmail } from "@/lib/status-email";

/** Staff with `perm` only (see src/lib/permissions.ts). Returns the acting user for the audit log. */
async function staffWith(perm: Perm) {
  const { user } = await requireStaff(perm);
  return user;
}

function refresh() {
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard/lots");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard", "layout"); // sidebar badges
}

export async function setCertStatus(formData: FormData) {
  const user = await staffWith("inbox");
  const status = String(formData.get("status"));
  if (!["APPROVED", "REJECTED"].includes(status)) return;
  const buyer = await db.user.update({ where: { id: String(formData.get("userId")) }, data: { certStatus: status } });
  await sendCertificateEmail(buyer, status, buyer.certNote);
  await logAudit(user, "inbox.certificate", buyer.email, status);
  refresh();
}

export async function toggleFeatured(formData: FormData) {
  const user = await staffWith("lots");
  const id = String(formData.get("lotId"));
  const lot = await db.lot.findUnique({ where: { id } });
  if (lot) {
    await db.lot.update({ where: { id }, data: { featured: !lot.featured } });
    await logAudit(user, "lot.featured", lot.title, lot.featured ? "unfeatured" : "featured");
  }
  refresh();
}

export async function markInquiryHandled(formData: FormData) {
  const user = await staffWith("inbox");
  const q = await db.inquiry.update({ where: { id: String(formData.get("id")) }, data: { handled: true } });
  await logAudit(user, "inbox.handled", q.email, q.topic);
  refresh();
}

// ---------------------------------------------------------------------------------------------
// Commerce admin additions: reopen messages, certificate review with a note.
// ---------------------------------------------------------------------------------------------

/** Mark a contact/program inquiry handled (handled=1) or reopen it (handled=0). */
export async function setInquiryHandled(formData: FormData) {
  const user = await staffWith("inbox");
  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") !== "0";
  const q = await db.inquiry.findUnique({ where: { id } });
  if (!q) return;
  await db.inquiry.update({ where: { id }, data: { handled } });
  await logAudit(user, handled ? "inbox.handled" : "inbox.unhandled", q.email, q.topic);
  refresh();
}

/**
 * Approve or reject a buyer's resale certificate with an optional note (stored on User.certNote and in the
 * activity log). Allowed for staff with "inbox" or "customers".
 */
export async function reviewCertificate(formData: FormData) {
  const { user } = await requireStaff();
  if (!(can(user.role, "inbox") || can(user.role, "customers"))) forbidden();
  const status = String(formData.get("status"));
  if (!["APPROVED", "REJECTED"].includes(status)) return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const buyer = await db.user.findUnique({ where: { id: String(formData.get("userId") ?? "") } });
  if (!buyer) return;
  await db.user.update({ where: { id: buyer.id }, data: { certStatus: status, certNote: note || null } });
  if (buyer.certStatus !== status) await sendCertificateEmail(buyer, status, note);
  await logAudit(user, "customer.certificate", buyer.email, `${status}${note ? ` · ${note}` : ""}`);
  refresh();
  revalidatePath(`/dashboard/customers/${buyer.id}`);
}
