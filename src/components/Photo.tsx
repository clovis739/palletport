import { photoSrc, type StockPhoto } from "@/content/photos";
import { ProductPhoto } from "./lot/ProductPhoto";

/** Responsive stock photo. The parent controls size; the image fills it with object-cover. */
export function Photo({
  photo,
  className = "",
  width = 800,
  ratio = 3 / 2,
  priority = false,
  sizes,
  alt,
}: {
  photo: StockPhoto;
  className?: string;
  /** Display width in CSS px (the 1x candidate). */
  width?: number;
  /** Aspect ratio of the slot; object-cover crops the local source image. */
  ratio?: number;
  /** LCP image: loads eagerly with high fetch priority. */
  priority?: boolean;
  /** `sizes` attribute; defaults to full width on phones, `width`px otherwise. */
  sizes?: string;
  alt?: string;
}) {
  return (
    <ProductPhoto
      src={photoSrc(photo, width, ratio)}
      sourceSrc={photo.src}
      sizes={sizes ?? `(max-width: 640px) 100vw, ${width}px`}
      width={width}
      height={Math.round(width / ratio)}
      alt={alt ?? photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? undefined : "async"}
      className={`bg-sand object-cover ${className}`}
    />
  );
}
