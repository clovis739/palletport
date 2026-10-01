import "server-only";
import type { BusinessSettings } from "@/lib/settings-schema";

/**
 * Google Business Profile helpers: live reviews (Places API, New) and map / directions links.
 *
 * Env (server-side, never sent to the browser except the embed key, which Google designs to be public
 * and which you restrict to your domain in Google Cloud):
 *   GOOGLE_PLACES_API_KEY   Places API (New) key used to read rating + reviews.
 *   GOOGLE_MAPS_EMBED_KEY   Maps Embed API key for the map iframe (optional; a keyless embed is used without it).
 * The Place ID and profile link are set by the owner in Admin → Site settings → Business profile.
 */

export type GoogleReview = {
  author: string;
  authorUrl?: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  when: string;
};

export type GoogleReviewSummary = {
  rating: number;
  count: number;
  mapsUrl?: string;
  reviews: GoogleReview[];
};

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
};

const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

/** Rating, review count and up to 5 recent reviews for the business, or null when not configured / unavailable. */
export async function getGoogleReviews(placeId?: string): Promise<GoogleReviewSummary | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const id = placeId?.trim();
  if (!key || !id || !PLACE_ID.test(id)) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews" },
      // Refreshed at most hourly: keeps the page fast and the (paid) Places calls low.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as PlacesResponse;
    if (!d.rating || !d.userRatingCount) return null;
    return {
      rating: d.rating,
      count: d.userRatingCount,
      mapsUrl: d.googleMapsUri,
      reviews: (d.reviews ?? [])
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          authorUrl: r.authorAttribution?.uri,
          authorPhoto: r.authorAttribution?.photoUri,
          rating: r.rating ?? 0,
          text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
          when: r.relativePublishTimeDescription ?? "",
        }))
        .filter((r) => r.text),
    };
  } catch {
    return null;
  }
}

type Place = Pick<BusinessSettings, "addressStreet" | "addressCity" | "addressRegion" | "addressPostal" | "country" | "name"> & {
  googlePlaceId?: string;
  googleMapsUrl?: string;
};

/** Full street address, or "" when the owner hasn't entered a street (we never guess one). */
export function streetAddress(b: Place) {
  if (!b.addressStreet?.trim()) return "";
  return [b.addressStreet, b.addressCity, [b.addressRegion, b.addressPostal].filter(Boolean).join(" "), b.country === "US" ? "" : b.country]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
}

export function hasMapLocation(b: Place) {
  return Boolean(b.googlePlaceId?.trim() || streetAddress(b));
}

/** iframe src for the location map. */
export function mapEmbedUrl(b: Place) {
  const key = process.env.GOOGLE_MAPS_EMBED_KEY?.trim();
  const address = streetAddress(b);
  const placeId = b.googlePlaceId?.trim();
  if (key) {
    const q = placeId ? `place_id:${placeId}` : `${b.name}, ${address}`;
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&zoom=15`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(address || b.name)}&z=15&output=embed`;
}

export function directionsUrl(b: Place) {
  const address = streetAddress(b);
  const placeId = b.googlePlaceId?.trim();
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("destination", address || b.name);
  if (placeId) u.searchParams.set("destination_place_id", placeId);
  return u.toString();
}

/** Opens Google's "write a review" box for the business (needs the Place ID). */
export function writeReviewUrl(b: Place) {
  const placeId = b.googlePlaceId?.trim();
  return placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : undefined;
}
