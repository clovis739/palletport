// Buyer-facing intro, "popular with" guide links and FAQs for category pages (/c/[slug]).
// Keyed by category slug (see prisma/seed.ts). Categories without an entry fall back to the category blurb.
// Keep answers factual: FAQs are also published as FAQPage structured data.

export type CategoryCopy = {
  /** 2–3 paragraphs, 150–300 words in total. */
  intro: string[];
  /** Guide slugs from src/content/guides.ts. */
  popularWith: string[];
  faqs: { q: string; a: string }[];
};

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  electronics: {
    intro: [
      "Our electronics lots are mostly consumer tech: earbuds and headphones, smart home devices, phone accessories, chargers, cables, and computer and tablet gear. Most come from big-box and online marketplace returns, with some shelf pulls and overstock mixed in. The manifest on each lot lists the SKUs, quantities and retail values.",
      "Condition matters more here than in almost any other category. New and shelf-pull lots are usually sealed or close to it. Customer-return lots are untested: expect a mix of units that work, units with cosmetic wear, and units that are defective or missing parts. Budget time to power on and test every item, check for account locks on smart devices, and wipe anything that stores data before you resell it.",
      "Electronics suit online resellers who can photograph and test each unit, and repair shops that can turn defective returns into working stock. Accessories such as cables and cases also sell well in bin stores and at flea markets. Start with a case pack if you're new to the category.",
    ],
    popularWith: ["online-resellers", "refurbishers", "exporters"],
    faqs: [
      {
        q: "Are returned electronics tested?",
        a: "No. Customer-return lots are sold untested and graded as returns, so expect some defective or incomplete units. New and shelf-pull lots are listed with those grades on the lot page.",
      },
      {
        q: "What should I check when an electronics lot arrives?",
        a: "Count units against the manifest, power on and test each item, look for missing chargers or parts, and check smart devices for account or activation locks before you list them.",
      },
      {
        q: "Which electronics lots are best for beginners?",
        a: "Accessory lots such as chargers, cables and cases, or a single case pack. They're lower in value per unit and easier to test than phones, tablets or computers.",
      },
    ],
  },

  "home-kitchen": {
    intro: [
      "Home and kitchen lots cover small appliances (air fryers, blenders, coffee makers, kettles), cookware and bakeware, home decor, and bedding and bath. Most come from big-box returns and department store overstock, and the manifest lists every item with its retail value.",
      "Condition varies by grade. Overstock and shelf pulls are usually boxed and ready to sell, sometimes with price stickers or scuffed packaging. Returned appliances should be plugged in and tested, and checked for missing lids, blades, filters and manuals. Decor and textiles are often resellable as they are, though glass and ceramics can arrive broken, so inspect them on delivery.",
      "This category turns over steadily in bin stores and discount shops because shoppers recognise the products and the price gap to retail. Bulky items such as appliances and cookware take up pallet space, so expect fewer units per pallet than in apparel or accessories. Compare lots by price per unit and check the pallet weight on the lot page before you buy.",
    ],
    popularWith: ["bin-stores", "discount-stores"],
    faqs: [
      {
        q: "What's usually in a home and kitchen pallet?",
        a: "A mix of small appliances, cookware, decor and bedding, depending on the lot. The manifest on each lot page lists the exact items, quantities and retail values.",
      },
      {
        q: "Should I test returned small appliances?",
        a: "Yes. Plug in and run each one, and check for missing parts such as lids, blades and filters before you price it.",
      },
      {
        q: "Why are there fewer units on a home and kitchen pallet?",
        a: "Appliances and cookware are bulky, so a pallet holds fewer units than one of apparel or small accessories. Compare lots by price per unit and percent of retail rather than unit count alone.",
      },
    ],
  },

  apparel: {
    intro: [
      "Apparel lots include mixed-brand activewear, footwear, kids' clothing, and bags and accessories. They come from department store overstock, closeouts and online returns. Each manifest lists items with quantities and retail values; lots don't come sorted by size, so expect a spread.",
      "New and overstock apparel often still has tags. Returned clothing may be tried on, folded differently or missing tags, and footwear returns can have worn soles or mismatched boxes. Sort on arrival into ready-to-sell, needs-cleaning and unsellable, and check shoes in pairs. Soft goods are light, so a pallet can hold a lot of units.",
      "Online resellers do well with branded pieces they can photograph and list one at a time. Flea-market vendors and bin stores use mixed apparel for quick-turn table and bin stock, and exporters buy clothing by volume. If you're testing the category, a case pack of one type, such as activewear or kids' clothing, is easier to price than a mixed pallet.",
    ],
    popularWith: ["online-resellers", "flea-market-vendors", "exporters"],
    faqs: [
      {
        q: "Are apparel lots sorted by size?",
        a: "No. Lots are sold as manifested, with a mix of sizes. Plan to sort by size and style when the lot arrives.",
      },
      {
        q: "Do new apparel lots still have tags?",
        a: "New and overstock items usually do. Customer returns may be missing tags or show signs of being tried on, which is reflected in their condition grade.",
      },
      {
        q: "What should I look for in footwear lots?",
        a: "Check that pairs match in size and style, look at soles for wear on returns, and note any missing or damaged boxes, which affect resale price online.",
      },
    ],
  },

  "tools-hardware": {
    intro: [
      "Tools and hardware lots include cordless power tools and batteries, hand tools and storage, lighting and electrical, and plumbing supplies. Many come from home improvement retailer returns, with overstock and closeouts mixed in. The manifest lists each item's quantity and retail value.",
      "Returned power tools are the riskiest part of this category. Some are like new, some have been used on a job and returned, and some are missing batteries or chargers, which are often sold separately. Test tools with a known-good battery, check chucks and blades, and match every battery to its platform before you price anything. Hand tools, storage and fixtures tend to be simpler: check for completeness and packaging damage.",
      "Flea-market vendors and bin stores sell hand tools and fixtures quickly because buyers recognise the brands. Repair shops can buy defective power tool returns, fix them and resell them as working units. Weight adds up fast in this category, so check the pallet weight on the lot page and plan your unloading.",
    ],
    popularWith: ["flea-market-vendors", "refurbishers"],
    faqs: [
      {
        q: "Do returned power tools come with batteries?",
        a: "Not always. Kits and bare tools are listed separately on the manifest, and some returns arrive without their battery or charger. Check the manifest and budget for batteries if you need them.",
      },
      {
        q: "How should I test power tools from a lot?",
        a: "Use a known-good battery from the same platform, run each tool, and check chucks, blades and switches. Separate working, cosmetic and for-repair units before pricing.",
      },
      {
        q: "Are tool pallets heavy?",
        a: "They can be. Each lot page shows the total weight and pallet count, so you can plan for a dock, liftgate delivery and a pallet jack.",
      },
    ],
  },

  "toys-baby": {
    intro: [
      "Toys and baby lots cover toys and games, nursery items and outdoor play. Stock comes from big-box returns, seasonal overstock and closeouts, and each manifest lists items, quantities and retail values.",
      "Games and puzzles can arrive with opened boxes or missing pieces, and electronic toys may need batteries to test. Take extra care with nursery and baby products: check for missing parts, damaged packaging and instructions, and look up recalls before reselling items such as car seats, cribs or strollers. Some resellers choose to sell only sealed baby gear for that reason.",
      "Toys move in bursts around the holidays, birthdays and back to school, so time your buying to leave enough weeks to sort and list before the season. Bin stores and flea-market vendors use toys as traffic drivers. Large outdoor play items take up a lot of pallet space, so compare lots by price per unit rather than by pallet count.",
    ],
    popularWith: ["bin-stores", "flea-market-vendors"],
    faqs: [
      {
        q: "Can I resell returned baby products?",
        a: "Check each item carefully, look up recalls, and follow the rules that apply where you sell. Many resellers stick to sealed or new nursery items and treat returned safety gear with extra caution.",
      },
      {
        q: "When should I buy toy lots?",
        a: "Ahead of your busiest season, so you have time to sort, test and list before demand peaks.",
      },
      {
        q: "Do toy lots include batteries?",
        a: "Usually not. Keep a supply of common battery sizes to test electronic toys when the lot arrives.",
      },
    ],
  },

  "health-beauty": {
    intro: [
      "Health and beauty lots include cosmetics, personal care items and hair tools. Most are shelf pulls and overstock from big-box and department stores, with some online returns. The manifest lists each product, quantity and retail value.",
      "Check dates and seals first. Cosmetics and personal care products can have expiry dates or seasonal packaging, and returned items may be opened. Most resellers only sell sealed products in this category and set aside anything opened or past its date. Hair tools such as dryers and straighteners are electronics: test them and check cords before reselling.",
      "Small, light products mean a lot of units per case or pallet, which suits discount stores that want a steady stream of low-price items and online resellers who list branded products individually. A case pack is a simple way to learn which brands and product types sell in your market before you buy a pallet. Keep a note of what sells and what comes back, and use it to choose your next lot.",
    ],
    popularWith: ["online-resellers", "discount-stores"],
    faqs: [
      {
        q: "Are health and beauty products sealed?",
        a: "New and shelf-pull items usually are. Customer returns may include opened products, which is reflected in the condition grade. Most resellers only sell sealed items in this category.",
      },
      {
        q: "What should I check first on arrival?",
        a: "Seals, expiry dates and packaging condition. Set aside anything opened or expired before you price the rest.",
      },
      {
        q: "Are hair tools tested?",
        a: "Returned hair tools are sold untested. Plug each one in, check the cord and heat settings, and grade them before resale.",
      },
    ],
  },

  furniture: {
    intro: [
      "Furniture lots include office furniture, patio and outdoor pieces, and living room items. Much of it is flat-pack and still boxed, from retailer overstock and online returns. The manifest lists each piece, its quantity and retail value.",
      "Flat-pack returns are often missing hardware or a panel, and boxes can be damaged in transit. Open and check each box against its parts list before you sell it, and keep a stock of common screws and cam locks for repairs. Assembled or outdoor pieces should be checked for scratches, dents and missing cushions. Furniture is bulky and heavy, so a pallet may hold only a few items; check the weight and dimensions on the lot page and make sure you can receive it.",
      "Discount stores and flea-market vendors do well with boxed furniture because it's easy to display and carry out. Online resellers often sell locally for pickup to avoid shipping large items. Price by piece, allowing for the ones that need parts.",
    ],
    popularWith: ["discount-stores", "flea-market-vendors"],
    faqs: [
      {
        q: "Is furniture in these lots assembled?",
        a: "Much of it is flat-pack in original boxes. Some returns may be partly assembled or repacked, which shows in the condition grade.",
      },
      {
        q: "What if a flat-pack box is missing parts?",
        a: "It's common with returns. Check each box against its parts list on arrival, keep spare hardware on hand, and price incomplete pieces accordingly.",
      },
      {
        q: "How do I receive a furniture pallet?",
        a: "Check the weight and pallet count on the lot page. You'll need a dock, or liftgate delivery and a pallet jack, plus space to unpack bulky boxes.",
      },
    ],
  },

  "general-merchandise": {
    intro: [
      "General merchandise lots mix products from several departments on the same pallet or trailer: home goods, toys, electronics accessories, seasonal items, health and beauty, and more. This is where most truckloads and mystery-mix pallets sit, sourced from big-box returns, store closures and overstock. The manifest lists every item with its quantity and retail value.",
      "Because the mix is broad, condition varies within a single lot. Plan a sorting area with separate spots for ready-to-sell, test-first, and unsellable items. Seasonal stock is cheapest after the season ends, so store it if you have space. Read the manifest by department before you order, so you know how much of the lot fits what your customers buy.",
      "Bin stores and discount stores rely on general merchandise to keep shelves varied from week to week, and exporters buy mixed truckloads by volume. If you're new to liquidation, a single general merchandise pallet shows you the range of what comes through retail returns before you specialise.",
    ],
    popularWith: ["bin-stores", "discount-stores", "exporters"],
    faqs: [
      {
        q: "What's in a general merchandise pallet?",
        a: "A mix of departments rather than a single category. The manifest on each lot page shows exactly what's included.",
      },
      {
        q: "Are mystery pallets manifested?",
        a: "Yes. Every lot we sell has a manifest listing items, quantities and retail values, including mixed lots.",
      },
      {
        q: "Are general merchandise lots good for a new bin store?",
        a: "They're a common starting point because the variety fills shelves quickly. Plan time and space to sort each load when it arrives.",
      },
    ],
  },
};
