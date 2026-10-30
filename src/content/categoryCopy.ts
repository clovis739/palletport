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

  "phones-computers": {
    intro: [
      "Phones and computers lots include smartphones, laptops, tablets and e-readers, desktops and monitors, and the accessories that go with them: cases, chargers, cables, keyboards and mice. Most come from carrier and big-box returns, trade-in programs and overstock. The manifest lists each model and its retail value.",
      "Devices that store data need the most care. Returned phones, tablets and laptops can carry activation, carrier or account locks, and some will have cracked screens, weak batteries or missing chargers. Check each unit's lock status before you price it, wipe every device to factory settings, and keep a record of serial numbers. New and shelf-pull accessories are usually ready to sell as they are.",
      "These lots suit online resellers who can test and photograph each device, repair shops that can replace screens and batteries, and exporters who buy by volume. If you're new to the category, accessory lots are a lower-risk way to start.",
    ],
    popularWith: ["online-resellers", "refurbishers", "exporters"],
    faqs: [
      {
        q: "Can returned phones be locked?",
        a: "Yes. Some returned phones and tablets have activation, carrier or account locks. Check each unit before you list it, and price locked units for parts.",
      },
      {
        q: "Do laptops and phones come with chargers?",
        a: "Not always. Returned devices are often missing chargers or cables, so budget for replacements when you work out your margin.",
      },
      {
        q: "Should I wipe devices before reselling them?",
        a: "Yes. Reset every phone, tablet and computer to factory settings before you sell it, so no previous owner's data goes to your customer.",
      },
    ],
  },

  "tvs-home-theater": {
    intro: [
      "TV and home theater lots cover televisions, soundbars and home audio, projectors and streaming devices, and TV mounts and accessories. Most are big-box and online returns, with some overstock and open-box units. The manifest lists screen sizes, models and retail values.",
      "Screens are fragile, so inspect TV pallets on delivery and note any visible damage before you sign. Returned TVs can have cracked panels, dead pixels or missing stands and remotes, so power on each set and check the full screen. Soundbars and streaming devices are lighter and easier to test, and often ship with fewer problems.",
      "TV lots suit repair shops that can replace parts and resellers with space to store and test large boxes. Plan for freight: TV pallets are bulky, and large screens need careful handling from the truck to your shelf.",
    ],
    popularWith: ["refurbishers", "online-resellers"],
    faqs: [
      {
        q: "Are returned TVs tested?",
        a: "No. Returned TVs are sold untested, so expect some units with screen damage or missing parts. Power on and check every set.",
      },
      {
        q: "What should I check when a TV pallet arrives?",
        a: "Look for crushed boxes or broken panels before you sign the delivery receipt, and write any damage on it. Then test each TV with a remote or the side buttons.",
      },
      {
        q: "Do TVs come with remotes and stands?",
        a: "Many do, but returns are often missing remotes, stands or screws. Universal remotes and replacement stands are cheap fixes that make a set easier to sell.",
      },
    ],
  },

  "video-games": {
    intro: [
      "Video game lots include consoles, physical games, controllers and accessories such as headsets, charging stations and cases. They come from retail returns, overstock and seasonal clear-outs. The manifest lists platforms, titles and retail values.",
      "Sealed games and new accessories are usually ready to sell. Returned consoles and controllers should be tested: check that consoles power on and connect, that controllers pair and hold a charge, and that disc drives read. Check returned game cases to make sure the disc inside matches the cover.",
      "Games and accessories sell well online, at flea markets and in bin stores, and demand rises before the holidays. Consoles have a higher value per unit, so they suit resellers who can test and photograph each one.",
    ],
    popularWith: ["online-resellers", "flea-market-vendors", "bin-stores"],
    faqs: [
      {
        q: "Are returned consoles tested?",
        a: "No. Returned consoles are sold untested. Power on each one, check it connects and reads discs, and look for account or parental locks.",
      },
      {
        q: "Do returned games have the right disc inside?",
        a: "Usually, but not always. Open each returned case and check that the disc matches the cover before you list it.",
      },
      {
        q: "When do video game lots sell best?",
        a: "Demand peaks before the holiday season and around major game releases, so buying a few weeks ahead gives you time to test and list.",
      },
    ],
  },

  appliances: {
    intro: [
      "Appliance lots cover large appliances such as refrigerators, washers and dryers, ranges and dishwashers, plus home comfort items like air conditioners, heaters and fans. They come from retail returns, scratch-and-dent stock and overstock. The manifest lists models and retail values.",
      "Scratch-and-dent units have cosmetic damage but often work, while returned appliances should be connected and tested before resale. Check for missing shelves, hoses, racks and installation parts, and look for freight damage on delivery. Large appliances are heavy, so you'll need a dock or liftgate delivery and an appliance dolly.",
      "Appliance lots suit appliance repair shops, used-appliance stores and discount retailers with floor space and a way to deliver to their customers. Smaller comfort appliances are easier to start with if you don't have heavy-lifting equipment.",
    ],
    popularWith: ["refurbishers", "discount-stores"],
    faqs: [
      {
        q: "What does scratch-and-dent mean?",
        a: "The appliance has cosmetic damage such as dents or scratches. It may still work normally, but test it before you sell it.",
      },
      {
        q: "How do I receive an appliance lot?",
        a: "Check the weight on the lot page and plan for a dock or liftgate delivery, a pallet jack and an appliance dolly. Inspect for freight damage before you sign.",
      },
      {
        q: "Should I test returned appliances?",
        a: "Yes. Connect and run each unit, and check for missing shelves, hoses or parts before you price it.",
      },
    ],
  },

  shoes: {
    intro: [
      "Shoe lots include athletic sneakers, boots, dress shoes, sandals and kids' footwear. They come from department store and online returns, overstock and end-of-season clear-outs. The manifest lists brands, styles and retail values, and some lots also list sizes.",
      "Expect a spread of sizes rather than full size runs. Returned shoes can be mismatched, worn or missing boxes, so pair every shoe on arrival and set aside singles and mismatched pairs. New overstock is usually boxed and ready to sell.",
      "Branded sneakers sell well online, while mixed footwear does well at flea markets and in bin stores. Because shoe boxes are bulky, a pallet holds fewer pairs than you might expect, so check the unit count on the lot page.",
    ],
    popularWith: ["online-resellers", "flea-market-vendors", "bin-stores"],
    faqs: [
      {
        q: "Are shoe lots sorted by size?",
        a: "Usually not. Expect a mix of sizes. Some manifests list sizes, so check the manifest on the lot page.",
      },
      {
        q: "Can returned shoes be mismatched?",
        a: "Yes. Pair every shoe when the lot arrives and check the size and style on both shoes before you list a pair.",
      },
      {
        q: "Do shoes come in their original boxes?",
        a: "New overstock usually does. Returns may be in damaged boxes or no box at all, which can lower the price you can ask online.",
      },
    ],
  },

  "accessories-jewelry": {
    intro: [
      "Accessories and jewelry lots include handbags and wallets, watches, fashion jewelry, sunglasses, hats, belts and scarves. They come from department store and online returns, overstock and seasonal clear-outs. The manifest lists brands, item types and retail values.",
      "These are small, high-count lots, so a single case can hold hundreds of pieces. Check returned items for missing tags, scratches, broken clasps and watches that need new batteries. Fashion jewelry is usually costume rather than fine jewelry, so price it that way unless the manifest says otherwise.",
      "Accessories are light and easy to ship, which suits online resellers, and they sell well at flea markets and in discount stores. A case pack is a good way to test demand before you buy a full pallet.",
    ],
    popularWith: ["online-resellers", "flea-market-vendors", "discount-stores"],
    faqs: [
      {
        q: "Is the jewelry in these lots real gold or silver?",
        a: "Most is fashion or costume jewelry. Only treat items as fine jewelry when the manifest describes them that way, and have valuable pieces checked.",
      },
      {
        q: "Do returned watches work?",
        a: "Many only need a new battery. Test each watch and replace batteries before you list it.",
      },
      {
        q: "Are accessories lots good for online selling?",
        a: "Yes. They're light, small and cheap to ship, and branded handbags, wallets and sunglasses are popular online.",
      },
    ],
  },

  "household-essentials": {
    intro: [
      "Household essentials lots cover cleaning supplies, laundry detergent, paper goods, diapers and wipes, storage, and bed and bath linens. They come from retail overstock, packaging changes and returns. The manifest lists products, quantities and retail values.",
      "These are everyday products that customers buy again and again, so they sell steadily. Check packaging on arrival: dented bottles, torn cases and leaks happen in transit, and liquids can damage other items on the same pallet. Keep stock dry and rotate older items to the front.",
      "Discount stores, dollar stores and bin stores use household essentials to bring in repeat customers. Diapers, paper goods and detergent are bulky, so check the pallet count and weight on the lot page before you order.",
    ],
    popularWith: ["discount-stores", "bin-stores"],
    faqs: [
      {
        q: "What's in a household essentials pallet?",
        a: "Everyday products such as cleaning supplies, detergent, paper goods, diapers and linens. The manifest on each lot page lists exactly what's included.",
      },
      {
        q: "What should I check on arrival?",
        a: "Look for leaks, dented bottles and torn cases, and separate damaged items so they don't spoil the rest of the stock.",
      },
      {
        q: "Are household essentials good for a discount store?",
        a: "Yes. They're everyday purchases, so they bring customers back regularly and turn over steadily.",
      },
    ],
  },

  "grocery-beverages": {
    intro: [
      "Grocery and beverage lots include snacks, candy, pantry staples such as cereal, pasta and canned goods, and soft drinks and other beverages. They come from manufacturer and retail overstock, packaging changes and short-dated stock. Lot pages list the products and their dates.",
      "Dates matter most in this category. Read the best-by or expiration dates on the lot page before you order, and plan to sell short-dated stock quickly. Follow your state and local rules for reselling food, check for damaged or opened packaging, and store everything cool and dry.",
      "Grocery lots suit discount grocers, dollar stores, bin stores and exporters who can move stock quickly. Beverage pallets are heavy, so check the weight and plan for a dock or liftgate delivery.",
    ],
    popularWith: ["discount-stores", "bin-stores", "exporters"],
    faqs: [
      {
        q: "Are grocery lots close to their dates?",
        a: "Some are. Dates are listed on the lot page, so check them before you order and plan to sell short-dated items quickly.",
      },
      {
        q: "Can I resell food from a liquidation lot?",
        a: "Rules vary by state and city. Check your local food resale requirements before you sell, and don't sell items past their expiration date.",
      },
      {
        q: "How should I store grocery stock?",
        a: "Keep it cool, dry and off the floor, away from cleaning chemicals, and put the earliest dates at the front.",
      },
    ],
  },

  collectibles: {
    intro: [
      "Collectibles lots include sealed trading cards, collectible figures, vinyl figures, die-cast models and other collector items. They come from retail overstock, returns and store clear-outs. The manifest lists products, quantities and retail values.",
      "Collectors care about condition, so packaging matters as much as the item. Check for crushed boxes, torn shrink wrap and opened packs, and keep sealed products sealed. Prices for collectibles can move quickly, so check recent sold listings before you set your prices.",
      "Collectibles suit online resellers and flea market and convention vendors who know their market. Sealed card products and popular figure lines tend to sell fastest.",
    ],
    popularWith: ["online-resellers", "flea-market-vendors"],
    faqs: [
      {
        q: "Are trading cards in these lots sealed?",
        a: "The manifest describes each item. Sealed products are listed as sealed, and returns may include opened packs, so check the condition grade on the lot page.",
      },
      {
        q: "Does box damage affect the value of collectibles?",
        a: "Yes. Collectors pay more for mint packaging, so inspect boxes on arrival and price damaged ones lower.",
      },
      {
        q: "How should I price collectibles?",
        a: "Check recent sold prices for each item before you list it, because collectible prices change faster than most products.",
      },
    ],
  },

  "sports-outdoors": {
    intro: [
      "Sports and outdoors lots include fitness equipment, camping gear, fishing tackle, hunting accessories, team sports equipment and bikes. They come from sporting goods and big-box returns, overstock and seasonal clear-outs. The manifest lists products and retail values.",
      "Returned fitness equipment and bikes may be missing hardware, so check each box against its parts list before you sell it. Inflatables, tents and coolers should be checked for leaks and tears. Seasonal items such as camping and pool gear are cheapest after the season ends.",
      "Sports lots suit flea market vendors, discount stores and online resellers, and demand follows the seasons: fitness gear in January, outdoor and camping gear in spring and summer, and hunting gear in the fall.",
    ],
    popularWith: ["flea-market-vendors", "online-resellers", "discount-stores"],
    faqs: [
      {
        q: "Do returned fitness machines include all parts?",
        a: "Not always. Check each box against its parts list and sell incomplete units for less or for parts.",
      },
      {
        q: "When should I buy sports and outdoors lots?",
        a: "Buy seasonal gear after its season ends when prices are lowest, and plan to sell it when the next season starts.",
      },
      {
        q: "Are bikes in these lots assembled?",
        a: "Usually they're boxed and partly assembled. Check that all parts are there and have each bike assembled and adjusted before you sell it.",
      },
    ],
  },

  seasonal: {
    intro: [
      "Seasonal and holiday lots include Christmas decor and lights, Halloween costumes and decorations, summer and pool items, and back-to-school supplies. They come from retail overstock and end-of-season clear-outs. The manifest lists products and retail values.",
      "Seasonal stock is cheapest right after the holiday it's made for, so you can buy low if you have space to store it until next year. Test lights and animated decor before you sell them, and check costumes for sizes and missing pieces.",
      "Seasonal lots suit bin stores, discount stores and flea market vendors who sell in the weeks before each holiday. Plan your buying around the calendar so stock arrives before demand peaks.",
    ],
    popularWith: ["bin-stores", "discount-stores", "flea-market-vendors"],
    faqs: [
      {
        q: "When is the best time to buy seasonal lots?",
        a: "Right after the season ends, when prices are lowest. Store the stock and sell it in the weeks before the next season.",
      },
      {
        q: "Should I test holiday lights and decor?",
        a: "Yes. Plug in lights and animated decorations before you sell them, and set aside anything that doesn't work.",
      },
      {
        q: "Do I need storage space for seasonal lots?",
        a: "If you buy after the season to save money, yes. Keep stock dry and boxed until the next season.",
      },
    ],
  },

  automotive: {
    intro: [
      "Automotive lots include replacement parts, wheels and tires, car electronics such as dash cams and stereos, and car care products like cleaners, waxes and accessories. They come from auto parts and big-box returns, overstock and discontinued stock. The manifest lists products and retail values.",
      "Parts are often vehicle-specific, so check fitment details and part numbers before you list them. Returned parts can be used or missing hardware, and car electronics should be tested. Car care liquids should be checked for leaks on arrival.",
      "Automotive lots suit online parts resellers who can list by part number, repair shops and flea market vendors. Car care products and accessories are the easiest place to start because they fit most vehicles.",
    ],
    popularWith: ["flea-market-vendors", "online-resellers", "refurbishers"],
    faqs: [
      {
        q: "How do I know which vehicles a part fits?",
        a: "Look up the part number from the manifest or the box. Listing parts with their part numbers and fitment helps buyers find them.",
      },
      {
        q: "Are returned auto parts new?",
        a: "Not always. Returns can include opened, used or incomplete parts, so inspect each one and check the condition grade on the lot page.",
      },
      {
        q: "Which automotive lots are best for beginners?",
        a: "Car care and accessory lots. They fit most vehicles, so they're easier to sell than model-specific parts.",
      },
    ],
  },

  "warehouse-industrial": {
    intro: [
      "Warehouse and industrial lots include pallet jacks and material handling equipment, shelving and racking, empty pallets, packaging supplies such as boxes, tape and stretch wrap, and other business supplies. They come from business overstock, returns and warehouse clear-outs. The manifest lists products and retail values.",
      "Equipment such as pallet jacks should be checked for leaks and tested under load before resale or use. Racking and shelving can be missing beams or hardware, so check the parts against the manifest. Packaging supplies are usually new overstock and ready to use or sell.",
      "These lots suit resellers who sell to small businesses and warehouses, and liquidation buyers who need equipment and supplies for their own operation. Industrial items are heavy, so check the weight and delivery requirements on the lot page.",
    ],
    popularWith: ["exporters", "discount-stores"],
    faqs: [
      {
        q: "Are pallet jacks in these lots tested?",
        a: "Returned equipment is sold untested. Check for hydraulic leaks and test each jack under load before you use or sell it.",
      },
      {
        q: "Can I use these supplies for my own resale business?",
        a: "Yes. Many buyers use packaging supplies, shelving and pallet jacks in their own store or warehouse.",
      },
      {
        q: "Is racking complete?",
        a: "Check beams, uprights and hardware against the manifest when the lot arrives, because returned racking can be missing parts.",
      },
    ],
  },
};
