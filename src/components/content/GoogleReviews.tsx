import { ExternalLink, PenLine } from "lucide-react";
import { Stars } from "@/components/Stars";
import { getGoogleReviews, writeReviewUrl } from "@/lib/google-business";
import type { BusinessSettings } from "@/lib/settings-schema";

type Props = {
  business: BusinessSettings;
  /** How many review cards to show (Google returns up to 5). */
  limit?: number;
  title?: string;
  className?: string;
};

function GoogleWordmark() {
  // Plain-text "Google" wordmark in Google's colours (attribution for reviews shown outside a Google map).
  return (
    <span className="font-semibold" aria-label="Google">
      <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span>
    </span>
  );
}

/**
 * Live Google reviews for the business (Places API). Renders nothing until a Place ID or Google profile link
 * is set in Admin → Site settings → Business profile. Without an API key it shows the "see / write a review"
 * links only. Reviews are shown exactly as Google returns them, with the reviewer's name and Google attribution.
 */
export async function GoogleReviews({ business, limit = 3, title = "What buyers say on Google", className = "container-pp py-12" }: Props) {
  const profile = business.googleMapsUrl?.trim();
  const placeId = business.googlePlaceId?.trim();
  if (!profile && !placeId) return null;
  const data = await getGoogleReviews(placeId);
  const readUrl = data?.mapsUrl || profile;
  const writeUrl = writeReviewUrl(business);
  const reviews = (data?.reviews ?? []).slice(0, limit);

  const links = (
    <div className="flex flex-wrap gap-2">
      {readUrl && (
        <a href={readUrl} target="_blank" rel="noopener" className="btn-ghost">
          {data ? "Read all reviews" : "See our reviews"} <ExternalLink aria-hidden className="ml-1.5 h-4 w-4" />
        </a>
      )}
      {writeUrl && (
        <a href={writeUrl} target="_blank" rel="noopener" className="btn-primary">
          <PenLine aria-hidden className="mr-1.5 h-4 w-4" /> Write a review
        </a>
      )}
    </div>
  );

  return (
    <section aria-labelledby="google-reviews-title" className={className}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="label">
            Reviews from <GoogleWordmark />
          </p>
          <h2 id="google-reviews-title" className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          {data ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="font-display text-2xl font-bold text-ink">{data.rating.toFixed(1)}</span>
              <Stars value={data.rating} size="h-4 w-4" />
              <span>
                {data.count.toLocaleString()} Google review{data.count === 1 ? "" : "s"}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Bought from us? Tell other resellers how it went.</p>
          )}
        </div>
        {links}
      </div>

      {reviews.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <li key={i} className="card flex min-w-0 flex-col p-5">
              <div className="flex items-center gap-3">
                {r.authorPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Google-hosted reviewer photo
                  <img src={r.authorPhoto} alt="" width={36} height={36} loading="lazy" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full bg-sand" />
                ) : (
                  <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand font-semibold">{r.author.charAt(0)}</span>
                )}
                <div className="min-w-0">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener nofollow" className="block truncate text-sm font-semibold hover:underline">{r.author}</a>
                  ) : (
                    <p className="truncate text-sm font-semibold">{r.author}</p>
                  )}
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Stars value={r.rating} /> {r.when}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-ink/80">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
