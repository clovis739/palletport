# PalletPort Admin — architecture & conventions

The admin lives at **`/dashboard`** (labelled **"Admin"** in the UI). It is a CMS + commerce back office
with a visual block editor for content and owner + staff roles. This document is the contract for everyone
building on it.

- [Setup](#setup)
- [Architecture](#architecture)
- [Roles & permissions](#roles--permissions)
- [Data models](#data-models)
- [Site settings](#site-settings)
- [Content & blocks](#content--blocks)
- [Media library](#media-library)
- [Audit log](#audit-log)
- [Admin UI kit](#admin-ui-kit)
- [Writing an admin page / action](#writing-an-admin-page--action)
- [File ownership](#file-ownership)
- [Status: what is wired and what isn't](#status-what-is-wired-and-what-isnt)

---

## Setup

```bash
npx prisma db push      # adds SiteSetting, ContentEntry, Media, AuditLog (additive, no data loss)
npm run db:seed         # optional: full demo reset (also imports content + writes default settings)
```

On an existing database without re-seeding, the owner can open **Admin → Pages & posts → Import default content**.
Until then the site keeps serving the built-in TypeScript content and default settings.

Demo logins (password `password123`): `admin@palletport.test` (owner), `manager@palletport.test`,
`editor@palletport.test`, `buyer@palletport.test`.

Uploaded media are written to `uploads/media/` (next to `uploads/lots/`). Back that folder up with the database.

---

## Architecture

```
src/lib/permissions.ts     Roles, ROLE_PERMS, can(), isStaff()           (pure, client-safe)
src/lib/auth.ts            requireUser / requireStaff(perm) / requireAdmin / getStaffUser   (server)
src/lib/audit.ts           logAudit(), recentAudit()                                       (server)
src/lib/settings-schema.ts zod schemas, types, DEFAULTS, deepMerge                        (pure, client-safe)
src/lib/settings.ts        getSettings / getSetting / saveSetting / patchSetting / resetSetting (server)
src/lib/blocks.ts          Block union + zod schema, converters, text helpers             (pure, client-safe)
src/lib/content-model.ts   ContentType, EntryMeta, ContentArticle, row <-> article        (pure, client-safe)
src/lib/content.ts         listEntries / getEntry / importDefaultContent …                (server)
src/lib/content-editor.ts  EditorEntry/EditorOptions, toEditorEntry, slugify, withBlockIds (pure, client-safe)
src/lib/preview.ts         canPreview(searchParams) for ?preview=1 draft previews          (server)
src/lib/blog.ts            async blog helpers on top of content.ts (categories, related…)  (server)
src/lib/imageRef.ts        resolveImageRef() for "stock key or media URL" image fields    (pure)
src/lib/uploads.ts         saveLotPhotos (unchanged) + saveMedia / deleteMedia / imageSize (server)
src/app/media/lib/[file]   serves uploads/media files (immutable cache, validated names)
src/components/content/    <Blocks> renderer, <RichText>, <SiteImage>
src/components/admin/      Admin shell + UI kit (see below)
src/app/dashboard/*        Admin pages (layout.tsx renders <AdminShell>)
src/app/actions/content.ts saveEntryAction, setEntryStatusAction, duplicateEntryAction, deleteEntryAction,
                           importDefaultContentAction (owner only)
src/components/admin/editor/ Visual block editor (client): EntryEditor, BlockCanvas, BlockFields, RichTextArea,
                           EditorSidebar panels, EntryPreview
```

"Pure" modules use only relative imports (plus `zod`) so `prisma/seed.ts` (run with `tsx`, outside Next)
can import them. Never import a `server-only` module from the seed or from a client component.

**Chrome.** The storefront `Header`/`Footer` are hidden on `/dashboard/**` by `<HideOnAdmin>`
(`src/components/SiteChrome.tsx`, client-side so it survives client navigations). The admin renders its own
sidebar + top bar in `src/components/admin/AdminShell.tsx`.

**Redirects.** `/admin` → `/dashboard/inbox` (next.config.ts). The old `DashNav.tsx` was removed.

---

## Roles & permissions

`User.role` is a string. Staff roles: `ADMIN` (owner), `MANAGER`, `EDITOR`. Everyone else is `BUYER`
(legacy `SELLER` is treated as BUYER).

| Perm         | ADMIN | MANAGER | EDITOR | Used by |
|--------------|:-----:|:-------:|:------:|---------|
| `orders`     | ✓ | ✓ |   | /dashboard/orders, updateOrderStatus |
| `lots`       | ✓ | ✓ |   | /dashboard/lots, /new, lot actions, toggleFeatured |
| `customers`  | ✓ | ✓ |   | /dashboard/customers |
| `promotions` | ✓ | ✓ |   | /dashboard/promotions, promo actions |
| `analytics`  | ✓ | ✓ | ✓ (read-only) | /dashboard/analytics |
| `inbox`      | ✓ | ✓ |   | /dashboard/inbox, setCertStatus, markInquiryHandled |
| `content`    | ✓ |   | ✓ | /dashboard/content |
| `media`      | ✓ |   | ✓ | /dashboard/media |
| `site`       | ✓ |   |   | /dashboard/site (hub) + /site/{business,navigation,announcement,homepage,about,seo}, `src/app/actions/site.ts` |
| `staff`      | ✓ |   |   | /dashboard/staff |
| `activity`   | ✓ |   |   | /dashboard/activity |
| *(owner)*    | ✓ |   |   | /dashboard/settings ("Store settings": minimum order, pickup at checkout, bio), import default content |

```ts
import { can, isStaff, isOwner, permsOf, ROLE_INFO, STAFF_ROLES, type Perm } from "@/lib/permissions";
can(user.role, "orders");          // boolean
ROLE_INFO.EDITOR.label;            // "Editor" (+ description, badge tone)
```

Guards (server):

```ts
const { user, seller } = await requireStaff("content", "/dashboard/content"); // page or action
const { user, seller } = await requireStaff();          // any staff (admin layout)
const { user, seller } = await requireAdmin("/dashboard/staff");  // owner only
const staff = await getStaffUser();                      // or null, never redirects
```

Signed out → `/login?next=…`; signed in without permission → `forbidden()` (403 screen).
**Every page and every server action must check its own permission** — hiding a sidebar link is not security.
`middleware.ts` only checks that `/dashboard` visitors are signed in.

The sidebar (`src/components/admin/nav.ts` → `ADMIN_NAV`) hides items the user lacks the permission for.
To give a role a new permission, edit `ROLE_PERMS` — nothing else.

---

## Data models

All new models are additive (`prisma/schema.prisma`, bottom of file). JSON is stored as strings (SQLite).

| Model | Key fields | Notes |
|---|---|---|
| `SiteSetting` | `key` (id), `value` JSON, `updatedAt`, `updatedById` | One row per settings group. |
| `ContentEntry` | `type`, `slug` (unique together), `title`, `excerpt`, `category`, `tags` JSON string[], `author`, `status` DRAFT\|PUBLISHED, `blocks` JSON Block[], `meta` JSON EntryMeta, `publishedAt` | Prisma unique input name: `type_slug`. |
| `Media` | `url`, `filename`, `mime`, `size`, `width?`, `height?`, `alt`, `uploadedById?` | Files in `uploads/media`. |
| `AuditLog` | `userId?`, `userEmail`, `action`, `target`, `detail`, `createdAt` | Indexed by `createdAt` and `userId`. |

Additive fields on existing models (commerce agent — run `npx prisma db push`):

| Model | Field | Meaning |
|---|---|---|
| `Order` | `paidAt DateTime?` | When staff recorded payment ("Mark paid"). Card orders count as paid without it. |
| `Order` | `carrier String?` | Freight carrier chosen when marking shipped (`trackingNo` already existed). |
| `Order` | `shippedAt`, `deliveredAt`, `cancelledAt` `DateTime?` | Fulfilment timestamps set by the admin order actions. |
| `Order` | `adminNotes String?` | Internal staff notes (never shown to the buyer). |
| `Order` | `@@index([createdAt])`, `@@index([status])` | For the overview/analytics range queries. |
| `User` | `certNote String?` | Note from the last resale-certificate review. |

---

## Site settings

Defined in `src/lib/settings-schema.ts`; DEFAULTS reproduce exactly what the site showed before the admin.
Stored rows are **deep-merged over DEFAULTS** (objects merge, arrays replace), then validated; invalid JSON
or a failing value falls back to DEFAULTS for that key.

| Key | Shape (abridged) |
|---|---|
| `business` | `name, tagline, email, salesEmail?, phone, whatsapp?, addressStreet, addressCity, addressRegion, addressPostal, country, hours, pickupNote, socialLinks: {label, href}[]` |
| `navigation` | `header: {label, href, children?, tone?: default\|primary\|urgent}[]` (DB categories are appended after), `mobileExtra?: link[]`, `footerColumns: {title, links}[]`, `footerBlurb`, `legalLinks: link[]` |
| `announcement` | `enabled, text, mobileText?, href?, linkLabel?, tone: info\|promo\|warning` |
| `home` | `heroEyebrow, heroTitle, heroSubtitle, heroSearchPlaceholder, heroPhoto, heroLinks[], stats{enabled, liveAuctions, endingHour, retailValue, typicalPrice, typicalPriceValue, typicalPriceLabel}, sections{<key>: {enabled, title, subtitle}}, howItWorksSteps[{title,text}], howItWorksCta{label,href}, order?: HomeSectionKey[]` — section keys: `closingSoon, lotSizes, categories, buyNow, howItWorks, conditions, collections, guides, recentlySold, aboutCard, contactCard, blog` (`HOME_SECTIONS`) |
| `about` | `heroEyebrow, heroTitle, heroIntro ({name}/{location} tokens), heroPhotos[≤4], statsTitle, mission{eyebrow,title,paragraphs[],linkLabel,linkHref}, sustainability{…, photo}, transparent{eyebrow,title,cards[{title,text,href}]}, audiences{eyebrow,title,intro}, advantages{eyebrow,title,cards[{…,cta}]}, thanks{title,body,cards[]}` |
| `seo` | `defaultTitle, titleTemplate (must contain %s), defaultDescription, ogImage?` |

Social links use `{ label, href }` (same `link` shape as navigation).

Additive helpers (site agent): `headerTones(items)` → the effective `NavTone` per header item (rows saved before
`tone` existed keep the original look: first item dark pill, `?ending=` links red); `homeSectionOrder(home)` → every
`HOME_SECTIONS` key in display order (`home.order` first, missing keys appended in default order); `NAV_TONES`.

```ts
import { getSettings, getSetting, saveSetting, patchSetting, resetSetting, getStoredSettings } from "@/lib/settings";

const home = await getSetting("home");            // effective value (cached per request)
const all = await getSettings();                  // every group; business falls back to STORE_* env vars when empty
const raw = await getStoredSettings();            // for admin forms: no env fallbacks

// in a server action (after requireStaff("site")):
const r = await saveSetting("announcement", value, user);   // zod-validated, audit-logged, revalidatePath("/", "layout")
if (!r.ok) return { error: r.error };
await patchSetting("home", { sections: { blog: { enabled: false } } }, user);  // partial, merged over stored
await resetSetting("home", user);                 // back to DEFAULTS
```

### Site editors (`/dashboard/site/**`, perm `site`) and actions (`src/app/actions/site.ts`)

| Page | Group | Action |
|---|---|---|
| `/dashboard/site` — hub: one card per area, Default/Customized badge, last update, **Reset** | — | `resetArea(fd: area, back?)` → `resetSetting`, logs `site.<area>.reset`, redirects with a flash |
| `/site/business` — Business profile + footer/contact previews | `business` **and** the store record's `name` + `location` | `saveBusiness` |
| `/site/navigation` — header links (style, dropdown children), mobile extras, footer columns/blurb, legal links; live header/footer preview | `navigation` | `saveNavigation` |
| `/site/announcement` — on/off, text, phone text, link, tone; desktop/phone preview | `announcement` | `saveAnnouncement` |
| `/site/homepage` — hero (MediaPicker photo), quick links, stats, sections (show/hide, heading, subheading, order) | `home` | `saveHome` |
| `/site/about` — every text/photo slot on /about | `about` | `saveAbout` |
| `/site/seo` — default title, template, description (counters), social image; ALLOW_AI_CRAWLERS status (read-only) | `seo` | `saveSeo` |

Every save action: `requireStaff("site")`, posts the whole group as JSON in a hidden `payload` field, validates with the
group schema plus stricter checks (phone format, `https://` social links, announcement text required when enabled,
title/description lengths), returns `{ error, fieldErrors: { "header.2.href": "…" } }` for inline errors, then
`saveSetting()` (→ `settings.save` + `revalidatePath("/", "layout")`) and logs `site.<area>.update` with the changed keys.
Editors are built on `src/app/dashboard/site/_components/`: `SettingsForm` (state + payload + SaveBar + toast;
ignores React 19's automatic post-action form reset), `fields.tsx` (`Text`, `Switch`, `MediaField`, `LinkEditor` with a
searchable page picker fed by `linkSuggestions()`, `SortableList` with drag handle + up/down + remove), `areas.tsx`.

**Store name/location:** the Seller record stays the source used by commerce. `saveBusiness` writes `business` and, in the
same save, `seller.name` / `seller.location` (logged as `store.update`). `/dashboard/settings` is labelled **Store settings**
in the sidebar (minimum order, pickup at checkout, bio).

### Where the storefront reads settings

| Surface | Reads |
|---|---|
| `AnnouncementBar` (new, root layout above the header, hidden on /dashboard; dismiss per session in `sessionStorage`, key = hash of text + link) | `announcement` |
| `Header` (desktop pills; `NavDropdown` for items with children), `MobileNav` (`links` prop: header items + children, then `mobileExtra`) | `navigation` |
| `Footer` (blurb, columns, legal links, © name) + `ContactDetails` / `SocialLinks` (`src/components/ContactDetails.tsx`, shown only when an email/phone/WhatsApp/street is set) | `navigation`, `business` |
| `src/app/page.tsx` — hero, stats, sections (toggle/heading/subheading/order); blog + guides teasers from `getPublishedPosts()` / `getPublishedGuides()` | `home`, `seo.defaultDescription` |
| `src/app/about/page.tsx` (card icons are fixed per slot and cycle) | `about` |
| `src/app/contact/page.tsx` — hours, pickup note (default note keeps the original sentence with the city), "Reach us directly" card | `business` |
| Root `generateMetadata` → `siteMetadata(seo, brand)` in `src/lib/seo.ts` (title default/template, description, OG image via `ogImageUrl(ref)`) | `seo`, `business.name` |
| `SiteJsonLd` → `organizationJsonLd(store, business)` (phone/email/address/sameAs from settings, env as fallback) | `business` |
| `llms.txt` Contact section (email, sales email, phone, WhatsApp, street address, hours, social) | `business` |

`SmartLink` (`src/components/NavDropdown.tsx`) renders internal hrefs with `next/link` and external ones as `<a>`
(new tab for http). Per-page `pageMetadata()` still uses `SITE_NAME` (env) for the OpenGraph title suffix and the
generated OG image; only the root defaults follow the `seo` settings.

Env fallbacks (unchanged, still read by `src/lib/seo.ts`): `STORE_NAME, STORE_EMAIL, STORE_PHONE, STORE_STREET,
STORE_POSTAL, STORE_COUNTRY` fill empty `business` fields. `STORE_HOURS` (schema.org format) is still read only by
`seo.ts` for JSON-LD; `business.hours` is free text for humans.

**Image fields** (`home.heroPhoto`, `about.heroPhotos`, `about.sustainability.photo`, block images, entry covers)
hold an *image ref*: a stock photo key from `src/content/photos.ts` (e.g. `"heroWarehouse"`) or a media URL
(`/media/lib/…`). Resolve with `resolveImageRef(ref)` or render with `<SiteImage src={ref} … />`.
`stockPhotoOptions()` lists stock keys for pickers.

---

## Content & blocks

### Block types (`src/lib/blocks.ts`)

Every block has an optional `id` (stable React key for editors) and a `type`:

| type | fields |
|---|---|
| `heading` | `level: 2 \| 3`, `text` (H2s get anchor ids and build the TOC) |
| `paragraph` | `text` |
| `list` | `items: string[]`, `ordered?` |
| `image` | `src` (image ref), `alt`, `caption?`, `width?`, `height?` (set from the Media row) |
| `table` | `head: string[]`, `rows: string[][]`, `caption?` (first column renders as row headers) |
| `faq` | `items: {q, a}[]` (visible Q&A; feeds FAQPage JSON-LD via `blocksFaq`) |
| `callout` | `tone: info \| tip \| warning`, `title?`, `text` |
| `quote` | `text`, `cite?` |
| `divider` | — |

Inline syntax in any text: `[label](/path)` or `[label](https://…)` links, `**bold**`.
No HTML is ever rendered from content.

Helpers: `blockSchema`, `blocksSchema`, `BLOCK_TYPES` (labels for an "add block" menu), `emptyBlock(type)`,
`parseBlocks(json)` (drops invalid blocks), `sectionsToBlocks(sections)` (lossless for TS content),
`blocksToSections(blocks)` (lossy, for legacy consumers), `blocksText`, `plainText`, `readMinutes`,
`blocksFaq`, `blocksToc`, `slugifyHeading`.

Render: `import { Blocks } from "@/components/content/Blocks"; <Blocks blocks={entry.blocks} />` (`size="sm"` for
denser text). Styles match the current blog post body. `Blocks` has no hooks and no server-only imports, so it is a
**shared presentational component**: the public pages render it on the server and the editor's live preview imports
the very same module on the client — keep it (and `RichText`, `SiteImage`, `Photo`) free of server-only imports so
preview and public output stay identical.

### Content API (`src/lib/content.ts`)

Types: `POST | GUIDE | HELP | LEGAL | PAGE` (`CONTENT_TYPES`, `CONTENT_TYPE_INFO` with labels and base paths).
Entries come back as `ContentArticle` = the existing `Article` shape (incl. legacy `body: Section[]`) plus
`type, blocks, status, meta, source ("db" | "code"), id?, publishedAt?, updatedAt?, collection?, categories?`.

**Fallback rule:** if the DB has *any* entry of a type, that type is served from the DB only; otherwise from
the TS files in `src/content/*`. So the site works before import, and deleting an imported post really removes it.

```ts
listEntries("POST")                        // published, newest first
listEntries("POST", { status: "ALL" })     // admin: incl. drafts
getEntry("GUIDE", slug)                    // published or null
getEntry("POST", slug, { preview: true })  // drafts too (check requireStaff("content") first!)
getEntryById(id)
getPublishedPosts() getPublishedGuides() getHelpArticles() getLegalPages() getPublishedPages()
getPost(slug) getGuide(slug) getHelpArticle(slug) getLegalPage(slug) getPage(slug)
contentSource("POST")                      // "db" | "code"
importDefaultContent(user, { force })      // owner only; returns { created, updated, skipped }
revalidateEntry(type, slug)                // after saving/publishing
entryPath(type, slug)                      // "/blog/slug", "/guides/slug", "/help/slug", "/legal/slug", "/p/slug"
```

`EntryMeta` (`meta` JSON, all optional, passthrough for extras): `cover, hue, readMins, date (YYYY-MM-DD),
updated, seoTitle, seoDescription, featured, noindex, collection, categories`. Writing rows: build data with
`articleToRowData()` or directly (`tags: JSON.stringify(string[])`, `blocks: JSON.stringify(blocksSchema.parse(b))`,
`meta: JSON.stringify(meta)`).

### Content admin (`/dashboard/content`, perm `content`)

- **List** `/dashboard/content?type=POST|GUIDE|HELP|LEGAL|PAGE&q=&status=PUBLISHED|DRAFT&sort=updated|published|title` —
  tabs with counts, search, status pills, sort, DataTable with Edit / View (or Preview for drafts) / Duplicate /
  Publish·Unpublish / Delete. Types still served from the built-in TS content show those entries read-only
  ("Built-in" badge), a prominent import callout (owner: button; editors: "ask the owner"), and **New is disabled**:
  creating the first DB entry of such a type would hide every built-in entry. `saveEntryAction` enforces the same rule.
  Deleting the **last** DB entry of a type that has built-in content is refused (it would resurrect the built-ins).
- **Editor** `/dashboard/content/new?type=…` and `/dashboard/content/[id]` → `<EntryEditor initial options />`
  (`src/components/admin/editor/EntryEditor.tsx`). Options come from `src/app/dashboard/content/editor-options.ts`.

Server actions (`src/app/actions/content.ts`, all `requireStaff("content")` except import = owner):

```ts
saveEntryAction(payload)          // create/update from the editor; payload = EditorEntry fields + status; returns
                                  // { ok, entry, savedAt } or { error, fieldErrors, blockErrors (by block id) }
setEntryStatusAction(formData)    // id, to=PUBLISHED|DRAFT, back — redirects with a flash toast
duplicateEntryAction(formData)    // id — copy as draft "<slug>-copy", opens it in the editor
deleteEntryAction(formData)       // id, back
importDefaultContentAction(state, formData)  // owner; force=on overwrites
```

Save rules: zod-validated; blocks validated one by one with `blockSchema` (+ image blocks need a valid image and
alt text); slug must match `SLUG_RE` and be unique per type (POST reserves `category|tag|page|feed`); unknown
(passthrough) meta keys are preserved; POST `meta.readMins` is recomputed from the blocks; publishing sets
`publishedAt` from `meta.date` (or now, and fills `meta.date`). Audit: `content.create|update|publish|unpublish|delete`.
Revalidates the entry URL (old and new slug), its listing, `/sitemap.xml`, `/`, `/llms.txt`, blog category pages.

**Draft preview:** public URLs accept `?preview=1`. `canPreview(searchParams)` (`src/lib/preview.ts`) is true only for
signed-in staff with the `content` perm; the page then loads with `{ preview: true }`, shows `<PreviewBanner>`
(`src/components/content/PreviewBanner.tsx`) and sets `robots: PREVIEW_ROBOTS` (noindex). Everyone else gets the
published entry or a 404.

**Public wiring:** blog (index, `[slug]`, category), guides, help, legal, `/p/[slug]` (PAGE, published only, not linked
anywhere — add links via Site → Navigation), `sitemap.ts` and `llms.txt` all read `src/lib/content.ts` (with the TS
fallback) and render bodies with `<Blocks>`. Entries with `meta.noindex` get `noindex` and are left out of the sitemap
and llms.txt. SEO title/description override the defaults; `meta.cover` is the card/hero/OG image (else the
built-in photo for the slug).

`src/lib/blog.ts` is now async and server-only: `allPosts()`, `getPost(slug, { preview })`, `blogCategories()`
(built-in + categories used by posts), `categoryFromSlug()`, `allTags()`, `relatedPosts()`, `neighbours()`,
`postCover(post)` (image ref), `postReadMins()`, `postFaq()`, `postToc()`, `imageRefUrl(ref)` (OG/JSON-LD URL), plus the
sync `authorOf`, `categorySlug`, `slugifyText`, `formatDate`. `<PostCard post>` accepts a `ContentArticle` (or a plain
`Article`) and uses `postCover()`. **Homepage teasers** (site agent) should use `getPublishedPosts()` /
`getPublishedGuides()` and `postCover()` / `meta.cover` instead of `POSTS` / `GUIDES`.

---

## Media library

### Storage (foundation, `src/lib/uploads.ts`)

```ts
import { saveMedia, deleteMedia, MEDIA_MAX_BYTES } from "@/lib/uploads";
// in an action after requireStaff("media"):
const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
const { media, error } = await saveMedia(files, user, { alt });   // Media[] created; error = first bad file
await deleteMedia(id);                                              // row + file; returns the row or null
```

- JPG, PNG, WebP, GIF only — type sniffed from bytes; max 8 MB each; SVG is deliberately not allowed.
- Stored as `uploads/media/<safe-name>-<8 hex>.<ext>`, URL `/media/lib/<file>`, served with
  `Cache-Control: immutable` and `nosniff` by `src/app/media/lib/[file]/route.ts`.
- `width`/`height` are read from the file header (`imageSize()`); use them in `image` blocks.
- Server Action body limit is 40 MB (next.config.ts). Lot photo functions (`saveLotPhotos`, `deleteLotPhoto`)
  are unchanged.

### Admin screen — `/dashboard/media` (perm `media`)

Tabs (`?tab=`): **Library** (default), **Stock photos** (read-only `PHOTOS` + `LOT_TOPICS` with Unsplash credits),
**Lot photos** (read-only, images under `uploads/lots` grouped by lot; links to `/dashboard/lots/<id>` for users
with `lots`).

Library: storage summary (count, total size, per type, missing-alt count), drag-and-drop / file-button upload
with per-file status (each file is optimized in the browser — longest edge ≤ 2400px, re-encoded to WebP when
supported, GIFs untouched — then uploaded with its own action call), search (filename/alt/URL), type filter,
"Missing alt text" filter, sort newest/oldest/largest, grid/list toggle (remembered in localStorage),
"Load more" (48 per page, server-side). URL params: `q, type=jpg|png|webp|gif, alt=missing, sort=oldest|largest`.
Clicking an image opens a drawer: large preview, details, editable alt text, copy URL, **Used in** (links to
`/dashboard/content/<id>` or the site settings screen) and delete (two-step confirm; warns when in use).
Bulk select → copy URLs / delete (warns with the in-use count).

Files: `src/app/dashboard/media/{page,MediaLibrary,MediaDetail,StockPhotos,LotPhotos}.tsx`,
server queries in `src/app/dashboard/media/_lib/media-data.ts` (`queryMedia, usageOf, usageMap, storageSummary,
metaFor, lotPhotos, toItems`), shared pieces in `src/components/admin/media/`:
`types.ts` (pure: `MediaItem`, `MediaUsage`, `MediaMeta`, filters, `formatBytes/formatDims`),
`client-utils.ts` (`prepareImage`, `copyText`), `Dialog.tsx` (accessible modal/drawer, portal + focus trap +
inert background — reusable), `UploadZone.tsx` (drop zone + per-file queue, `onUploaded(items)`).

### Actions (`src/app/actions/media.ts`)

| Action | Guard | Notes |
|---|---|---|
| `listMediaAction({ q?, type?, missingAlt?, sort?, cursor? })` → `{ items, nextCursor, total, canUpload, error? }` | `media` **or** `content` **or** `site` | 48 per page; pass `nextCursor` back as `cursor`. Each item has `uses` (reference count). |
| `mediaUsage(url)` → `MediaUsage[]` | same | Scans `ContentEntry.blocks`/`meta` JSON and `SiteSetting.value` for the URL. |
| `mediaMetaAction(urls)` → `MediaMeta[]` | same | Alt/dimensions for `/media/lib/` URLs (the picker batches these). |
| `uploadMediaAction(formData)` → `{ items, error?, ok? }` | `requireStaff("media")` | `files` (≤ 20), optional `alt`. Logs `media.upload`. |
| `updateAltAction({ id, alt })` → `{ ok?, error?, item? }` | `requireStaff("media")` | ≤ 300 chars. Logs `media.update`. |
| `deleteMediaAction({ id, force? })`, `bulkDeleteMediaAction({ ids, force? })` → `{ deleted, ok?, error?, inUse? }` | `requireStaff("media")` | Refuses in-use images unless `force`; logs `media.delete`; revalidates the site layout when an in-use image was removed. |

These actions don't `revalidatePath` admin pages (they are dynamic); the library updates its own state and calls
`router.refresh()` for the summary.

### MediaPicker (`src/components/admin/MediaPicker.tsx`)

Interface unchanged: `name?, value?, defaultValue?, onChange?(ref), label?, hint?, allowStock? (true),
allowEmpty? (true)`, plus the exported `refPreviewSrc(ref, width)`. **Additive:** `onPick?(ref, info)` where
`info = { source: "library"|"upload"|"stock"|"url", alt, width, height, filename? }` (null on remove) — use it to
fill an image block's `alt`/`width`/`height`. Also exported: type `PickedImage`.

It opens a modal dialog (portal on `<body>` so it never submits or bubbles into the parent form; focus trap, Esc,
focus return) with tabs **Library** (search + load more, fetched only when opened), **Upload** (auto-selects the
upload), **Stock photos** (if `allowStock`), **Link** (same-site absolute URLs are turned into paths). The
selection shows its alt text and dimensions; double-click an image to use it immediately. Below the trigger the
picker shows the chosen image's alt text (or "No alt text") and size. After a change it dispatches
`input`/`change` on its hidden input, so `<SaveBar>` notices.

---

## Audit log

```ts
import { logAudit, recentAudit } from "@/lib/audit";
await logAudit(user, "content.publish", entry.title, `/blog/${slug}`);  // never throws
await recentAudit({ take: 100, prefix: "lot." });
```

Action names are `<area>.<verb>`. Already logged: `lot.create|update|status|delete|hide|photos|featured`,
`order.status`, `store.update`, `promo.create|toggle`, `inbox.certificate|handled`, `settings.save|reset`,
`content.import`, `seed.run`, `site.<area>.update|reset` (business, navigation, announcement, home, about, seo),
commerce: `order.confirm|paid|shipped|delivered|cancel|note|export` (target = order number, so the order timeline can
find them), `lot.bulk|quick`, `promo.update`, `inbox.unhandled`, `customer.update|pro|reset|certificate`,
`staff.create|role|remove`. Human labels for all of these live in `AUDIT_LABEL` / `auditLabel()` in `src/lib/commerce.ts`
(the activity log uses them; add yours there). Please log: `content.create|update|publish|unpublish|delete`, `nav.save`, `home.save`.
Media logs `media.upload|update|delete` (alt text changes are `media.update`).

---

## Admin UI kit

All in `src/components/admin/` (also re-exported from `@/components/admin`). Dependency-free, brand tokens,
keyboard accessible. Server components unless marked *(client)*.

### PageHeader
```tsx
<PageHeader title="Pages & posts" description="…" back={{ href: "/dashboard/content", label: "All content" }}
  actions={<Link href="/dashboard/content/new" className="btn-primary">New post</Link>}
  meta={<StatusPill status="DRAFT" />} />
```

### Card / Section
```tsx
<Card title="Recent orders" description="Last 5" actions={<Link …>All</Link>} padded={false} footer={…}>…</Card>
<Section title="Danger zone" description="…">…</Section>
```

### StatCard / Sparkline
```tsx
<StatCard label="Sales (30 days)" value={money(c)} icon={DollarSign} href="/dashboard/analytics"
  delta={{ value: "+12%", trend: "up" }} hint="vs previous 30 days">
  <Sparkline values={daily} label="Daily sales" />
</StatCard>
```

### DataTable
Table on md+, stacked cards on phones. `cell` render functions → keep it in a server component.
```tsx
<Card padded={false}>
  <DataTable rows={entries} rowKey={(e) => e.id!} caption="Posts"
    columns={[
      { key: "title", header: "Title", cell: (e) => <Link href={`/dashboard/content/${e.id}`}>{e.title}</Link> },
      { key: "status", header: "Status", cell: (e) => <StatusPill status={e.status} /> },
      { key: "updated", header: "Updated", align: "right", hideOnMobile: true, cell: (e) => timeAgo(e.updatedAt!) },
    ]}
    empty={<EmptyState icon={FileText} title="No posts yet" compact />} />
</Card>
```

### EmptyState
`<EmptyState icon={Image} title="No images" description="…" action={<button …/>} compact />`

### Badge / StatusPill
`<Badge tone="moss">Published</Badge>` — tones `neutral | ink | signal | moss | rust | amber | muted`.
`<StatusPill status={order.status} />` knows content, lot, order and certificate statuses.

### Toolbar
GET search form (reads `searchParams.q`) + filter slot + right-aligned slot.
`<Toolbar q={q} placeholder="Search…" keep={{ status }} end={`${n} results`}><Tabs … variant="pills" /></Toolbar>`

### Tabs / PanelTabs *(client)*
```tsx
<Tabs current={type} variant="pills" items={[{ value: "POST", label: "Posts", href: "?type=POST", count: 10 }, …]} />
<PanelTabs tabs={[{ id: "content", label: "Content", panel: … }, { id: "seo", label: "SEO", panel: … }]} />
```
PanelTabs keeps hidden panels mounted, so fields in every tab still submit.

### ConfirmButton *(client)* — two-step inline confirm, no `window.confirm`
```tsx
<form action={deleteEntry}><input type="hidden" name="id" value={id} />
  <ConfirmButton confirmLabel="Delete post" prompt="Delete this post?">Delete</ConfirmButton></form>
```
Supports `formAction`, `name`/`value`, custom classes.

### Toasts / messages
- After a redirecting action: `redirect(withFlash("/dashboard/media", "3 images uploaded"))`
  (tone `"error" | "info"` optional). `<FlashToast />` is mounted once by the layout.
- With `useActionState`: `<ActionMessage state={state} />` for inline `{ error?, ok? }`, or render
  `<Toast message=… tone=… onClose=… />` *(client)* yourself.
- `ActionForm` (`src/components/forms/ActionForm.tsx`) still works for simple forms.

### Form fields
```tsx
<FormSection title="Contact" description="Shown on the contact page.">
  <TextField name="email" label="Support email" type="email" defaultValue={b.email} hint="Leave empty to hide" />
  <TextArea name="pickupNote" label="Pickup note" rows={3} defaultValue={b.pickupNote} />
  <Toggle name="enabled" label="Show announcement bar" defaultChecked={a.enabled} />
  <Field label="Tone" htmlFor="tone"><Select id="tone" name="tone" defaultValue={a.tone}>…</Select></Field>
</FormSection>
```
Always use `Select` from `src/components/ui/Select.tsx` for dropdowns.

### SaveBar *(client)*
Sticky Save/Discard bar for long forms; last child of the `<form>`. Appears once the form is edited,
warns before leaving with unsaved changes, `Discard` resets the form.
```tsx
const [state, action] = useActionState(saveHome, undefined);
<form action={action}>…<SaveBar resetKey={state?.savedAt} message={state?.error} /></form>
```
`bleed={false}` when the form sits inside a Card.

### ComingNext
Placeholder body used by the unbuilt pages. Delete it from a page when you build the section.

### Charts — `src/components/admin/charts.tsx` (server)
Hand-written SVG, no dependencies. Each is a `<figure>` whose SVG has `<title>`/`<desc>`, native hover tooltips and a
"Show data table" fallback.
```tsx
<LineChart title="Revenue per day" labels={["Sep 1", …]} format={(c) => money(c)}
  series={[{ label: "Revenue", values }, { label: "Previous", values: prev, dashed: true, area: false }]} />
<BarChart title="Orders by status" items={[{ label: "Pending", value: 3, href: "…", className: "text-signal" }]} />
<HBarChart title="Revenue by category" items={[{ label: "Tools", value: 120000, note: "12 sold" }]} format={money} />
```
`hideTitle` when the chart sits in a titled Card (the title still labels the SVG).

### List controls — `src/components/admin/ListControls.tsx` (server)
`<SortHeader base params field sort dir>` (column header link), `<Pagination base params page perPage total>`,
`<RangeSwitcher base current />` (7/30/90 days via `?range=`), `<FilterButtons clearHref active />` (Apply/Clear for
Toolbar filter inputs that join the search form with `form="toolbar-form"`).

### CopyButton *(client)* — `src/components/admin/CopyButton.tsx`
`<CopyButton text={email} label="Copy email" showLabel? />` (Clipboard API with a textarea fallback).

### Commerce helpers
- `src/lib/commerce.ts` (pure): `parseRange/rangeWindow/bucketByDay/chunk/delta/pct`, `REVENUE_STATUSES`
  (CONFIRMED/SHIPPED/DELIVERED = revenue), `ORDER_STATUS_LABEL`, `PAYMENT_LABEL`, `DELIVERY_LABEL`, `CARRIERS`, `isPaid()`,
  `parseOrderFilters/orderWhere` (shared by the orders page and the CSV route), `parseSort/parsePage/qs/csvCell`,
  `promoState`, `AUDIT_LABEL/AUDIT_AREAS/auditLabel`.
- `src/lib/metrics.ts` (server): `salesMetrics(win)` (revenue, orders, AOV, new customers, bids — current vs previous
  period, daily series) and `categoryRevenue(win)`.

### Shell & nav
`AdminShell` *(client)* is rendered by `src/app/dashboard/layout.tsx` (guards with `requireStaff()`, computes
sidebar badges: Inbox = pending certificates + unhandled inquiries, Orders = AWAITING_PAYMENT). Sidebar
collapse state is a cookie (`pp_admin_nav`). Add sections to `ADMIN_NAV` in `nav.ts` with a `perm` and
optional `badge`. The top-bar search sends users to `/dashboard/orders?q=` or `/dashboard/lots?q=` (both pages
support `q`).

---

## Writing an admin page / action

```tsx
// src/app/dashboard/media/page.tsx
export const metadata = { title: "Media library" };        // the layout adds noindex
export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;                    // Next 15: params/searchParams are Promises
  const { user } = await requireStaff("media", "/dashboard/media");
  …
  return (<><PageHeader title="Media library" … /><Card padded={false}>…</Card></>);
}
```

```ts
// src/app/actions/media.ts
"use server";
export async function uploadMedia(_: State, fd: FormData): Promise<State> {
  const { user } = await requireStaff("media", "/dashboard/media");
  …validate with zod…
  await logAudit(user, "media.upload", …);
  revalidatePath("/dashboard/media");
  return { ok: "Uploaded" };
}
```

Conventions: Server Actions + `useActionState`; return `{ error?: string; ok?: string }`; zod-validate every
input; audit every write; `revalidatePath` what changed (settings already revalidate the whole site);
no new npm dependencies; keep pages responsive (phones first) and use brand tokens (`ink, paper, sand, line,
muted, signal, moss, rust`) and existing classes (`btn-primary, btn-dark, btn-ghost, input, label, card`).

---

## File ownership

| Area | Owner | Files |
|---|---|---|
| Foundation (shared — change only with care, keep APIs backward compatible) | foundation | `src/lib/{permissions,auth,audit,settings,settings-schema,blocks,content,content-model,imageRef,uploads}.ts`, `src/components/admin/*`, `src/components/content/{Blocks,RichText,SiteImage}.tsx`, `src/components/SiteChrome.tsx`, `src/app/dashboard/layout.tsx`, `prisma/schema.prisma` (add models/fields additively only) |
| Content | content agent | `src/app/dashboard/content/**`, `src/app/actions/content.ts` (extend), block editor components (`src/components/admin/editor/**` suggested), public content pages `src/app/{blog,guides,help,legal}/**`, a new `src/app/p/[slug]` for PAGE, `src/lib/blog.ts` |
| Media | media agent | `src/app/dashboard/media/**`, `src/app/actions/media.ts`, `src/components/admin/MediaPicker.tsx`, `src/components/admin/media/**` |
| Site | site agent | `src/app/dashboard/site/**`, `src/app/actions/site.ts`, `src/components/{Header,MobileNav,Footer,AnnouncementBar,NavDropdown,ContactDetails,SiteJsonLd}.tsx`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx`, root metadata in `src/app/layout.tsx`, `src/lib/seo.ts`, business facts in `llms.txt` |
| Commerce / team | commerce agent | redesign of `src/app/dashboard/{page,orders,lots,new,customers,promotions,analytics,settings,inbox}/**`, `src/app/dashboard/{staff,activity}/**`, `src/app/dashboard/LotForm.tsx`, `src/app/actions/{seller,admin,staff,customers,orderAdmin}.ts`, `src/lib/{commerce,metrics}.ts`, `src/components/admin/{charts,ListControls,CopyButton}.tsx` |

If you need a foundation change (new permission, new settings key, new block type), make it additively and
update this document in the same change.

---

## Status: what is wired and what isn't

Done in the foundation:
- Schema, permissions, guards on every existing admin page and action, audit logging on existing actions.
- Settings API with DEFAULTS; content API with TS fallback; block renderer; media backend and route.
- Admin shell, UI kit, placeholder pages, `/admin` redirect, "Store manager" → "Admin", staff see the Admin link.
- Seed: demo manager/editor accounts, content import, default settings rows.

Not yet wired (next agents):
- ~~Public pages read `src/content/*` directly~~ — blog/guides/help/legal/sitemap/llms.txt now use
  `src/lib/content.ts` (content agent); Header/Footer/home/about/contact use `getSettings()` (site agent).
- ~~Staff management, activity log UI~~ — done (commerce agent, below).

Content (done): content manager (tabs/counts/search/status/sort/row actions, import callout), visual block editor
(all 9 block types with inline editors, insert menu, drag & drop + keyboard reorder, duplicate/delete with undo,
paragraph↔heading, Edit/Preview/Split with the public `<Blocks>`, sidebar panels: status & publish, taxonomy, cover,
SEO with snippet preview, danger zone; unsaved-changes guard; Ctrl/⌘+S; phones get Content/Settings tabs), save/
publish/unpublish/duplicate/delete actions with audit + revalidation, `?preview=1` draft previews, public blog/guides/
help/legal + `/p/[slug]`, sitemap and llms.txt on the content API.
Not done / ideas: scheduled publishing (a future publish date is shown but the entry is live immediately); revision
history / autosave; editing author profiles (authors are still `AUTHORS` in `src/content/blog.ts`); help topic blurbs
for new topics; `src/app/site-map/page.tsx`, `src/app/about/page.tsx`, `src/app/c/[slug]/page.tsx` and the homepage
still read `GUIDES`/`LEGAL`/`POSTS` from `src/content/*` directly (owned by other areas); `/p/*` pages are in the sitemap
and llms.txt unless marked "Hide from search engines".

Site (done): all six settings editors + hub with per-area reset; Header/MobileNav/Footer/AnnouncementBar,
homepage, About, Contact, root metadata, Organization JSON-LD and llms.txt business facts read `getSettings()`.
At DEFAULTS the storefront renders as before, except: the announcement strip now sits above the sticky header
(scrolls away) and has a close button; the footer/contact page show contact details when STORE_* env or settings
provide them. Additive foundation changes: `tone` on header nav items + `headerTones()`, `home.order` +
`homeSectionOrder()` (settings-schema), sidebar items under "Site" (nav.ts).
Not done / ideas: per-page SEO overrides for static pages; `pageMetadata()` OG suffix still uses env `SITE_NAME`;
`STORE_HOURS` (schema.org hours) is not editable; no "unsaved changes" prompt on in-app (client) navigation —
only on tab close/reload (SaveBar); header dropdowns open on click (no hover menus).

Media (done): library page with upload/search/filters/grid+list/detail drawer/alt text/usage/bulk actions,
stock + lot photo tabs, media actions, MediaPicker modal (Library/Upload/Stock/Link).
Not done / ideas: image cropping or focal point, replacing a file in place, folders/tags, cleaning up unused
lot photo files on disk, usage scan of lot descriptions (lots only reference `/media/lots/`).

Commerce & team (done):
- **Overview** `/dashboard` — 7/30/90-day switcher (`?range=`), KPI cards with delta vs previous period + sparklines
  (revenue, orders placed, AOV, active auctions, bids placed, new customers, conversion *proxy* = orders per 1,000 lot
  views, labelled as all-time views), revenue/day line chart vs previous period, orders by status, revenue by category,
  "Needs attention" (overdue/awaiting payment, orders to confirm, confirmed-not-shipped, certificates, messages, auctions
  ending in 24h with no bids, sold-out / low Buy Now lots), recent orders, recent activity (owner) or at-risk auctions.
  Editors keep the content overview.
- **Orders** — status tabs with counts, search (order #, buyer name/email/business, PO, lot title), filters (payment,
  delivery, source, date range), sortable columns, pagination, CSV export (`/dashboard/orders/export`, same filters,
  guarded by `requireStaff("orders")`, audit `order.export`). **Order detail** `/dashboard/orders/[id]`: items, totals &
  promo, buyer, copyable ship-to, freight options, payment, timeline (order fields + audit entries), actions (confirm,
  mark paid with method for won auctions, ship with carrier + tracking / update tracking, delivered, cancel with restock
  rules explained, internal notes). **Print** `/dashboard/orders/[id]/print` — invoice / packing slip, print CSS hides the
  admin chrome. Actions: `src/app/actions/orderAdmin.ts`.
- **Lots** — thumbnail table, status tabs, filters (sale type, category, size, real/stock photos, featured), search,
  sort, pagination, bulk publish/draft/feature/unfeature/delete (lots with orders are hidden instead of deleted), inline
  quick edit (Buy Now: price + qty with automatic SOLD_OUT/ACTIVE; auction: Buy Now price). Lot editor: stats strip,
  feature/publish/delete in the header; `LotForm` restyled into cards with a sticky SaveBar (fields/validation unchanged;
  auction mode now posts `available=1` so the shared schema validates).
- **Customers** — list (search, role/certificate/Pro filters, spend/orders/last order, sort, pagination) and detail
  (stats, orders, bids, profile + shipping edit with unique-email check, certificate approve/reject with note, Pro toggle,
  24-hour password-reset link shown to staff — no email is sent; owner-only role change). Managers can't edit or reset
  staff accounts. Actions: `src/app/actions/customers.ts`, `reviewCertificate` in `admin.ts`, `changeRole` in `staff.ts`.
- **Promotions** — stats, list with usage (orders/discount/revenue per code), create (now with optional expiry), edit page
  `/dashboard/promotions/[id]` (terms, active, expiry; code is immutable), pause/activate. Site-wide (sellerId null) codes
  are listed too.
- **Analytics** — range switcher; revenue, orders, AOV (weekly buckets for 90 days), new vs returning buyers, auction
  sell-through / avg bids / final % of retail by category and condition, top lots by revenue / views / bids, category
  performance, promo usage. View counts are all-time and labelled as such.
- **Inbox** — tabs: Resale certificates (approve/reject with note, recently reviewed) and Messages (topic + open/handled
  filters, reopen, mailto reply with the message quoted, copyable email, pagination).
- **Staff** (owner) — team list with role badges and last activity, add staff (new account with a one-time temporary
  password, or promote an existing customer), change role, remove access (→ BUYER); can't change yourself or the last
  owner. Role cards from `ROLE_INFO`/`ROLE_PERMS`. Actions: `src/app/actions/staff.ts`.
- **Activity log** (owner) — filters (person, area, date range), search, pagination, human-readable labels, links to
  orders, lots, customers, promotions, settings and content.
- **Store settings** `/dashboard/settings` (owner) — minimum order, pickup at checkout, store bio (`updateStoreSettings`).
  Store name / warehouse location moved to Site settings → Business profile (`/dashboard/site/business`). The legacy
  `updateStore` action is kept for compatibility but unused.
Not done / ideas: refunds / partial cancellations; editing order lines or freight after checkout; emailing buyers
(reset links, replies and shipping notices are manual); per-day view tracking (conversion stays a proxy); customer CSV
export; bulk order actions; the old `src/app/orders/StatusPill.tsx` is no longer used by the admin.

## Catalogue: categories, subcategories and brands (v0.8)

**Structure.** Department group → Category → Subcategory, plus a Brand on each lot.
- Groups (menu headings): Electronics & Tech, Home & Living, Fashion & Beauty, Everyday & Bulk, Hobbies & Family, Tools, Auto & Industrial. Stored as `Category.group` (free text; the list is `CATEGORY_GROUPS` in `src/lib/taxonomy.ts`).
- 21 standard categories and 112 subcategories are defined in `src/lib/taxonomy.ts` (the seed and the "Add the missing ones" button use it). The database is the source of truth once they exist.
- Brands are NOT subcategories. Put "DeWALT" in the lot's Brand field and file the lot under Tools & Hardware › Power Tools; buyers then filter by brand. Named sources (a retailer's returns) go in the Source field.

**Admin → Catalog → Categories & brands** (`/dashboard/categories`, permission `lots`):
- Overview by group with live/total lot counts, subcategory chips (click to see those lots), ↑/↓ to reorder within a group.
- Edit a category: name, URL slug (locked once it has lots), group, accent colour, one-line description, photo (media library or stock; empty = default photo), "hide from menus".
- Subcategories: rename, reorder, move to another category (its lots move too), delete (lots stay in the category), add.
- Delete a category: requires choosing where its lots go.
- Brands (`/dashboard/categories/brands`): every brand with lot counts; rename one to fix all lots, type an existing brand's name to merge, clear to remove. Likely duplicates ("DeWalt" / "DEWALT") are flagged.
- Lots table: filter by category, subcategory ("No subcategory" finds unsorted lots) and brand; bulk action "Move to category…".
- Lot form: grouped category picker, Brand and Source with suggestions (existing spellings are reused automatically).

**Storefront:** header "Categories" is a mega menu by group (collapsible groups in the mobile menu); `/categories` is grouped with jump links; category pages show subcategories, "Shop by brand" and an empty state; `/lots` filters show groups, counts and a Brand filter; cards show the brand; Product JSON-LD includes `brand`.

**Files:** `src/lib/taxonomy.ts` (standard tree), `src/lib/catalog.ts` (storefront reads, ordering, category photo, brand counts), `src/app/actions/catalog.ts` (admin actions, audit-logged), `src/app/dashboard/categories/*`, `prisma/sample-lots.json` (sample listings, built by `scripts/build-sample-lots.py`).
