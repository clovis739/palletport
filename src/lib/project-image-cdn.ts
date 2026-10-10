import "server-only";
import images from "@/content/project-image-cdn.json";

const uploaded: Record<string, string> = images;
/** Resolve only hash-verified uploads; keep unknown/new local files unchanged. Server only. */
export function projectImageUrl(src: string): string {
  return Object.hasOwn(uploaded, src) ? uploaded[src] : src;
}
