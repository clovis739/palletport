import type { ImgHTMLAttributes } from "react";
import { displayImage } from "@/lib/mediaUrls";
import { photoLightingStyle } from '@/lib/photo-lighting';

/** Display product photography without added text or logo overlays. */
export function ProductPhoto({ className = "", src, style, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // Cloudinary photos are resized to twice the shown width (sharp on high-density screens) and served as WebP/AVIF.
  const w = Number(props.width) || undefined;
  const shown = typeof src === "string" ? displayImage(src, w ? w * 2 : undefined) : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} src={shown} style={photoLightingStyle(typeof src === 'string' ? src : undefined, style)} className={`block h-full w-full object-cover ${className}`} />
  );
}
