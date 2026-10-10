# Crawler controls

Implemented locally on 2026-10-10. Not deployed yet.

## Crawl exclusions

robots.txt excludes catalog URLs containing search, category, subcategory, brand,
condition, size, state, price, sorting or sold-stock parameters. These apply in
English and Spanish, regardless of parameter order. Homepage recent/value
combinations are excluded too.

Product detail pages, dedicated category pages, unfiltered catalog pages,
ordinary page-number pagination, images, sitemap and Merchant feed remain
crawlable. Existing private-route exclusions also cover Spanish paths. Search
engines and allowed AI crawlers receive the same exclusions, since an explicit
user-agent group does not inherit the wildcard group's restrictions.

AhrefsBot, SemrushBot, MJ12bot, DotBot, BLEXBot, CCBot and Bytespider are denied
by robots.txt. Middleware also returns a small 403 response for their declared
user agents on public page requests, before rendering or database reads. GET
and HEAD are handled; POST and private-route authentication keep their existing
behavior. Google, Google Image, Merchant/Ads crawlers and Bing are not blocked
by this user-agent check. Sitemap, robots and feed endpoints remain available.

## Limits and next steps

robots.txt is advisory. User-agent matching is bypassable and is not a firewall
or distributed rate limiter. It does not establish that any of these named
crawlers caused the supplied traffic. No abusive IP was supplied, so no IP block
has been configured. Requests rejected by middleware can still incur hosting
request/middleware usage, although they avoid the heavier page response.

The supplied logs show rapid requests for varied /es/lots filter combinations,
51,252 requests and 6.5 GB transfer. They do not identify the clients or prove
the exact compute cost. If traffic persists, obtain User-Agent and client IP
details and configure hosting-level traffic controls supported by the plan.
Do not blindly block search or Merchant verification crawlers.

Run `npm run crawlers:check`, `npm run security:check` and `npx tsc --noEmit`.
These checks passed locally. The crawler check exercises actual middleware
responses and robots rules with isolated fixtures, without database writes.
After deployment, verify /robots.txt and the access controls, then compare
bandwidth and compute over equivalent time periods. These changes cannot
unpause a credit-exhausted team or remove credits already consumed.

Google reference: https://developers.google.com/crawling/docs/faceted-navigation
