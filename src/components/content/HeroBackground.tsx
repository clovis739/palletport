import { Photo } from "@/components/Photo";
import { resolveImageRef } from "@/lib/imageRef";
import { ProductPhoto } from "@/components/lot/ProductPhoto";

const UNSPLASH = /^https:\/\/images\.unsplash\.com\//;

/** Unsplash serves any width: give the browser a proper srcset so phones don't download the 2000px image. */
function unsplashSrc(url: string, w: number) {
  const u = new URL(url);
  u.searchParams.set("w", String(w));
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  if (!u.searchParams.has("q")) u.searchParams.set("q", "70");
  return u.toString();
}

/**
 * Full-bleed background photo for dark hero sections (home, about). Decorative (alt=""), loaded with high priority.
 * Accepts a stock key, a media-library URL or an https URL (e.g. images.unsplash.com).
 */
export function HeroBackground({ refStr }: { refStr: string }) {
  const img = resolveImageRef(refStr);
  if (img.kind === "stock") return <Photo photo={img.photo} width={1600} ratio={16 / 9} sizes="100vw" priority alt="" className="absolute inset-0 h-full w-full" />;
  if (img.kind !== "url") return null;
  if (UNSPLASH.test(img.src)) {
    const widths = [640, 1080, 1600, 2200];
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external CDN image with its own resizing
      <img
        src={unsplashSrc(img.src, 1600)}
        srcSet={widths.map((w) => `${unsplashSrc(img.src, w)} ${w}w`).join(", ")}
        sizes="100vw"
        alt=""
        width={1600}
        height={900}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full bg-ink object-cover"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- media library / external image
  return <ProductPhoto src={img.src} sizes="100vw" alt="" width={1600} height={900} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full bg-ink object-cover" />;
}
