# Hosting usage reduction

Implemented on 2026-10-10:

- 2,845 hash-verified local image paths resolve to their previously uploaded Cloudinary copies for product cards, galleries, cart/checkout covers and order thumbnails. No database image values were changed.
- All 533 supplier stock photos include a verified CDN copy. Original local paths remain for audits and existing brightness corrections.
- Public stock photos use native responsive image markup, bypassing the Next/Netlify image optimization proxy.
- Product, stock and uploaded Cloudinary images use f_auto,q_auto,c_limit with bounded responsive widths up to 2,000 pixels. Thumbnail resizing replaces the generated resize layer instead of stacking it.
- Gallery thumbnails remain lazy. Only the selected large gallery image is rendered. Card links disable Next.js automatic prefetch; navigation still works when clicked.
- Static /images files have a one-day browser cache with stale-while-revalidate. No public caching was added to personalized HTML.
- Existing public database caching was checked and retained. No public automatic polling loop was found; admin refreshes occur after edits.

## Verification

Run npm run images:check, npm run queries:check, npm run merchant:check and npx tsc --noEmit. Production build verification uses PALLET_BUILD_DIR=.next-verify so it does not share the development server cache.

The server-only product mapping stays outside browser bundles. Source photos carry their own CDN URL for client-side content previews. Uploaded admin images automatically use responsive CDN delivery.

To regenerate mappings after uploads, run npm run images:cdn:prepare. It reads docs/CLOUDINARY-IMAGE-UPLOAD.json, verifies every local file hash and rejects stale/missing uploads. It does not upload files or change the database. Unknown new local images stay local until uploaded and mapped.

## Deployment and remaining checks

Publish the verified changes once. Use preview deploys for subsequent testing; production deployment credits are not controlled by these source changes.

After deployment, use browser Network tools to confirm product images request res.cloudinary.com directly, with smaller w_ variants for cards/thumbnails, and stock photos do not request /_next/image. Check Cloudinary's own quotas as image delivery usage moves there. Previously published deploys and existing Merchant feed image URLs can still serve original local images from Netlify.

Compare Netlify bandwidth, web requests and Functions compute over equivalent periods. The supplied report showed 332 total credits, 54K requests and around 6.6–7.1 GB bandwidth; deployment/compute totals are still needed to explain the remainder. No traffic logs were provided, so abusive bots have not been identified or blocked. Broad bot blocks can disrupt search and Merchant crawlers.

Changing this code cannot unpause a credit-exhausted team or erase consumed credits. Restore hosting through the available plan/credit options or the billing-cycle reset.

Verification result: image-delivery checks, TypeScript, public-query checks, Merchant feed checks and git diff --check passed. The isolated production build compiled and passed type checking, then failed prerendering /llms.txt because Supabase was unreachable from this environment. Cloudinary HTTP checks were blocked with EACCES. Live availability and complete prerender verification remain pending in an environment with network access. Product-only mapping URLs were confirmed absent from browser chunks. Changes have not been committed, pushed or deployed.
