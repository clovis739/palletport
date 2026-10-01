import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

/**
 * Friendly empty / placeholder state.
 *
 *   <EmptyState icon={FileText} title="No posts yet" description="Write your first post."
 *     action={<Link href="/dashboard/content/new" className="btn-primary">New post</Link>} />
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className = "",
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-4 py-8" : "px-6 py-14"} ${className}`}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-ink/70">
        <Icon aria-hidden className="h-6 w-6" />
      </span>
      <p className="mt-4 font-display text-lg font-bold">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
