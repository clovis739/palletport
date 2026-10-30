export const FLAT_SHIPPING_CENTS = 10000;

/**
 * Delivery time in business days, told to Google (Merchant feed + Product structured data).
 * Owner's figure: delivered in 3–10 business days in total. Split as 1–2 days to dispatch after payment plus
 * 2–8 days in transit, matching the transit estimate on the /shipping page.
 */
export const HANDLING_DAYS = { min: 1, max: 2 } as const;
export const TRANSIT_DAYS = { min: 2, max: 8 } as const;
