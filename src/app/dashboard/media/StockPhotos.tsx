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
        <a href={photo.page} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc(photo, 400, 3 / 2)} alt={photo.alt} width={400} height={267} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          <span className="sr-only"> (opens the photo on Unsplash)</span>
        </a>
        <figcaption className="mt-1.5 space-y-0.5">
          {code && <code className="block truncate text-[11px] font-semibold text-ink" title="Stock photo key (usable in image fields)">{code}</code>}
          <span className="block truncate text-[11px] text-muted" title={photo.alt}>{photo.alt}</span>
          <span className="block truncate text-[11px] text-muted">
            Photo by{" "}
            <a href={photo.page} target="_blank" rel="noreferrer" className="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
              {photo.by}
            </a>{" "}
            on Unsplash
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

const GRID = "grid grid-cols-2 gap-4 min-[520px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-6";

/** Read-only overview of the built-in Unsplash photos (src/content/photos.ts). */
export function StockPhotos() {
  const site = Object.entries(PHOTOS) as [string, StockPhoto][];
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Built-in photos from Unsplash (free for commercial use under the{" "}
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2">Unsplash License</a>).
        Pick them in any image field via <strong>Choose image → Stock photos</strong>. They can't be edited or deleted here.
      </p>
      <Card title="Site photos" description={`${site.length} photos for pages, posts and the homepage`}>
        <ul className={GRID}>
          {site.map(([key, photo]) => (
            <Tile key={key} photo={photo} code={key} />
          ))}
        </ul>
      </Card>
      <Card title="Lot placeholder photos" description="Shown (labelled “Stock photo”) on lots that don't have real photos yet, matched by title keywords.">
        <div className="space-y-6">
          {LOT_TOPICS.map((t) => (
            <section key={t.keywords.source} aria-label={topicLabel(t.keywords)}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{topicLabel(t.keywords)}</h3>
              <ul className={GRID}>
                {t.photos.map((p) => (
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
  return Object.keys(PHOTOS).length + LOT_TOPICS.reduce((n, t) => n + t.photos.length, 0);
}
