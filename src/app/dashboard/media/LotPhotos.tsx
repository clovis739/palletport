import { ProductPhoto } from "@/components/lot/ProductPhoto";
import Link from "next/link";
import { Package } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusPill } from "@/components/admin/Badge";

type LotWithPhotos = { id: string; title: string; status: string; images: string[] };

/** Read-only list of uploaded lot photos (uploads/lots), grouped by lot, linking to the lot editor. */
export function LotPhotos({ lots, canEditLots }: { lots: LotWithPhotos[]; canEditLots: boolean }) {
  if (!lots.length) {
    return (
      <Card>
        <EmptyState icon={Package} title="No lot photos yet" description="Photos added to lots appear here. Lots without photos show a labelled stock photo." compact />
      </Card>
    );
  }
  const total = lots.reduce((n, l) => n + l.images.length, 0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {total} photo{total === 1 ? "" : "s"} on {lots.length} lot{lots.length === 1 ? "" : "s"}. Lot photos are managed on each lot{canEditLots ? " — open a lot to add, remove or reorder them" : ""}.
      </p>
      <Card padded={false}>
        <ul >
          {lots.map((l) => {
            const Title = canEditLots ? (
              <Link href={`/dashboard/lots/${l.id}`} className="font-semibold hover:underline">{l.title}</Link>
            ) : (
              <span className="font-semibold">{l.title}</span>
            );
            return (
              <li key={l.id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm">{Title}</p>
                  <StatusPill status={l.status} />
                  <span className="text-xs text-muted">{l.images.length} photo{l.images.length === 1 ? "" : "s"}</span>
                </div>
                <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {l.images.map((src, i) => (
                    <li key={src} className="shrink-0">
                      <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-signal">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <ProductPhoto src={src} alt={`${l.title} — photo ${i + 1}`} width={96} height={96} loading="lazy" decoding="async" className="h-20 w-20 object-cover sm:h-24 sm:w-24" />
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
