import Link from "next/link";

export type TabItem = { href: string; label: string; count?: number; value?: string };

/**
 * Link tabs / filter chips (server component, URL-driven).
 *
 *   <Tabs current={status} items={[{ value: "ALL", label: "All", href: "/dashboard/orders" },
 *     { value: "PENDING", label: "Pending", href: "/dashboard/orders?status=PENDING", count: 3 }]} />
 *
 * `current` is compared with each item's `value` (or `href` when no value). variant="pills" for chips.
 * For in-page panels without navigation use <PanelTabs> (client).
 */
export function Tabs({ items, current, variant = "underline", label = "Views", className = "" }: { items: TabItem[]; current: string; variant?: "underline" | "pills"; label?: string; className?: string }) {
  const pills = variant === "pills";
  return (
    <nav aria-label={label} className={`-mx-1 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      <ul className={`flex w-max gap-1 ${pills ?"":""}`}>
        {items.map((t) => {
          const active = (t.value ?? t.href) === current;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={
 pills
 ?`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-signal ${active ?"bg-ink text-white":" bg-white "}`
 :`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-signal ${active ?"border-signal text-ink":"border-transparent text-muted hover:text-ink"}`
 }
              >
                {t.label}
                {t.count !== undefined && <span className={`rounded-full px-1.5 text-[11px] ${active && pills ? "bg-white/20" : "bg-sand text-ink"}`}>{t.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
