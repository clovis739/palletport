/** WhatsApp community groups promoted by the site-wide popup and the bar above the header (WhatsAppGroups.tsx). */
export type WhatsAppGroup = { id: string; title: string; subtitle: string; href: string; icon: "fashion" | "general" };

export const WHATSAPP_GROUPS: WhatsAppGroup[] = [
  {
    id: "fashion",
    title: "Clothing & Shoes",
    subtitle: "Apparel, footwear and fashion deals",
    href: "https://chat.whatsapp.com/FCMn5dzmJBJ7rCT8jBcaij",
    icon: "fashion",
  },
  {
    id: "general",
    title: "Everything Else",
    subtitle: "Electronics, home goods, tools and toys",
    href: "https://chat.whatsapp.com/FCMn5dzmJBJ7rCT8jBcaij",
    icon: "general",
  },
];

/** Seconds on the page before the popup opens for a first-time visitor. */
export const WHATSAPP_POPUP_DELAY_S = 6;

/** Pages where the popup never opens on its own (buying, signing in, account). The bar still shows. */
export const WHATSAPP_POPUP_QUIET_PATHS = ["/cart", "/checkout", "/login", "/register", "/forgot-password", "/reset-password", "/account", "/orders"];
