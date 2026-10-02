import "server-only";
import { cache } from "react";
import { getSettings, DEFAULT_BRAND, rebrandText } from "./settings";

/**
 * The store's brand name for server code (pages, metadata, emails, feeds). Comes from Admin → Site settings →
 * Business profile → Business name, so renaming the business there renames it across the whole site.
 * Falls back to the STORE_NAME env var, then "PalletPort".
 */
export const getBrand = cache(async (): Promise<string> => {
  try {
    const { business } = await getSettings();
    return business.name?.trim() || process.env.STORE_NAME?.trim() || DEFAULT_BRAND;
  } catch {
    return process.env.STORE_NAME?.trim() || DEFAULT_BRAND;
  }
});

/** Logo name + the part shown in orange ("Port"), for the header/footer logo and social images. */
export const getBrandLogo = cache(async (): Promise<{ name: string; accent: string }> => {
  const name = await getBrand();
  let accent = "";
  try {
    accent = ((await getSettings()).business.logoAccent ?? "").trim();
  } catch {
    /* defaults */
  }
  return { name, accent: accent && name.includes(accent) ? accent : "" };
});

/** Replaces the original brand name in fixed text with the current one (see rebrandText). */
export async function withBrand(text: string): Promise<string> {
  return rebrandText(text, await getBrand());
}
