import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

/**
 * KPI tile.
 *
 *   <StatCard label="Sales (30 days)" value={money(c)} delta={{ value: "+12%", trend: "up" }}
 *     href="/dashboard/analytics" icon={DollarSign}>
 *     <Sparkline values={daily} />
 *   </StatCard>
 *
 * `delta.good` flips colouring when "down" is good (e.g. refunds).
 */
export function StatCard({
  label,
  value,
  delta,
  hint,
  href,
  icon: Icon,
  children,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: { value: string; trend: "up" | "down" | "flat"; good?: "up" | "down" };
  hint?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  /** Sparkline or other visual slot under the value. */
  children?: ReactNode;
  className?: string;
}) {
  const good = delta ? (delta.trend === "flat" ? null : delta.trend === (delta.good ?? "up")) : null;
  const TrendIcon = delta?.trend === "up" ? ArrowUpRight : delta?.trend === "down" ? ArrowDownRight : Minus;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {Icon && <Icon aria-hidden className="h-4 w-4 shrink-0 text-muted" />}
      </div>
      <p className="mt-1 truncate font-display text-2xl font-bold tabular-nums">{value}</p>
      {(delta || hint) && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
          {delta && (
            <span className={`inline-flex items-center gap-0.5 font-semibold ${good === null ? "text-muted" : good ? "text-moss" : "text-rust"}`}>
              <TrendIcon aria-hidden className="h-3.5 w-3.5" />
              {delta.value}
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </>
  );
  const cls = `block min-w-0 rounded-2xl bg-white p-4 sm:p-5 ${className}`;
  return href ? (
    <Link href={href} className={`${cls} transition focus-visible:outline-2 focus-visible:outline-signal`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Tiny dependency-free SVG sparkline. `values` in chronological order. */
export function Sparkline({ values, height = 36, className = "text-signal", label }: { values: number[]; height?: number; className?: string; label?: string }) {
  if (values.length < 2) return null;
  const w = 100;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={`h-9 w-full ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={`${d} L${w},${height} L0,${height} Z`} fill="currentColor" opacity="0.12" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
