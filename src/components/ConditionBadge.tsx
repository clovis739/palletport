import { CONDITIONS } from "@/lib/format";
import { getT } from "@/i18n/server";

export async function ConditionBadge({ condition }: { condition: string }) {
  const c = CONDITIONS[condition];
  const t = await getT();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c?.tone ?? "bg-sand text-ink"}`}>
      {c?.label ? t(c.label) : condition}
    </span>
  );
}
