export const WAREHOUSE_ADDRESS = '1150 Corrugated Way, Columbus, OH 43201, USA';

/** Replace supplier fulfillment locations while preserving surrounding product details. */
export function withWarehouseAddress(text: string, address: string) {
  const locations = 'Texas, Georgia, Indiana|DFW \\(Dallas/Fort Worth\\)|Houston, Texas|Dallas, TX|Jacksonville, Florida|Jacksonville, FL|Tampa,\\s*FL|North Carolina|New Jersey|Pennsylvania|California|Tennessee|Michigan|Virginia|Indiana|Florida|Georgia|Kansas|Texas|Ohio|East Coast|DFW';
  const pattern = new RegExp(`\\b(Warehouse Locations?\\s*:|Warehouse\\s*:|FOB(?: Location)?\\s*:?\\s*(?:pickup from\\s+)?|Ships? FOB\\s+|Ships? from\\s*:)\\s*(?:${locations})(?:\\s*\\([A-Z]{2}\\))?(?:,\\s*USA)?`, 'gi');
  return text.replace(pattern, (_, label: string) => `${/^warehouse/i.test(label) ? 'Warehouse' : /^ship/i.test(label) ? 'Ships from' : 'FOB'}: ${address}`);
}
