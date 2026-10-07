import { MapPin, Navigation } from "lucide-react";
import { directionsUrl, hasMapLocation, mapEmbedUrl, streetAddress } from "@/lib/google-business";
import type { BusinessSettings } from "@/lib/settings-schema";
import { getT } from "@/i18n/server";

/**
 * Google map of the warehouse with a "Get directions" link. Shown only once a street address or a Google
 * Place ID is set in Admin → Site settings → Business profile (we never pin a guessed location).
 * The iframe is lazy-loaded, so it costs nothing until it scrolls into view.
 */
export async function LocationMap({ business, title = "Find our warehouse", note, className = "" }: { business: BusinessSettings; title?: string; note?: string; className?: string }) {
  if (!hasMapLocation(business)) return null;
  const t = await getT();
  const address = streetAddress(business);
  return (
    <section aria-labelledby="location-title" className={`card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h2 id="location-title" className="font-display text-lg font-bold">{t(title)}</h2>
          {address && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-ink/75">
              <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> {address}
            </p>
          )}
          {note && <p className="mt-1 text-xs text-muted">{note}</p>}
        </div>
        <a href={directionsUrl(business)} target="_blank" rel="noopener" className="btn-ghost shrink-0">
          <Navigation aria-hidden className="mr-1.5 h-4 w-4" /> {t("Get directions")}
        </a>
      </div>
      <iframe
        title={t("Map: {name} warehouse", { name: business.name })}
        src={mapEmbedUrl(business)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="block aspect-[16/10] w-full border-0 bg-sand sm:aspect-[16/7]"
      />
    </section>
  );
}
