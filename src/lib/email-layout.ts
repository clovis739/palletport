/**
 * Branded, responsive HTML shell for every PalletPort email (order, visit, password reset, inquiry).
 * Pure module (no server-only / db imports) so it can be previewed with scripts/preview-emails.ts.
 *
 * Email-client rules followed here: table layout, inline styles for everything that must survive Gmail,
 * a <style> block only for progressive extras (mobile stacking, web fonts), images with width/height,
 * a plain-text preheader, and no background images or scripts.
 */

export const BRAND = {
  ink: "#13233f",
  signal: "#f0641e",
  signalDark: "#cf4f0e",
  signalTint: "#fff1e9",
  sand: "#f4f5f7",
  line: "#eceef1",
  muted: "#5b6472",
  text: "#3d4757",
  moss: "#2d6a4c",
} as const;

/** Logo wordmark in the email header. sendEmail() (src/lib/email.ts) swaps it for the current business name. */
export const LOGO_WORDMARK = `Pallet<span style="color:${BRAND.signal}">Port</span>`;

const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
const DISPLAY = "'Space Grotesk',Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Site base URL for links and the logo (APP_URL, never a trailing slash). */
export function emailBase() {
  return (process.env.APP_URL || "https://liquidationpalletssale.com").replace(/\/+$/, "");
}

/** Label / value row. On phones the two cells stack (label above value). */
export function factRow(label: string, value: string, stack = true) {
  return `<tr${stack ? ' class="pp-stack"' : ""}><td class="pp-k" style="padding:9px 12px 9px 0;color:${BRAND.muted};font-family:${SANS};font-size:13px;line-height:1.5;vertical-align:top;width:40%">${esc(label)}</td><td class="pp-v" style="padding:9px 0;color:${BRAND.ink};font-family:${SANS};font-size:13px;line-height:1.5;font-weight:600;text-align:right;vertical-align:top;word-break:break-word">${esc(value)}</td></tr>`;
}

/** `stack: false` keeps label and value side by side on phones (short values such as money). */
export function factTable(rows: [string, string][], stack = true) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows.map(([k, v]) => factRow(k, v, stack)).join("")}</table>`;
}

export function sectionTitle(text: string) {
  return `<h2 style="margin:26px 0 6px;color:${BRAND.ink};font-family:${DISPLAY};font-size:16px;line-height:1.3;font-weight:700">${esc(text)}</h2>`;
}

/** Highlighted reference box (order / booking number, reset notice …). */
export function callout(label: string, value: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin-top:20px"><tr><td style="padding:14px 16px;background:${BRAND.sand};border-left:4px solid ${BRAND.signal};border-radius:10px"><div style="color:${BRAND.muted};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase">${esc(label)}</div><div style="margin-top:4px;color:${BRAND.ink};font-family:${DISPLAY};font-size:19px;font-weight:700;word-break:break-all">${esc(value)}</div></td></tr></table>`;
}

export function paragraph(html: string) {
  return `<p style="margin:14px 0 0;color:${BRAND.text};font-family:${SANS};font-size:14px;line-height:1.7">${html}</p>`;
}

/** The pallet mark built from table cells, so it shows even when a mail client blocks images. */
function logoMark() {
  const c = (w: number, h: number, bg: string, r = 3) => `<td width="${w}" height="${h}" style="width:${w}px;height:${h}px;background:${bg};border-radius:${r}px;font-size:0;line-height:0">&nbsp;</td>`;
  const gap = (w: number) => `<td width="${w}" style="width:${w}px;font-size:0;line-height:0">&nbsp;</td>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr>${c(13, 11, BRAND.ink)}${gap(2)}${c(13, 11, BRAND.signal)}</tr><tr><td colspan="3" height="2" style="height:2px;font-size:0;line-height:0">&nbsp;</td></tr><tr><td colspan="3" style="padding:0"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr>${c(28, 6, BRAND.ink, 2)}</tr></table></td></tr><tr><td colspan="3" style="padding:2px 0 0"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr>${c(5, 5, BRAND.ink, 1)}${gap(6)}${c(5, 5, BRAND.ink, 1)}${gap(7)}${c(5, 5, BRAND.ink, 1)}</tr></table></td></tr></table>`;
}

type Layout = {
  /** <title> and screen-reader heading context. */
  title: string;
  /** Inbox preview line (hidden in the body). */
  preheader: string;
  /** Small orange pill above the heading, e.g. "Order confirmation". */
  eyebrow?: string;
  heading: string;
  /** Already-escaped HTML. */
  introHtml?: string;
  /** Already-escaped HTML for the main content. */
  bodyHtml?: string;
  cta?: { label: string; href: string };
  /** Small print under the button, already escaped. */
  noteHtml?: string;
  /** Why they got this email (footer). */
  reason: string;
  /** Email language (customer's choice); text passed in is already translated. */
  lang?: "en" | "es";
};

/** Site base URL for links in an email, with /es for Spanish readers. */
export function emailLinkBase(lang: "en" | "es" = "en") {
  return lang === "es" ? `${emailBase()}/es` : emailBase();
}

export function emailLayout({ title, preheader, eyebrow, heading, introHtml = "", bodyHtml = "", cta, noteHtml, reason, lang = "en" }: Layout) {
  const base = emailBase();
  const host = base.replace(/^https?:\/\//, "");
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 auto" class="pp-full"><tr><td align="center" style="border-radius:999px;background:${BRAND.signal}"><a class="pp-btn" href="${esc(cta.href)}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:${BRAND.signal};color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;line-height:1;text-decoration:none">${esc(cta.label)} &rarr;</a></td></tr></table>`
    : "";
  return `<!doctype html>
<html lang="${lang === "es" ? "es" : "en"}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  a { color:${BRAND.signalDark}; }
  @media (max-width:620px) {
    .pp-outer { padding:0 !important; }
    .pp-card { border-radius:0 !important; }
    .pp-pad { padding-left:20px !important; padding-right:20px !important; }
    .pp-h1 { font-size:23px !important; }
    .pp-stack td { display:block !important; width:100% !important; text-align:left !important; }
    .pp-stack td.pp-k { padding:10px 0 0 !important; }
    .pp-stack td.pp-v { padding:2px 0 10px !important; border-bottom:1px solid ${BRAND.line}; }
    .pp-full { width:100% !important; }
    .pp-btn { display:block !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.sand}">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.sand}">
<tr><td align="center" class="pp-outer" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="pp-card" style="width:100%;max-width:600px;border-collapse:separate;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td class="pp-pad" style="padding:22px 32px;border-bottom:1px solid ${BRAND.line}">
      <a href="${esc(base)}" style="text-decoration:none">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
          <td style="padding-right:10px;vertical-align:middle">${logoMark()}</td>
          <td style="vertical-align:middle;font-family:${DISPLAY};font-size:22px;font-weight:700;color:${BRAND.ink};line-height:1">${LOGO_WORDMARK}</td>
        </tr></table>
      </a>
    </td></tr>
    <tr><td class="pp-pad" style="padding:30px 32px 6px">
      ${eyebrow ? `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${BRAND.signalTint};color:${BRAND.signalDark};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase">${esc(eyebrow)}</span>` : ""}
      <h1 class="pp-h1" style="margin:14px 0 0;color:${BRAND.ink};font-family:${DISPLAY};font-size:27px;line-height:1.2;font-weight:700">${esc(heading)}</h1>
      ${introHtml ? paragraph(introHtml) : ""}
    </td></tr>
    ${bodyHtml ? `<tr><td class="pp-pad" style="padding:0 32px 6px">${bodyHtml}</td></tr>` : ""}
    ${cta || noteHtml ? `<tr><td class="pp-pad" align="center" style="padding:26px 32px 32px">${button}${noteHtml ? `<p style="margin:${cta ? "16px" : "0"} 0 0;color:${BRAND.muted};font-family:${SANS};font-size:12px;line-height:1.6;text-align:center">${noteHtml}</p>` : ""}</td></tr>` : `<tr><td style="padding:0 0 26px"></td></tr>`}
    <tr><td class="pp-pad" style="padding:20px 32px;background:${BRAND.ink};color:#c9d2e1;font-family:${SANS};font-size:11px;line-height:1.7">
      <strong style="color:#ffffff">PalletPort</strong> &middot; ${lang === "es" ? "Pallets de liquidación al por mayor" : "Wholesale liquidation pallets"}<br>
      <a href="${esc(base)}" style="color:#ffffff;text-decoration:underline">${esc(host)}</a><br>
      ${esc(reason)}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

// ---------- password reset ----------

export function passwordResetEmailHtml(url: string, t: (s: string) => string = (s) => s, lang: "en" | "es" = "en") {
  return emailLayout({
    lang,
    title: t("Reset your PalletPort password"),
    preheader: t("Use this link within one hour to choose a new password."),
    eyebrow: t("Account security"),
    heading: t("Reset your password"),
    introHtml: esc(t("We received a request to reset the password for your PalletPort account. Tap the button below to choose a new one.")),
    cta: { label: t("Choose a new password"), href: url },
    noteHtml: `${esc(t("This link expires in one hour and can be used once."))}<br>${esc(t("If you didn't ask for this, you can ignore this email; your password won't change."))}<br><br>${esc(t("Button not working? Copy this link:"))}<br><a href="${esc(url)}" style="color:${BRAND.signalDark};word-break:break-all">${esc(url)}</a>`,
    reason: t("You are receiving this because a password reset was requested for your account."),
  });
}

// ---------- contact / sourcing inquiry (to the store team) ----------

export function inquiryEmailHtml(d: { topic: string; name: string; email: string; company?: string; body: string }) {
  const base = emailBase();
  return emailLayout({
    title: `New ${d.topic.toLowerCase()} inquiry`,
    preheader: `${d.name} sent a ${d.topic.toLowerCase()} inquiry. Reply to this email to answer.`,
    eyebrow: "New inquiry",
    heading: `${d.topic.charAt(0)}${d.topic.slice(1).toLowerCase()} inquiry from ${d.name}`,
    introHtml: "Reply directly to this email to answer the customer.",
    bodyHtml:
      factTable([["Topic", d.topic.charAt(0) + d.topic.slice(1).toLowerCase()], ["Name", d.name], ["Email", d.email], ...(d.company ? ([["Company", d.company]] as [string, string][]) : [])]) +
      sectionTitle("Message") +
      `<div style="padding:14px 16px;background:${BRAND.sand};border-radius:10px;color:${BRAND.ink};font-family:${SANS};font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">${esc(d.body)}</div>`,
    cta: { label: "Open the inbox", href: `${base}/dashboard/inbox` },
    reason: "Sent to the store team because someone used the contact form on the site.",
  });
}
