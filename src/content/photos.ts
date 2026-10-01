// Stock photography used on marketing pages (homepage, categories, About, How it works, blog).
// All photos are from Unsplash under the Unsplash License (free for commercial use, no permission needed).
// https://unsplash.com/license — credits are listed on /credits and in PHOTO-CREDITS.md.
//
// Lot pages deliberately do NOT use stock photos: a buyer must see the actual pallet they are buying.
//
// Images are served from Unsplash's CDN, resized on the fly. To self-host instead, run
// `node scripts/download-photos.mjs` (saves them to public/images/stock) and set NEXT_PUBLIC_LOCAL_PHOTOS=1.

export type StockPhoto = {
  id: string; // images.unsplash.com/photo-<id>
  alt: string;
  by: string; // photographer
  page: string; // unsplash.com photo page (for credit)
};

const p = (id: string, alt: string, by: string, page: string): StockPhoto => ({ id, alt, by, page: `https://unsplash.com/photos/${page}` });

export const PHOTOS = {
  // Warehouse / brand
  heroWarehouse: p("1689942010216-dc412bb1e7a9", "Warehouse aisle stacked high with wrapped pallets", "AFINIS Group", "OnbSOhz0oig"),
  forklift: p("1645736315000-6f788915923b", "Forklift moving through a warehouse filled with pallets", "Bernd Dittrich", "F2C_mSrb6iM"),
  boxesOnRacks: p("1587293852726-70cdb56c2866", "Cardboard boxes on warehouse racking", "CHUTTERSNAP", "BNBA1h-NgdY"),
  warehouseBoxes: p("1672552226380-486fe900b322", "Warehouse floor filled with boxes and pallets", "Arum Visuals", "VnMbc9Szs-E"),
  warehouseBoxes2: p("1672552226650-796f40198c47", "Stacked boxes in a large warehouse", "Arum Visuals", "wpSTbotzfGw"),
  boxStack: p("1709804945989-c8be542e04db", "Large stack of boxes in a warehouse", "Ali Mkumbwa", "DU2ybvshovg"),
  shelving: p("1714650601435-67a4d51a0798", "Tall warehouse shelving full of stock", "Rack Manufacturing Expert", "wHfvgx506PM"),
  shelvingBoxes: p("1749244768351-2726dc23d26c", "Warehouse shelves filled with boxes", "Russ Murray", "M7G_m5XJ-go"),
  aisleTeam: p("1664382953403-fc1ac77073a0", "Two staff walking a warehouse aisle", "Centre for Ageing Better", "ZlOlRnWk8zU"),
  woodenPallets: p("1594571194668-7112042d8f54", "Stack of empty wooden pallets", "Lucas van Oort", "tWLgDQCKRYU"),
  palletPile: p("1631630935045-bcf9f5872335", "Pile of reusable wooden pallets", "Dylan Hunter", "BoFRFnzE5Gk"),
  boxLot: p("1570086625846-f33f679eb4f5", "Assorted cardboard boxes ready to ship", "Wonderlane", "OFfEOcIFiIc"),
  boxesOnShelf: p("1627915589334-14a3c3e3a741", "Returned product boxes on a shelf", "CPG.IO", "CBTmEZqUaM0"),
  openBox: p("1647489238347-dbd651c2f37a", "Open carton of mixed merchandise", "Ainur Iman", "sFawrnFtYvs"),
  // Freight
  semiTruck: p("1695222833131-54ee679ae8e5", "Semi truck on the highway", "Artem Balashevsky", "ZhNYKwjRMh4"),
  freightTruck: p("1616432043562-3671ea2e5242", "Freight truck on the road", "Caleb Ruiter", "EmEQ6kK_5P0"),
  loadingVan: p("1620455800201-7f00aeef12ed", "Loading boxes into a delivery van", "Claudio Schwarz", "a85IYeAXgxU"),
  truckCity: p("1711942179703-fce59b6afac6", "Semi truck driving through town", "Bernd Dittrich", "OtbeW0R6RFo"),
  // Buying / retail
  checklist: p("1642188537432-41c8a331ebdb", "Clipboard with a checklist", "Testeur de CBD", "UFb4LPahwHQ"),
  clipboard: p("1646808914973-e4fce4514ab5", "Clipboard with a notepad", "aceofnet", "fTM-hp2q3Cs"),
  storeDisplay: p("1601600576337-c1d8a0d1373c", "Assorted products on display in a store", "Eduardo Soares", "e4EmPx91Aj4"),
  storeShelf: p("1631856954913-c751a44490ec", "Store shelf filled with different items", "Oxana Melis", "KzT5IWf0yHQ"),
  // Categories
  electronics: p("1725832533422-7b225e601e9c", "Table of electronics and boxes", "Yuri Krupenin", "AaffVi9CVoo"),
  homeKitchen: p("1556909212-d5b604d0c90d", "Cooking pots and a pepper mill", "Becca Tapert", "sY5RjMB1KkE"),
  blender: p("1570222094114-d054a817e56b", "Countertop blender", "Daniel Norris", "ZN_86cZrSN0"),
  apparel: p("1532453288672-3a27e9be9efd", "Rack of assorted shirts", "Marcus Loke", "xXJ6utyoSw0"),
  tools: p("1426927308491-6380b6a9936f", "Hand tools hanging on a tool rack", "Barn Images", "t5YUoHW6zRo"),
  carpentryTools: p("1567361808960-dec9cb578182", "Carpentry tools on a workbench", "Louis Hansel", "Rf9eElW3Qxo"),
  hammer: p("1581783898377-1c85bf937427", "Hammer and screwdriver", "Julie Molliver", "Z3vFp7szCAY"),
  toys: p("1558060370-d644479cb6f7", "Assorted colourful toys on a table", "Huy Hung Trinh", "zoyBqT7ytLU"),
  woodenTrain: p("1596461404969-9ae70f2830c1", "Wooden toy train set", "Jerry Wang", "qBrF1yu5Wys"),
  beauty: p("1598440947619-2c35fc9aa908", "Skincare products and a jade roller", "michela ampolo", "7tDGb3HrITg"),
  cosmetics: p("1583209814683-c023dd293cc6", "Pink cosmetic containers and a brush", "pmv chamara", "dMjkQJs58uo"),
  lotion: p("1620916566398-39f1143ab7be", "Tube of body lotion", "Mathilde Langevin", "p3O5f4u95Lo"),
  furniture: p("1592078615290-033ee584e267", "Wooden chair", "Suchit Poojari", "ljRiZl00n18"),
  armchair: p("1505843490538-5133c6c7d0e1", "White wooden armchair", "Dillon Mangum", "9489sFfgk4c"),
  // Added to keep every marketing slot unique
  sweaters: p("1582719188393-bb71ca45dbb9", "Rows of colourful sweaters on a clothing rack", "Markus Winkler", "PQmXUxmfR44"),
  deviceTable: p("1730967844913-29eb5cae5f34", "Electronic devices laid out on a table", "Jakub Żerdzicki", "uxYLtGRyGKQ"),
  metalTool: p("1611288875785-f62fb9b044a7", "Hands holding a metal repair tool", "Recha Oktaviani", "5tYUk7sZzqc"),
  baubles: p("1482517967863-00e15c9b44be", "Baubles on a holiday tree", "Chad Madden", "SUTfFCAHV_A"),
  cardboardLot: p("1507560461415-997cd00bfd45", "Flattened cardboard boxes", "Jon Moore", "1PxGp8kkQyk"),
  boxStackBrown: p("1624137527136-66e631bdaa0e", "Stack of brown cardboard boxes", "Kadarius Seegars", "DevJkLB3hWE"),
  boxesLeaning: p("1562534315-64dba645d0f9", "Boxes leaning on a cardboard box", "Matthew Hamilton", "twWIq9MxPRg"),
  truckField: p("1694113372786-2553caec0c76", "Truck driving past green fields", "Artem Balashevsky", "C-y-iAXoY_M"),
  emptyShelves: p("1584568694489-f71bdbac55e2", "Empty store shelves waiting for stock", "Mick Haupt", "VE9DQ7zm22Y"),
  shelfBoxes: p("1606824722920-4c652a70f348", "Labelled boxes on store shelves", "Egor Litvinov", "ncKxCn5SI3A"),
  twoPhones: p("1524226108234-3cccbbbfa86d", "Two smartphones on a white table", "Steve A Johnson", "f-gxmsZlj9c"),
  clawHammer: p("1586864387789-628af9feed72", "Claw hammer", "iMattSmart", "sm0Bkoj5bnA"),
  yellowTruck: p("1605705658744-45f0fe8f9663", "Yellow truck parked beside trees", "Nur Alamin", "xifUN_Mkf8Y"),
  warehouseBig: p("1675388773022-e82caedee672", "Large warehouse filled with boxes", "william wang", "B4ojJGZPO98"),
  warehouseWide: p("1672552226686-17ae189fbf2c", "Wide view of a warehouse full of boxes", "Arum Visuals", "k16Uqg-WK64"),
  vanBoxes: p("1580674285054-bed31e145f59", "Shipping boxes stacked in a delivery van", "Claudio Schwarz", "q8kR_ie6WnI"),
  recycleBox: p("1654078054613-a56cfcabdb84", "Cardboard box with a recycling symbol", "Ochir-Erdene Oyunmedeg", "nHVrk02meXs"),
  boxesOnPallets: p("1528323273322-d81458248d40", "Assorted boxes on wooden pallets", "Alfonso Navarro", "qph7tJfcDys"),
  // v0.8 departments (category cards and lot stock photos)
  tvOn: p("1560169897-fc0cdbdfa4d5", "Flat-screen TV switched on", "Glenn Carstens-Peters", "EOQhsfFBhRk"),
  tvOff: p("1567690187548-f07b1d7bf5a9", "Wall-mounted flat-screen TV", "Dario", "KzGhmrQmB6I"),
  tvBlack: p("1509281373149-e957c6296406", "Black television on a stand", "Ajeet Mestry", "UBhpOIHnazM"),
  laptopDesk: p("1541807084-5c52b6b3adef", "Open laptop on a wooden desk", "Howard Bouchevereau", "RSCirJ70NDM"),
  laptopTable: p("1496181133206-80ce9b88a853", "Laptop on a brown table", "Kari Shea", "1SAnrIxw5OY"),
  laptopBed: p("1649972904349-6e44c42644a7", "Person working on a laptop", "Surface", "xSiQBSq-I0M"),
  phoneHand: p("1592890288564-76628a30a657", "Hand holding a black smartphone", "Jonas Leupe", "wK-elt11pF0"),
  phoneWhite: p("1512428559087-560fa5ceab42", "Hand holding a white smartphone", "NordWood Themes", "q8U1YgBaRQk"),
  phoneScreen: p("1598327105666-5b89351aff97", "Smartphone home screen", "Shiwa ID", "Uae7ouMw91A"),
  controllerNeon: p("1612287230202-1ff1d85d1bdf", "Wireless game controller under coloured light", "Javier Martínez", "hUD0PUczwJQ"),
  controllerWood: p("1552820728-8b83bb6b773f", "Game controller on a wooden surface", "Alexey Savchenko", "k4Akpt5-Sfk"),
  controllerHand: p("1509198397868-475647b2a1e5", "White game controller held in a hand", "Nikita Kachanovsky", "FJFPuE1MAOM"),
  washer: p("1626806787461-102c1bfaaea1", "White front-load washing machine", "PlanetCare", "5cpBWEl6y6c"),
  washerCabinet: p("1622473590925-e3616c0a41bf", "Front-load washer beside a cabinet", "Raychan", "vkpVPcIBU5U"),
  fridge: p("1630459065645-549fe5a56db4", "Black top-mount refrigerator", "Erik Mclean", "xK8QreBEjcc"),
  sneakersPastel: p("1595950653106-6c9ebd614d3a", "Pastel sneakers with white laces", "Ryan Plomp", "jvoZ-Aux9aw"),
  sneakersBox: p("1560769629-975ec94e6a86", "Athletic shoes on a shoe box", "Irene Kredenets", "dwKiHoqqxk8"),
  handbagRed: p("1584917865442-de89df76afd3", "Red leather handbag", "Arno Senoner", "oCXVxwTFwqE"),
  handbagBrown: p("1590874103328-eac38a683ce7", "Brown leather handbag on a table", "Arno Senoner", "ZT16YkAYueo"),
  handbagBlack: p("1705909237050-7a7625b47fac", "Black leather bag", "Mobina Ghazazani", "lnbuoKz2GlM"),
  watch: p("1523170335258-f5ed11844a49", "Analog wristwatch", "John Torcasio", "TJrkkhdB39E"),
  necklaces: p("1599643478518-a784e5dc4c8f", "Two gold necklaces with pendants", "Andres Vera", "202NAwjisYA"),
  rings: p("1543294001-f7cd5d7fb516", "Three gold rings", "Cornelia Ng", "zZLhoEwGCeM"),
  perfumeBlack: p("1594035910387-fea47794261f", "Black and gold perfume bottle", "Laura Chouette", "4sKdeIMiFEI"),
  perfumeClear: p("1458538977777-0549b2370168", "Clear perfume bottle", "Jessica Weiller", "So4eFi-d1nc"),
  sprayBottle: p("1563453392212-326f5e854473", "Hand holding a cleaning spray bottle", "JESHOOTS.COM", "__ZMnefoI3k"),
  sprayBottles: p("1528740561666-dc2479dc08ab", "Two spray bottles on a table", "Daiga Ellaby", "uooMllXe6gE"),
  paperRolls: p("1631524254770-03abe3f42a0d", "Pile of toilet paper rolls", "colourblindkevin.art", "jEMcrcWSf3M"),
  paperRoll: p("1584556812952-905ffd0c611a", "Paper roll on a wooden table", "Erik Mclean", "Sss9uGhSiPw"),
  snackAisle: p("1688217170693-e821c6e18d72", "Store display full of snacks", "Di Weng", "2lu4hpLgBxY"),
  pantryShelf: p("1585341840941-98553e474d84", "Packaged food on a shelf", "Estera", "5HgdQjUdYpc"),
  coffeeSack: p("1524350876685-274059332603", "Coffee beans in a sack", "Tina Guina", "obV_LM0KjxY"),
  sportsCards: p("1551306683-9e7cf1661af1", "Baseball trading cards on a table", "Mick Haupt", "AOyR7aMFHyU"),
  toyCar: p("1780675625636-1ebb87b66aed", "Vintage red toy car", "Defrino Maasy", "tMFu8QOifyo"),
  fishingReel: p("1593442998882-7cb49031174b", "Fishing reel", "Harrison Kugler", "YLLhafrInyI"),
  fishingRod: p("1566014727723-20aa739a7b11", "Fishing rod", "Matthew McBrayer", "GcGz0yYy3bg"),
  tent: p("1504280390367-361c6d9f38f4", "Orange camping tent among trees", "Scott Goodwill", "y8Ngwq34_Ak"),
  dumbbellRack: p("1576678927484-cc907957088c", "Row of dumbbells on a rack", "Samuel Girven", "VJ2s0c20qCo"),
  dumbbells: p("1638536532686-d610adfc8e5c", "Pair of black dumbbells", "VD Photography", "H-qxKCedhcc"),
  tirePile: p("1578844251758-2f71da64c96f", "Piles of car tires", "Robert Laursoo", "WHPOFFzY9gU"),
  tires: p("1571335746824-742511d49bce", "Four vehicle tires", "Shadrach Warid", "-gqb3xbGa5Y"),
  engine: p("1663642775693-6628f65358be", "Car engine bay", "Manuel E Sankitts", "i2kOA2p0DTo"),
  firewood: p("1571040195944-85a412548a43", "Stack of firewood", "Andreas Pajuvirta", "VfJ600bfjdc"),
  jackOLantern: p("1509558567730-6c838437b06b", "Lit jack-o'-lantern", "Quilia", "ASNSoeead70"),
  mower: p("1458245201577-fc8a130b8829", "Lawn mower on grass", "Daniel Watson", "8vBpYpTGo90"),
  pushMower: p("1590820292118-e256c3ac2676", "Push lawn mower on grass", "Andres Siimon", "zfwyrIA6bFw"),
} satisfies Record<string, StockPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

export const CATEGORY_PHOTOS: Record<string, PhotoKey> = {
  "phones-computers": "laptopDesk",
  "tvs-home-theater": "tvOn",
  "video-games": "controllerNeon",
  appliances: "washer",
  shoes: "sneakersPastel",
  "accessories-jewelry": "handbagBrown",
  "household-essentials": "sprayBottles",
  "grocery-beverages": "snackAisle",
  collectibles: "sportsCards",
  "sports-outdoors": "tent",
  seasonal: "baubles",
  automotive: "tirePile",
  "warehouse-industrial": "forklift",
  electronics: "electronics",
  "home-kitchen": "homeKitchen",
  apparel: "apparel",
  "tools-hardware": "tools",
  "toys-baby": "toys",
  "health-beauty": "beauty",
  furniture: "furniture",
  "general-merchandise": "warehouseBoxes",
};
/** Secondary image for category page heroes. */
export const CATEGORY_HERO_PHOTOS: Record<string, PhotoKey> = {
  "phones-computers": "phoneHand",
  "tvs-home-theater": "tvOff",
  "video-games": "controllerWood",
  appliances: "fridge",
  shoes: "sneakersBox",
  "accessories-jewelry": "watch",
  "household-essentials": "paperRolls",
  "grocery-beverages": "pantryShelf",
  collectibles: "toyCar",
  "sports-outdoors": "fishingReel",
  seasonal: "jackOLantern",
  automotive: "engine",
  "warehouse-industrial": "woodenPallets",
  electronics: "openBox",
  "home-kitchen": "blender",
  apparel: "sweaters",
  "tools-hardware": "carpentryTools",
  "toys-baby": "woodenTrain",
  "health-beauty": "cosmetics",
  furniture: "armchair",
  "general-merchandise": "warehouseBoxes2",
};

export const BLOG_PHOTOS: Record<string, PhotoKey> = {
  "liquidation-myths-vs-facts": "warehouseBig",
  "how-to-read-a-manifest": "checklist",
  "buying-strategy": "clipboard",
  "ltl-freight-101": "truckField",
  "liquidation-and-sustainability": "recycleBox",
  "first-pallet-checklist": "cardboardLot",
  "returns-vs-shelf-pulls": "boxesOnShelf",
  "q4-market-report-2026": "shelfBoxes",
  "electronics-sell-through": "deviceTable",
  "bin-store-from-zero": "emptyShelves",
};

export const GUIDE_PHOTOS: Record<string, PhotoKey> = {
  "bin-stores": "storeShelf",
  "online-resellers": "loadingVan",
  "discount-stores": "storeDisplay",
  "flea-market-vendors": "hammer",
  refurbishers: "metalTool",
  exporters: "truckCity",
};

export const COLLECTION_PHOTOS: Record<string, PhotoKey> = {
  "bin-store-starter": "boxStackBrown",
  "under-1000": "boxesLeaning",
  "brand-new-overstock": "boxesOnRacks",
  truckloads: "yellowTruck",
  "flip-ready-electronics": "twoPhones",
  "repair-and-refurb": "clawHammer",
  "holiday-ready": "baubles",
  "staff-picks": "shelvingBoxes",
};

/**
 * Stock photos for lots that don't have real photos yet (always labelled "Stock photo" on screen).
 * Matched to the lot title by keywords; each topic has three photos and lots rotate through them,
 * so two lots with the same kind of goods still get different cover photos.
 */
const lp = (id: string, alt: string, by: string, page: string) => p(id, alt, by, page);
export const LOT_TOPICS: { keywords: RegExp; photos: StockPhoto[] }[] = [
  // Department-specific topics first (v0.8), so e.g. "video game controllers" doesn't fall into the toy topic.
  { keywords: /\btvs?\b|television|home theater|soundbar|projector/i, photos: [PHOTOS.tvOn, PHOTOS.tvOff, PHOTOS.tvBlack] },
  { keywords: /laptop|notebook|chromebook|computer|pc monitor|\btablets?\b/i, photos: [PHOTOS.laptopDesk, PHOTOS.laptopTable, PHOTOS.laptopBed] },
  { keywords: /smartphone|cell ?phone|unlocked phone/i, photos: [PHOTOS.phoneHand, PHOTOS.phoneWhite, PHOTOS.phoneScreen] },
  { keywords: /video game|console|controller|gaming/i, photos: [PHOTOS.controllerNeon, PHOTOS.controllerWood, PHOTOS.controllerHand] },
  { keywords: /washer|dryer|refrigerator|fridge|freezer|dishwasher|large appliance|major appliance|\brange\b/i, photos: [PHOTOS.washer, PHOTOS.fridge, PHOTOS.washerCabinet] },
  { keywords: /handbag|purse|wallet|tote/i, photos: [PHOTOS.handbagBrown, PHOTOS.handbagRed, PHOTOS.handbagBlack] },
  { keywords: /watch|jewel|necklace|earring|\brings?\b|bracelet|sunglass/i, photos: [PHOTOS.watch, PHOTOS.necklaces, PHOTOS.rings] },
  { keywords: /fragrance|perfume|cologne/i, photos: [PHOTOS.perfumeBlack, PHOTOS.perfumeClear] },
  { keywords: /paper towel|toilet paper|tissue|paper goods|wipes|diaper|incontinence/i, photos: [PHOTOS.paperRolls, PHOTOS.paperRoll] },
  { keywords: /detergent|cleaning|laundry|household essential|sanitizer|trash bag/i, photos: [PHOTOS.sprayBottles, PHOTOS.sprayBottle] },
  { keywords: /snack|grocery|pantry|candy|beverage|soft drink|coffee & tea|ground coffee|pet food/i, photos: [PHOTOS.snackAisle, PHOTOS.pantryShelf, PHOTOS.coffeeSack] },
  { keywords: /trading card|collectible|die-cast|memorabilia|figure/i, photos: [PHOTOS.sportsCards, PHOTOS.toyCar] },
  { keywords: /fishing|camping|tent|hiking|hunting/i, photos: [PHOTOS.tent, PHOTOS.fishingReel, PHOTOS.fishingRod] },
  { keywords: /fitness|dumbbell|\bgym\b|exercise|kettlebell/i, photos: [PHOTOS.dumbbellRack, PHOTOS.dumbbells] },
  { keywords: /\btires?\b|wheels|\brims?\b|automotive|auto parts|car parts/i, photos: [PHOTOS.tirePile, PHOTOS.tires, PHOTOS.engine] },
  { keywords: /firewood|pellets?\b|charcoal/i, photos: [PHOTOS.firewood] },
  { keywords: /pallet jack|material handling|racking|shelving|empty pallets|forklift/i, photos: [PHOTOS.forklift, PHOTOS.woodenPallets, PHOTOS.palletPile] },
  { keywords: /lawn|mower|string trimmer|hedge trimmer|leaf blower|outdoor power/i, photos: [PHOTOS.mower, PHOTOS.pushMower] },
  { keywords: /halloween/i, photos: [PHOTOS.jackOLantern, PHOTOS.baubles] },
  { keywords: /earbud|headphone|audio|speaker/i, photos: [
    lp("1606220588913-b3aacb4d2f46", "Black and blue wireless earbuds", "TheRegisti", "qt9_OfTaaeY"),
    lp("1505740420928-5e560c06d30e", "Wireless headphones flat lay", "C D-X", "PDX_a_82obo"),
    lp("1578319439584-104c94d37305", "Black wireless earphones", "Roger Cai", "HuTUDQqr88c"),
  ] },
  { keywords: /smart home|smart plug|smart bulb|doorbell|camera/i, photos: [
    lp("1532007271951-c487760934ae", "White smart LED bulb", "Federico Bottos", "TuAtSs8peoM"),
    lp("1707733260992-73ff6dbed163", "Phone controlling a smart light switch", "Jakub Żerdzicki", "We56jns_zLE"),
    lp("1674659719067-8735479ba10c", "Smart light bulb on a table", "Ian Talmacs", "iEDKPLfJrEo"),
  ] },
  { keywords: /phone|charger|cable|power bank|accessor/i, photos: [
    lp("1557767382-97b28f5488e7", "Smartphone with charging cable connected", "Andreas Haslinger", "W9Z87k4hV08"),
    lp("1572721546624-05bf65ad7679", "Bundle of orange USB cables", "Lucian Alexe", "yh0UtueiZ-I"),
    lp("1603539444875-76e7684265f6", "White USB charging cable", "Solen Feyissa", "115YGe1M28I"),
  ] },
  { keywords: /appliance|air fryer|blender|coffee|kettle|toaster/i, photos: [
    lp("1608354580875-30bd4168b351", "Black and silver drip coffee maker", "Nathan Dumlao", "xPSBoaJNs2g"),
    lp("1630617867674-3905ea203152", "Black and silver electric kettle", "Nancy Hughes", "mdrDZpt1RrA"),
    lp("1618506408870-64d8bec48248", "Stainless steel toaster", "Quilia", "G_GWtt1tiUs"),
  ] },
  { keywords: /cookware|bakeware|\bpans?\b|\bpots?\b|utensil/i, photos: [
    lp("1556911164-1297abe8527c", "Orange enamel cookware set", "Jason Briscoe", "PkkLkjJdUZw"),
    lp("1584990347193-6bebebfeaeee", "Three stainless steel cooking pots", "Cooker King", "AOVtEuU9UGc"),
    lp("1518291344630-4857135fb581", "Frying pan beside tomatoes", "Icons8 Team", "seDjj4dmC9s"),
  ] },
  { keywords: /decor|pillow|lamp|mirror/i, photos: [
    lp("1531592762598-58a792d73aed", "Throw pillows on a sofa", "DESIGNECOLOGIST", "40NvXW1VPyQ"),
    lp("1592195985871-2d326ada5d51", "Green and white table lamp", "wu yi", "lfkos4iarZA"),
    lp("1579888028917-47462bb03ca9", "Clear glass table lamp", "Kari Shea", "heISypiCno4"),
  ] },
  { keywords: /activewear|legging|athletic|sportswear|hoodie/i, photos: [
    lp("1523654999808-59842135e652", "Black and grey athletic pants", "Hey Beauti Magazine", "xn2Zh8b4yqw"),
    lp("1626026397008-3316047db4fc", "Black leggings and white tank top on a yoga mat", "Katerina May", "K_w5UNRxh-8"),
    lp("1618355281951-a174b87198e2", "Black leggings and long-sleeve top", "Ryan Hoffman", "Y_oWhp2dqMY"),
  ] },
  { keywords: /footwear|shoe|sneaker|boot/i, photos: [
    lp("1595950653106-6c9ebd614d3a", "Pastel sneakers", "Ryan Plomp", "jvoZ-Aux9aw"),
    lp("1560769629-975ec94e6a86", "White and orange athletic shoes", "Irene Kredenets", "dwKiHoqqxk8"),
    lp("1608231387042-66d1773070a5", "White sneaker on a dark background", "The DK Photography", "NUoPWImmjCU"),
  ] },
  { keywords: /power tool|drill|driver|cordless/i, photos: [
    lp("1622044939413-0b829c342434", "Green cordless drill", "Jonathan Cooper", "7sZwThSntdw"),
    lp("1504148455328-c376907d081c", "Red cordless power drill", "Quilia", "CuDoRFyTkAQ"),
    lp("1632095710940-ad578e8cbe6b", "Hand holding a cordless drill", "Sean", "XolHGHlwy7Q"),
  ] },
  { keywords: /hand tool|tool storage|socket|wrench|tool/i, photos: [
    lp("1581166397057-235af2b3c6dd", "Red and silver hand tool", "Elena Rouame", "9JU2CKqtw0M"),
    lp("1671040690726-b78261eff126", "Hand tools hanging on a wall", "Anton Savinov", "2Qlj2Gaft7w"),
    lp("1508873535684-277a3cbcc4e8", "Four hand tools on a board", "Hunter Haley", "s8OO2-t-HmQ"),
  ] },
  { keywords: /toy|game|puzzle/i, photos: [
    lp("1629760946220-5693ee4c46ac", "Board game pieces and dice", "Nik Korba", "3WceTBlUoMs"),
    lp("1545558014-8692077e9b5c", "Multicoloured learning toys", "Xavi Cabrera", "gDiRwIYAMA8"),
    lp("1611996575749-79a3a250f948", "Colourful letter cubes spelling GAME", "Andrey Metelev", "DEuansgqjns"),
  ] },
  { keywords: /nursery|baby|crib|infant/i, photos: [
    lp("1543346242-2b8e41fb91ca", "White sheep baby mobile", "charlesdeluvio", "2vfwTakDTIo"),
    lp("1505043203398-7e4c111acbfa", "White crib mobile", "insung yoon", "iioAHjNYA_o"),
    lp("1642685464968-5d85bb7cffe0", "Crib with a white pillow", "Jenna Duxbury", "KZ7cfMnSDh8"),
  ] },
  { keywords: /beauty|cosmetic|makeup|lipstick/i, photos: [
    lp("1571646034647-52e6ea84b28c", "Five lipsticks in assorted colours", "Marek Studzinski", "mzstXkKH8DI"),
    lp("1512496015851-a90fb38ba796", "Assorted cosmetics close-up", "Jazmin Quaynor", "FoeIOgztCXo"),
    lp("1596462502278-27bfdc403348", "Makeup brush set", "Shamblen Studios", "xwM61TPMlYk"),
  ] },
  { keywords: /personal care|toothbrush|trimmer|grooming/i, photos: [
    lp("1559671216-bda69517c47f", "Four electric toothbrushes", "Goby", "zHMpGLOD8nI"),
    lp("1575325342632-92615b50d3e2", "Two white electric toothbrushes", "Goby", "7fqy0iDE5e8"),
    lp("1641130331708-dd0cc94ae8e5", "Electric toothbrush on a travel case", "Cosmin Ursea", "WhNaHxPE934"),
  ] },
  { keywords: /office|desk|chair|bookshelf/i, photos: [
    lp("1612372606404-0ab33e7187ee", "Rolling office chair beside a plant", "Kelly Sikkema", "Pvse_0mSm6Y"),
    lp("1688578735352-9a6f2ac3b70a", "Grey office chair next to a desk", "EFFYDESK", "7mfNpV5eJH0"),
    lp("1594235048794-fae8583a5af5", "Black office chairs around a table", "Uneebo Office Design", "UgYT5nkXdK4"),
  ] },
  { keywords: /patio|outdoor|garden/i, photos: [
    lp("1623625434531-d130448273c1", "Wicker patio chairs and table", "Alen Rojnić", "jDlTJSrjlgI"),
    lp("1613317447829-eea2ed59640f", "Black metal bistro table and chairs", "David Hunter", "M9gGS4ggbq4"),
    lp("1602860739945-9a61573cd62d", "Wooden outdoor table and chairs", "Arcwind", "-OKp-rhSWE4"),
  ] },
  { keywords: /seasonal|holiday|christmas|halloween/i, photos: [
    lp("1545048702-79362596cdc9", "Assorted holiday ornaments", "JESHOOTS.COM", "7VOyZ0-iO0o"),
    lp("1511268011861-691ed210aae8", "Holiday wreath on a red background", "Toni Cuenca", "CvFARq2qu8Y"),
    lp("1576919228236-a097c32a5cd4", "Red bauble", "Markus Spiske", "B40ztSGQTZY"),
  ] },
  { keywords: /returns|truckload|general|assorted|mixed|big-box/i, photos: [
    lp("1700165644892-3dd6b67b25bc", "Open brown cardboard boxes", "Luke Heibert", "gthSas4oYC0"),
    lp("1766040923580-16ad32fae8b4", "Large pile of taped cardboard boxes", "Rohit Choudhari", "qO2ztAz5g7A"),
    lp("1513672494107-cd9d848a383e", "Cardboard box lot", "CHUTTERSNAP", "fyaTq-fIlro"),
  ] },
];

/** Fallback when a title matches no topic: category photos (only used for lots you create without photos). */
export const CATEGORY_POOLS: Record<string, PhotoKey[]> = {
  "phones-computers": ["laptopDesk", "phoneHand", "laptopTable", "phoneWhite"],
  "tvs-home-theater": ["tvOn", "tvOff", "tvBlack"],
  "video-games": ["controllerNeon", "controllerWood", "controllerHand"],
  appliances: ["washer", "fridge", "washerCabinet"],
  shoes: ["sneakersPastel", "sneakersBox"],
  "accessories-jewelry": ["handbagBrown", "watch", "necklaces", "handbagRed"],
  "household-essentials": ["sprayBottles", "paperRolls", "sprayBottle"],
  "grocery-beverages": ["snackAisle", "pantryShelf", "coffeeSack"],
  collectibles: ["sportsCards", "toyCar"],
  "sports-outdoors": ["tent", "fishingReel", "dumbbellRack"],
  seasonal: ["baubles", "jackOLantern"],
  automotive: ["tirePile", "engine", "tires"],
  "warehouse-industrial": ["forklift", "woodenPallets", "palletPile"],
  electronics: ["electronics", "openBox"],
  "home-kitchen": ["homeKitchen", "blender"],
  apparel: ["apparel"],
  "tools-hardware": ["tools", "carpentryTools", "hammer"],
  "toys-baby": ["toys", "woodenTrain"],
  "health-beauty": ["beauty", "cosmetics", "lotion"],
  furniture: ["furniture", "armchair"],
  "general-merchandise": ["warehouseBoxes", "warehouseBoxes2", "boxLot", "boxStack"],
};

export const LOT_SIZE_PHOTOS: Record<string, PhotoKey> = { CASE: "boxLot", PALLET: "woodenPallets", TRUCKLOAD: "semiTruck" };

const FALLBACKS: PhotoKey[] = ["warehouseBoxes", "shelving", "boxStack", "forklift", "shelvingBoxes", "warehouseBoxes2"];

/** Stable pick for anything without an explicit mapping (guides, collections, new posts). */
export function photoFor(key: string, map?: Record<string, PhotoKey>): StockPhoto {
  return PHOTOS[photoKeyFor(key, map)];
}

/** Same as photoFor, but returns the photo key (an image ref usable with <SiteImage>). */
export function photoKeyFor(key: string, map?: Record<string, PhotoKey>): PhotoKey {
  const k = map?.[key];
  if (k) return k;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
}

/** CDN URL for a stock photo. With `ratio` (width / height) the CDN crops to that aspect so the file matches its slot. */
export function photoSrc(photo: StockPhoto, width = 800, ratio?: number) {
  if (process.env.NEXT_PUBLIC_LOCAL_PHOTOS === "1") return `/images/stock/${photo.id}.jpg`;
  const h = ratio ? `&h=${Math.round(width / ratio)}` : "";
  return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=${width}${h}&q=70`;
}
