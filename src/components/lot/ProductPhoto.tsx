import type { ImgHTMLAttributes } from "react";
import { displayImage, imageSrcSet } from "@/lib/mediaUrls";
import { photoLightingStyle } from '@/lib/photo-lighting';

/** Display product photography without added text or logo overlays. */
export function ProductPhoto({ className = "", src, sourceSrc, style, sizes, srcSet, ...props }: ImgHTMLAttributes<HTMLImageElement> & { sourceSrc?: string }) {
  const width = Number(props.width) || 800;
  const url = typeof src === "string" ? src : undefined;
  const candidates = srcSet ?? (url ? imageSrcSet(url, width * 2) : undefined);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} src={url ? displayImage(url, width) : src}
      srcSet={candidates} sizes={candidates ? (sizes ?? `(max-width: 640px) 100vw, ${width}px`) : sizes}
      loading={props.loading ?? "lazy"} decoding={props.decoding ?? "async"}
      style={photoLightingStyle(sourceSrc ?? url, style)} className={`block h-full w-full object-cover ${className}`} />
  );
}
