import Link from "next/link";
import { Eye } from "lucide-react";

/** Shown on public content pages opened with ?preview=1 by staff. */
export function PreviewBanner({ id, status }: { id?: string; status: string }) {
  const draft = status !== "PUBLISHED";
  return (
    <div role="status" className="border-b border-signal/30 bg-signal/10">
      <div className="container-pp flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
        <Eye aria-hidden className="h-4 w-4 shrink-0 text-signal-dark" />
        <p className="min-w-0 flex-1 font-medium text-ink">
          {draft ? "Draft preview — only staff can see this page." : "Preview mode — this is the published version."}
        </p>
        {id && (
          <Link href={`/dashboard/content/${id}`} className="font-semibold text-signal-dark underline underline-offset-2 hover:no-underline">
            Back to editor
          </Link>
        )}
      </div>
    </div>
  );
}
