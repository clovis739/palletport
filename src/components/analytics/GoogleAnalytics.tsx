import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js). Rendered from the root layout only when a Measurement ID is configured and the
 * viewer isn't staff. Privacy defaults:
 * - Visitors who send Global Privacy Control (GPC) are not tracked (GA's official ga-disable flag).
 * - Google signals and ad personalisation are off: analytics only, no advertising features.
 * Page views on client-side navigation are recorded by GA4's enhanced measurement (browser history events).
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const init = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
if (navigator.globalPrivacyControl === true) { window['ga-disable-${id}'] = true; }
gtag('js', new Date());
gtag('config', '${id}', { allow_google_signals: false, allow_ad_personalization_signals: false });
`;
  return (
    <>
      {/* Inline so window.gtag exists before any page component sends an event. */}
      <script id="ga-init" dangerouslySetInnerHTML={{ __html: init }} />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  );
}
