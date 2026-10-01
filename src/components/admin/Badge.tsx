import type { ReactNode } from "react";

export type Tone = "neutral" | "ink" | "signal" | "moss" | "rust" | "amber" | "muted";

const TONES: Record<Tone, string> = {
  neutral: "bg-sand text-ink",
  ink: "bg-ink text-white",
  signal: "bg-signal/15 text-signal-dark",
  moss: "bg-moss/12 text-moss",
  rust: "bg-rust/10 text-rust",
  amber: "bg-amber-100 text-amber-800",
  muted: "bg-line/60 text-muted",
};

/** Small label. `<Badge tone="moss">Published</Badge>` */
export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONES[tone]} ${className}`}>{children}</span>;
}

/** Known statuses → tone + label. Unknown statuses render neutral with a humanised label. */
const STATUS: Record<string, [Tone, string]> = {
  // content
  PUBLISHED: ["moss", "Published"],
  DRAFT: ["muted", "Draft"],
  // lots
  ACTIVE: ["moss", "Active"],
  SOLD_OUT: ["ink", "Sold out"],
  // orders
  PENDING: ["signal", "Pending"],
  CONFIRMED: ["ink", "Confirmed"],
  SHIPPED: ["neutral", "Shipped"],
  DELIVERED: ["moss", "Delivered"],
  CANCELLED: ["rust", "Cancelled"],
  // certificates
  APPROVED: ["moss", "Approved"],
  REJECTED: ["rust", "Rejected"],
  NONE: ["muted", "None"],
};

const human = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

/** Status pill with a dot: `<StatusPill status={order.status} />` (override with tone/label). */
export function StatusPill({ status, tone, label, className = "" }: { status: string; tone?: Tone; label?: string; className?: string }) {
  const [t, l] = STATUS[status] ?? ["neutral", human(status)];
  return (
    <Badge tone={tone ?? t} className={className}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? l}
    </Badge>
  );
}
