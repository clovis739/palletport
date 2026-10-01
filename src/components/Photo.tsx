import { photoSrc, type StockPhoto } from "@/content/photos";

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
  /** Aspect ratio (width / height) of the slot; the CDN crops to it and width/height attrs reserve the space. */
  ratio?: number;
  /** LCP image: loads eagerly with high fetch priority. */
  priority?: boolean;
  /** `sizes` attribute; defaults to full width on phones, `width`px otherwise. */
  sizes?: string;
  alt?: string;
}) {
  const half = Math.round(width / 2);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Unsplash's CDN already resizes and serves modern formats
    <img
      src={photoSrc(photo, width, ratio)}
      srcSet={`${photoSrc(photo, half, ratio)} ${half}w, ${photoSrc(photo, width, ratio)} ${width}w, ${photoSrc(photo, width * 2, ratio)} ${width * 2}w`}
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
