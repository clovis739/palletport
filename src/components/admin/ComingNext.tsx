import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";

/** Placeholder page body for admin sections that are not built yet. Replace the whole page when building it. */
export function ComingNext({ title, description, icon = Sparkles, points = [] }: { title: string; description: string; icon?: LucideIcon; points?: string[] }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={icon}
          title="Coming next"
          description={
            points.length ? (
              <span className="block">
                This section is being built. It will let you:
                <span className="mt-3 block space-y-1 text-left">
                  {points.map((p) => (
                    <span key={p} className="block">• {p}</span>
                  ))}
                </span>
              </span>
            ) : (
              "This section is being built."
            )
          }
        />
      </Card>
    </>
  );
}
