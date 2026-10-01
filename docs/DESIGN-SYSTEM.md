
# Flat admin design system (PalletPort style)

A calm, flat, high-contrast UI: navy ink, one orange accent, grey "sand" surfaces, white cards, rounded corners, **no shadows, gradients or decorative lines**. Everything works from 320px phones to wide desktops. Stack: Next.js App Router + React + Tailwind v4 + lucide-react, but the rules are framework-agnostic.

Follow these rules for every new screen. When a rule and a request conflict, ask; don't silently break the system.

---

## 1. Design tokens

Define once (Tailwind v4 `@theme` in `globals.css`) and use only these names in markup. Never hard-code a new hex in a component.

```css
@import "tailwindcss";
@theme {
  --color-ink: #13233f;          /* text, dark surfaces, sidebar, primary dark buttons */
  --color-ink-2: #213557;        /* hover for ink surfaces */
  --color-paper: #ffffff;        /* page background (storefront), cards (admin) */
  --color-sand: #f4f5f7;         /* secondary surface: admin canvas, storefront cards, ghost buttons */
  --color-line: #eceef1;         /* the rare divider, empty toggle track */
  --color-muted: #5b6472;        /* secondary text, labels, captions */
  --color-signal: #f0641e;       /* THE accent: primary buttons, active states, focus, links hover */
  --color-signal-dark: #cf4f0e;  /* accent hover + accent-coloured text (AA on white) */
  --color-moss: #2d6a4c;         /* success / positive / published */
  --color-rust: #b3371f;         /* error / destructive / negative */
  --font-display: var(--font-grotesk), ui-sans-serif, system-ui, sans-serif; /* Space Grotesk */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;      /* Inter */
}
```

**Colour roles (strict):**

| Role | Token | Use |
|---|---|---|
| Text | `ink` | body + headings |
| Secondary text | `muted` | descriptions, labels, meta, table headers |
| Accent | `signal` | one primary action per view, active nav, focus rings, key numbers in charts |
| Accent text | `signal-dark` | text links, accent text on white/tint (contrast) |
| Success | `moss` | positive deltas, "Published/Active/Delivered", toggles on |
| Danger | `rust` | errors, destructive confirm text, negative deltas |
| Warning | `amber-100 / amber-800` | the only non-token colour allowed (pending/attention badges) |

Tints are made with opacity on tokens, never new colours: `bg-signal/15`, `bg-moss/12`, `bg-rust/10`, `bg-ink/60` (overlay), `text-white/60` (on ink).

**Surface inversion rule:** storefront = white page + `sand` cards. Admin = `sand` canvas + **white** cards + `ink` sidebar + white top bar. Inside floating panels (menus, dropdowns), the panel is `sand` and hovered/selected items flip to white.

## 2. Typography

- Fonts: **Space Grotesk** (display: headings, numbers, brand) + **Inter** (everything else). Load with `next/font`, expose as `--font-grotesk` / `--font-inter`.
- Scale (Tailwind classes):
  - Page title `h1`: `font-display text-2xl sm:text-3xl font-bold leading-tight` (storefront heroes up to `text-5xl`)
  - Section / card title: `font-display text-base font-bold` (storefront section `text-2xl sm:text-3xl`)
  - Body: `text-sm` (admin), `text-[15px]`/`text-base` for reading pages
  - Description under a title: `text-sm text-muted sm:text-[15px]`
  - Label / eyebrow / table header: `text-xs font-semibold uppercase tracking-wider text-muted`
  - Badge: `text-[11px] font-semibold`
  - KPI value: `font-display text-2xl font-bold tabular-nums`
- Numbers that line up (money, counts, tables): `tabular-nums`.
- Long strings: `break-words` / `truncate` + `min-w-0` on the flex/grid child. Never let text widen a layout.
- Form text is `text-base` on phones (stops iOS zoom), `sm:text-sm` above.

## 3. Shape, spacing, depth

- Radius: cards/sections `rounded-2xl`; inputs, icon buttons, nav items `rounded-lg`; buttons, badges, pills, tabs `rounded-full`; toasts `rounded-xl`.
- **Flat:** no `shadow-*`, no gradients, no borders on cards. Separation comes from surface colour (white on sand / sand on white) and spacing. The one bordered element is the form input (1px `#cfd4dc`, so a field always reads as a field).
- Spacing rhythm (4px base): card padding `p-4 sm:p-5`; card header `px-4 py-3.5 sm:px-5`; page padding `px-4 py-6 sm:px-6 sm:py-8 lg:px-8`; gaps `gap-2` (controls), `gap-3/4` (tiles), `gap-6` (card grid); page header bottom margin `mb-6 sm:mb-8`.
- Content width: `mx-auto w-full max-w-7xl`. Reading width `max-w-3xl`.
- Z-index ladder: sticky header 30 · desktop sidebar 40 · mobile drawer 60 · toast 70 · skip link 80.

## 4. Component recipes (copy these)

```css
@layer components {
  .btn-primary { @apply inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-signal text-white hover:bg-signal-dark; }
  .btn-dark    { @apply inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 bg-ink text-white hover:bg-ink-2; }
  .btn-ghost   { @apply inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 bg-sand text-ink hover:bg-[#e8eaee]; }
  .input { @apply w-full min-w-0 rounded-lg border border-[#cfd4dc] bg-white px-3.5 py-2.5 text-base sm:text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 hover:border-[#aab1bd] focus:border-signal focus:ring-3 focus:ring-signal/20 disabled:bg-sand disabled:text-muted aria-[invalid=true]:border-rust; }
  .label { @apply mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted; }
  .card  { @apply rounded-2xl bg-sand; }                 /* storefront card */
  .container-pp { @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8; }
}
@layer base { .grid { grid-template-columns: minmax(0, 1fr); } } /* grids can never overflow a phone */
```

Buttons: one `btn-primary` per view (the main action). Secondary = `btn-ghost`. Dark CTA on light heroes = `btn-dark`. Compact rows use `py-2`. Destructive actions are text-first (see ConfirmButton), never a big red button.

### Admin building blocks (one component each, reused everywhere)

| Component | Recipe |
|---|---|
| **AdminShell** | Sidebar `bg-ink text-white w-64` (collapsible to `72px`, remembers state), grouped nav with `text-[11px] uppercase tracking-wider text-white/40` group labels; item `min-h-10 rounded-lg text-sm`, active = `bg-white/10` + orange icon + 2px orange bar on the left; count badges `rounded-full bg-signal text-white text-[11px]`. Top bar `sticky top-0 bg-white h-14` with search, "View site", account. Mobile: hamburger → slide-in drawer `w-[min(18rem,86vw)]` over `bg-ink/60`. Skip link to `#admin-main`. |
| **PageHeader** | back link (`text-xs text-muted` + chevron) · optional eyebrow · `h1` · description · meta row · actions on the right (wrap under on phones). |
| **Card** | `rounded-2xl bg-white`; optional header (title + description + actions), body `p-4 sm:p-5` or `padded={false}` for edge-to-edge tables; footer `bg-sand/30`. |
| **StatCard** | label `text-xs text-muted` + icon top-right, value `font-display text-2xl tabular-nums`, delta with arrow (`moss` good / `rust` bad / `muted` flat; `good:"down"` flips it), optional sparkline slot, whole tile is a link when `href`. KPI rows: `grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4`. |
| **Badge / StatusPill** | `rounded-full px-2.5 py-0.5 text-[11px] font-semibold`; tones: neutral `bg-sand`, ink, signal `bg-signal/15 text-signal-dark`, moss `bg-moss/12 text-moss`, rust `bg-rust/10 text-rust`, amber, muted. StatusPill adds a 1.5px dot and maps every status to one tone in ONE table (e.g. PENDING→signal, CONFIRMED→ink, DELIVERED/PUBLISHED/ACTIVE→moss, CANCELLED/REJECTED→rust, DRAFT→muted). |
| **DataTable** | Real `<table>` from `md:` (`thead bg-sand/40 text-xs uppercase tracking-wider text-muted`, cells `px-4 py-3`, row hover `bg-sand/25`, horizontal scroll with `minWidth`); **below md it becomes stacked cards**: first column as the title, the rest as a `dl` label/value grid. Right-align money/counts. Always pass `empty`. |
| **Toolbar + Pagination + SortHeader** | search input with icon (`input pl-9`, `sm:w-72`), filter selects, result count on the right; sortable headers with up/down icons; pagination "x–y of n · Previous · Page n of m · Next" — **every list is paginated, no exceptions**. Filters/sort/page live in the URL (`?q=&status=&sort=&dir=&page=`). |
| **Tabs** | underline variant (`border-b-2`, active `border-signal text-ink`, inactive `text-muted`) or pills (active `bg-ink text-white`, inactive `bg-white`); optional count chip; scroll sideways on phones with hidden scrollbar. |
| **Forms** | `Field` = label + control + hint/error (`text-xs`, error `text-rust`, `aria-invalid`). `FormSection` = two columns on `lg` (title+description left 1fr, fields right 2fr), stacked on phones. `Toggle` = switch (`h-6 w-11`, on = `moss`). Long forms end with a **SaveBar**: sticky bottom, white/95 + blur, appears only when something changed, "Discard" + "Save", warns before leaving with unsaved edits. |
| **Feedback** | Toast: bottom-right (bottom-centre on phones), white, `rounded-xl`, icon + text + close, auto-hides after 5s; `role="status"` (errors `role="alert"`). After a server action: redirect back with a flash message. |
| **ConfirmButton** | destructive actions confirm **in place**: click → shows "Delete this lot?" (`text-rust`) + confirm + cancel. No modal, no browser `confirm()`. |
| **EmptyState** | icon in a `h-12 w-12 rounded-2xl bg-sand` tile, `font-display text-lg` title, one helpful sentence, one action. Never an empty table. |
| **Charts** | hand-made SVG, `currentColor`: first series `text-signal` (area at 12% opacity), comparison `text-ink/40` dashed; bars `text-ink`, highlight `text-signal`; 2px strokes, rounded caps, hover column highlight, legend as small line swatches, always a readable text fallback. |

### Storefront additions
Header with mega-menu (panels `sand`, items flip to white, fade+slide `pp-pop-in`), lot/product cards (`sand`, rounded-2xl, facts as label-left / value-right rows), sticky-free section tabs with `bg-sand` pills, single-open FAQ accordions, pagination under every grid.

## 5. Layout & responsive rules

- Mobile-first. Test at **320, 360, 768, 1024, 1280, 1440**. Zero horizontal scroll at any width (`document.documentElement.scrollWidth === innerWidth`).
- Every flex/grid child that holds text gets `min-w-0`. Use `grid-cols-[minmax(0,1fr)_...]`, never bare `auto` columns for text.
- Tables become cards below `md`; toolbars wrap; action groups wrap under titles.
- Tap targets ≥ 40px for primary controls, ≥ 24px for small text links (invisible `::after` hit area).
- Respect safe areas on phones (`env(safe-area-inset-*)`) for drawers, toasts and sticky bars.

## 6. Interaction & motion

- Transitions: colours 150ms; panels/drawers 200–320ms with `cubic-bezier(0.22,1,0.36,1)`; accordions animate `grid-template-rows 0fr→1fr`.
- Only one accordion item open at a time.
- Everything decorative sits under `@media (prefers-reduced-motion: no-preference)`.
- Focus: visible everywhere — `focus-visible:outline-2 focus-visible:outline-signal` (inputs use the orange ring). Never remove outlines without a replacement.
- Brand details: orange scrollbars on a sand track, orange text selection.
- Loading: skeletons in the shape of the final layout (sand blocks), not spinners; never put a loading boundary above a page that can 404.

## 7. Accessibility (non-negotiable)

- Semantic landmarks: `header`, `nav` with `aria-label`, `main` with an id + skip link, one `h1` per page, headings in order.
- Icons are `aria-hidden`; icon-only buttons have `aria-label`; collapsed-sidebar labels become `sr-only`.
- Colour is never the only signal (status pills carry text; deltas carry arrows).
- Contrast AA: accent text uses `signal-dark`, not `signal`, on white.
- Forms: every input has a `<label>`, errors use `aria-invalid` + text; switches use `role="switch"`.
- `aria-current="page"` on active nav/tabs/pagination; tables have a `caption` (can be `sr-only`).

## 8. Content & copy

- Plain, short, specific: "Mark as shipped", not "Submit". Buttons are verbs; titles are nouns.
- Descriptions explain the *why* in one sentence ("Discount codes buyers enter at checkout.").
- Human labels for data: "Wire / ACH", "Pending" — never raw enums like `WIRE`, `PENDING`.
- Empty states and errors tell the user what to do next.
- Never invent business facts (addresses, reviews, policies, ratings). Show nothing until real data exists.

## 9. Architecture habits that keep it clean

- One shared component per pattern (Card, PageHeader, DataTable, Badge…) exported from `components/admin/index.ts`; pages compose them, pages don't restyle them.
- Server components by default; client components only for interaction (drawer, SaveBar, toasts, charts hover).
- Every admin page checks permissions (`requireStaff(perm)`), every change writes an audit log entry and redirects with a flash message.
- State that should survive reloads or be shareable (filters, tabs, page) lives in the URL.

## 10. Pre-flight checklist (run before calling a screen done)

1. Only token colours used? No shadows/gradients/borders on cards?
2. One primary button? Destructive actions confirm in place?
3. List paginated, with empty state, search/filter in the URL?
4. Works at 320px with no sideways scroll; table turns into cards below `md`?
5. Keyboard: tab order sensible, focus visible, skip link works?
6. Labels human, numbers `tabular-nums`, long text truncates or wraps?
7. Loading, error, empty and success states all designed?
8. Reduced-motion respected?
