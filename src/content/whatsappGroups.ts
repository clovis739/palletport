/**
 * The WhatsApp groups popup (src/components/WhatsAppGroups.tsx) is configured in
 * Admin → Site settings → WhatsApp groups (`whatsappGroups` settings: links, names, wording, on/off, delay).
 */

/** Pages where the popup never opens on its own (buying, signing in, account). The bar still shows. */
export const WHATSAPP_POPUP_QUIET_PATHS = ["/cart", "/checkout", "/login", "/register", "/forgot-password", "/reset-password", "/account", "/orders"];
