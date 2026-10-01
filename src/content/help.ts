import type { Article } from "./types";

export const HELP_TOPICS = [
  { key: "Buying", blurb: "Accounts, verification, payment and terms" },
  { key: "Orders & freight", blurb: "Delivery, tracking, receiving and damage" },
  { key: "Account & security", blurb: "Passwords, profile and privacy" },
];

export const HELP: Article[] = [
  {
    slug: "placing-an-order", category: "Buying", title: "How do I place an order?",
    excerpt: "Add lots to your cart and check out at the listed price.",
    body: [
      { p: ["Every lot has one fixed price. Open a lot, check the manifest and condition grade, choose a quantity if more than one is in stock, then select Add to cart. Buy now takes you straight to checkout."] },
      { p: ["At checkout, enter your delivery details and choose how to pay. Freight to your ZIP is added to the order total, and you can see an estimate on the lot page first."] },
      { p: ["See the full guide on the How to order page."] },
    ],
  },
  {
    slug: "cart-reservations", category: "Buying", title: "Does my cart reserve a lot?",
    excerpt: "No. Lots stay on sale until you complete checkout.",
    body: [{ p: ["Adding a lot to your cart doesn't hold it. Other buyers can still order it until you complete checkout. If a lot sells first, your cart shows that it's no longer available so you can remove it and continue."] }],
  },
  {
    slug: "who-can-buy", category: "Buying", title: "Who can buy on PalletPort?",
    excerpt: "PalletPort is a wholesale store for businesses that resell goods.",
    body: [
      { p: ["Any business that resells merchandise can open a buyer account — bin stores, discount shops, online resellers, flea-market vendors, refurbishers and exporters. You can browse without an account; you'll need one to add lots to your cart."] },
      { h: "Do I need a resale certificate?", p: ["Not to buy with a card or wire transfer. A verified resale certificate unlocks Net 30 terms and tax-exempt checkout where it applies. Add yours under Account → Business verification."] },
    ],
  },
  {
    slug: "payment-options", category: "Buying", title: "Payment options and Net 30 terms",
    excerpt: "Pay by card, wire/ACH, or Net 30 once your business is verified.",
    body: [
      { list: ["Card — charged when we confirm your order.", "Wire / ACH — we email bank details; the order ships once funds clear.", "Net 30 — for verified resellers. The invoice is due 30 days after delivery."] },
      { h: "How is Net 30 approved?", p: ["Submit your resale certificate number and issuing state. Our team reviews submissions within one business day. Approval limits are based on order history and may increase over time."] },
    ],
  },
  {
    slug: "condition-grades", category: "Buying", title: "What do the condition grades mean?",
    excerpt: "New, shelf pull, customer return, mixed and salvage — explained.",
    body: [
      { list: [
        "New / Overstock — unopened retail inventory in original packaging.",
        "Shelf Pull — removed from store shelves; may carry price stickers or light box wear.",
        "Customer Return — returned by shoppers and untested; expect a mix of working, cosmetic and defective units.",
        "Mixed — a combination of the grades above.",
        "Salvage — damaged or for parts, sold as-is to repair and parts professionals.",
      ] },
      { p: ["Liquidation lots are sold as-is according to the listed grade. Read the manifest and the lot notes, and contact us with questions before buying."] },
    ],
  },
  {
    slug: "promo-codes", category: "Buying", title: "Using promo codes",
    excerpt: "Enter one code per order in your cart.",
    body: [{ p: ["Enter a code in the Order summary on your cart page. Codes apply to your whole cart. Some codes require a minimum spend or are for first orders only; the cart will tell you why a code didn't apply."] }],
  },
  {
    slug: "minimum-order", category: "Buying", title: "Is there a minimum order?",
    excerpt: "We may set a minimum order value to cover dock and handling costs.",
    body: [{ p: ["If a minimum order value applies, it's shown in your cart along with how much more you'd need to add. Case packs and single pallets usually qualify on their own."] }],
  },
  {
    slug: "freight-and-delivery", category: "Orders & freight", title: "How freight and delivery work",
    excerpt: "Pallets ship LTL freight. Here's what to expect on delivery day.",
    body: [
      { p: ["Most lots ship by less-than-truckload (LTL) freight. Freight is estimated at $175 per pallet and is free on orders over $7,500. When we ship, you'll see a PRO (tracking) number on your order page."] },
      { h: "Dock or liftgate?", p: ["If your location has a loading dock, tick the dock box at checkout. Otherwise the carrier will bring a liftgate truck and lower pallets to the ground. Make sure you have a pallet jack or help to move them."] },
      { h: "Warehouse pickup", p: ["Pickup from our warehouse is by appointment. Book a warehouse visit from any lot page: pick a weekday (Monday to Friday) and a 50-minute time at least 45 hours ahead. Orders of $600 or more pay a refundable 35% deposit to confirm; smaller orders pay in full. There's no walk-in store. Please don't travel until your visit is confirmed."] },
    ],
  },
  {
    slug: "receiving-a-shipment", category: "Orders & freight", title: "Receiving a shipment: inspect before you sign",
    excerpt: "Note visible damage on the delivery receipt to protect your claim.",
    body: [
      { list: ["Count the pallets against your order.", "Look for crushed corners, torn wrap or leaning stacks.", "Write any damage on the bill of lading before signing and take photos.", "Report problems within 48 hours through the contact form, quoting your order number."] },
    ],
  },
  {
    slug: "cancel-or-change", category: "Orders & freight", title: "Cancelling or changing an order",
    excerpt: "Orders can be cancelled until we confirm them.",
    body: [{ p: ["While an order is Pending, open it from Orders and choose Cancel order — the lot goes straight back on sale. After we confirm it, contact us; changes depend on whether the pallet has already been wrapped or collected by the carrier."] }],
  },
  {
    slug: "manifest-discrepancies", category: "Orders & freight", title: "What if the manifest doesn't match?",
    excerpt: "Small variances are normal; large ones are covered.",
    body: [{ p: ["Manifests are prepared by our warehouse team and small count variances happen. If the order doesn't match its written listing in a material way, contact us within 15 days of pickup or delivery with your order number and photos. See our Return & Refund Policy."] }],
  },
  {
    slug: "reset-password", category: "Account & security", title: "Resetting your password",
    excerpt: "Use 'Forgot password?' on the sign-in page.",
    body: [{ p: ["Click Forgot password? on the sign-in page and enter your email. The reset link is valid for one hour. If you're signed in, you can change your password under Account → Password & security."] }],
  },
  {
    slug: "update-business-details", category: "Account & security", title: "Updating your business details",
    excerpt: "Change your name, business type and default address.",
    body: [{ p: ["Go to Account → Profile & address. Your default address pre-fills checkout. Contact us if you need to change the company name on an invoice."] }],
  },
];
