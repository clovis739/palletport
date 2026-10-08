import { paymentLogoSources } from './payment-logos';
import { paymentLabel } from './commerce';
import { emailBase, esc } from './email-layout';

/** Absolute PNG URLs and inline table styles for common desktop and mobile mail clients. */
export function paymentEmailHtml(methodId?: string, name?: string, customLogo?: string) {
  if (!methodId) return '';
  const sources = paymentLogoSources(methodId, customLogo, true);
  if (!sources.length) return '';
  const images = sources.flatMap(src => {
    try {
      const url = new URL(src, emailBase());
      if (url.protocol !== 'https:') return [];
      return [`<td style="padding:8px;background:${methodId === 'ZELLE' && !customLogo ? '#6d1ed4' : '#ffffff'};vertical-align:middle"><img src="${esc(url.href)}" alt="${esc(name || paymentLabel(methodId))}" width="64" style="display:block;width:64px;max-width:64px;height:auto;border:0" /></td>`];
    } catch { return []; }
  });
  if (!images.length) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;border-collapse:collapse"><tr>${images.join('')}<td style="padding:8px 12px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#17212b">${esc(name || paymentLabel(methodId))}</td></tr></table>`;
}
