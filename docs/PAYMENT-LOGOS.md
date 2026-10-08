# Payment selector artwork

Logos are stored under `public/images/payments` and loaded locally in both the selected payment value and dropdown options. Admin-uploaded artwork takes priority over the built-in method logos. Wire transfer and Net 30 use bank/transfer and invoice symbols because they have no provider-specific brand.

Asset sources:

- Apple Pay: official [Apple Pay mark download](https://developer.apple.com/apple-pay/marketing/Apple-Pay-Mark.zip), SVG from the provided archive. [Usage guidelines](https://developer.apple.com/apple-pay/marketing/).
- Zelle: [Zelle website logo](https://www.zelle.com/themes/custom/zelle/images/zelle-logo-white.png), displayed on a purple tile so its white lettering remains visible.
- Chime: [Chime wordmark](https://companieslogo.com/chime/logo/).
- Visa: [Visa logo](https://companieslogo.com/visa/logo/).
- Mastercard: [Mastercard logo](https://companieslogo.com/mastercard/logo/).

The logos identify the payment choices already configured by the administrator. This display change does not integrate or activate payment processing.

Order confirmations for customers and admins, plus order lifecycle notifications, include the selected method's mark. Email templates use absolute HTTPS PNG URLs for built-in logos; plaintext messages retain the payment name. Uploaded custom logos take priority. Images become publicly accessible when these assets are deployed.
