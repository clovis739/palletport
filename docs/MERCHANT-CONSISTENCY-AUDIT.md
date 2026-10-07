# Merchant consistency audit — October 7, 2026

The site is not yet consistently ready for Merchant Center review. This is a technical and public-content audit, not a Google approval or confirmation of physical inventory.

## Verified

- Live Merchant feed returned HTTP 200 and contained 456 products.
- All 456 primary image URLs returned successful image responses. Local image metadata was available for every primary image. None exceeded 16 MB or 64 megapixels.
- Eight sampled live product pages returned HTTP 200. Their SKUs, prices and primary image URLs matched the feed; sampled conditions were consistent with the corresponding structured data.
- Live contact page showed the requested warehouse address: 1150 Corrugated Way, Columbus, OH 43201. Product listings include USA.
- Return, terms and privacy pages are accessible and linked publicly. The live return policy offers a 15-day request window, requires written approval, and charges buyer-paid return freight except for confirmed merchant errors.
- A diagnostic contact sheet of ten images showed product/packaging photography without obvious added promotional overlays. This sample is not a new visual certification of every gallery image.

## Findings to resolve

| Priority | Finding | Evidence and required decision |
| --- | --- | --- |
| High | Card payment is not implemented | `src/app/actions/orders.ts` contains a TODO for a payment processor and confirms CARD orders without charging a card. `src/app/checkout/CheckoutForm.tsx` displays a payment-setup placeholder. There is no stored checkout override, so the default configuration enables CARD. Live `/help/payment-options` says cards are charged when orders are confirmed. Connect a real payment flow or disable this method and correct all claims. |
| High | Business-only signup is inconsistent with Google's checkout requirements | Live `/register` requires a business name; the server registration schema requires at least two characters. Guest checkout is absent: `/checkout` redirects signed-out visitors to login. Google requires individuals to be able to purchase, optional business-related fields, and describes guest/OTP checkout. |
| High | Shipping costs and free-freight wording do not match checkout | Live `/how-to-buy` and `/help/freight-and-delivery` quote an estimated $175 per pallet and free freight over $7,500. `src/lib/shipping.ts` computes pallet linehaul from $125 plus $20 per distance zone, applies $75 liftgate and $95 residential surcharges, and waives only non-parcel linehaul at $7,500 or more. Parcel shipments remain charged. Publish the actual calculation, eligibility and surcharges consistently; match them in Merchant Center. |
| High | Delivery policy is incomplete | There is freight guidance but no dedicated shipping policy linked in the audited homepage footer. Handling time, order cutoff, destination exclusions and precise overall delivery estimates are not established by that guidance. The estimator returns different transit windows by mode and zone; transit time is not the same as handling plus transit. Do not invent operating commitments to fill these gaps. |
| Medium | Return/refund details are incomplete | Live `/legal/returns-and-disputes` does not state a refund-processing timeframe or a precise approved-return destination/method. It allows a refund, replacement, store credit or partial refund depending on condition. Clarify which remedies apply, how return approval is requested and when approved refunds are processed. Verify that Merchant Center represents the same 15-day window, fees, exclusions and methods. |
| Medium | Tax wording and totals need alignment | Live `/how-to-buy` says sales tax is added unless exempt. Checkout labels tax “Calculated on invoice,” while the stored order total is merchandise minus discounts plus freight, without a tax amount. Establish the actual tax workflow and disclose when the final payable amount is known. US feed prices exclude sales tax; account tax settings still need verification. |
| Medium | Image resolution needs improvement | 43 primary feed images have a dimension below 500 pixels. Google's published page announces a 500 × 500 minimum for all products from January 31, 2027. Two clothing images are 225 × 225: `PP-A7E8198DC2FD` and `PP-5ABBBE05E454`. Obtain higher-resolution originals; simple enlargement does not recover product detail. |
| Medium | Some image-to-lot relationships need inventory verification | The two 225 × 225 clothing photos show the same composition despite different new/used feed conditions. A sampled “Sephora Makeup Casepack” primary photo depicts an Olaplex hair product. These observations warrant checking the actual lot contents and condition; this audit cannot establish whether either listing is inaccurate. Supplier photographs must accurately represent the goods being sold. |

## Merchant Center settings are not verified

The feed provides shipping labels but does not provide shipping-rate or return-policy details. This is permitted when these are correctly configured at account level, but account settings were not accessible in this audit. Check:

- Business identity, claimed domain, contact information and fulfillment address.
- Shipping services for pallet, truckload and case-pack labels; destination restrictions, handling/transit ranges and all mandatory fees.
- Return policy URL, 15-day window, return methods, fees and refund-processing time.
- Tax settings and product diagnostics.

No test purchase, payment, refund or physical inventory inspection was performed. Price/SKU/condition landing-page verification was sampled across eight products, not all 456. Image URL accessibility and technical metadata checks covered every primary feed image, not every additional gallery image. The website and policy text were not edited during this audit.

## Official sources

- [Google checkout requirements](https://support.google.com/merchants/answer/9158778?hl=en)
- [Google image requirements](https://support.google.com/merchants/answer/6324350?hl=en)
- [Google shipping settings](https://support.google.com/merchants/answer/12577710?hl=en)
- [Google return-policy setup](https://support.google.com/merchants/answer/14011730?hl=en)
