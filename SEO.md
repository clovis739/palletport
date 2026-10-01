# SEO & AI visibility

What the code does, what you configure, and what only you can do off-site. Nothing here guarantees rankings or AI citations. It makes the site easy to crawl, understand and quote accurately.

## Implemented

- **`src/lib/seo.ts`** has the shared helpers: `siteUrl()`, `absoluteUrl()`, `pageMetadata()` (canonical, Open Graph, Twitter card, robots, descriptions trimmed to 155 characters) and `privateMetadata()` (noindex). It also has JSON-LD builders for Organization/OnlineStore, WebSite + SearchAction, BreadcrumbList, Product, BlogPosting, FAQPage, ItemList and About/ContactPage. `<JsonLd>` (`src/components/JsonLd.tsx`) outputs the data safely, with `<` escaped.
- **Root layout**: sets `metadataBase`, the title template, default description, OG and Twitter defaults, `robots` with `max-image-preview: large` and `formatDetection`. It renders the Organization + WebSite JSON-LD once (`src/components/SiteJsonLd.tsx`).
- **Every public page** has its own title, description and canonical. Filtered or paginated listings (`/lots?…`, `/pallets?…`) point their canonical to the unfiltered path. Search results with parameters (`/search?q=`, `/blog?q=`, `/help?q=`) are `noindex, follow`. The bare `/search` page stays indexable.
- **Private pages are `noindex`**: cart, checkout, account/*, orders/*, dashboard/* (set in its layout), admin, login, register, the password-reset pages, maintenance, offline and status.
- **Structured data**:
  - Lot pages: Product + Offer + BreadcrumbList. The condition maps to NewCondition, UsedCondition or DamagedCondition. The offer price is the lot's fixed price. Availability comes from the lot status, with the stock count as `inventoryLevel`.
  - The Product has an `image` **only when real photos have been uploaded**, because stock photos only illustrate the category.
  - Category and collection pages: BreadcrumbList + ItemList.
  - Blog posts: BlogPosting + BreadcrumbList.
  - Help articles: BreadcrumbList, plus FAQPage when the visible title or sub-headings are phrased as questions.
  - Guides and legal pages: BreadcrumbList.
  - Pro, Volume, Affiliates, Events and Integrations: FAQPage from their visible "Questions" block.
  - About and Contact: AboutPage and ContactPage.
  - There is no Review or AggregateRating markup.
- **Social cards**: `src/app/opengraph-image.tsx` is the default card. `src/app/lots/[slug]/opengraph-image.tsx` makes a card per lot showing title, price, % of retail and condition, with text only and no product photo.
- **Icons and manifest**: `src/app/icon.svg` (favicon), `/logo.png` (a 512px PNG used as the Organization logo), and `src/app/manifest.ts`.
- **`/robots.txt`**:
  - Private areas and `/api/` are disallowed.
  - Search engines are allowed.
  - AI crawlers are allowed by default: ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended and others.
  - Bingbot is always allowed. It is Bing's search crawler, so blocking it would remove the site from Bing and DuckDuckGo.
  - The file includes `host` and `sitemap` lines.
- **`/sitemap.xml`**:
  - Lists only indexable pages, with sensible `changeFrequency` and `priority`.
  - `lastModified` is set where it is known: lots, categories, posts and policies.
  - Includes active lots plus lots sold in the last 14 days.
- **`/llms.txt`**: generated hourly from live data. It covers the store name and bio, lot sizes, condition grades, categories with counts, how buying works, freight and pickup, contact, and links to the key pages, collections, guides, help, blog and policies. It uses only facts that are already on the site.

## Environment variables

All of these are optional except `APP_URL` in production. Business facts are only output when they are set.

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public base URL, e.g. `https://www.example.com`. Used for canonicals, sitemap, OG and JSON-LD. |
| `STORE_NAME` | Brand name in metadata (default "PalletPort"). |
| `STORE_PHONE`, `STORE_EMAIL` | Adds a customer-service ContactPoint. Also listed in llms.txt. |
| `STORE_STREET`, `STORE_POSTAL`, `STORE_COUNTRY` | Full warehouse address. The city and state come from the store record's `location`. |
| `STORE_HOURS` | Pickup hours, e.g. `Mo-Fr 08:00-18:00; Sa 09:00-12:00`. Only used when `STORE_STREET` is set and pickup is enabled. |
| `STORE_SAME_AS` | Comma-separated official profile URLs (Google Business Profile, LinkedIn, Facebook…). |
| `ALLOW_AI_CRAWLERS` | Set to `false` to block AI crawlers in robots.txt. It is your choice. The default is to allow them. |

## How to verify

1. Run `view-source:` on any page. Check `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:*`, and the `application/ld+json` blocks.
2. Paste a lot URL, a blog post and a help article into the [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/).
3. Open `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/manifest.webmanifest`, `/opengraph-image` and `/lots/<slug>/opengraph-image`.
4. Check that private pages (e.g. `/cart`, `/login`) contain `<meta name="robots" content="noindex, nofollow">`.
5. Preview link cards with the LinkedIn Post Inspector, or by pasting a URL into Slack.

## Owner checklist (off-site)

- [ ] Set `APP_URL` to the final https domain before launch. Redirect other hostnames to it.
- [ ] Verify the domain in **Google Search Console** and **Bing Webmaster Tools**. Submit `/sitemap.xml` to both and watch the Pages/Indexing reports.
- [ ] Create or claim a **Google Business Profile** and **Bing Places** listing for the warehouse. Only do this if buyers can pick up there. Use the same name, address and phone everywhere (NAP consistency): site env vars, profiles, directories and invoices.
- [ ] Add the profile URLs to `STORE_SAME_AS`.
- [ ] Upload real photos to lots. Product results need an image, and lots with only stock photos are deliberately left without one.
- [ ] Replace demo content before launch: seeded reviews and ratings, sample Warehouse Days events and demo stats should never be shown as real.
- [ ] Keep the hours on `/contact` in sync with `STORE_HOURS`.
- [ ] Have a lawyer review the policy pages. Once the shipping and returns terms are final, consider adding them to the Offer markup and to a Google Merchant Center feed.
