// Freight estimator. Pure functions (no DB) so it runs on the server and in the browser.
// Replace with a live LTL rate API (e.g. via a freight broker) before launch — see README.

export type DeliveryMethod = "FREIGHT" | "PICKUP";

export type FreightOptions = {
  toZip?: string | null;
  method: DeliveryMethod;
  liftgate: boolean; // no loading dock at delivery
  residential: boolean;
};

export type ShipLine = {
  sellerId: string;
  sellerName: string;
  shipsFrom: string; // "City, ST"
  lotSize: string; // CASE | PALLET | TRUCKLOAD
  palletCount: number;
  weightLbs: number;
  quantity: number;
  priceCents: number;
};

export type Shipment = {
  sellerId: string;
  sellerName: string;
  shipsFrom: string;
  mode: "PARCEL" | "LTL" | "TRUCKLOAD" | "PICKUP";
  pallets: number;
  weightLbs: number;
  zone: number;
  linehaulCents: number;
  accessorialCents: number;
  totalCents: number;
  transitDays: string;
  notes: string[];
};

export const FREE_FREIGHT_CENTS = 750000;
const LIFTGATE_CENTS = 7500;
const RESIDENTIAL_CENTS = 9500;

// First ZIP digit by state — a rough stand-in for distance zones.
const STATE_ZIP_DIGIT: Record<string, number> = {
  CT: 0, MA: 0, ME: 0, NH: 0, NJ: 0, RI: 0, VT: 0, PR: 0,
  DE: 1, NY: 1, PA: 1,
  DC: 2, MD: 2, NC: 2, SC: 2, VA: 2, WV: 2,
  AL: 3, FL: 3, GA: 3, MS: 3, TN: 3,
  IN: 4, KY: 4, MI: 4, OH: 4,
  IA: 5, MN: 5, MT: 5, ND: 5, SD: 5, WI: 5,
  IL: 6, KS: 6, MO: 6, NE: 6,
  AR: 7, LA: 7, OK: 7, TX: 7,
  AZ: 8, CO: 8, ID: 8, NM: 8, NV: 8, UT: 8, WY: 8,
  AK: 9, CA: 9, HI: 9, OR: 9, WA: 9,
};

export function validZip(zip?: string | null) {
  return !!zip && /^\d{5}(-\d{4})?$/.test(zip.trim());
}

function zoneBetween(shipsFrom: string, toZip?: string | null) {
  const st = shipsFrom.split(",").pop()?.trim().toUpperCase() ?? "";
  const from = STATE_ZIP_DIGIT[st] ?? 4;
  const to = validZip(toZip) ? Number(toZip!.trim()[0]) : 4;
  return Math.abs(from - to);
}

function transit(zone: number, mode: Shipment["mode"]) {
  if (mode === "PICKUP") return "Pick up by appointment";
  if (mode === "PARCEL") return zone <= 2 ? "2–3 business days" : "3–5 business days";
  if (mode === "TRUCKLOAD") return zone <= 2 ? "1–3 business days" : "3–5 business days";
  return zone <= 2 ? "2–4 business days" : zone <= 5 ? "4–6 business days" : "5–8 business days";
}

/** Groups cart lines by seller (each seller ships separately) and prices each shipment. */
export function estimateShipments(lines: ShipLine[], opts: FreightOptions, subtotalCents: number): Shipment[] {
  const bySeller = new Map<string, ShipLine[]>();
  for (const l of lines) bySeller.set(l.sellerId, [...(bySeller.get(l.sellerId) ?? []), l]);
  const freeLinehaul = subtotalCents >= FREE_FREIGHT_CENTS;

  return [...bySeller.values()].map((ls) => {
    const first = ls[0];
    const zone = zoneBetween(first.shipsFrom, opts.toZip);
    const weight = ls.reduce((a, l) => a + l.weightLbs * l.quantity, 0);
    const pallets = ls.filter((l) => l.lotSize !== "CASE").reduce((a, l) => a + l.palletCount * l.quantity, 0);
    const trucks = ls.filter((l) => l.lotSize === "TRUCKLOAD").reduce((a, l) => a + l.quantity, 0);
    const cases = ls.filter((l) => l.lotSize === "CASE").reduce((a, l) => a + l.quantity, 0);
    const base = { sellerId: first.sellerId, sellerName: first.sellerName, shipsFrom: first.shipsFrom, pallets, weightLbs: weight, zone };

    if (opts.method === "PICKUP") {
      return { ...base, mode: "PICKUP" as const, linehaulCents: 0, accessorialCents: 0, totalCents: 0, transitDays: transit(zone, "PICKUP"), notes: [`Pickup by appointment at our warehouse in ${first.shipsFrom}. We'll email you to book a time; bring a truck or trailer sized for ${pallets || cases} ${pallets ? "pallet" : "case"}${(pallets || cases) === 1 ? "" : "s"}.`] };
    }

    let mode: Shipment["mode"];
    let linehaul = 0;
    const notes: string[] = [];
    if (trucks > 0) {
      mode = "TRUCKLOAD";
      linehaul += trucks * (140000 + zone * 18000);
      const loosePallets = pallets - ls.filter((l) => l.lotSize === "TRUCKLOAD").reduce((a, l) => a + l.palletCount * l.quantity, 0);
      linehaul += Math.max(0, loosePallets) * (12500 + zone * 2000);
      notes.push("Full truckload — requires a loading dock and forklift.");
    } else if (pallets > 0) {
      mode = "LTL";
      linehaul += pallets * (12500 + zone * 2000);
    } else {
      mode = "PARCEL";
      linehaul += cases * 1800 + Math.round(weight * 45) + zone * 150 * cases;
    }
    if (mode !== "PARCEL" && cases > 0) linehaul += cases * 900; // cases ride along on the pallet shipment

    let accessorial = 0;
    if (mode === "LTL" && opts.liftgate) {
      accessorial += LIFTGATE_CENTS;
      notes.push("Liftgate lowers pallets to the ground — you'll need a pallet jack.");
    }
    if (mode !== "PARCEL" && opts.residential) {
      accessorial += RESIDENTIAL_CENTS;
      notes.push("Residential delivery surcharge applies.");
    }
    if (freeLinehaul && mode !== "PARCEL") {
      notes.push("Free freight applied (order over $7,500).");
      linehaul = 0;
    }
    return { ...base, mode, linehaulCents: linehaul, accessorialCents: accessorial, totalCents: linehaul + accessorial, transitDays: transit(zone, mode), notes };
  });
}

export function freightTotal(shipments: Shipment[]) {
  return shipments.reduce((a, s) => a + s.totalCents, 0);
}

export const MODE_LABEL: Record<Shipment["mode"], string> = {
  PARCEL: "Parcel",
  LTL: "LTL freight",
  TRUCKLOAD: "Full truckload",
  PICKUP: "Warehouse pickup (by appointment)",
};
