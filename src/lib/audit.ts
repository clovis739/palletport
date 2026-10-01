import "server-only";
import { db } from "./db";

export type AuditActor = { id: string; email: string } | null | undefined;

/**
 * Records an admin action in the activity log. Best-effort: never throws, never blocks the action.
 *
 *   await logAudit(user, "lot.delete", lot.title);
 *   await logAudit(user, "settings.save", "business", "name, phone");
 *
 * Action names are dotted "<area>.<verb>" (lot.create, order.status, content.publish, media.upload,
 * settings.save, staff.role, inbox.handled…) so the activity page can filter by prefix.
 */
export async function logAudit(user: AuditActor, action: string, target = "", detail = ""): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userEmail: user?.email ?? "",
        action: action.slice(0, 80),
        target: target.slice(0, 200),
        detail: detail.slice(0, 2000),
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[audit] could not write log entry", e);
  }
}

/** Recent entries (newest first). `prefix` filters by action area, e.g. "lot." */
export async function recentAudit({ take = 50, prefix }: { take?: number; prefix?: string } = {}) {
  return db.auditLog.findMany({
    where: prefix ? { action: { startsWith: prefix } } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });
}
