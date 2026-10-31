import { pageMetadata } from "@/lib/seo";
export const generateMetadata = () => pageMetadata({ title: "Shipping policy", description: "Flat $100 shipping per order for pallets, truckloads and case packs.", path: "/shipping" });
export default function ShippingPolicy() {
  return <main className="container-pp py-12"><article className="max-w-2xl space-y-5">
    <h1 className="font-display text-3xl font-bold">Shipping policy</h1>
    <p>Delivery costs $100 USD per order for pallets, truckloads and case packs within our supported delivery area. The fee applies once to the entire order, regardless of order value, quantity, weight or the number of shipments.</p>
    <p>Liftgate and residential delivery are included where applicable, with no additional shipping surcharge. Full truckloads require a loading dock and forklift; liftgate delivery is not available for a full trailer.</p>
    <p>Warehouse pickup is free by confirmed appointment. Enter your delivery ZIP code at checkout and provide accurate dock and residential information so we can arrange delivery.</p>
    <p>Orders ship after payment is confirmed. Estimated transit after dispatch is 2-8 business days for pallets, 1-5 business days for domestic truckloads and 2-5 business days for case packs, depending on destination. These are estimates; appointment scheduling may require additional time. Contact us before ordering if you need a confirmed delivery date.</p>
    <p>Tracking is provided on your order page when available. Inspect your shipment and record any damage on the delivery receipt before signing.</p>
  </article></main>;
}
