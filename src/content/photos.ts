// Representative supplier photography, served from local verified image files.
// Legacy image keys remain stable for saved settings and content references.
import sourcePhotos from "./source-photos.json";
import { displayImage } from "@/lib/mediaUrls";

export type StockPhoto = {
  id: string;
  src: string;
  /** Verified Cloudinary copy; original local path stays available for audits. */
  cdnSrc?: string;
  sourceUrl: string;
  alt: string;
  by: string;
  page: string;
  width: number;
  height: number;
};

const sourceById = new Map(sourcePhotos.map(photo => [photo.id, photo]));
function supplierPhoto(id: string): StockPhoto {
  const photo = sourceById.get(id);
  if (!photo) throw new Error(`Missing supplier photo: ${id}`);
  return photo;
}
const SOURCE_LIBRARY = Object.fromEntries(sourcePhotos.map(photo => [`supplier_${photo.id}`, photo])) as Record<`supplier_${string}`, StockPhoto>;

export const PHOTOS = {
  ...SOURCE_LIBRARY,
  // Warehouse / brand
  heroWarehouse: supplierPhoto("09099e16272b55ce"),
  forklift: supplierPhoto("0ca89317e28c3ac8"),
  boxesOnRacks: supplierPhoto("1130831b8f3e6a8d"),
  warehouseBoxes: supplierPhoto("131d5e97e36cca2d"),
  warehouseBoxes2: supplierPhoto("14db572ae3c50069"),
  boxStack: supplierPhoto("19f59eedb40b8a98"),
  shelving: supplierPhoto("1a3147ca3770db24"),
  shelvingBoxes: supplierPhoto("22cbd24af6baab9f"),
  aisleTeam: supplierPhoto("22da2d4b0ba0afba"),
  woodenPallets: supplierPhoto("30077b694c5f33ad"),
  palletPile: supplierPhoto("f9dc6b544b25627d"),
  boxLot: supplierPhoto("326c8206296e9aa5"),
  boxesOnShelf: supplierPhoto("32cb1fe3d0ee1d0f"),
  openBox: supplierPhoto("b90ffb31e1ba4ad0"),
  // Freight
  semiTruck: supplierPhoto("cbe1f2241613915f"),
  freightTruck: supplierPhoto("6ceb8b997d43b42f"),
  loadingVan: supplierPhoto("36d6c4aa5421afe3"),
  truckCity: supplierPhoto("067f15382888b687"),
  // Buying / retail
  checklist: supplierPhoto("38e04b5c2b889269"),
  clipboard: supplierPhoto("3b8b075c49581161"),
  storeDisplay: supplierPhoto("3bfeb3b7741214ba"),
  storeShelf: supplierPhoto("3c65dbcbb78d2ff7"),
  // Categories
  electronics: supplierPhoto("2d783ab0bf7fef98"),
  homeKitchen: supplierPhoto("ad2bd79a07d2cad5"),
  blender: supplierPhoto("510216d687cdcdae"),
  apparel: supplierPhoto("81c3215840e7a6c4"),
  tools: supplierPhoto("df90be146dde014e"),
  carpentryTools: supplierPhoto("131d5e97e36cca2d"),
  hammer: supplierPhoto("19f59eedb40b8a98"),
  toys: supplierPhoto("2c3e618cd3f533c3"),
  woodenTrain: supplierPhoto("42dc91d83e9adab8"),
  beauty: supplierPhoto("4e8a65c8ec735933"),
  cosmetics: supplierPhoto("432fc77d4599801f"),
  lotion: supplierPhoto("62a35e648ed16799"),
  furniture: supplierPhoto("4b3aedd5d79061a2"),
  armchair: supplierPhoto("4b3aedd5d79061a2"),
  // Added to keep every marketing slot unique
  sweaters: supplierPhoto("b6b27fb04b74bc73"),
  deviceTable: supplierPhoto("eeb3b5ede4b443f1"),
  metalTool: supplierPhoto("86f3fff2f53f0dcf"),
  baubles: supplierPhoto("3d82c51315c6416d"),
  cardboardLot: supplierPhoto("645b12b284e411aa"),
  boxStackBrown: supplierPhoto("67b88ea1ccb355aa"),
  boxesLeaning: supplierPhoto("6b190a19790c0463"),
  truckField: supplierPhoto("2399b205d57957ce"),
  emptyShelves: supplierPhoto("755ced485d145761"),
  shelfBoxes: supplierPhoto("785f626603b5331a"),
  twoPhones: supplierPhoto("c665432c58e077d8"),
  clawHammer: supplierPhoto("ed53a5551fa982d6"),
  yellowTruck: supplierPhoto("59ee20baea37c4c3"),
  warehouseBig: supplierPhoto("835eed6cd6e7e39e"),
  warehouseWide: supplierPhoto("86f3fff2f53f0dcf"),
  vanBoxes: supplierPhoto("89eb00cf2886168c"),
  recycleBox: supplierPhoto("8a4071241a8affc8"),
  boxesOnPallets: supplierPhoto("8be33dbb60ecc955"),
  // v0.8 departments (category cards and lot stock photos)
  tvOn: supplierPhoto("fb75e668fa3116be"),
  tvOff: supplierPhoto("5f5f627d8b430b56"),
  tvBlack: supplierPhoto("5013fc1354288980"),
  laptopDesk: supplierPhoto("a2d912c9c37c1428"),
  laptopTable: supplierPhoto("857ce6f2340c80ae"),
  laptopBed: supplierPhoto("a7aa30897743676d"),
  phoneHand: supplierPhoto("9d58b795c2ccc07b"),
  phoneWhite: supplierPhoto("a6e720e7c3e7fdf7"),
  phoneScreen: supplierPhoto("adc0317cbcff4908"),
  controllerNeon: supplierPhoto("ba4a93268554f689"),
  controllerWood: supplierPhoto("e15aeafaa916a71d"),
  controllerHand: supplierPhoto("eaeffbc072494071"),
  washer: supplierPhoto("1a3147ca3770db24"),
  washerCabinet: supplierPhoto("aa76d4710971c9fb"),
  fridge: supplierPhoto("f65a7b066981a87c"),
  sneakersPastel: supplierPhoto("12882d531edb00f8"),
  sneakersBox: supplierPhoto("2a5fefb323e88da6"),
  handbagRed: supplierPhoto("f431ade6a4e448b9"),
  handbagBrown: supplierPhoto("26f622b7c0ce76bd"),
  handbagBlack: supplierPhoto("4356d461bcef3154"),
  watch: supplierPhoto("82d078e6286c2551"),
  necklaces: supplierPhoto("eee88fd51933c00a"),
  rings: supplierPhoto("eee88fd51933c00a"),
  perfumeBlack: supplierPhoto("e3270f353b5628b3"),
  perfumeClear: supplierPhoto("ef1ef677107b5ef4"),
  sprayBottle: supplierPhoto("755ced485d145761"),
  sprayBottles: supplierPhoto("82e9412332a599a5"),
  paperRolls: supplierPhoto("6ceb8b997d43b42f"),
  paperRoll: supplierPhoto("80bccd2851fad274"),
  snackAisle: supplierPhoto("e762ba4a14269022"),
  pantryShelf: supplierPhoto("091c1cc2d628e315"),
  coffeeSack: supplierPhoto("8a2c4fbaf9a6b7e7"),
  sportsCards: supplierPhoto("bc3fdabdf49e2979"),
  toyCar: supplierPhoto("c69ad5117e1ad14d"),
  fishingReel: supplierPhoto("9fdadf92704dda10"),
  fishingRod: supplierPhoto("b194441495ac90f2"),
  tent: supplierPhoto("4bf728630d351d83"),
  dumbbellRack: supplierPhoto("a824734f481ac7bf"),
  dumbbells: supplierPhoto("18e0e625db5b0b6b"),
  tirePile: supplierPhoto("91a3785c8edf13d3"),
  tires: supplierPhoto("ca824058802d200a"),
  engine: supplierPhoto("063cc6cd80fd73b4"),
  firewood: supplierPhoto("f7c9cc0a57147b61"),
  jackOLantern: supplierPhoto("48df0de6f86fee51"),
  mower: supplierPhoto("ba6c6d6847f009c8"),
  pushMower: supplierPhoto("ba6c6d6847f009c8"),
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
    supplierPhoto("bb0ee9a07d07f237"),
    supplierPhoto("c7c9a902ad405193"),
    supplierPhoto("bb0ee9a07d07f237"),
  ] },
  { keywords: /smart home|smart plug|smart bulb|doorbell|camera/i, photos: [
    supplierPhoto("645b12b284e411aa"),
    supplierPhoto("6b190a19790c0463"),
    supplierPhoto("6b87b46b7668d548"),
  ] },
  { keywords: /phone|charger|cable|power bank|accessor/i, photos: [
    supplierPhoto("d9835dabcf52a3f6"),
    supplierPhoto("fc0e8532d48e5369"),
    supplierPhoto("3f0d177d63c7480c"),
  ] },
  { keywords: /appliance|air fryer|blender|coffee|kettle|toaster/i, photos: [
    supplierPhoto("510216d687cdcdae"),
    supplierPhoto("67b88ea1ccb355aa"),
    supplierPhoto("8a4071241a8affc8"),
  ] },
  { keywords: /cookware|bakeware|\bpans?\b|\bpots?\b|utensil/i, photos: [
    supplierPhoto("d9b76fa6adf7a006"),
    supplierPhoto("ee5187d4a5c5ba50"),
    supplierPhoto("7871dad0ac8c5931"),
  ] },
  { keywords: /decor|pillow|lamp|mirror/i, photos: [
    supplierPhoto("1001a30ac0681a6e"),
    supplierPhoto("6ceb8b997d43b42f"),
    supplierPhoto("7603d294389a620d"),
  ] },
  { keywords: /activewear|legging|athletic|sportswear|hoodie/i, photos: [
    supplierPhoto("4bf830baa4c0eed7"),
    supplierPhoto("5ebfcb68bdd105c7"),
    supplierPhoto("e5609aedf389abc4"),
  ] },
  { keywords: /footwear|shoe|sneaker|boot/i, photos: [
    supplierPhoto("afb9b44aede3e77b"),
    supplierPhoto("b0e1b22b5aa2c597"),
    supplierPhoto("b3dbbbd01b5e1eec"),
  ] },
  { keywords: /power tool|drill|driver|cordless/i, photos: [
    supplierPhoto("ab0254021119c3f9"),
    supplierPhoto("da27d0a17242f692"),
    supplierPhoto("19f59eedb40b8a98"),
  ] },
  { keywords: /hand tool|tool storage|socket|wrench|tool/i, photos: [
    supplierPhoto("22da2d4b0ba0afba"),
    supplierPhoto("3c65dbcbb78d2ff7"),
    supplierPhoto("3c6f06ff6c6a8a3a"),
  ] },
  { keywords: /toy|game|puzzle/i, photos: [
    supplierPhoto("7a4a66589464f51a"),
    supplierPhoto("7da5f9277116dac6"),
    supplierPhoto("8080c60e2264ff08"),
  ] },
  { keywords: /nursery|baby|crib|infant/i, photos: [
    supplierPhoto("46963f39ba6d3df1"),
    supplierPhoto("48df0de6f86fee51"),
    supplierPhoto("1001a30ac0681a6e"),
  ] },
  { keywords: /beauty|cosmetic|makeup|lipstick/i, photos: [
    supplierPhoto("432fc77d4599801f"),
    supplierPhoto("66417461a9fc41b4"),
    supplierPhoto("8d9577a738f4f347"),
  ] },
  { keywords: /personal care|toothbrush|trimmer|grooming/i, photos: [
    supplierPhoto("62a35e648ed16799"),
    supplierPhoto("0964f4c6d0c49318"),
    supplierPhoto("62a35e648ed16799"),
  ] },
  { keywords: /office|desk|chair|bookshelf/i, photos: [
    supplierPhoto("97521e357a912505"),
    supplierPhoto("d539108232915839"),
    supplierPhoto("4b3aedd5d79061a2"),
  ] },
  { keywords: /patio|outdoor|garden/i, photos: [
    supplierPhoto("3c8b1059f4cf7cc6"),
    supplierPhoto("4b3aedd5d79061a2"),
    supplierPhoto("4b3aedd5d79061a2"),
  ] },
  { keywords: /seasonal|holiday|christmas|halloween/i, photos: [
    supplierPhoto("0514b492b3d9c10c"),
    supplierPhoto("0caaf3db7ba1cae1"),
    supplierPhoto("2ba405cfbae2f623"),
  ] },
  { keywords: /returns|truckload|general|assorted|mixed|big-box/i, photos: [
    supplierPhoto("7871dad0ac8c5931"),
    supplierPhoto("791065cbf0a1a419"),
    supplierPhoto("82e9412332a599a5"),
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

/** Local representative image. Layout cropping is handled by the image component. */
export function photoSrc(photo: StockPhoto, _width = 800, _ratio?: number) {
  return displayImage(photo.cdnSrc ?? photo.src, _width);
}
