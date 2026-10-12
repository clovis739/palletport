// Upgrade previous shipping wording in saved content without changing other admin edits.
const replacements: Record<string, string> = {
  "Most lots ship by less-than-truckload (LTL) freight. Freight is estimated at $175 per pallet and is free on orders over $7,500. When we ship, you'll see a PRO (tracking) number on your order page.": "Shipping costs $100 per order for pallets, truckloads and case packs, regardless of order value, quantity or destination within our delivery area. Liftgate and residential delivery are included where applicable. Warehouse pickup is free by appointment. When we ship, you'll see tracking on your order page.",
  "Parcel vs. LTL vs. truckload, what drives the cost of shipping a pallet, liftgate and residential fees, and how to receive freight without losing a claim.": "Parcel vs. LTL vs. truckload, our $100 shipping fee per order, and how to receive freight without losing a claim.",
  "Every lot page has an Estimate shipping box. Enter your delivery ZIP, tick Loading dock if you have one (otherwise the estimate includes liftgate delivery), and tick Residential if it applies. The estimate shows the shipping mode, the freight amount, any liftgate or residential fees, and an approximate transit time.": "Every lot page has an Estimate shipping box. Enter your delivery ZIP, tick Loading dock if you have one (otherwise the estimate includes liftgate delivery), and tick Residential if it applies. The estimate shows the shipping mode, our flat $100 shipping fee per order, and an approximate transit time. Liftgate and residential delivery are included where applicable.",
  "Put more on each shipment. Much of an LTL bill is fixed per shipment: pickup, delivery and any liftgate or residential fees. Two or three pallets in one order usually cost less per pallet than the same pallets shipped separately.": "Combine purchases into one order. Our $100 shipping fee applies once per order, regardless of how many pallets or case packs you buy.",
  "Use a dock or a commercial address. Dock delivery avoids the liftgate fee, and a business address avoids the residential surcharge.": "Tell us whether you have a loading dock and whether the address is residential so we can arrange the right delivery equipment. These options do not add to our $100 shipping fee.",
  "Price in freight. At $175 per pallet, a $400 lot really costs $575.": "Price in shipping. With $100 shipping per order, a $400 lot costs $500 before any applicable tax.",
  "For resellers who buy every week: free freight from $3,000 instead of $7,500, 24-hour early access to new lots, Net 60 terms and priority support.": "For resellers who buy every week: $100 shipping per order, 24-hour early access to new lots, Net 60 terms and priority support.",
  "Free freight from $3,000": "$100 shipping per order",
  "Instead of the standard $7,500 threshold.": "One flat delivery fee for your whole order."
};
export function currentShippingCopy<T>(value: T): T {
  if (typeof value === "string") return (replacements[value] ?? value) as T;
  if (Array.isArray(value)) return value.map(currentShippingCopy) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, currentShippingCopy(item)])) as T;
  return value;
}
