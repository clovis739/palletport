import type { ReactNode } from "react";

/**
 * White surface for admin content.
 *
 *   <Card title="Recent orders" description="Last 10" actions={<Link …>View all</Link>}>…</Card>
 *   <Card padded={false}><DataTable … /></Card>          // edge-to-edge content
 */
export function Card({
  title,
  description,
  actions,
  children,
  footer,
  padded = true,
  className = "",
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
  id?: string;
}) {
  const head = title || description || actions;
  return (
    <section id={id} className={`min-w-0 rounded-2xl bg-white ${className}`}>
      {head && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-base font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted sm:text-sm">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
      {footer && <div className="bg-sand/30 px-4 py-3 text-sm sm:px-5">{footer}</div>}
    </section>
  );
}

/**
 * Titled group of content without a surface (for page sections, or stacking several Cards).
 *
 *   <Section title="Danger zone" description="…">…</Section>
 */
export function Section({ title, description, actions, children, className = "" }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 space-y-3 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
