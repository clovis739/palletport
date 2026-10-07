const TONES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-moss/10 text-moss",
  CANCELLED: "bg-rust/10 text-rust",
};

import { getT } from "@/i18n/server";

export async function StatusPill({ status }: { status: string }) {
  const t = await getT();
  const label = status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[status] ?? "bg-sand"}`}>{t(label)}</span>;
}
