import { CONDITIONS } from "@/lib/format";

export function ConditionBadge({ condition }: { condition: string }) {
  const c = CONDITIONS[condition];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c?.tone ?? "bg-sand text-ink"}`}>
      {c?.label ?? condition}
    </span>
  );
}
