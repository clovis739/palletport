import Script from "next/script";

/**
 * Smartsupp live chat. Rendered from the root layout when a chat key is set (Admin → Site settings → Business
 * profile → Live chat) and the viewer isn't staff (staff answer chats from the Smartsupp dashboard / app).
 * Loaded "lazyOnload" (after the page is idle) so it never slows down the first paint.
 * The widget hides while one of our own dialogs is open (html.pp-modal-open, see globals.css).
 */
export function LiveChat({ chatKey }: { chatKey: string }) {
  const init = `
var _smartsupp = _smartsupp || {};
_smartsupp.key = ${JSON.stringify(chatKey)};
_smartsupp.color = '#f0641e';
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);
`;
  return <Script id="smartsupp-chat" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: init }} />;
}
