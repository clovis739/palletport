import type { Article } from "./types";

// Starter policy text written for PalletPort. Have a lawyer review before launch.
export const LEGAL: Article[] = [
  {
    slug: "terms", title: "Terms of Service", date: "2026-09-23", excerpt: "The rules for buying from PalletPort.",
    body: [
      { h: "1. Who we are", p: ["PalletPort sells liquidation inventory that we own and hold in our own warehouse to businesses that buy it for resale (\"Buyers\"). We are the seller of record for every lot on this site."] },
      { h: "2. Business accounts", p: ["Accounts are for businesses. You confirm that you are buying or selling for business purposes and that the information you give us is accurate."] },
      { h: "3. Listings and condition", p: ["We describe every lot as accurately as we can, including condition grade and manifest. Lots are sold as-is according to the listed grade. Manifest counts may vary slightly; see the Return & Refund Policy for remedies."] },
      { h: "4. Orders and payment", p: ["An order is a binding offer to buy. Payment is taken by the method you select. Net 30 terms are available only to approved Buyers and are due 30 days after delivery."] },
      { h: "5. What we don't sell", p: ["We do not knowingly sell recalled, counterfeit, stolen or hazardous goods, or items whose sale is restricted by law. If you find one in a lot, contact us and we'll resolve it."] },
      { h: "6. Liability", p: ["To the extent permitted by law, PalletPort's liability for any claim is limited to the fees we received for the transaction concerned."] },
      { h: "7. Changes", p: ["We may update these terms. Continued use after an update means you accept the new terms."] },
    ],
  },
  {
    slug: "privacy", title: "Privacy Policy", date: "2026-09-23", excerpt: "What we collect, why, and your choices.",
    body: [
      { h: "What we collect", list: ["Account details: name, business name, email, phone and addresses.", "Verification details: resale certificate number and issuing state.", "Transaction details: orders, questions you send us and reviews.", "Usage data: pages viewed and lots saved, used to improve the marketplace."] },
      { h: "How we use it", p: ["To run the store, process orders, verify businesses, prevent fraud, and send service messages. We share delivery details only with the carrier that delivers your order."] },
      { h: "Your choices", p: ["You can update your details in your account at any time and ask us to delete your account by contacting support. We keep transaction records as required by law."] },
    ],
  },
  {
    slug: "cookies", title: "Cookie Policy", date: "2026-09-23", excerpt: "The small number of cookies we use.",
    body: [
      { p: ["PalletPort uses a session cookie to keep you signed in and a short-lived cookie to remember a promo code in your cart. We do not use advertising cookies. If you add analytics later, list those tools here."] },
    ],
  },
  {
    slug: "returns-and-disputes", title: "Return & Refund Policy", date: "2026-09-27", excerpt: "15-day returns, cancellations, order problems, return freight and refunds.",
    body: [
      { h: "15-day returns", p: [
        "You can request a return on any order placed on our website within 15 days of pickup or delivery.",
        "Every return must be approved by us in writing before anything is sent back — a single item, a pallet or a whole lot. We can't accept returns that arrive without written approval.",
      ] },
      { h: "Condition of returned goods", p: [
        "Send items back in the condition you received them, together with the original lot contents and any labels, manifests, accessories, packaging and paperwork that came with them.",
        "Please keep in mind what liquidation stock is: lots can contain overstock, shelf pulls, closeouts, customer returns and open-box items, with damaged packaging, missing parts, mixed conditions, and tested or untested units. The listing and condition grade describe what to expect.",
      ] },
      { h: "Cancellations", p: [
        "You can cancel an order before you've sent payment and before we've prepared, reserved, released it to a carrier, scheduled freight or handed it over at pickup. Pending orders can be cancelled from your Orders page.",
        "Once payment is received or freight is scheduled, the order is final unless we agree to a cancellation in writing.",
      ] },
      { h: "Problems with an order", p: [
        "Contact us within 15 days of pickup or delivery if you'd like to return an order, you received the wrong order, something you paid for is unavailable, or the order doesn't match its written listing in a material way.",
        "Include your order number, your name and phone number, photos or videos of the goods, and any freight paperwork. We may decline claims that arrive without these details.",
      ] },
      { h: "Return freight and delivery damage", p: [
        "Return freight, shipping, pickup, packing and handling are paid by the buyer, unless the return is needed because of an error we've confirmed.",
        "Inspect every freight delivery before you sign for it. Write any visible damage, missing pallet or shortage on the bill of lading or delivery receipt before you accept the shipment.",
        "Damage that happens in transit is claimed with the carrier. Original shipping and freight charges aren't refunded unless the problem was caused by an error we've confirmed.",
      ] },
      { h: "Refunds", p: [
        "When an approved return reaches us, we inspect it. Depending on the order and the condition it comes back in, we'll issue a refund, a replacement, store credit or a partial refund.",
        "Refunds go back to the original payment method wherever possible.",
        "Warehouse visit deposits: the payment made to confirm a warehouse visit is refundable if the product doesn't match its listing when you inspect it at your visit.",
      ] },
    ],
  },
  {
    slug: "prohibited-items", title: "Prohibited Items", date: "2026-09-23", excerpt: "What can't be sold on PalletPort.",
    body: [{ list: ["Recalled products", "Counterfeit or infringing goods", "Stolen property", "Weapons, ammunition and explosives", "Hazardous materials that require special freight handling", "Prescription drugs and medical devices that require a license", "Expired food, supplements or cosmetics"] }],
  },
  {
    slug: "intellectual-property", title: "Intellectual Property Policy", date: "2026-09-23", excerpt: "Reporting listings that infringe your rights.",
    body: [{ p: ["If you believe a listing infringes your trademark or copyright, send us the listing URL, a description of your rights, and your contact details. We will review promptly and may remove listings and suspend repeat infringers."] }],
  },
  {
    slug: "accessibility", title: "Accessibility Statement", date: "2026-09-23", excerpt: "Our commitment to an accessible store.",
    body: [{ p: ["We aim to meet WCAG 2.1 AA across PalletPort. If something is hard to use with assistive technology, contact us and tell us the page and what happened — we'll work on a fix and help you complete your task in the meantime."] }],
  },
];
