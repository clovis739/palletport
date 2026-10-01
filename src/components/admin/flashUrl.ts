/**
 * Flash messages via the URL, for server actions that redirect:
 *
 *   redirect(withFlash("/dashboard/content", "Post published"));
 *   redirect(withFlash("/dashboard/media", "Upload failed: too large", "error"));
 *
 * <FlashToast /> (rendered once by the admin shell) shows the message and strips the params.
 */
export const FLASH_PARAM = "flash";
export const FLASH_TONE_PARAM = "flashTone";
export type FlashTone = "success" | "error" | "info";

export function withFlash(path: string, message: string, tone: FlashTone = "success") {
  const [base, hash = ""] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${FLASH_PARAM}=${encodeURIComponent(message.slice(0, 200))}${tone === "success" ? "" : `&${FLASH_TONE_PARAM}=${tone}`}${hash ? `#${hash}` : ""}`;
}
