/**
 * Site settings: zod schemas, TypeScript types and DEFAULTS. Pure module (no server imports) so client
 * editor forms can import the types, schemas and defaults. Read/write settings with src/lib/settings.ts.
 *
 * DEFAULTS mirror what the storefront showed before the admin existed (Header, Footer, home, about, contact,
 * root metadata). Empty string = unknown / not shown. Business contact fields fall back to the STORE_* env
 * vars (see src/lib/seo.ts) when empty — that happens in getSettings(), not here.
 *
 * Image fields ("photo refs") hold either a stock photo key from src/content/photos.ts (e.g. "heroWarehouse")
 * or a media library URL ("/media/lib/…"). Resolve them with resolveImageRef() in src/lib/imageRef.ts.
 *
 * Text fields may use the tokens {name} (business name) and {location} (store location) where noted.
 */
import { z } from "zod";

const str = z.string().trim();
const optStr = z.string().trim().optional();
/** Internal path ("/x") or absolute http(s) URL, or "" (none). */
const href = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v) || /^(mailto|tel):/i.test(v), "Links must start with / or https://");
const link = z.object({ label: str.min(1, "Every link needs a label"), href: href.refine((v) => v !== "", "Every link needs a URL") });
export type SiteLink = z.infer<typeof link>;
const imageRef = str; // stock photo key or media URL

/**
 * Accepts either the bare Smartsupp key or the whole "Chat code" snippet pasted from Smartsupp and returns the key,
 * so the owner can switch Smartsupp accounts by pasting whatever Smartsupp gives them.
 */
export function smartsuppKeyFrom(input: string): string {
  const v = input.trim();
  const m = v.match(/_smartsupp\.key\s*=\s*['"]([a-f0-9]{20,64})['"]/i);
  return m ? m[1] : v.replace(/^['"]|['"]$/g, "");
}

// ---------- business ----------

export const businessSchema = z.object({
  name: str.min(1, "Enter the business name"),
  tagline: str,
  email: str.refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  salesEmail: str.refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email").optional(),
  phone: str,
  whatsapp: optStr,
  addressStreet: str,
  addressCity: str,
  addressRegion: str,
  addressPostal: str,
  country: str,
  /** Free text shown to buyers, e.g. "Monday–Friday, 8am–6pm ET". (JSON-LD hours still come from STORE_HOURS.) */
  hours: str,
  pickupNote: str,
  socialLinks: z.array(link),
  /** Google Business Profile: Place ID (for live reviews, the map pin and the "write a review" link). */
  googlePlaceId: optStr,
  /** Public link to the Google Business Profile ("Share" link from Google Maps). */
  googleMapsUrl: optStr.refine((v) => !v || /^https:\/\//.test(v), "Link must start with https://"),
  /** Real photos of the warehouse / storefront (uploaded, never stock). Shown on the Contact page and given to Google as the business images. */
  photos: z.array(imageRef).max(6).optional(),
  /** Part of the name shown in orange in the header logo, e.g. "Port" in PalletPort. Empty = whole name in one colour. */
  logoAccent: optStr,
  /** Smartsupp live chat key (Smartsupp → Settings → Chat box → Chat code: the value of _smartsupp.key). Empty = no chat widget. */
  smartsuppKey: z.preprocess(
    (v) => (typeof v === "string" ? smartsuppKeyFrom(v) : v),
    optStr.refine((v) => !v || /^[a-f0-9]{20,64}$/i.test(v), "Paste the Smartsupp key (or the whole chat code)"),
  ),
});
export type BusinessSettings = z.infer<typeof businessSchema>;

// ---------- navigation ----------

/** Visual style of a header quick link: "primary" = dark pill, "urgent" = red text (e.g. a sale). */
export const NAV_TONES = ["default", "primary", "urgent"] as const;
export type NavTone = (typeof NAV_TONES)[number];
const navItem = link.extend({ children: z.array(link).optional(), tone: z.enum(NAV_TONES).optional() });
export type NavItem = z.infer<typeof navItem>;

/**
 * Tone of each header item. Rows saved before `tone` existed (no item has a tone) keep the original look:
 * first item primary, "…ending=…" links urgent.
 */
export function headerTones(items: NavItem[]): NavTone[] {
  const legacy = items.every((i) => i.tone === undefined);
  return items.map((i, n) => (legacy ? (n === 0 ? "primary" : /[?&]ending=/.test(i.href) ? "urgent" : "default") : i.tone ?? "default"));
}

export const navigationSchema = z.object({
  /** Header quick-link strip (categories from the DB are appended after these automatically). */
  header: z.array(navItem),
  /** Extra links shown in the mobile drawer's "Shop" list after the header links. */
  mobileExtra: z.array(link).optional(),
  footerColumns: z.array(z.object({ title: str.min(1), links: z.array(link) })),
  footerBlurb: str,
  legalLinks: z.array(link),
});
export type NavigationSettings = z.infer<typeof navigationSchema>;

// ---------- announcement bar ----------

export const announcementSchema = z.object({
  enabled: z.boolean(),
  text: str,
  /** Shorter version for phones (falls back to `text`). */
  mobileText: optStr,
  href: href.optional(),
  linkLabel: optStr,
  tone: z.enum(["info", "promo", "warning"]),
});
export type AnnouncementSettings = z.infer<typeof announcementSchema>;

// ---------- homepage ----------

/** closingSoon = "Recently added" (was "Featured lots"), buyNow = "Best value" (keys kept so saved settings stay valid). */
export const HOME_SECTIONS = ["closingSoon", "lotSizes", "categories", "buyNow", "howItWorks", "conditions", "collections", "guides", "recentlySold", "aboutCard", "contactCard", "blog"] as const;
export type HomeSectionKey = (typeof HOME_SECTIONS)[number];
const homeSection = z.object({ enabled: z.boolean(), title: str, subtitle: str });

export const homeSchema = z.object({
  heroEyebrow: str,
  heroTitle: str.min(1, "Enter a hero headline"),
  heroSubtitle: str,
  heroSearchPlaceholder: str,
  heroPhoto: imageRef,
  heroLinks: z.array(link),
  stats: z.object({
    enabled: z.boolean(),
    /** "Lots in stock" count (key kept from the auction era so saved settings stay valid). */
    liveAuctions: z.boolean(),
    /** "New this week" count. */
    endingHour: z.boolean(),
    retailValue: z.boolean(),
    typicalPrice: z.boolean(),
    typicalPriceValue: str,
    typicalPriceLabel: str,
  }),
  sections: z.object(Object.fromEntries(HOME_SECTIONS.map((k) => [k, homeSection])) as Record<HomeSectionKey, typeof homeSection>),
  howItWorksSteps: z.array(z.object({ title: str, text: str })),
  howItWorksCta: link,
  /** Display order of the homepage sections (HOME_SECTIONS keys). Missing keys follow in default order. */
  order: z.array(z.enum(HOME_SECTIONS)).optional(),
});
export type HomeSettings = z.infer<typeof homeSchema>;

/** Every homepage section key in display order (`home.order` first, then any missing keys in default order). */
export function homeSectionOrder(home: Pick<HomeSettings, "order">): HomeSectionKey[] {
  const seen = new Set<HomeSectionKey>();
  const out: HomeSectionKey[] = [];
  for (const k of [...(home.order ?? []), ...HOME_SECTIONS]) {
    if (!(HOME_SECTIONS as readonly string[]).includes(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

// ---------- about page ----------

const card = z.object({ title: str, text: str, href: href });
const ctaCard = card.extend({ cta: str });

export const aboutSchema = z.object({
  heroEyebrow: str,
  heroTitle: str.min(1),
  /** Supports {name} and {location}. */
  heroIntro: str,
  heroPhotos: z.array(imageRef).max(4),
  /** Full-width background photo behind the About hero text (like the homepage hero). */
  heroBg: imageRef,
  statsTitle: str,
  mission: z.object({ eyebrow: str, title: str, paragraphs: z.array(str), linkLabel: str, linkHref: href }),
  sustainability: z.object({ eyebrow: str, title: str, body: str, linkLabel: str, linkHref: href, photo: imageRef }),
  transparent: z.object({ eyebrow: str, title: str, cards: z.array(card) }),
  audiences: z.object({ eyebrow: str, title: str, intro: str }),
  advantages: z.object({ eyebrow: str, title: str, cards: z.array(ctaCard) }),
  thanks: z.object({ title: str, body: str, cards: z.array(card) }),
});
export type AboutSettings = z.infer<typeof aboutSchema>;

// ---------- FAQs (homepage, about page, blog) ----------

const faqItem = z.object({ q: str.min(1, "Enter the question"), a: str.min(1, "Enter the answer") });
export type FaqItem = z.infer<typeof faqItem>;
const faqBlock = z.object({
  enabled: z.boolean(),
  title: str,
  /** Optional line under the heading. Supports {name} and {location}. */
  intro: str,
  /** Answers support {name} and {location}. */
  items: z.array(faqItem).max(20, "Up to 20 questions per page"),
});
export type FaqBlock = z.infer<typeof faqBlock>;
export const FAQ_PAGES = ["home", "about", "blog"] as const;
export type FaqPage = (typeof FAQ_PAGES)[number];
export const faqsSchema = z.object({ home: faqBlock, about: faqBlock, blog: faqBlock });
export type FaqsSettings = z.infer<typeof faqsSchema>;

// ---------- contact page ----------

const contactTip = z.object({ label: str, text: str, linkLabel: str, href: href });
export type ContactTip = z.infer<typeof contactTip>;
export const contactSchema = z.object({
  /** Browser tab / Google title and description for /contact. */
  seoTitle: str.min(1, "Enter a page title"),
  seoDescription: str,
  title: str.min(1, "Enter a heading"),
  /** Supports {name} and {location}. */
  intro: str,
  /** Short notes in the first box (label in bold, then text, then an optional link). */
  tips: z.array(contactTip).max(8, "Up to 8 notes"),
  /** Adds the pickup note from the business profile to the first box. */
  showPickup: z.boolean(),
  /** Adds the opening hours from the business profile to the first box. */
  showHours: z.boolean(),
  directTitle: str,
  formTitle: str,
  bodyLabel: str.min(1, "Enter a label for the message box"),
  submitLabel: str.min(1, "Enter the button text"),
  /** Shown above the form when someone comes from a "Book a pickup" link (/contact?topic=pickup). */
  pickupNotice: str,
  pickupSubmitLabel: str.min(1, "Enter the button text"),
  photosTitle: str,
  showMap: z.boolean(),
  mapTitle: str,
  mapNote: str,
  showReviews: z.boolean(),
  reviewsTitle: str,
});
export type ContactSettings = z.infer<typeof contactSchema>;

// ---------- checkout (payment methods + fields) ----------

/** Built-in methods with special handling at checkout: CARD (card form), WIRE (bank details), NET30 (verified resellers only). */
export const BUILTIN_PAYMENT_IDS = ["CARD", "WIRE", "NET30"] as const;
/** Generic icons an admin can pick for a payment method (brand logos are uploaded as images instead). */
export const PAYMENT_ICONS = ["card", "bank", "transfer", "phone", "wallet", "cash", "invoice", "zap"] as const;
export type PaymentIcon = (typeof PAYMENT_ICONS)[number];

const paymentMethod = z.object({
  /** Stable code saved on each order, e.g. "ZELLE". Capital letters, digits and _ only. */
  id: str.regex(/^[A-Z0-9_]{2,24}$/, "Use 2–24 capital letters, digits or _ (e.g. ZELLE)"),
  enabled: z.boolean(),
  name: str.min(1, "Enter the method name"),
  /** One line under the name in the dropdown. */
  description: str,
  /** Shown after the order is placed (order page + confirmation email): where and how to send payment. */
  instructions: str,
  icon: z.enum(PAYMENT_ICONS),
  /** Optional uploaded logo (the provider's official acceptance mark). Replaces the generic icon. */
  logo: imageRef,
});
export type PaymentMethodSetting = z.infer<typeof paymentMethod>;

const fieldSetting = z.object({ show: z.boolean(), required: z.boolean(), label: str.min(1, "Enter a label"), placeholder: str });
export type CheckoutFieldSetting = z.infer<typeof fieldSetting>;
const customField = z.object({
  id: str.regex(/^[a-z0-9_]{2,24}$/, "Use lowercase letters, digits or _"),
  label: str.min(1, "Enter a label"),
  type: z.enum(["text", "textarea"]),
  required: z.boolean(),
  placeholder: str,
});
export type CheckoutCustomField = z.infer<typeof customField>;

export const checkoutSettingsSchema = z.object({
  paymentTitle: str.min(1, "Enter a heading"),
  paymentMethods: z.array(paymentMethod).min(1, "Keep at least one payment method").max(12, "Up to 12 payment methods"),
  fields: z.object({ phone: fieldSetting, poNumber: fieldSetting, notes: fieldSetting }),
  /** Extra questions at checkout. Answers are saved in the order notes. */
  customFields: z.array(customField).max(6, "Up to 6 extra fields"),
});
export type CheckoutSettings = z.infer<typeof checkoutSettingsSchema>;

// ---------- SEO ----------

export const seoSchema = z.object({
  defaultTitle: str.min(1),
  /** Must contain %s, e.g. "%s · PalletPort". */
  titleTemplate: str.refine((v) => v.includes("%s"), "The template must contain %s"),
  defaultDescription: str,
  /** Media URL or absolute URL; "" = the generated /opengraph-image. */
  ogImage: optStr,
  /** Google Search Console "HTML tag" verification code (only the content="…" value). */
  googleVerification: optStr,
  /** Google Analytics 4 Measurement ID ("G-XXXXXXXXXX"). Empty = analytics off (unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set). */
  gaMeasurementId: optStr.refine((v) => !v || /^G-[A-Z0-9]{4,20}$/i.test(v.trim()), "Use the Measurement ID, e.g. G-AB12CD34EF"),
});
export type SeoSettings = z.infer<typeof seoSchema>;

// ---------- registry ----------

export const SETTINGS_SCHEMAS = {
  business: businessSchema,
  navigation: navigationSchema,
  announcement: announcementSchema,
  home: homeSchema,
  about: aboutSchema,
  faqs: faqsSchema,
  contact: contactSchema,
  checkout: checkoutSettingsSchema,
  seo: seoSchema,
} as const;

export type SettingsKey = keyof typeof SETTINGS_SCHEMAS;
export const SETTINGS_KEYS = Object.keys(SETTINGS_SCHEMAS) as SettingsKey[];
export type SettingsMap = { [K in SettingsKey]: z.infer<(typeof SETTINGS_SCHEMAS)[K]> };

export function isSettingsKey(k: string): k is SettingsKey {
  return k in SETTINGS_SCHEMAS;
}

// ---------- defaults (= what the site showed before settings existed) ----------

export const DEFAULTS: SettingsMap = {
  business: {
    name: "PalletPort",
    logoAccent: "Port",
    tagline: "Manifested liquidation pallets, truckloads and case packs direct from our warehouse",
    email: "",
    salesEmail: "",
    phone: "",
    whatsapp: "",
    addressStreet: "",
    addressCity: "Columbus",
    addressRegion: "OH",
    addressPostal: "",
    country: "US",
    hours: "Monday–Friday, 8am–6pm ET",
    pickupNote: "Warehouse pickup is by appointment only. There's no walk-in store.",
    socialLinks: [],
  },
  navigation: {
    header: [
      { label: "Shop all lots", href: "/lots", tone: "primary" },
      { label: "New arrivals", href: "/new" },
      { label: "Best value", href: "/lots?sort=value" },
      { label: "Truckloads", href: "/truckloads" },
      { label: "Pallets", href: "/pallets" },
      { label: "Case packs", href: "/case-packs" },
    ],
    mobileExtra: [
      { label: "All categories", href: "/categories" },
      { label: "How ordering works", href: "/how-to-buy" },
      { label: "Help center", href: "/help" },
    ],
    footerColumns: [
      {
        title: "Shop",
        links: [
          { label: "Shop all lots", href: "/lots" },
          { label: "Truckloads", href: "/truckloads" },
          { label: "Pallets", href: "/pallets" },
          { label: "Case packs", href: "/case-packs" },
          { label: "Categories", href: "/categories" },
          { label: "New arrivals", href: "/new" },
          { label: "Trending", href: "/trending" },
          { label: "Collections", href: "/collections" },
        ],
      },
      {
        title: "Buyers",
        links: [
          { label: "Create an account", href: "/register" },
          { label: "How to order", href: "/how-to-buy" },
          { label: "My orders", href: "/orders" },
          { label: "How it works", href: "/how-it-works" },
          { label: "Guides by store type", href: "/guides" },
          { label: "PalletPort Pro", href: "/pro" },
          { label: "Volume buyers", href: "/volume-buyers" },
          { label: "Refer a business", href: "/account/referrals" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Blog", href: "/blog" },
          { label: "Market reports", href: "/reports" },
          { label: "Warehouse Days", href: "/events" },
          { label: "Columbus, Ohio pallets", href: "/liquidation-pallets-columbus-ohio" },
          { label: "Affiliates", href: "/affiliates" },
          { label: "Help center", href: "/help" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
    footerBlurb:
      "Liquidation pallets sold direct from our own warehouse. Every lot manifested and shipped by LTL, truckload or parcel. Warehouse pickup by appointment only.",
    legalLinks: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Returns & refunds", href: "/legal/returns-and-disputes" },
      { label: "Prohibited items", href: "/legal/prohibited-items" },
      { label: "IP policy", href: "/legal/intellectual-property" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
  announcement: {
    enabled: false,
    text: "Fixed prices on every lot · Free freight on orders over $7,500 · Net 30 for verified resellers",
    mobileText: "Fixed prices · Free freight over $7,500",
    href: "/how-to-buy",
    linkLabel: "How ordering works",
    tone: "info",
  },
  home: {
    heroEyebrow: "Liquidation pallets, direct from our warehouse",
    heroTitle: "Shop returns & overstock by the case, pallet or truckload.",
    heroSubtitle: "Manifested lots from retailers and distributors at fixed prices. Add to cart, check out, and we ship dock to door.",
    heroSearchPlaceholder: "Search lots — try “air fryer”, “power tools”, “truckload”",
    // Warehouse aisle with pallet racking. Photo: Ruchindra Gunasekara on Unsplash (free under the Unsplash License).
    heroPhoto: "https://images.unsplash.com/photo-1553413077-190dd305871c",
    heroLinks: [
      { label: "Shop all lots", href: "/lots" },
      { label: "New arrivals", href: "/new" },
      { label: "Truckloads", href: "/truckloads" },
      { label: "Pallets", href: "/pallets" },
      { label: "Case packs", href: "/case-packs" },
    ],
    stats: {
      enabled: true,
      liveAuctions: true,
      endingHour: true,
      retailValue: true,
      typicalPrice: true,
      typicalPriceValue: "10–35%",
      typicalPriceLabel: "typical price vs. retail",
    },
    sections: {
      closingSoon: { enabled: true, title: "Recently added", subtitle: "The newest lots in stock, latest first." },
      lotSizes: { enabled: true, title: "Shop by lot size", subtitle: "" },
      categories: { enabled: true, title: "Shop by category", subtitle: "" },
      buyNow: { enabled: true, title: "Best value", subtitle: "In-stock lots with the lowest price against retail." },
      howItWorks: { enabled: true, title: "How buying works", subtitle: "For bin stores, discount shops, online resellers, flea-market vendors and exporters." },
      conditions: { enabled: true, title: "Shop by condition", subtitle: "" },
      collections: { enabled: true, title: "Collections", subtitle: "" },
      guides: { enabled: true, title: "Buying guides:", subtitle: "" },
      recentlySold: { enabled: true, title: "Recently sold", subtitle: "Lots that sold out recently. Check back for similar stock." },
      aboutCard: { enabled: true, title: "Sold direct by us", subtitle: "" },
      contactCard: { enabled: true, title: "Looking for something specific?", subtitle: "Tell us the categories and volume you need — we source new loads every week." },
      blog: { enabled: true, title: "From The Loading Dock", subtitle: "" },
    },
    howItWorksSteps: [
      { title: "Register your business", text: "Free account. Add a resale certificate to unlock Net 30 and tax-exempt buying." },
      { title: "Add to cart & check out", text: "Read the manifest, pick a quantity and pay the listed price. No bidding, no waiting." },
      { title: "Pay & receive", text: "Pay by card, wire/ACH or Net 30. Lots ship by LTL, truckload or parcel. Pickup is by appointment only." },
    ],
    howItWorksCta: { label: "How ordering works", href: "/how-to-buy" },
  },
  about: {
    heroEyebrow: "About PalletPort",
    heroTitle: "Pallets sorted, manifested and sold by us.",
    heroIntro:
      "{name} buys returns and overstock from retailers, sorts and manifests every load in our {location} warehouse, and sells it straight to resellers — by the case, the pallet or the truckload. No middlemen, no third-party sellers.",
    heroPhotos: [],
    // Warehouse with forklift and pallet racking. Photo: AFINIS Group on Unsplash (free under the Unsplash License).
    heroBg: "https://images.unsplash.com/photo-1689942010216-dc412bb1e7a9",
    statsTitle: "PalletPort by the numbers",
    mission: {
      eyebrow: "Our mission",
      title: "Make buying surplus inventory as clear as buying anything else online.",
      paragraphs: [
        "Liquidation used to mean phone calls, blind pallets and guesswork. We think resellers deserve better: a full manifest on every lot, honest condition grades and real freight quotes — from one company that stands behind every pallet it ships.",
        "Because we handle every lot ourselves, from receiving to wrapping, you always know who you're buying from and who to call if something isn't right.",
      ],
      linkLabel: "See how it works",
      linkHref: "/how-it-works",
    },
    sustainability: {
      eyebrow: "Sustainability",
      title: "Every resold pallet is one less load for landfill.",
      body: "Returned and overstocked goods are often destroyed simply because processing them is inconvenient. By making resale easy, we help keep usable products in circulation and support the local shops, market vendors and repairers who give them a second life.",
      linkLabel: "Why reselling returns is good for the planet",
      linkHref: "/blog/liquidation-and-sustainability",
      photo: "palletPile",
    },
    transparent: {
      eyebrow: "A transparent buying experience",
      title: "No mystery boxes. No surprises at checkout.",
      cards: [
        { title: "Full manifests", text: "Every lot lists SKUs, quantities and retail values — search, sort or download them.", href: "/blog/how-to-read-a-manifest" },
        { title: "Clear condition grades", text: "New, shelf pull, customer return, mixed or salvage — labelled on every lot.", href: "/how-it-works#conditions" },
        { title: "Freight up front", text: "Estimate shipping by ZIP on the lot page before you order, or book a weekday pickup visit.", href: "/blog/ltl-freight-101" },
        { title: "Buyer protection", text: "15-day returns with written approval when an order doesn't match its listing.", href: "/legal/returns-and-disputes" },
      ],
    },
    audiences: { eyebrow: "Who buys from us", title: "Built for every kind of reseller", intro: "" },
    advantages: {
      eyebrow: "Our advantages",
      title: "Why resellers choose PalletPort",
      cards: [
        { title: "Buy with confidence", text: "Every pallet is sorted, graded and manifested by our own team — one company, one standard, one point of contact.", href: "/how-it-works", cta: "Inside our warehouse" },
        { title: "No hidden fees", text: "You see the price, freight estimate and payment terms before you commit. The price on the page is the price you pay.", href: "/how-to-buy", cta: "How buying works" },
        { title: "Scale with ease", text: "Start with a single case pack and grow to weekly truckloads — plus Net 30 terms once your business is verified.", href: "/truckloads", cta: "Shop truckloads" },
      ],
    },
    thanks: {
      title: "Thank you",
      body: "To every reseller who trusts us with their sourcing — thank you. Tell us what categories and lot sizes you want to see more of, and we'll go and find them.",
      cards: [
        { title: "Start buying", text: "Create a free business account", href: "/register" },
        { title: "Shop all lots", text: "See everything in stock", href: "/lots" },
        { title: "Talk to us", text: "Questions, feedback or partnerships", href: "/contact" },
      ],
    },
  },
  faqs: {
    home: {
      enabled: true,
      title: "Frequently asked questions",
      intro: "Quick answers for first-time buyers. More detail in the help center.",
      items: [
        {
          q: "What is a liquidation pallet?",
          a: "A pallet of customer returns, shelf pulls or overstock that a retailer or distributor couldn't sell through normal channels. We buy these loads, sort and manifest them in our {location} warehouse, and sell them by the case, pallet or truckload.",
        },
        {
          q: "Who am I buying from?",
          a: "From us. {name} sells only its own inventory from its own warehouse. There are no third-party sellers on the site.",
        },
        {
          q: "Do I know what's in a lot before I buy?",
          a: "Yes. Every lot has a manifest listing SKUs, quantities and retail values, plus a condition grade. Read it before you order, and price the lot on what those items sell for in your market.",
        },
        {
          q: "Are your prices fixed?",
          a: "Yes. Every lot has one listed price, with no bidding. Add it to your cart and check out; freight to your ZIP is added at checkout.",
        },
        {
          q: "How does shipping work?",
          a: "Pallets ship by LTL freight, truckloads on a full trailer and case packs by parcel. Enter your ZIP on any lot page for a freight estimate. The final amount is confirmed at checkout.",
        },
        {
          q: "Can I pick up from the warehouse?",
          a: "Pickup is by appointment: book a weekday visit from the lot page. There's no walk-in store.",
        },
        {
          q: "What if a lot doesn't match its manifest?",
          a: "If the order doesn't match its written listing in a material way, contact us within 15 days of pickup or delivery with photos. See our Return & Refund Policy. Note any visible damage on the delivery receipt before you sign.",
        },
      ],
    },
    about: {
      enabled: true,
      title: "Questions about {name}",
      intro: "",
      items: [
        {
          q: "Where are you based?",
          a: "Our warehouse is in {location}. Every lot on the site is received, sorted, manifested and wrapped there before it ships.",
        },
        {
          q: "Do you sell other people's pallets?",
          a: "No. We only sell inventory we own, so you always know who you're buying from and who to contact if something isn't right.",
        },
        {
          q: "Where does your inventory come from?",
          a: "From retailers and distributors clearing customer returns, shelf pulls and overstock. Each lot page shows the condition grade and full manifest.",
        },
        {
          q: "Who do you sell to?",
          a: "Any business that resells: bin stores, discount and dollar stores, online and marketplace resellers, flea-market vendors, repair shops and exporters, buying anything from a single case pack to full truckloads.",
        },
        {
          q: "Can I buy tax-exempt or on terms?",
          a: "Yes. Add a resale certificate to your account to buy tax-exempt. Verified resellers can also apply for Net 30 terms.",
        },
        {
          q: "Can I visit the warehouse?",
          a: "There's no walk-in store, but you can book a weekday pickup visit from any lot page (at least 45 hours ahead).",
        },
      ],
    },
    blog: {
      enabled: true,
      title: "Reseller questions, answered",
      intro: "Short answers to what new buyers ask most. The guides above go deeper.",
      items: [
        {
          q: "How do I read a liquidation manifest?",
          a: "Check the item mix, quantities, condition grade and retail values. Retail value isn't resale value, so look up what the top items actually sell for, and allow for untested or damaged units in returns.",
        },
        {
          q: "Is liquidation reselling profitable?",
          a: "It can be, but margins depend on what you pay, freight, how fast you sell and how many items are unsellable. Start small, track your cost per unit, and buy categories you know how to sell.",
        },
        {
          q: "Should I start with a pallet or a case pack?",
          a: "Case packs are a lower-risk way to test a category because they ship by parcel and cost less. Move up to pallets once you know what sells for you.",
        },
        {
          q: "What does LTL freight cost?",
          a: "It depends on the number of pallets, the distance and extras such as liftgate or residential delivery. Enter your ZIP on any lot page for an estimate before you order.",
        },
      ],
    },
  },
  contact: {
    seoTitle: "Contact our warehouse team",
    seoDescription:
      "Questions about a lot, an order, bulk buying or a warehouse pickup appointment? Send our warehouse team a message. We reply within one business day.",
    title: "Contact us",
    intro: "Questions about a lot, an order, bulk buying or a pickup appointment? Our warehouse team replies within one business day.",
    tips: [
      { label: "Order issue?", text: "Include your order number (for example PP-XXXX) so we can find it quickly.", linkLabel: "", href: "" },
      { label: "Quick answers:", text: "", linkLabel: "Help center", href: "/help" },
    ],
    showPickup: true,
    showHours: true,
    directTitle: "Reach us directly",
    formTitle: "",
    bodyLabel: "How can we help?",
    submitLabel: "Send message",
    pickupNotice:
      "Requesting a pickup appointment. Include the lot or order number, the vehicle you'll bring and a few days and times that suit you. Please don't travel until we've confirmed.",
    pickupSubmitLabel: "Request pickup appointment",
    photosTitle: "Our warehouse",
    showMap: true,
    mapTitle: "Find our warehouse",
    mapNote: "Pickup is by appointment only. Please book before you travel.",
    showReviews: true,
    reviewsTitle: "What buyers say on Google",
  },
  checkout: {
    paymentTitle: "Payment",
    paymentMethods: [
      { id: "CARD", enabled: true, name: "Credit or debit card", description: "Charged when we confirm your order.", instructions: "", icon: "card", logo: "" },
      { id: "WIRE", enabled: true, name: "Wire / ACH transfer", description: "We email bank details and an invoice. Ships once funds clear (1–2 business days).", instructions: "We'll email you our bank details and an invoice. Your order ships once the funds clear.", icon: "transfer", logo: "" },
      { id: "NET30", enabled: true, name: "Net 30 terms", description: "Invoice due 30 days after delivery. For verified resellers.", instructions: "", icon: "invoice", logo: "" },
      { id: "ZELLE", enabled: true, name: "Zelle", description: "Pay from your bank app. We email the details after you order.", instructions: "We'll email you our Zelle details. Include your order number in the memo. Your order ships once payment arrives.", icon: "bank", logo: "" },
      { id: "APPLE_PAY", enabled: true, name: "Apple Pay", description: "Pay from your iPhone. We email the details after you order.", instructions: "We'll email you how to pay with Apple Pay. Include your order number with the payment. Your order ships once payment arrives.", icon: "phone", logo: "" },
      { id: "CHIME", enabled: true, name: "Chime", description: "Pay from your Chime account. We email the details after you order.", instructions: "We'll email you our Chime details. Include your order number with the payment. Your order ships once payment arrives.", icon: "wallet", logo: "" },
    ],
    fields: {
      phone: { show: true, required: false, label: "Delivery contact phone", placeholder: "" },
      poNumber: { show: true, required: false, label: "PO number (optional)", placeholder: "" },
      notes: { show: true, required: false, label: "Notes for our team / carrier (optional)", placeholder: "Dock hours, gate code, appointment needed…" },
    },
    customFields: [],
  },
  seo: {
    defaultTitle: "PalletPort — Wholesale liquidation pallets & truckloads",
    titleTemplate: "%s · PalletPort",
    defaultDescription:
      "Buy manifested liquidation pallets, truckloads and case packs at fixed prices — customer returns, shelf pulls and overstock sold direct from our own warehouse.",
    ogImage: "",
  },
};

// ---------- helpers ----------

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Deep-merges `over` onto `base`: plain objects merge key by key, everything else (arrays, strings,
 * numbers, booleans) from `over` replaces `base`. `undefined` in `over` keeps the base value.
 */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!isPlain(base) || !isPlain(over)) return (over === undefined ? base : (over as T));
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    out[k] = k in base ? deepMerge((base as Plain)[k], v) : v;
  }
  return out as T;
}

/** Recursive Partial, for patchSetting(). Arrays are replaced whole. */
export type DeepPartial<T> = T extends (infer _U)[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/** The brand name the site shipped with. Text that still says it is shown with the current business name. */
export const DEFAULT_BRAND = "PalletPort";

/**
 * Replaces the original brand name ("PalletPort") with `brand` in a piece of text, so renaming the business in
 * Admin → Business profile renames it everywhere, including text written before the rename. Safe when the new
 * name contains the old one ("PalletPort USA"): existing occurrences of the new name are left alone.
 */
export function rebrandText(text: string, brand: string | undefined | null): string {
  const b = (brand ?? "").trim();
  if (!b || b === DEFAULT_BRAND || !text.includes(DEFAULT_BRAND)) return text;
  return text.split(b).map((part) => part.split(DEFAULT_BRAND).join(b)).join(b);
}

/** rebrandText() applied to every string inside a value (objects and arrays are copied). */
export function rebrandDeep<T>(value: T, brand: string | undefined | null): T {
  const b = (brand ?? "").trim();
  if (!b || b === DEFAULT_BRAND) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return rebrandText(v, b);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(value) as T;
}

/** Replaces {name} / {location} tokens in settings text. */
export function fillTokens(text: string, vars: { name?: string; location?: string }) {
  return text.replace(/\{(name|location)\}/g, (m, k: "name" | "location") => vars[k] ?? m);
}
