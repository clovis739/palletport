import type { Article } from "./types";

export const BLOG_CATEGORIES = ["Buying guides", "Industry insights", "Market reports", "Reseller stories"];

export const AUTHORS: Record<string, { name: string; role: string; bio: string }> = {
  team: { name: "Editorial Team", role: "Marketplace team", bio: "Our buyer-success and marketplace teams write about what they see across thousands of lots every month." },
  sourcing: { name: "Sourcing Desk", role: "Buying & grading", bio: "The team that buys our inbound loads, grades every pallet and writes the manifests." },
  freight: { name: "Logistics Team", role: "Freight & fulfilment", bio: "Our logistics specialists help buyers move pallets and truckloads across the country." },
};

export const POSTS: Article[] = [
  {
    slug: "liquidation-myths-vs-facts", category: "Industry insights", date: "2026-09-20", readMins: 11, hue: 250, author: "team", featured: true,
    tags: ["Getting started", "Risk", "Sourcing"],
    title: "Liquidation myths vs. facts: what new resellers get wrong",
    excerpt: "Is it all broken junk? Do you need a warehouse and a huge budget? We take the most common beliefs about liquidation stock and check them against what actually happens on the dock.",
    body: [
      { p: ["Liquidation has a reputation problem. Ask ten people what's on a returns pallet and you'll hear 'broken stuff nobody wanted' from at least half of them. The reality is more nuanced — and much more useful to understand if you want to make money reselling. Here are the beliefs we hear most often from new buyers, and what the data from our own marketplace suggests instead."] },
      { h: "Myth: Liquidation stock is mostly broken", p: [
        "Fact: condition varies enormously, and it's labelled. A pallet of new overstock is typically sealed retail product that simply didn't sell through fast enough. Shelf pulls are store-display items that may carry stickers or scuffed boxes. Customer returns are the true grab-bag — many units work perfectly and were returned for reasons like 'changed my mind'.",
        "The key is that every lot on PalletPort carries a condition grade. Buy the grade that matches your channel, and your 'broken' rate becomes predictable rather than a surprise.",
      ] },
      { h: "Myth: Every liquidation deal is a steal", p: [
        "Fact: price vs. retail is only half the equation. A lot at 12% of retail can still lose money if half the units need testing, the freight is expensive, or the items are slow sellers in your area.",
        "Compare on landed cost per sellable unit: (price + freight) ÷ units you realistically expect to sell. That number, not the headline discount, tells you whether it's a deal.",
      ] },
      { h: "Myth: You need a big budget to start", p: [
        "Fact: case packs and single pallets let you start small. Many first-time buyers begin with lots under $1,000 and reinvest their profits.",
        "Starting small also means your mistakes are cheap. Your first three lots are as much about learning your recovery rate as they are about profit.",
      ] },
      { h: "Myth: You need a warehouse or a shop", p: [
        "Fact: plenty of successful resellers work from a garage, a storage unit, or a shared space and sell entirely online or at weekend markets. Case packs ship by parcel to a home address; pallets can be delivered by liftgate truck.",
        "What you do need is a plan for where each item goes — listing, testing, parts, donation — before the pallet arrives.",
      ] },
      { h: "Myth: Bigger lots are always better value", p: [
        "Fact: truckloads usually have a lower cost per unit, but they also tie up more cash and more space, and the variety can be harder to sell through. The best-value lot is the biggest one you can turn over within your normal selling cycle.",
      ] },
      { h: "Myth: Unmanifested pallets are never worth it", p: [
        "Fact: they can be — for the right buyer. Bin stores that sell by the item often do well with mixed, unsorted loads because variety is the attraction. If you sell online, a full manifest is worth paying for because it lets you research prices before you buy.",
      ] },
      { h: "Myth: Once you buy, you're stuck with it", p: [
        "Fact: lots are sold as-is according to their grade, but that doesn't mean you have no protection. On PalletPort, if the retail value you receive is materially below the manifest, or the lot isn't the listed category or grade, you can open a dispute. Always inspect and photograph pallets on delivery.",
      ] },
      { h: "Myth: Margins are too thin to bother", p: [
        "Fact: margins depend on your channel, speed and labour. Resellers who know their categories, list quickly and price with recent sold data regularly recover several times their landed cost. Those who buy randomly and let stock sit usually don't.",
      ] },
      { h: "Myth: Liquidation is a passing trend", p: [
        "Fact: returns and overstock are built into modern retail. As online shopping grows, so do returns — and retailers need reliable ways to recover value from them. That steady supply is what makes liquidation a durable business rather than a fad.",
      ] },
      { h: "Myth: You can't build a brand on liquidation stock", p: [
        "Fact: many resellers build loyal followings around curation — 'the best kitchen finds every Friday' or 'tested tools with a 30-day guarantee'. Your brand is the experience you add: testing, cleaning, honest descriptions and service.",
      ] },
      { h: "Myth: You never know who you're really buying from", p: [
        "Fact: on many marketplaces that's true — lots pass through several hands before they reach you. PalletPort is different: we buy, sort, grade and ship every pallet ourselves, so there's one company responsible for the manifest and one team to call if something isn't right.",
      ] },
      { h: "The bottom line", p: [
        "Liquidation isn't a lottery and it isn't a guaranteed win. It's a sourcing channel that rewards buyers who read manifests, understand condition grades, price in freight and know their customers. Start with a lot you can afford to learn from, track your results, and scale what works.",
      ] },
    ],
  },
  {
    slug: "how-to-read-a-manifest", category: "Buying guides", date: "2026-09-18", updated: "2026-09-24", readMins: 9, hue: 45, author: "sourcing",
    tags: ["Manifests", "Research"],
    title: "How to read a liquidation manifest before you buy",
    excerpt: "What each manifest column means, why retail value isn't resale value, and a worked example that turns a manifest into a price you can defend.",
    body: [
      { p: [
        "A liquidation manifest is the line-by-line list of what's in a lot: item codes, descriptions, quantities and the retail price of each item. Reading one well comes down to three habits. Find the handful of lines that carry most of the value. Research what those items actually sell for, in the condition the lot is graded. Then add freight before you compare the result with the price.",
        "This guide walks through every column, shows the math on an example manifest, and lists the warning signs that should make you slow down. Every lot on PalletPort has a manifest, so you can practise on real lots as you read.",
      ] },
      { h: "What a liquidation manifest is", p: [
        "When a retailer or manufacturer clears returns, overstock or shelf pulls, the goods are counted and listed before they're sold. That list is the manifest. It tells you what was put on the pallet or truck, so you can price a lot before you commit to it.",
        "A manifest describes contents. It doesn't tell you condition item by item, and it doesn't tell you what anything will resell for. Condition comes from the lot's grade (see [what the condition grades mean](/help/condition-grades)). Resale value comes from your own research. Treat the manifest as the starting point for that research.",
        "On PalletPort, manifests are prepared by our own warehouse team for lots we sort and ship from our own dock. Small count variances can happen with any manifest, which is why the dispute rules further down use a threshold rather than a single-unit test.",
      ] },
      { h: "Each manifest column, explained", p: ["Column names vary between sellers, but most manifests carry the same five pieces of information."], list: [
        "SKU or UPC. The item code. A SKU is a retailer's or seller's internal code; a UPC is the barcode number printed on retail packaging. A UPC is the most reliable way to find the exact product online. A SKU helps you match lines within a lot and across lots.",
        "Description (Item). The product name as it appeared in the source system. Good descriptions name the brand, model and size. Poor ones say things like “kitchen item” or “assorted”.",
        "Qty. How many units of that line are in the lot. Multiply everything else by this number.",
        "Unit retail (MSRP). The retail price for one unit, usually the manufacturer's suggested price or the original retail list price. It's a reference point, and often higher than what the item sold for in stores.",
        "Extended retail (Ext. retail). Qty × unit retail for that line. Added up across all lines, it gives the lot's total retail value, the number most listings quote.",
      ] },
      { h: "What “retail value” means (and what it doesn't)", p: [
        "Total retail value is useful for one job: comparing the size and price of lots on the same basis. A lot priced at 20% of retail is cheaper relative to its contents than one at 30%, if the contents are similar. The lot page shows this as “price vs. retail”.",
        "Retail value is not what you'll get when you sell. Returned items resell below new prices. Some MSRPs are list prices nobody actually paid. Some items are last season's models. And you won't sell every unit. Resellers who budget on retail value, rather than on sold prices, overpay.",
        "Use retail value to shortlist lots. Use sold prices to decide what to pay.",
      ] },
      { h: "How to estimate resale value", p: [
        "You don't need to price every line. In most manifests a few lines hold a large share of the value, so start there and work down until the remaining lines are small enough to estimate as a group.",
      ], list: [
        "Sort by extended retail. Research the top lines first. The lot page's “Top 3 lines” figure tells you how much of the retail value those three carry.",
        "Look up sold prices, not asking prices. Use completed or sold listings on the marketplaces where you sell, and match condition: open-box or used prices for returns, new prices only for sealed stock.",
        "Estimate sell-through. Sell-through is the share of units you expect to sell within your normal selling window. Returns have defects and missing parts, so plan for less than 100%. Your own records from past lots are the best guide.",
        "Subtract your selling costs. Marketplace fees, shipping to your customer, packaging, and your time to test, clean and list.",
        "Add freight to the price. Your real cost is the price plus delivery. Divide by units to get landed cost per unit.",
      ] },
      { h: "Worked example: pricing a six-line manifest", p: [
        "The manifest below is an EXAMPLE, invented for this guide. The item names, prices and freight figure are made up to show the math. They are not a PalletPort lot or quote.",
      ], table: {
        caption: "Example manifest (invented for illustration)",
        head: ["SKU", "Item", "Qty", "Unit retail", "Ext. retail"],
        rows: [
          ["EX-1001", "Stand mixer, 5 qt, tilt-head", "4", "$279.99", "$1,119.96"],
          ["EX-1002", "Air fryer, 6 qt, digital", "12", "$89.99", "$1,079.88"],
          ["EX-1003", "Silicone utensil set, 5 pc", "60", "$12.99", "$779.40"],
          ["EX-1004", "Glass food storage set, 18 pc", "30", "$24.99", "$749.70"],
          ["EX-1005", "Nonstick cookware set, 10 pc", "6", "$119.99", "$719.94"],
          ["EX-1006", "Cordless handheld vacuum", "10", "$59.99", "$599.90"],
          ["Total", "", "122", "", "$5,048.78"],
        ],
      } },
      { p: [
        "Say this is a Customer Return pallet listed at $900, and you assume $250 for freight to your ZIP (a made-up number for the math; always use the estimator on the real lot). Landed cost is $1,150.",
      ], list: [
        "Price vs. retail: $900 ÷ $5,048.78 ≈ 18%. Landed vs. retail: $1,150 ÷ $5,048.78 ≈ 23%.",
        "Landed cost per unit: $1,150 ÷ 122 units ≈ $9.43.",
        "Value concentration: the top two lines (mixers and air fryers) are $2,199.84, about 44% of retail, but only 16 units.",
        "Resale research (example numbers): mixers sell used for about $140, air fryers $40, utensil sets $6, storage sets $12, cookware sets $55, vacuums $25.",
        "Sell-through (example assumptions): 3 of 4 mixers, 10 of 12 air fryers, 57 of 60 utensil sets, 27 of 30 storage sets, 5 of 6 cookware sets, 8 of 10 vacuums.",
        "Gross resale: $420 + $400 + $342 + $324 + $275 + $200 = $1,961, or about 39% of retail.",
        "Rough range: if sold prices come in 25% lower than your research, gross falls to about $1,470. So plan on roughly $1,470–$1,960 before selling costs.",
      ] },
      { p: [
        "Against a landed cost of $1,150, the low end leaves about $320 before fees, packaging and labour. An online seller paying marketplace fees and shipping on each order might clear very little. A bin store with no per-order fees and a customer base for kitchen goods might do fine. Same manifest, different answer, which is why the method matters more than any rule of thumb about percent of retail.",
        "Notice what drives the result: 16 high-value units carry almost half the retail value. If two mixers turn out to be defective, the numbers move a lot. When value is that concentrated, research those lines carefully and buy with a margin of safety.",
      ] },
      { h: "Red flags to look for", list: [
        "Vague lines. “Assorted”, “misc”, “general merchandise” or a bare category name with a large quantity. You can't research what you can't identify.",
        "Missing quantities or prices. A line without a qty or unit retail can't be valued. Ask before you buy.",
        "One line dominating the value. If a single item is a big share of retail, the lot's value depends on that item's condition. Check the “Top 3 lines” figure on the lot page.",
        "Retail prices that look inflated. If an item's unit retail is far above anything you can find it selling for new, discount it in your math.",
        "Units that don't add up. The lot's unit count should match the manifest total. If the listing and the manifest disagree, ask.",
        "Heavy, low-value lines. Bulky items with low resale prices add freight weight and take space without adding much value.",
      ] },
      { h: "Manifested vs. unmanifested pallets", p: [
        "A manifested pallet comes with a list of its contents. An unmanifested pallet is sold by description only, such as “mixed general merchandise, about 200 units”. Unmanifested loads are usually cheaper per unit because you're taking on more uncertainty.",
        "Manifested lots suit buyers who sell item by item online, who need to research prices before buying, or who want to track recovery against a known retail value. Unmanifested loads can work for some bin stores and flea-market sellers, where variety is part of the appeal and nothing is priced individually. Even then, the manifest is what gives you a basis for a dispute if a lot arrives well short.",
        "Every lot PalletPort sells is manifested, from single [case packs](/case-packs) to [truckloads](/truckloads).",
      ] },
      { h: "Using the manifest table on PalletPort", p: ["Each lot page has a Manifest section with a table of every line. You can:"], list: [
        "Search the manifest by item name or SKU, for example to check how many units of one brand are in the lot. The totals row updates to show the filtered units and retail value.",
        "Sort by item name, quantity, unit retail or extended retail. It opens sorted by extended retail, so the highest-value lines are at the top.",
        "Download the manifest as a CSV, add your own columns for sold prices and sell-through, and keep it with your purchase records.",
        "Read the summary above the table: price vs. retail, the share of value in the top 3 lines, the number of distinct items, and the highest-value items. The key facts panel shows the price per unit.",
      ] },
      { p: ["Pair the manifest with the freight estimate on the same page. Enter your ZIP and you'll see an estimate that includes dock or liftgate delivery. Our [freight guide](/blog/ltl-freight-101) explains what goes into it."] },
      { h: "If a lot arrives below its manifest", p: [
        "Lots are sold as-is according to their condition grade, so an individual defective unit in a returns or salvage lot isn't grounds for a refund. Under our [Return & Refund Policy](/legal/returns-and-disputes) you can request a return within 15 days of pickup or delivery, including when an order doesn't match its written listing in a material way.",
        "To raise a problem, contact us within 15 days of pickup or delivery with your order number, photos or videos and any freight paperwork. Returns need our written approval before anything is sent back. Count and photograph the contents as you unpack, before anything is sold or mixed with other stock. That record is what makes a discrepancy easy to prove. See also [what to do if the manifest doesn't match](/help/manifest-discrepancies).",
      ] },
      { h: "FAQ", faq: [
        { q: "How accurate are liquidation manifests?", a: "Accurate enough to price a lot, but small count variances are normal on any manifest. On PalletPort, if an order doesn't match its written listing in a material way, contact us within 15 days of pickup or delivery under our Return & Refund Policy." },
        { q: "Is manifest retail value the same as what I can sell the items for?", a: "No. Retail value is the original list price. Your resale value depends on condition, current sold prices on your channel and how many units you actually sell. Use sold listings to estimate it." },
        { q: "Are manifested pallets worth the higher price?", a: "If you sell item by item or need to research prices before buying, usually yes, because you can value the lot before you commit. If you sell by the bin or by the bag, variety may matter more than knowing each item." },
        { q: "How many lines should I research before buying?", a: "Start with the lines that make up most of the extended retail, often the top five to ten. Estimate the remaining small lines as a group, using a conservative price per unit." },
        { q: "Can I download a PalletPort manifest?", a: "Yes. Every lot page has a Download manifest (CSV) link above the manifest table, so you can add your own research columns in a spreadsheet." },
      ] },
    ],
  },
  {
    slug: "buying-strategy", category: "Buying guides", date: "2026-09-12", updated: "2026-09-26", readMins: 5, hue: 215, author: "team",
    tags: ["Pricing", "Buying"],
    title: "Buying strategy: how to choose liquidation lots without overpaying",
    excerpt: "Know your target cost per unit before you shop, compare lots on landed cost, and walk away from lots that don't fit your numbers.",
    body: [
      { h: "Decide your target cost before you browse", p: ["Work out the landed cost per sellable unit you can afford (see our manifest guide). That's the number that still leaves the margin you need. Write it down and judge every lot against it."] },
      { h: "Compare lots on landed cost, not headline price", p: ["Add the freight estimate for your ZIP to the lot price, then divide by the units you expect to sell. A cheaper pallet with fewer sellable units can cost you more per item than a pricier one."] },
      { h: "Save lots to compare them", p: ["Save several similar lots and compare their manifests side by side before you order. There's always another pallet."] },
      { h: "Check 'Recently sold'", p: ["Sold-out lots show what similar mixes and grades sold for. Use them as a benchmark for what a fair price looks like in a category."] },
      { h: "Combine lots in one order", p: ["Everything ships from one warehouse, so lots in the same cart can ship together. Adding them to one order before checkout can lower freight per pallet."] },
    ],
  },
  {
    slug: "ltl-freight-101", category: "Buying guides", date: "2026-09-08", updated: "2026-09-24", readMins: 8, hue: 10, author: "freight",
    tags: ["Freight", "Receiving"],
    title: "Liquidation pallet shipping: LTL freight costs explained",
    excerpt: "Parcel vs. LTL vs. truckload, what drives the cost of shipping a pallet, liftgate and residential fees, and how to receive freight without losing a claim.",
    body: [
      { p: [
        "Most liquidation pallets ship by LTL (less-than-truckload) freight, where your pallets share a trailer with other shippers' freight. The cost depends on weight, how many pallets you order and how much space they take, the distance, the freight class, and extra services such as a liftgate or residential delivery. Case packs usually go by parcel. Full truckloads get their own trailer.",
        "Freight can change whether a lot makes money, so price it before you order. This guide explains what goes into the quote, what you need on delivery day, and how to cut freight cost per unit.",
      ] },
      { h: "Parcel, LTL or full truckload?", p: ["The shipping mode follows the lot size. On PalletPort each lot page tells you which mode applies."], list: [
        "Parcel, for case packs. Sealed cartons travel by parcel carrier like any online order. No dock or equipment needed, and home delivery is simple. [Case packs](/case-packs) are the easiest way to start.",
        "LTL, for one or a few pallets. Your pallets ride on a shared trailer and move through the carrier's terminals. It's the standard for single [pallets](/pallets) and small multi-pallet orders. Each of our pallets is a standard 48×40 in. footprint; the lot page shows the approximate weight per pallet.",
        "Full truckload, for truckload lots. A dedicated 53 ft trailer carries 18–26 pallets from our dock to yours without stops at terminals. It requires a loading dock and a forklift at delivery. See [truckloads](/truckloads).",
      ] },
      { h: "What drives LTL freight cost", p: ["An LTL quote is a base linehaul rate plus fees for any extra services. These factors set the base rate."], list: [
        "Weight. LTL is priced largely per hundred pounds, so heavier shipments cost more, though the rate per pound often falls as weight rises.",
        "Pallet count and dimensions. Carriers price the space you take on the trailer. Two pallets cost more than one; a tall or oversize pallet can cost more than its weight suggests.",
        "Distance and lanes. Longer distances cost more. Some lanes are cheaper than others because carriers have more freight moving that way.",
        "Freight class. See the next section.",
        "Accessorials. Extra services such as liftgate, residential delivery or delivery appointments. These are added on top of the base rate.",
        "Market conditions. Fuel surcharges and seasonal demand move rates up and down during the year.",
      ] },
      { h: "Freight class basics", p: [
        "In the US, LTL freight is classified under the National Motor Freight Classification (NMFC), with classes from 50 to 500. Lower classes are dense, durable freight that's easy to handle, and they cost less per pound. Higher classes are light for their size, fragile or awkward, and they cost more.",
        "Density, meaning pounds per cubic foot, is the biggest factor for most mixed merchandise. A pallet of dense kitchen goods usually ships in a lower class than a pallet of the same size stacked with pillows. You don't need to classify freight yourself when you buy from us, because we set it up with the carrier. It helps to know why a light, bulky lot can cost more to ship per dollar of retail than a heavy, compact one.",
      ] },
      { h: "Dock, liftgate or residential delivery", p: ["How the pallets come off the truck matters as much as how far they travel."], list: [
        "Dock delivery. If you have a loading dock at trailer height, the driver rolls pallets straight into your building. It's the simplest and cheapest option, and the only one for full truckloads.",
        "Liftgate delivery. With no dock, the carrier sends a truck with a hydraulic lift that lowers each pallet to the ground. Liftgate is an added fee. Once the pallet is on the ground, moving it is up to you.",
        "Residential delivery. Homes, and often farms and some home-based businesses, count as residential. Carriers add a surcharge, may need an appointment, and may use a smaller truck. Tell us at checkout so the quote is accurate.",
        "Limited-access sites. Storage units, construction sites, schools and similar locations can carry extra fees or restrictions. Check with us before you choose one as your delivery address.",
      ] },
      { h: "What you need to unload", list: [
        "A pallet jack for any pallet delivery by liftgate. Drivers typically bring the pallet to the liftgate and lower it, then leave it at the curb or end of the driveway.",
        "A firm, level surface. Pallet jacks struggle on gravel, grass and steep driveways. Plan where the pallet will land and how you'll move it.",
        "A forklift and dock for full truckloads, and usually a delivery appointment.",
        "Help. A loaded pallet can weigh several hundred pounds or more. Have a second person and a plan to break the pallet down if you can't move it whole.",
        "Space. Know where the pallets will go before the truck arrives, and keep the path clear.",
      ] },
      { h: "Receiving checklist: inspect before you sign", p: ["The delivery receipt, usually the bill of lading (BOL), is your evidence if anything went wrong in transit. Once you sign it clean, a damage claim gets much harder. Before the driver leaves:"], list: [
        "Count the pallets and check them against the BOL and your order.",
        "Walk around every pallet. Look for torn or re-wrapped stretch wrap, crushed corners, leaning or shifted stacks, forklift punctures and wet cartons.",
        "Write any problem on the BOL before you sign, in specific words: “1 pallet wrap torn, top cartons crushed” is far stronger than “damaged”.",
        "If a pallet is missing, write the short count on the BOL too.",
        "Take photos of each pallet, all four sides and the top, before you unwrap anything.",
        "Keep your copy of the signed BOL with your order records.",
      ] },
      { p: ["See also our help article on [receiving a shipment](/help/receiving-a-shipment)."] },
      { h: "Freight damage claims basics", p: [
        "Visible damage should be noted on the BOL at delivery. Concealed damage, found only when you unwrap, should be photographed and reported as soon as you find it. Keep the packaging and the damaged goods until the claim is settled; a carrier may want to inspect them.",
        "Transit damage is claimed with the carrier, which is why the notes on the delivery receipt matter. Contact us within 15 days of delivery with your order number, photos and the freight paperwork, and we'll tell you the next steps. See our [Return & Refund Policy](/legal/returns-and-disputes). Report problems quickly; the sooner we hear, the easier it is to take up with the carrier.",
      ] },
      { h: "How PalletPort shows freight before you buy", p: [
        "Every lot page has an Estimate shipping box. Enter your delivery ZIP, tick Loading dock if you have one (otherwise the estimate includes liftgate delivery), and tick Residential if it applies. The estimate shows the shipping mode, the freight amount, any liftgate or residential fees, and an approximate transit time.",
        "At checkout, freight is calculated again for your whole cart using the same ZIP and delivery options. Everything we sell ships from our own warehouse, so all the lots in one order travel together as one shipment. Final freight is confirmed at checkout.",
        "Want to collect instead? Use “Warehouse pickup · book a visit” on any lot page to book a weekday visit at our Columbus-area warehouse. Bring a truck or trailer sized for your pallets.",
      ] },
      { h: "How to lower freight cost per unit", list: [
        "Put more on each shipment. Much of an LTL bill is fixed per shipment: pickup, delivery and any liftgate or residential fees. Two or three pallets in one order usually cost less per pallet than the same pallets shipped separately.",
        "Combine lots in one order. Because everything ships from one warehouse, lots in the same cart ship together as one shipment. Add them before you check out rather than placing separate orders.",
        "Use a dock or a commercial address. Dock delivery avoids the liftgate fee, and a business address avoids the residential surcharge.",
        "Favour dense, high-unit lots. Freight follows weight and space, so a lot with more sellable units per pallet spreads the cost further. Check the units and weight in the lot's key facts.",
        "Move up to a truckload when volume allows. Once you're buying many pallets at a time, a full truckload can cost less per pallet than several LTL shipments.",
        "Be ready on delivery day. Missed appointments and redeliveries add fees. Answer the carrier's call and keep your unloading area clear.",
      ] },
      { h: "Build freight into your math", p: [
        "Freight belongs in your cost before you order. Add the estimate to the price, then divide by the units you expect to sell. That landed cost per unit is the number to compare against your resale research. Our [manifest guide](/blog/how-to-read-a-manifest) has a worked example.",
      ] },
      { h: "FAQ", faq: [
        { q: "How much does it cost to ship a liquidation pallet?", a: "It depends on weight, pallet count, distance, freight class and delivery services such as liftgate or residential delivery. On PalletPort, enter your ZIP on any lot page to see an estimate; freight is confirmed at checkout." },
        { q: "Do I need a loading dock to receive a pallet?", a: "No. Without a dock, choose liftgate delivery and the carrier lowers the pallet to the ground. You'll need a pallet jack and a firm, level surface to move it. Full truckloads do require a dock and a forklift." },
        { q: "Can pallets be delivered to a home address?", a: "Yes, by liftgate truck, with a residential surcharge and often an appointment. Tick Residential in the estimator or at checkout so your quote includes it." },
        { q: "What should I do if a pallet arrives damaged?", a: "Note the damage on the delivery receipt before you sign, take photos, and contact us within 15 days of delivery with your order number and the freight paperwork. Transit damage is claimed with the carrier, as set out in our Return & Refund Policy." },
        { q: "Can I pick up my order at your warehouse?", a: "Yes, by appointment. Book a warehouse visit from any lot page: pick a weekday (Monday to Friday) and a 50-minute time at least 45 hours ahead. Orders of $600 or more pay a refundable 35% deposit to confirm; smaller orders pay in full. There's no walk-in store." },
      ] },
    ],
  },
  {
    slug: "liquidation-and-sustainability", category: "Industry insights", date: "2026-09-01", readMins: 5, hue: 150, author: "team",
    tags: ["Sustainability"],
    title: "Why reselling returns is one of the greenest things in retail",
    excerpt: "Every pallet that finds a reseller is one less load heading to landfill.",
    body: [
      { p: ["Returned and unsold goods have to go somewhere. Without a resale channel, a surprising amount is destroyed or landfilled simply because it's cheaper than processing it."] },
      { h: "Keeping goods in use", p: ["Liquidation moves products to businesses that can test, repair, clean and resell them — extending their life and reducing the demand for new manufacturing."] },
      { h: "Local impact", p: ["Bin stores, thrift shops and market vendors bring affordable goods to their communities and create local jobs sorting, testing and selling."] },
      { h: "What you can do", list: ["Offer testing and honest grading so fewer items are returned again.", "Sell parts from salvage items.", "Donate what you can't sell rather than binning it."] },
    ],
  },

  {
    slug: "first-pallet-checklist", category: "Buying guides", date: "2026-09-15", readMins: 6, hue: 24,
    title: "Your first liquidation pallet: a 10-point checklist",
    excerpt: "How to pick a first lot you can actually sell, without getting burned on freight or condition.",
    body: [
      { p: ["Your first pallet sets the tone for your margins. Start small, pick a category you already understand, and treat the first lot as tuition as much as inventory."] },
      { h: "Before you buy", list: [
        "Choose a category you can price quickly — you should know roughly what each item resells for.",
        "Read the full manifest. Sort by extended MSRP and look at the top five lines: they carry most of the value.",
        "Match the condition grade to your channel. Customer returns suit bin stores and refurbishers; new overstock suits online marketplaces.",
        "Check customer reviews and whether the lot has photos or testing notes.",
        "Price in freight. At $175 per pallet, a $400 lot really costs $575.",
      ] },
      { h: "When it arrives", list: [
        "Inspect before you sign the delivery receipt.",
        "Photograph the pallet before you unwrap it.",
        "Sort into sell-now, test, and parts piles on day one.",
        "Track the actual resale of every unit for your first three pallets.",
        "Compare real recovery against the manifest value — that's your personal benchmark.",
      ] },
    ],
  },
  {
    slug: "returns-vs-shelf-pulls", category: "Buying guides", date: "2026-09-02", updated: "2026-09-24", readMins: 7, hue: 215,
    tags: ["Condition grades", "Sourcing"],
    title: "Customer returns vs. shelf pulls: pallet grades explained",
    excerpt: "Customer return pallets cost less; shelf pull pallets need less work. Compare all five grades on packaging, testing, price and fit.",
    body: [
      { p: [
        "Customer return pallets hold goods that shoppers bought and sent back. They're untested, so you'll get a mix of working, cosmetic and defective units. Shelf pull pallets hold goods that never sold: they were pulled from store shelves and may have price stickers or light box wear, but they haven't been used. Returns cost less relative to retail. Shelf pulls cost more and need far less testing.",
        "Which is better depends on how you sell and how much time you can spend per unit. This guide covers all five PalletPort condition grades, what's typically inside each, and how to match a grade to your channel.",
      ] },
      { h: "Why condition grade matters more than price", p: [
        "Two lots with the same retail value and the same price can have very different outcomes. One might be ready to list the day it arrives. The other might need every unit opened, tested, cleaned and photographed, with a share set aside as parts. The grade tells you which kind of lot you're buying before you see it.",
        "Across our lots, typical prices run from about 10% to 35% of retail. Where a lot sits in that range depends mostly on grade and category. New / Overstock and Shelf Pull lots sit toward the top, Customer Return and Mixed Condition lots lower, and Salvage lowest. The discount on the lower grades pays you for the extra work and risk you take on.",
      ] },
      { h: "The five PalletPort condition grades", p: ["These are the grades we use on every lot, with the definition shown on the lot page. Full definitions are also in the help centre under [condition grades](/help/condition-grades)."] },
      { h: "New / Overstock", p: [
        "Definition: unopened retail overstock in original packaging.",
        "This is stock a retailer or manufacturer ordered but didn't sell through: excess seasonal buys, discontinued colours, packaging changes. Boxes are sealed. Testing is usually unnecessary beyond a spot check, and you can list with stock photos and describe items as new where your marketplace's rules allow it.",
        "It's the highest-priced grade relative to retail. Your margin comes from selling at or near new-item prices on your channel, so price research on current sold listings matters more than defect rates. Browse [Brand-New Overstock](/collections/brand-new-overstock).",
      ] },
      { h: "Shelf Pull", p: [
        "Definition: pulled from store shelves; may have price stickers or light box wear.",
        "Shelf pulls come off the sales floor when a store resets a section, clears a season or makes room for new stock. The products are unused. The packaging is where the wear shows: price or clearance stickers, scuffed corners, dented boxes, sometimes an opened display unit.",
        "Testing effort is low. Plan time to remove stickers and to check any box that looks opened. Some buyers sell shelf pulls as new in open or damaged packaging, depending on the item and the marketplace. Pricing sits just below New / Overstock. For tech in these two grades, see [Flip-Ready Electronics](/collections/flip-ready-electronics).",
      ] },
      { h: "Customer Return", p: [
        "Definition: returned by shoppers. Untested; expect a mix of working, cosmetic and defective.",
        "Shoppers return things for all sorts of reasons: wrong size, changed mind, gift duplicates, missing parts, damage in shipping, or a real fault. Returns pallets reflect that. Some units are like new, some have cosmetic marks or missing accessories, and some don't work. Packaging ranges from sealed to opened, retaped or missing.",
        "Testing effort is the highest of the sellable grades. Every unit you plan to sell individually should be checked for function and completeness. You also need somewhere to send what fails: parts sales, repair, bulk resale, recycling. In exchange, customer return pallets are priced well below new and shelf-pull stock, so you get more units per dollar. Individual defective units are part of what the grade describes, so on their own they aren't grounds for a refund under our [Return & Refund Policy](/legal/returns-and-disputes).",
      ] },
      { h: "Mixed Condition", p: [
        "Definition: a blend of new, shelf-pull and returned goods.",
        "Mixed lots come from loads where grades were combined, such as a store clearance or a returns stream with some unsold stock mixed in. Expect variety in both products and packaging. Treat it like a returns lot for testing: check anything opened, and assume sealed units are fine unless the box is damaged.",
        "Pricing depends on the blend, and usually sits with or near Customer Return lots. Mixed and returns lots with high unit counts make up our [Bin Store Starter Kit](/collections/bin-store-starter) collection.",
      ] },
      { h: "Salvage", p: [
        "Definition: damaged or for parts. Sold as-is for repair and resale professionals.",
        "Salvage lots include items with known damage, failed tests or missing components. Some can be repaired and resold, and some are worth more as parts. Packaging is often missing or heavily damaged.",
        "It's the lowest-priced grade by a wide margin, and the one that needs the most skill. Buy salvage if you repair, refurbish or sell parts and have a plan for scrap and recycling. If you don't, the low price won't make up for the time. See [Repair & Refurb](/collections/repair-and-refurb) and our [guide for refurbishers](/guides/refurbishers).",
      ] },
      { h: "Comparison table", table: {
        head: ["Grade", "Packaging", "Testing effort", "Price vs. other grades", "Typical buyer fit"],
        rows: [
          ["New / Overstock", "Sealed, original packaging", "Minimal; spot checks", "Highest", "Online resellers, discount stores"],
          ["Shelf Pull", "Original, may have stickers or light box wear", "Low; check opened boxes", "High", "Online resellers, discount stores, flea-market vendors"],
          ["Customer Return", "Anywhere from sealed to opened or missing", "High; test every unit you sell individually", "Low", "Bin stores, flea-market vendors, refurbishers"],
          ["Mixed Condition", "Varies by unit", "Moderate to high", "Low, depends on the blend", "Bin stores, flea-market vendors"],
          ["Salvage", "Often missing or damaged", "Highest; repair or part out", "Lowest", "Repair shops, parts resellers"],
        ],
      } },
      { h: "How to choose for your sales channel", list: [
        "Online marketplace sellers. Every defective unit you ship costs a return, a refund and possibly a bad review. New / Overstock and Shelf Pull lots usually work out cheaper per sale once you count those costs. If you buy returns, test before listing and describe condition honestly. See [sourcing for online resale](/guides/online-resellers).",
        "Bin stores. Customers buy on price and variety and accept that items are as-is. Customer Return and Mixed Condition pallets with high unit counts give you the most items per dollar. Pull the best units for a showcase shelf or online listing. See [how to start a bin store](/blog/bin-store-from-zero).",
        "Flea-market vendors. You can test items at your table and explain condition face to face, which suits returns and mixed lots. Shelf pulls work well for gift-type items that sell better in a box.",
        "Discount and dollar stores. Shoppers expect new product. New / Overstock and Shelf Pull stock fits the shelf with little work. See [running a discount store](/guides/discount-stores).",
        "Refurbishers and repair shops. Your skills turn lower grades into sellable stock. Customer Return and Salvage lots in categories you know are where your margin is.",
      ] },
      { h: "A quick way to compare grades on cost", p: [
        "The cheaper grade isn't always the cheaper buy. To compare, work out your cost per sellable unit for each option.",
        "Take the landed cost (price plus freight) and divide by the units you expect to sell. Then add your handling cost per unit: minutes to test, clean and list, times your hourly labour cost. Compare the totals. If a returns lot saves you less per unit than it costs you in extra handling, the higher grade is the better buy.",
        "Your expected sell-through for each grade should come from your own records. Track every lot you buy: units received, units sold, units scrapped and hours spent. After a few lots you'll know your real numbers for each grade and category. Our [manifest guide](/blog/how-to-read-a-manifest) walks through the rest of the math.",
      ] },
      { h: "Checking a lot's grade before you buy", list: [
        "Read the grade and definition on the lot page, under Condition.",
        "Read the lot description for anything specific to that load, such as packaging details or known issues.",
        "Check the manifest. For returns, look at which lines carry the value; a few high-value items raise the stakes on their condition.",
        "Check the product specifications and condition details.",
        "Ask. If you're unsure whether a grade fits your plans, [contact us](/contact) before you order.",
      ] },
      { h: "FAQ", faq: [
        { q: "What's the difference between shelf pulls and customer returns?", a: "Shelf pulls were removed from store shelves without being sold, so they're unused but may have stickers or box wear. Customer returns were bought and returned by shoppers, and they're untested, so you'll find a mix of working, cosmetic and defective units." },
        { q: "Are customer return pallets worth it?", a: "They can be if your channel handles mixed quality, such as a bin store, flea-market table or repair shop, and you've priced in testing time and a share of units you can't sell. They're harder to make work if you sell online item by item without testing capacity." },
        { q: "Can I get a refund for defective items in a customer return pallet?", a: "Individual defective units aren't grounds for a refund, because the grade tells you to expect them. If the order doesn't match its written listing in a material way, you can request a return within 15 days of pickup or delivery under our Return & Refund Policy." },
        { q: "Can I sell shelf pulls as new?", a: "Shelf pulls are unused, but packaging may show stickers or wear. How you can describe them depends on the item and on each marketplace's condition rules, so check those rules before listing." },
        { q: "Which grade should I start with?", a: "Start with the grade your channel can sell with the least extra work, and a lot size you can afford to learn from. For many first-time online sellers that's shelf pulls; for bin stores it's customer returns or mixed lots." },
      ] },
    ],
  },
  {
    slug: "q4-market-report-2026", category: "Market reports", date: "2026-09-10", readMins: 7, hue: 330,
    title: "Market report: what's moving into Q4",
    excerpt: "Seasonal overstock is arriving early. Here's where supply is heavy and where it's thin.",
    body: [
      { p: ["This report summarizes listing and sell-through patterns on PalletPort over the past 60 days. Figures describe our marketplace only and are directional, not a forecast."] },
      { h: "Where supply is heavy", list: ["Small kitchen appliances — plentiful, with average pricing at the low end of the historical range.", "Outdoor and patio — end-of-season lots are clearing at steep discounts.", "Phone accessories — high unit counts, low per-unit values."] },
      { h: "Where supply is thin", list: ["Toys and games — lots are selling within days of listing ahead of the holidays.", "Cordless power tools — shelf-pull tool lots remain in demand."] },
      { h: "What it means for buyers", p: ["If you stock for the holidays, buy toys now rather than in November. Patio and outdoor lots are a good speculative buy to hold for spring if you have storage."] },
    ],
  },
  {
    slug: "electronics-sell-through", category: "Market reports", date: "2026-08-20", readMins: 4, hue: 250,
    title: "Electronics sell-through: audio leads, smart home lags",
    excerpt: "Earbud and headphone lots are the fastest movers in electronics this summer.",
    body: [
      { p: ["Audio lots sold fastest among electronics subcategories on PalletPort this summer, while smart-home lots sat longer — likely because compatibility questions make them harder to resell."] },
      { h: "Takeaway", p: ["If you buy smart-home returns, budget time to reset and test devices, and list them with clear compatibility notes."] },
    ],
  },
  {
    slug: "bin-store-from-zero", category: "Reseller stories", date: "2026-08-12", updated: "2026-09-24", readMins: 8, hue: 90,
    tags: ["Bin stores", "Getting started", "Sourcing"],
    title: "How to start a bin store: inventory, pricing and restocking",
    excerpt: "Plan a bin store from the numbers up: price days, startup budget categories, how many pallets you need each week, and what to do with leftovers.",
    body: [
      { p: [
        "A bin store sells general merchandise loose in large bins at one flat price per item, and that price drops on a set schedule through the week. Customers come for the restock day and come back for the bargain days. To start one, you need a space with room for bins and back stock, a budget that covers several weeks of inventory before sales cover it, and a reliable supply of high-unit-count pallets.",
        "This guide covers the model, space, budget, which lots to buy, how to work out pallets per week, pricing, restock day and leftovers. The numbers in the examples are placeholders. Replace them with your own quotes and results.",
      ] },
      { h: "How the bin store model works", p: [
        "Most bin stores run a weekly cycle. The store restocks on one day, often closing for part or all of the day before to empty and refill the bins. Opening day has the highest price and the best selection. Each day after, the price per item drops, until the last day of the cycle when everything left goes for the lowest price. Then the cycle starts again.",
        "The falling price does two jobs. Early shoppers pay more for first pick, and late shoppers clear what's left, so less stock carries over. The weekly reset gives regulars a reason to return.",
      ], table: {
        caption: "Example price schedule (illustrative; set your own days and prices)",
        head: ["Day", "Price per item", "What happens"],
        rows: [
          ["Thursday", "Closed", "Restock: clear, sort and refill bins"],
          ["Friday", "$10", "Restock day, biggest crowd"],
          ["Saturday", "$8", "Busy weekend trade"],
          ["Sunday", "$6", ""],
          ["Monday", "$4", ""],
          ["Tuesday", "$2", ""],
          ["Wednesday", "$1", "Last day; pull leftovers at close"],
        ],
      } },
      { h: "Space and fixtures", list: [
        "Sales floor. Bins need room on all sides for shoppers to reach in. Plan wide aisles, because restock days bring crowds.",
        "Back room. You need space to receive, unwrap and sort pallets, plus storage for next week's stock and pulled items. Many owners find the back room fills faster than the sales floor.",
        "Delivery access. A loading dock is ideal. Without one, you'll need liftgate delivery, a pallet jack and a level path from the curb to the back room. See our [freight guide](/blog/ltl-freight-101).",
        "Bins and tables. Large, sturdy, shallow-enough bins that shoppers can reach the bottom of. Add a few shelves or a glass case for higher-value items priced separately.",
        "Checkout. A POS or card reader that handles fast, repeated single-price sales, bags, and a clear line layout for restock day.",
        "Parking and signage. Restock-day traffic needs parking, and a visible sign with the price schedule saves your staff answering the same question all day.",
        "Local rules. Check zoning, occupancy limits, business licensing and your state's sales tax permit before you sign a lease.",
      ] },
      { h: "Startup budget categories", p: [
        "Costs vary widely by city, space and how much you build out, so get real quotes. The categories below are what most bin store budgets need to cover. The figures are a worked EXAMPLE with round numbers, not typical or national costs.",
      ], table: {
        caption: "Example startup budget (replace every figure with your own quotes)",
        head: ["Category", "Example amount", "Notes"],
        rows: [
          ["Lease deposit and first month", "$6,000", "Ask about build-out allowances and rent-free fit-out time"],
          ["Bins, tables and shelving", "$4,000", "Buying used fixtures can cut this"],
          ["First four weeks of inventory", "$12,000", "Enough pallets to restock before sales fully fund buying"],
          ["Freight for that inventory", "$2,000", "Use real freight estimates for your ZIP"],
          ["POS, card reader and bags", "$1,000", ""],
          ["Pallet jack, carts, cutters, safety gear", "$800", ""],
          ["Signage and opening marketing", "$2,000", "Outdoor sign, social media, opening-week flyers"],
          ["Licences, permits and insurance", "$1,500", "Varies by state and city"],
          ["Cash reserve", "$10,000", "Rent, payroll and restocks while sales ramp up"],
          ["Example total", "$39,300", ""],
        ],
      } },
      { p: [
        "The cash reserve is the line new owners cut first and regret most. Sales usually take time to reach a steady level, and you still need to buy next week's inventory before this week's sales are counted.",
      ] },
      { h: "Which lots work for a bin store", p: [
        "Bin stores run on unit count and variety. A shopper paying one price per item wants a lot to choose from, and you need enough items to fill bins every week. That points to lots with many units at a low cost per unit, across categories with broad appeal.",
      ], list: [
        "Customer Return pallets. Untested returns sell well in bins because shoppers accept as-is condition in exchange for the price. They also give you the most units per dollar.",
        "Mixed Condition pallets. A blend of new, shelf-pull and returned goods adds variety, and some sealed items make good showcase pieces.",
        "General merchandise. Mixed general merchandise gives the widest range per pallet. Home and kitchen and toys are popular bin categories too. Browse [General Merchandise](/c/general-merchandise), [Home & Kitchen](/c/home-kitchen) and [Toys & Baby](/c/toys-baby).",
        "High unit counts. Check Units and Price / unit in each lot's key facts. The [Bin Store Starter Kit](/collections/bin-store-starter) collection gathers our Customer Return and Mixed Condition lots with 150 or more units.",
      ] },
      { p: [
        "What to avoid: large furniture, which takes bin space and needs separate pricing, and Salvage lots unless you have a parts or repair channel. For more detail see our [bin store buying guide](/guides/bin-stores) and [customer returns vs. shelf pulls](/blog/returns-vs-shelf-pulls).",
      ] },
      { h: "How many pallets to buy each week", p: [
        "Work out pallets per week from your floor, not from a guess. You need four numbers: how many bins you have, how many items fill a bin, how much of that stock you replace each week, and the average units per pallet in the lots you buy.",
        "Units needed per week = bins × units per full bin × weekly replacement rate ÷ share of units that go into bins.",
        "Pallets per week = units needed per week ÷ average units per pallet.",
        "Example (invented numbers): you have 20 bins that each hold about 150 items, so a full floor is 3,000 items. You plan to replace about 80% each week, which means 2,400 items. About 85% of what arrives is bin-worthy; the rest is broken, oversized, or pulled for a showcase shelf or online sale. So you need about 2,400 ÷ 0.85 ≈ 2,825 units arriving each week. If the lots you buy average 300 units per pallet, that's about 9.4, so plan on 9–10 pallets a week.",
        "A full truckload is 18–26 pallets, so at that volume a truckload every two to three weeks may cost less per pallet than weekly LTL shipments, if you have space to store the extra. Recalculate every month with your real sell-through and your real units per pallet.",
      ] },
      { h: "Pricing strategy", list: [
        "Start from landed cost per unit. Add the price and freight of a week's pallets and divide by the bin-worthy units. Your average realised price across the week needs to cover that, plus rent, payroll and other costs spread across the units you sell.",
        "Track sales by day. Record items sold and revenue for each price day. If most stock goes in the first two days, your top price may be low. If a lot is left for the final day, the early prices may be too high or the stock mix is wrong.",
        "Pull high-value items out of the bins. Use the manifest to spot the most valuable lines before the pallet arrives (sort by extended retail on the lot page). Price those separately on a showcase shelf or sell them online.",
        "Keep the schedule simple. Shoppers should be able to read the week's prices at a glance. Change the schedule rarely, and announce changes in advance.",
      ] },
      { h: "Restock day operations", p: ["Restock day decides the week. A routine keeps it fast and safe."], list: [
        "Schedule deliveries so pallets arrive before restock day, with time to sort. Inspect and note any damage on the delivery receipt before you sign.",
        "Clear the bins. Pull leftovers from the last cycle to clearance, online or donation piles.",
        "Unwrap and sort. Separate showcase items, oversized items, broken units and bin stock. Flatten and bale cardboard as you go.",
        "Fill bins evenly. Spread each category across several bins so every bin has variety, and put some eye-catching items near the top.",
        "Take photos and post them. A few pictures of the best finds on social media brings shoppers in on opening day.",
        "Brief staff on crowd control, line management and the price schedule before you open.",
      ] },
      { h: "What to do with leftovers", list: [
        "Final-day pricing. The lowest price day, or a fill-a-bag deal, clears much of what's left.",
        "Clearance area. Move slow items to a clearance table rather than letting them fill bins week after week.",
        "Online resale. Items worth more than your bin price can be tested and listed online.",
        "Bulk resale. Other resellers, flea-market vendors and exporters may buy leftovers by the box or gaylord.",
        "Donate and recycle. Donate usable goods to local charities, and recycle cardboard, plastics and electronics through proper channels. Check local rules for e-waste and batteries.",
      ] },
      { h: "Keep your sourcing consistent", p: [
        "Shoppers notice when the bins get thin or the mix changes. Buying the same grades and categories on a regular schedule keeps restock days predictable for you and for them.",
        "Order the pallets you need every week at the same time each week, so restock days stay predictable. Add extra lots when the price fits your numbers. Our [how to order](/how-to-buy) page explains checkout, payment and delivery.",
        "Track every lot: units received, units sold, units pulled and revenue per pallet. After a few weeks you'll know which lot types and categories earn their place in your bins. If you have a resale certificate, add it under Account to unlock Net 30 terms and tax-exempt checkout where it applies.",
      ] },
      { h: "FAQ", faq: [
        { q: "How much does it cost to start a bin store?", a: "It depends on your city, space and build-out. Budget for lease costs, fixtures, several weeks of inventory and freight, a POS system, equipment, licences and insurance, marketing, and a cash reserve. Get local quotes for each category rather than relying on a national figure." },
        { q: "How many pallets does a bin store need each week?", a: "Multiply your bins by the items per full bin and your weekly replacement rate, adjust for items that won't go in bins, then divide by the average units per pallet in the lots you buy. The result is your weekly pallet count." },
        { q: "What kind of pallets are best for a bin store?", a: "High-unit-count Customer Return and Mixed Condition pallets in broad-appeal categories such as general merchandise, home and kitchen, and toys. PalletPort's Bin Store Starter Kit collection lists lots like these with 150 or more units." },
        { q: "How do bin stores price items?", a: "Most use one price per item that falls on a set schedule through the week, starting highest on restock day and ending at the lowest price on the final day. Higher-value items are often pulled and priced separately." },
        { q: "What should I do with items that don't sell?", a: "Clear them on the final low-price day, move slow items to a clearance area, sell better items online, sell leftovers in bulk to other resellers, and donate or recycle the rest." },
      ] },
    ],
  },
];
