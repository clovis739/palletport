import { LOT_TOPICS, PHOTOS, photoSrc, type StockPhoto } from "@/content/photos";
import { Card } from "@/components/admin/Card";

/** Human label for a LOT_TOPICS entry from its keyword regex ("earbud|headphone|…" → "Earbud, headphone, audio"). */
function topicLabel(re: RegExp) {
  const words = re.source.replace(/\\b|\?|\(|\)/g, "").split("|").slice(0, 3);
  const s = words.join(", ").replace(/s\?$/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Tile({ photo, code }: { photo: StockPhoto; code?: string }) {
  return (
    <li className="min-w-0">
      <figure>
        <div className="overflow-hidden rounded-xl bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc(photo, 400, 3 / 2)} alt={photo.alt} width={400} height={267} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover" />
        </div>
        <figcaption className="mt-1.5 space-y-0.5">
          {code && <code className="block truncate text-[11px] font-semibold text-ink" title="Stock photo key (usable in image fields)">{code}</code>}
          <span className="block truncate text-[11px] text-muted" title={photo.alt}>{photo.alt}</span>
        </figcaption>
      </figure>
    </li>
  );
}

const GRID = "grid grid-cols-2 gap-4 min-[520px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-6";

/** Read-only overview of the representative supplier catalog. */
export function StockPhotos() {
  const site = Object.entries(PHOTOS) as [string, StockPhoto][];
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Product and pallet images served locally.
        Pick them in any image field via <strong>Choose image → Stock photos</strong>. They can't be edited or deleted here.
      </p>
      <Card title="Site photos" description={`${site.length} photos for pages, posts and the homepage`}>
        <ul className={GRID}>
          {site.map(([key, photo]) => (
            <Tile key={key} photo={photo} code={key} />
          ))}
        </ul>
      </Card>
      <Card title="Lot placeholder photos" description="Shown on lots without uploaded photos, matched by title keywords.">
        <div className="space-y-6">
          {LOT_TOPICS.map((t) => (
            <section key={t.keywords.source} aria-label={topicLabel(t.keywords)}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{topicLabel(t.keywords)}</h3>
              <ul className={GRID}>
                {[...new Map(t.photos.map(p => [p.id, p])).values()].map((p) => (
                  <Tile key={p.id} photo={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function stockPhotoCount() {
  return new Set([...Object.values(PHOTOS), ...LOT_TOPICS.flatMap(t => t.photos)].map(photo => photo.id)).size;
}
