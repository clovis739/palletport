import { Photo } from "@/components/Photo";
import { displayImage } from "@/lib/mediaUrls";
import { resolveImageRef } from "@/lib/imageRef";
import { photoLightingStyle } from '@/lib/photo-lighting';

/**
 * Renders an image ref (stock photo key or media URL — see src/lib/imageRef.ts) in a slot.
 * Stock photos go through <Photo> (responsive CDN srcset); media URLs render a plain <img> with
 * width/height to reserve space. Renders nothing for an empty/unknown ref.
 */
export function SiteImage({
  src,
  alt,
  width = 800,
  height,
  ratio,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  alt?: string;
  /** Display width in CSS px (stock photos) or intrinsic width (media). */
  width?: number;
  /** Intrinsic height for media URLs. */
  height?: number;
  /** Slot aspect ratio (width / height). */
  ratio?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const img = resolveImageRef(src);
  if (img.kind === "none") return null;
  if (img.kind === "stock") {
    return <Photo photo={img.photo} alt={alt || img.photo.alt} width={width} ratio={ratio ?? 3 / 2} sizes={sizes} priority={priority} className={className} />;
  }
  const h = height ?? Math.round(width / (ratio ?? 3 / 2));
  return (
    // eslint-disable-next-line @next/next/no-img-element -- media library files are served pre-sized from /media/lib
    <img
      src={displayImage(img.src, width * 2)}
      style={photoLightingStyle(img.src)}
      alt={alt ?? ""}
      width={width}
      height={h}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? undefined : "async"}
      className={`bg-sand object-cover ${className}`}
    />
  );
}
