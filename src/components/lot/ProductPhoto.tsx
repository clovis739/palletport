import type { ImgHTMLAttributes } from "react";
import { displayImage, imageSrcSet } from "@/lib/mediaUrls";
import { photoLightingStyle } from '@/lib/photo-lighting';

/** Display product photography without added text or logo overlays. */
export function ProductPhoto({ className = "", src, sourceSrc, style, sizes, srcSet, ...props }: ImgHTMLAttributes<HTMLImageElement> & { sourceSrc?: string }) {
  const width = Number(props.width) || 800;
  // Fill the parent by default, but never override an explicit size (h-11 w-11 thumbnails etc.):
  // with both classes present the CSS order decides, and w-full was winning (400px thumbnails).
  const fill = [/(^|\s)(h-|size-)/.test(className) ? "" : "h-full", /(^|\s)(w-|size-)/.test(className) ? "" : "w-full"].join(" ");
  const url = typeof src === "string" ? src : undefined;
  const candidates = srcSet ?? (url ? imageSrcSet(url, width * 2) : undefined);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} src={url ? displayImage(url, width) : src}
      srcSet={candidates} sizes={candidates ? (sizes ?? (width <= 200 ? `${width}px` : `(max-width: 640px) 100vw, ${width}px`)) : sizes}
      loading={props.loading ?? "lazy"} decoding={props.decoding ?? "async"}
      style={photoLightingStyle(sourceSrc ?? url, style)} className={`block ${fill} object-cover ${className}`} />
  );
}
