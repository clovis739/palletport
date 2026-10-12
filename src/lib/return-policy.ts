/** Keep legacy saved content aligned with the approved holiday return extension. */
export function currentReturnText(text: string): string {
  if (text.includes("November 1")) return text;
  return text
    .replace(/within 15 days of pickup or delivery/g, "within 15 days of pickup or delivery (60 days for orders placed November 1 through December 31 each year)")
    .replace(/15-day returns/g, "15-day returns (60 days for orders placed November 1 through December 31 each year)");
}
export function currentReturnCopy<T>(value: T): T {
  if (typeof value === "string") return currentReturnText(value) as T;
  if (Array.isArray(value)) return value.map(currentReturnCopy) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, currentReturnCopy(item)])) as T;
  return value;
}
