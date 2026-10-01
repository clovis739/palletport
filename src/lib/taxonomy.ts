/**
 * The standard PalletPort catalogue structure: department groups → categories → subcategories.
 *
 * Pure data (no server imports), shared by the seed, the admin ("Categories → Add missing standard categories")
 * and the storefront menus. The database is the source of truth once categories exist: the owner can rename,
 * reorder, hide or add categories in Admin → Categories, and syncing this list only ADDS what's missing
 * (matched by slug); it never renames, moves or deletes anything.
 *
 * Rules that keep the catalogue easy to maintain:
 * - Slugs are permanent (they're in URLs). Rename freely, but don't change a slug once lots are listed.
 * - A lot has ONE category and at most one subcategory. Brands live on the lot (`Lot.brand`), not in the tree,
 *   so "DeWALT" is a filter inside Power Tools rather than a subcategory of its own.
 * - Named sources (e.g. a specific retailer's returns) go in the lot's Source field, not in the tree.
 * - Subcategory slugs are prefixed with the category slug so they stay unique across the site.
 */

export type TaxonomySub = { name: string; slug: string };
export type TaxonomyCategory = { name: string; slug: string; group: string; blurb: string; hue: number; subs: TaxonomySub[] };

/** Department groups, in menu order. Category.group holds one of these labels (free text is allowed too). */
export const CATEGORY_GROUPS = [
  "Electronics & Tech",
  "Home & Living",
  "Fashion & Beauty",
  "Everyday & Bulk",
  "Hobbies & Family",
  "Tools, Auto & Industrial",
] as const;

const sub = (cat: string, name: string, slug?: string): TaxonomySub => ({ name, slug: `${cat}-${slug ?? slugifyName(name)}` });

function slugifyName(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const cat = (
  slug: string,
  name: string,
  group: (typeof CATEGORY_GROUPS)[number],
  hue: number,
  blurb: string,
  subs: (string | [string, string])[],
): TaxonomyCategory => ({
  slug,
  name,
  group,
  hue,
  blurb,
  subs: subs.map((s) => (Array.isArray(s) ? sub(slug, s[0], s[1]) : sub(slug, s))),
});

/**
 * Order here = default menu order. Existing subcategory slugs from earlier versions are kept (the second
 * element of a tuple) so old links keep working.
 */
export const TAXONOMY: TaxonomyCategory[] = [
  // ---------- Electronics & Tech
  cat("phones-computers", "Phones & Computers", "Electronics & Tech", 205, "Smartphones, laptops, tablets and accessories", [
    "Smartphones",
    "Laptops",
    "Tablets & E-readers",
    "Desktops & Monitors",
    "Computer Accessories",
    ["Phone Accessories", "accessories"],
  ]),
  cat("tvs-home-theater", "TVs & Home Theater", "Electronics & Tech", 225, "Televisions, soundbars, projectors and mounts", [
    "Televisions",
    "Soundbars & Home Audio",
    "Projectors & Streaming",
    "TV Mounts & Accessories",
  ]),
  cat("video-games", "Video Games", "Electronics & Tech", 262, "Consoles, games, controllers and gaming gear", [
    "Consoles",
    "Games",
    "Controllers & Accessories",
    "Gaming Headsets & Chairs",
  ]),
  cat("electronics", "Electronics", "Electronics & Tech", 215, "Audio, smart home, cameras, wearables", [
    ["Audio & Headphones", "audio"],
    "Smart Home",
    "Cameras & Drones",
    "Wearables",
    "Mixed Electronics",
  ]),

  // ---------- Home & Living
  cat("appliances", "Appliances", "Home & Living", 190, "Refrigerators, laundry, ranges and home comfort", [
    "Refrigerators & Freezers",
    "Washers & Dryers",
    "Ranges & Cooktops",
    "Dishwashers",
    "Microwaves",
    "Air Conditioners & Heaters",
    "Vacuums & Floor Care",
  ]),
  cat("home-kitchen", "Home & Kitchen", "Home & Living", 24, "Cookware, small appliances, decor", [
    "Small Appliances",
    "Cookware",
    "Drinkware",
    "Home Decor",
    "Bedding & Bath",
    "Storage & Organization",
  ]),
  cat("furniture", "Furniture", "Home & Living", 90, "Office, living room, bedroom and patio", [
    "Office",
    "Living Room",
    "Bedroom & Mattresses",
    "Patio & Outdoor",
  ]),

  // ---------- Fashion & Beauty
  cat("apparel", "Clothing", "Fashion & Beauty", 330, "Women's, men's and kids' clothing by the case or pallet", [
    "Women's Clothing",
    "Men's Clothing",
    "Kids Clothing",
    "Activewear",
    "Department Store Apparel",
    "Mixed Apparel",
  ]),
  cat("shoes", "Shoes", "Fashion & Beauty", 345, "Sneakers, boots and dress shoes for all ages", [
    "Athletic & Sneakers",
    "Women's Shoes",
    "Men's Shoes",
    "Kids Shoes",
    "Boots",
    "Sandals & Slides",
  ]),
  cat("accessories-jewelry", "Accessories & Jewelry", "Fashion & Beauty", 300, "Handbags, watches, jewelry, sunglasses and hats", [
    "Handbags & Wallets",
    "Watches",
    "Jewelry",
    "Sunglasses",
    "Hats & Cold Weather",
    "Backpacks & Luggage",
  ]),
  cat("health-beauty", "Health & Beauty", "Fashion & Beauty", 160, "Cosmetics, skincare, fragrance and personal care", [
    "Cosmetics",
    "Skincare",
    ["Hair Care & Tools", "hair-tools"],
    "Fragrance",
    "Bath & Body",
    "Personal Care",
  ]),

  // ---------- Everyday & Bulk
  cat("household-essentials", "Household Essentials", "Everyday & Bulk", 175, "Cleaning, laundry, paper goods, diapers and linens", [
    "Laundry & Cleaning",
    "Paper Goods & Wipes",
    "Diapers & Baby Care",
    "Adult Care",
    "Towels & Linens",
    "Trash Bags & Food Storage",
  ]),
  cat("grocery-beverages", "Grocery & Beverages", "Everyday & Bulk", 38, "Snacks, pantry staples and soft drinks, with dates listed", [
    "Snacks & Candy",
    "Pantry Staples",
    "Beverages",
    "Coffee & Tea",
    "Pet Food & Supplies",
  ]),
  cat("general-merchandise", "General Merchandise", "Everyday & Bulk", 0, "Mixed truckload and pallet lots", [
    "Truckloads",
    "Mystery Mix",
    "Store Returns",
    "Overstock & Closeouts",
    "Bin Store Loads",
  ]),

  // ---------- Hobbies & Family
  cat("toys-baby", "Toys & Baby", "Hobbies & Family", 280, "Toys, games, nursery essentials", [
    "Toys & Games",
    "Nursery",
    "Outdoor Play",
    "Ride-ons & Bikes",
  ]),
  cat("collectibles", "Collectibles & Trading Cards", "Hobbies & Family", 48, "Sealed trading cards, figures and collector items", [
    "Trading Cards",
    "Collectible Figures",
    "Die-cast & Models",
    "Memorabilia",
  ]),
  cat("sports-outdoors", "Sports & Outdoors", "Hobbies & Family", 135, "Fitness, camping, fishing, hunting accessories and bikes", [
    "Fitness Equipment",
    "Camping & Hiking",
    "Fishing",
    "Hunting Accessories",
    "Bikes & Scooters",
    "Team Sports",
  ]),
  cat("seasonal", "Seasonal & Holiday", "Hobbies & Family", 12, "Christmas, Halloween, summer and back-to-school", [
    "Christmas",
    "Halloween",
    "Summer & Pool",
    "Back to School",
    "Party Supplies",
    "Mixed Seasonal",
  ]),

  // ---------- Tools, Auto & Industrial
  cat("tools-hardware", "Tools & Hardware", "Tools, Auto & Industrial", 45, "Power tools, hand tools, fixtures", [
    "Power Tools",
    "Hand Tools",
    "Outdoor Power Equipment",
    "Lighting & Electrical",
    "Plumbing",
    "Tool Storage",
  ]),
  cat("automotive", "Automotive", "Tools, Auto & Industrial", 0, "Parts, wheels and tires, car electronics and care", [
    "Parts & Accessories",
    "Wheels & Tires",
    "Car Electronics",
    "Car Care",
    "Garage & Shop",
  ]),
  cat("warehouse-industrial", "Warehouse & Industrial", "Tools, Auto & Industrial", 210, "Pallet jacks, racking, pallets, packaging and fuel", [
    "Material Handling",
    "Shelving & Racking",
    "Empty Pallets",
    "Packaging & Shipping Supplies",
    "Firewood, Pellets & Charcoal",
  ]),
];

/** Subcategories that moved to a different category in the v0.8 restructure: old slug → new category + new slug. */
export const MOVED_SUBCATEGORIES: Record<string, { category: string; slug: string }> = {
  "electronics-phone-accessories": { category: "phones-computers", slug: "phones-computers-accessories" },
  "electronics-computers-tablets": { category: "phones-computers", slug: "phones-computers-laptops" },
  "apparel-footwear": { category: "shoes", slug: "shoes-athletic-sneakers" },
  "apparel-bags-accessories": { category: "accessories-jewelry", slug: "accessories-jewelry-handbags-wallets" },
  "general-merchandise-seasonal": { category: "seasonal", slug: "seasonal-mixed-seasonal" },
};

export function taxonomyGroupIndex(group: string) {
  const i = (CATEGORY_GROUPS as readonly string[]).indexOf(group);
  return i === -1 ? CATEGORY_GROUPS.length : i;
}

/** Groups categories for menus, keeping each group's categories in their stored order. Empty groups are dropped. */
export function groupCategories<T extends { group: string }>(cats: T[]): { group: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const c of cats) {
    const g = c.group || "More";
    map.set(g, [...(map.get(g) ?? []), c]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => taxonomyGroupIndex(a) - taxonomyGroupIndex(b))
    .map(([group, items]) => ({ group, items }));
}
