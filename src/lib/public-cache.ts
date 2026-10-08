import "server-only";
import { unstable_cache, revalidateTag, revalidatePath as nextRevalidatePath } from "next/cache";

const PUBLIC_TAG = "storefront-public-v2";

/** Public, language-neutral DB results only. Never pass sessions or customer data. */
export function cachedPublic<A extends unknown[], T>(query: (...args: A) => Promise<T>, key: string, seconds = 300) {
  // Next's Data Cache serializes JSON. Preserve Date instances used by sorting,
  // visit dates and metadata instead of silently returning strings on cache hits.
  const read = unstable_cache(async (...args: A) => JSON.stringify(await query(...args), function (key, value) {
    const original = this[key];
    return original instanceof Date ? { __storefrontDate: original.toISOString() } : value;
  }), ["public-v2", key], { revalidate: seconds, tags: [PUBLIC_TAG] });
  return async (...args: A): Promise<T> => JSON.parse(await read(...args), (_key, value) =>
    value && typeof value === "object" && Object.keys(value).length === 1 && typeof value.__storefrontDate === "string"
      ? new Date(value.__storefrontDate) : value);
}

/** Use after catalogue/content/settings/inventory writes, never on ordinary cart reads. */
export function revalidatePath(path: string, type?: "page" | "layout") {
  revalidateTag(PUBLIC_TAG);
  nextRevalidatePath(path, type);
}
