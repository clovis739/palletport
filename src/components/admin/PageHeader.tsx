import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

/**
 * Title block at the top of every admin page.
 *
 *   <PageHeader
 *     title="Orders"
 *     description="Everything bought on the site."
 *     back={{ href: "/dashboard/lots", label: "All lots" }}
 *     actions={<Link href="/dashboard/new" className="btn-primary">New lot</Link>}
 *   />
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  meta,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  /** Extra line under the description (badges, counts, "last saved"). */
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:mb-8 ${className}`}>
      <div className="min-w-0 max-w-3xl">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 rounded text-xs font-semibold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-signal">
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> {back.label}
          </Link>
        )}
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>}
        <h1 className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted sm:text-[15px]">{description}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
