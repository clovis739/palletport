import "server-only";
import { sendEmail as sendRaw } from "./email-client";
import { BRAND, LOGO_WORDMARK } from "./email-layout";
import { rebrandText } from "./settings-schema";

export { emailConfigured, validEmail } from "./email-client";

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Sends an email with the current brand: every "PalletPort" in the subject, text and HTML (templates, headers,
 * footers) becomes the business name from Admin → Business profile, and the header logo uses its orange highlight.
 */
export async function sendEmail(message: Parameters<typeof sendRaw>[0]) {
  let name = "";
  let accent = "";
  try {
    const { getBrandLogo } = await import("./brand");
    ({ name, accent } = await getBrandLogo());
  } catch {
    /* settings unavailable: send as written */
  }
  if (!name || name === "PalletPort") return sendRaw(message);
  const i = accent ? name.lastIndexOf(accent) : -1;
  const wordmark = i >= 0 ? `${escHtml(name.slice(0, i))}<span style="color:${BRAND.signal}">${escHtml(accent)}</span>${escHtml(name.slice(i + accent.length))}` : escHtml(name);
  return sendRaw({
    ...message,
    subject: rebrandText(message.subject, name),
    text: rebrandText(message.text, name),
    ...(message.html ? { html: rebrandText(message.html.split(LOGO_WORDMARK).join(wordmark), escHtml(name)) } : {}),
  });
}
