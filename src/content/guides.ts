import type { Article } from "./types";

// Store-type guides: what to buy, by business model.
export const GUIDES: (Article & { collection?: string; categories: string[] })[] = [
  {
    slug: "bin-stores", title: "Stocking a bin store", hue: 24, categories: ["general-merchandise", "home-kitchen", "toys-baby"], collection: "bin-store-starter",
    excerpt: "High unit counts, broad variety and fast restocks.",
    body: [
      { p: ["Bin stores live on variety and volume. Customers come back because the bins change every week, so your buying should favour unit count over unit value."] },
      { h: "What to buy", list: ["Mixed customer-return pallets with 150+ units", "General merchandise truckloads once you restock weekly", "Toys and home goods for broad appeal"] },
      { h: "What to avoid", list: ["Large furniture — it takes bin space and needs separate pricing", "Salvage lots unless you have a parts channel"] },
    ],
  },
  {
    slug: "online-resellers", title: "Sourcing for online resale", hue: 215, categories: ["electronics", "apparel", "health-beauty"], collection: "brand-new-overstock",
    excerpt: "Condition consistency matters more than price.",
    body: [
      { p: ["Online buyers expect items to match their photos and descriptions. Every defect costs you a return label and a review, so prioritize new and shelf-pull lots."] },
      { h: "What to buy", list: ["New overstock with sealed packaging", "Shelf-pull electronics and accessories", "Apparel lots with consistent sizing"] },
      { h: "Tip", p: ["Choose lots where the top five manifest lines are items you can list in under five minutes each."] },
    ],
  },
  {
    slug: "discount-stores", title: "Running a discount or dollar store", hue: 150, categories: ["home-kitchen", "health-beauty", "general-merchandise"], collection: "under-1000",
    excerpt: "Low per-unit cost and everyday essentials.",
    body: [
      { p: ["Discount shoppers want everyday items at a price they can see is a deal. Buy for low cost per unit and fast-moving consumables."] },
      { h: "What to buy", list: ["Personal care shelf pulls", "Kitchen basics and bakeware", "Seasonal overstock ahead of holidays"] },
    ],
  },
  {
    slug: "flea-market-vendors", title: "Selling at flea markets", hue: 330, categories: ["tools-hardware", "toys-baby", "apparel"], collection: "under-1000",
    excerpt: "Portable, eye-catching and easy to haggle over.",
    body: [
      { p: ["Weekend markets reward items that are easy to carry and fun to browse. Tools, toys and footwear all draw crowds to a table."] },
      { h: "Tip", p: ["Buy single pallets you can unload from a van. If you're close to our warehouse, you can book a weekday pickup visit from the lot page instead of paying for freight."] },
    ],
  },
  {
    slug: "refurbishers", title: "Refurbishing and repair shops", hue: 10, categories: ["electronics", "tools-hardware"], collection: "repair-and-refurb",
    excerpt: "Salvage and returns are your raw material.",
    body: [
      { p: ["If you can test and repair, customer returns and salvage lots offer the lowest cost per unit on the marketplace. The same model repeated across a pallet lets you harvest parts efficiently."] },
      { h: "What to buy", list: ["Salvage electronics with repeated models", "Power-tool returns", "Small appliances for parts"] },
    ],
  },
  {
    slug: "exporters", title: "Exporting liquidation goods", hue: 45, categories: ["general-merchandise", "apparel", "electronics"], collection: "truckloads",
    excerpt: "Truckloads, consistent grading and paperwork.",
    body: [
      { p: ["Exporters buy by the container, so multi-pallet lots and full truckloads are the best fit. Ask us for weights and dimensions early — they drive your container plan."] },
      { h: "Tip", p: ["Ask us to hold several lots together on our dock for a single freight pickup."] },
    ],
  },
];
