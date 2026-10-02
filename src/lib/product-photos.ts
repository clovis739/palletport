import overrides from '../content/product-photo-overrides.json';

const approvedPhotos: Record<string, string | null> = overrides;

/** Resolve reviewed replacements and exclude supplier badges, overlays and broken files. */
export function cleanProductPhotos(images: string | string[] | null | undefined): string[] {
  const urls = Array.isArray(images) ? images : (images ?? '').split('\n');
  return [...new Set(urls.map(value => {
    const url = value.trim();
    return Object.hasOwn(approvedPhotos, url) ? approvedPhotos[url] : url;
  }).filter((url): url is string => Boolean(url)))];
}
