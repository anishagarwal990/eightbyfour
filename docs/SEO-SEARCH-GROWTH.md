# SEO Search Growth Engine — rules & runbook

Owner doc for how EightByFour's catalogue pages are titled, canonicalised,
interlinked and measured. Code is the source of truth; this explains the rules
and the routine. Last updated 2026-09-11 (risk-reduction pass).

## 0. Risk-reduction pass (2026-09-11)

Five safeguards added on top of §1-9 below before this went live, all in
`lib/seoProtection.ts` and small edits elsewhere — nothing here is a redesign.

1. **Title safety tiers** (`lib/seoProtection.ts`, used by `buildProductTitle`
   in `lib/productSeo.ts`). Built from `seo/opportunities/latest.json`, not
   hard-coded per URL:
   - **protect** — bucket `protect` (pos ≤ 3.5, CTR at/above half the curve).
     Title stays exactly what it was before this pass
     (`legacyProductTitle()`, reproducing the pre-session algorithm
     unchanged) unless it has a genuine defect — a duplicated word (any
     plural form) or a raw category label leaking through (`" - "`,
     e.g. "Corian - Acrylic Solid Surface") — in which case it falls back to
     the plain heading. `hasTitleDefect()` is the detector.
   - **optimise** — bucket `fix-snippet` (top-3, weak CTR — the snippet, not
     the rank, is the problem) or `striking-distance` (pos 4-10, the
     highest-priority group). Gets the full new title system.
   - **discover** — `page-two`, `long-tail`, or no snapshot row at all. Same
     full system as optimise — there's no existing snippet to protect.
2. **"Price on Request" dropped from titles.** Unpriced SKUs (≈1,994 of
   3,124) now title as the bare identity + type — no qualifier at all. Price
   language stays in the description, the page and the CTA. A qualifier is
   only ever added for a *priced* SKU (`Price & Finishes` / `Sheet Price` /
   `Price & Pack Sizes` / `Price & Specs`), or the legacy `Price in
   Hyderabad` suffix on priced board categories.
3. **Relation-engine caps tightened** — `RELATION_LIMITS` in
   `lib/productRelations.ts`: each of the four groups (other finishes,
   similar shades, same finish, cross-brand alternatives) capped at 6, and
   `guideLinksFor()` (`components/ProductPageView.tsx`) capped at 3. Pinned
   by a test asserting every limit sits in 4-6.
4. **No invented availability.** "In Stock — Hyderabad" → "Check
   Availability — Hyderabad"; the FAQ's "same or next-day delivery" claim
   dropped for a "confirm current availability and delivery timeline" one;
   `ProductSchema`'s Offer no longer sets `availability: InStock` (omitted —
   valid per schema.org, just not eligible for stock-status rich results
   until real inventory data exists). See §7 for what's retained.
5. **Collection-landing quality gate** — `CollectionLanding.indexable`
   (`lib/collectionLandings.ts`), default true. `false` keeps the clean URL
   and the page working for navigation but marks it `noindex` and drops it
   from the sitemap. `seoTitle`/`seoDescription`/`intro` let one range
   override the computed defaults. Two ranges gated off today (EightxFour's
   own merchandising labels, not externally recognised range names) — see §4.

## 1. Why

## 1. Why

Search Console, 28 days to 2026-09-08 (`sc-domain:eightbyfour.com`):

| Segment | Pages | Impressions | Clicks | CTR | Avg pos |
|---|---:|---:|---:|---:|---:|
| Product pages (`/products/{sku}`) | 882 | 9,715 | 387 | 3.98% | 8.0 |
| — of which position 5–10 | 516 | 6,249 | 145 | 2.32% | — |
| — of which position 1–3 | 78 | 586 | 105 | 17.9% | — |
| Brand pages | 63 | 873 | 18 | 2.06% | 24.4 |
| Guides | 12 | 673 | 2 | 0.30% | 41.2 |

Product pages are the organic channel. Most of them sit on page 1 below the
top three, where a result earns a fraction of the clicks a top-3 one does. The
queries they show for are brand + code ("21317 merino", 869 impressions, 0.23%
CTR) and bare codes ("5314 sud"). The job is to move page-1 SKUs into the top
five and convert the impressions they already get — not to publish more pages.

Device check: on the 164 product pages with both mobile and desktop
impressions, the impression-weighted position is 9.9 mobile vs 10.4 desktop.
The site-wide gap (7.8 vs 13.7) is query mix — desktop carries more generic
and guide queries ranking deep — not a rendering or layout difference.

## 2. Product metadata rules — `lib/productSeo.ts`

All deterministic, built only from fields on the row, pinned by
`lib/productSeo.test.ts`.

| Piece | Rule | Example |
|---|---|---|
| Identity | brand + shade code + shade name (+ finish code when the SKU is sold in one finish). No code: display name + collection as disambiguator. Brand/code never doubled. | `Merino 22153 Saga Green` · `Virgo 1987 Coined SHG` |
| Heading (H1, schema `name`) | identity + product type, unless the identity already says it | `Merino 22153 Saga Green Laminate` · `Century Laminates 3903 French Cambric LN` |
| Title | protect tier: pre-existing title, defect-fixed only if needed. optimise/discover: heading + ` — ` + one qualifier, only if the whole title is ≤ 70 chars | `Merino 22153 Saga Green Laminate — Price & Finishes` |
| Description | identity + finishes by name + price/thickness/size + commercial close, ≤ 155 chars, always a whole sentence — not tier-gated | `Merino 22153 Saga Green laminate in Standard, Feather Touch (FT) and MR+ finishes — ₹1300/sheet, 1mm, 8×4 ft. Project pricing and Hyderabad delivery.` |

Title qualifier for optimise/discover-tier pages — picked from what the row can back up:

| Row | Qualifier |
|---|---|
| priced, several finishes | `— Price & Finishes` |
| priced per sheet | `— Sheet Price` |
| priced per pack (adhesives) | `— Price & Pack Sizes` |
| priced otherwise | `— Price & Specs` |
| no rate on file | *(none — bare heading; see §0.2)* |
| priced board category (plywood, MDF/HDHMR, blockboard, boil board, NFC, birch) | ` Price in Hyderabad` — the pre-existing format, unchanged |

Falls back to `— Price`, then to the bare heading. `buildMetadata` (lib/seo.ts)
adds ` | Eight x Four` only when the total fits 60 chars.

**Catalogue-wide title-qualifier usage (2026-09-11, 3,124 products):** 2,021
bare heading (no qualifier — mostly the 1,994 unpriced SKUs, §0.2), 806 Sheet
Price, 189 Price & Finishes, 63 Price & Specs, 35 Price in Hyderabad, 10 Price
& Pack Sizes. **Safety-tier distribution:** 45 protect, 456 optimise, 2,623
discover. Of the 45 protect-tier pages, 29 keep their pre-session title
verbatim and 16 get the defect-fixed heading (all a "Century Laminates …
Laminate" redundancy).

Product types: "Corian - Acrylic Solid Surface" → `Solid Surface`,
"MDF and HDHMR" → `Board`, other categories their singular.

Finish names come from `lib/finishGlossary.ts` — only codes a repo source
defines (Merino and Greenlam finish guides, Virgo's spec rows). Century
Laminates codes (SU, LU, SI…) are shown bare; nothing is guessed.

Catalogue-wide check on 2026-09-11 (3,124 products): 0 duplicate titles,
0 titles over 78 chars, 0 descriptions over 155, 0 leaked `null`/`undefined`.

## 3. Canonical & indexation

| URL | Indexed | Canonical | Sitemap |
|---|---|---|---|
| `/products/{sku}` | yes | self | products.xml |
| `/products/{category}` | yes (noindex while empty) | self | categories.xml |
| `/products/{category}/page/{n}` | yes | self | categories.xml |
| `/products/{category}/page/1` | — | 308 → `/products/{category}` | — |
| `/products/{category}/collections/{range}[/page/{n}]` | yes (noindex under 20 SKUs) | self | categories.xml |
| `/products/{category}?collection={range with a landing}` | — | 308 → the landing page (page N → landing page N) | — |
| `/products/{category}?collection={anything else}` | no | `/products/{category}` | — |
| `…?collection=` matching no products | noindex, follow | `/products/{category}` | — |
| `/brands/{brand}`, `/brands/{brand}/page/{n}` | yes | self | brands.xml |
| `/brands/{brand}?category=` | — | `/brands/{brand}` | — |
| `/search` | robots.txt disallow | — | — |

No product URL is canonicalised to another. The 9 brand+code "duplicates" in
the catalogue were checked: they are different finishes or different designs
sharing a code (e.g. Merino 22133 Standard/FT vs MR+), so each stays
self-canonical and they now link to each other ("Also available as").

Hosts: production is `https://www.eightbyfour.com`. Vercel 308s
`http://` → `https://` and apex → `www`, and strips trailing slashes. Every
canonical, `og:url`, sitemap `<loc>` and JSON-LD URL is built from `SITE_URL`.
`http://eightbyfour.com/…` takes two hops (http→https, then apex→www); a
single hop needs the apex domain set to redirect straight to
`https://www.eightbyfour.com` in Vercel → Domains. Mixed-case paths
(`/Products/…`) render with the lowercase canonical; none appear in Search
Console.

## 4. Collections — `lib/collectionLandings.ts`

A `?collection=` value earns the clean URL and its own page only when all of
these hold:

1. It's a real range name — not `other`, not the category's own name (Merino's
   "Laminates"), not a generic label ("HPL"), not a bare 2–4 letter code
   ("GL", "ZMT").
2. It has ≥ 20 live SKUs.
3. It isn't the brand's whole catalogue in that category (that's the brand
   page — e.g. Sky Decor "Liner Laminates").
4. Its slug is unique in the category. Laminate ranges are brand-prefixed
   (`merino-luvih`).

29 ranges clear 1-4 today (20 laminate, 8 veneer, 1 solid surface). Everything
else remains a filter chip.

Clearing 1-4 earns the page; a fifth rule (the **quality gate**, `indexable`
on `CollectionLanding`) decides whether it's actually indexed: the range has
to be a real, externally recognised customer/search concept — a
manufacturer's own named range, or an established category-wide grouping
people search by name (several of the 29 are confirmed by real Search
Console queries — "designer veneers" among them) — not just an SKU count
past the threshold. **27 of the 29 are indexable; 2 are gated off**
(`eightbyfour-acrylic`, `eightbyfour-masters-wood-grains`) because they're
EightxFour's own merchandising labels for its house brand, not a name a
customer searches by. A gated range still gets its clean URL, still renders,
still works for on-site navigation — `indexable: false` only sets `noindex`
and drops it from the sitemap; it doesn't touch the architecture. `seoTitle`
/ `seoDescription` / `intro` on the same interface let one range override the
computed defaults when the generic summary undersells it (unused today).

To add a range: add an entry to `COLLECTION_LANDINGS`, run `npm test`. The
route, the 308 from the old `?collection=` URL, the category/brand links and
(if `indexable` isn't `false`) the sitemap entry follow.

Each landing's title, description and intro are counted from its own SKUs
(`lib/rangeSummary.ts`): design count, code span, finishes, lowest listed
rate — never the category's copy — unless overridden.

## 5. Internal linking

Product page (`lib/productRelations.ts`, rendered by `components/ProductExplore.tsx`).
Deliberately small — a SKU page is a product page, not a catalogue directory
— each of the four relevance groups capped at 4-6 (`RELATION_LIMITS`,
pinned by a test):

1. **Also available as** — same brand + code in other finishes, in the first
   screen (≤ 6).
2. **Similar {brand} shades** — nearest design codes, same range first, one row
   per design (≤ 6). Replaces a block that linked every Merino page to the
   same four SKUs.
3. **More {brand} designs in {finish}** — where the finish distinguishes the
   SKU (≤ 6).
4. **Similar {family} shades from other brands** — same category, same shade
   family read from the name (green, walnut, marble…), spread across brands
   (≤ 6). Boards compare against other brands in their category. "Same
   collection/range" is covered by group 2 (which already prefers the SKU's
   own range) and by the "Keep exploring" link to that range's own landing
   page, rather than a fifth product-card group.
5. **Keep exploring** — brand hub, range landing, category hub (plain links,
   not counted against the caps above).
6. Breadcrumb: Home › Products › {Category} › {Brand} › {SKU}; the UI trail and
   `BreadcrumbList` come from one array.
7. Up to 3 guides for the category and brand (`lib/brandGuides.ts`).

Worst case, the relation engine puts ≤ 24 product cards on a page. In
practice it's fewer — a real Merino SKU page carries about 18 (a small pool
means several groups don't fill their cap). The rest of a page's
`/products/*` links come from the site-wide brand mega-menu in the header
(present on every page, including ones with no product content at all — e.g.
`/about`), which is outside this branch.

Hubs:
- Category and brand pages list **Most searched** SKUs from the opportunity
  snapshot (section 8), and the brand's / category's range landings.
- Guides and comparisons end with a product grid for the brands and
  categories they discuss, high-opportunity SKUs first.

Relation pools are cached per build worker (`lib/data/poolCache.ts`), so the
product-page build downloads each brand's range once, not once per SKU.

## 6. Structured data

- `Product` — priced SKUs only (or SKUs with reviews): Google rejects an
  `Offer` without a price, and no price is invented. `name` = the H1;
  `sku`/`mpn` = shade code; `offers` net of the published discount with the
  seller; `image` = real product photos only, absolute URLs (brand-logo
  stand-ins excluded); `additionalProperty` = finish(es), thickness, sheet
  size, range, grade, core, certifications, applications — only fields on the row.
- `BreadcrumbList` — mirrors the visible breadcrumb.
- `CollectionPage` + `ItemList` — category, category page N, range landings;
  items are exactly the products rendered.
- `FAQPage` on product/category/brand pages (kept; answers are the visible FAQ).
- `HomeAndConstructionBusiness` + `WebSite` sitewide (unchanged).

## 7. Conversion & analytics

CTA copy: priced SKU → **Get Project Pricing**; unpriced → **Get Today's
Price** and a "Price on Request" price block; secondary **WhatsApp for Quote**;
"Have a BOQ or a full material list?" opens the quote modal with upload. A
three-line pricing/delivery band (project quantities, multi-brand quote,
Hyderabad delivery) sits under the product hero. No superlatives.

**Availability claims — audited, none invented.** EightxFour is a
procurement platform without verified real-time inventory per SKU, so no page
or schema block claims stock:
- `ProductSchema`'s Offer carries no `availability` field (omitted, not
  faked — schema.org marks it optional; the Offer stays valid).
- The product page's certification/warranty badge reads "Check Availability
  — Hyderabad", not "In Stock".
- The "Where can I buy…" FAQ asks the reader to "request a quote and we'll
  confirm current availability and delivery timeline" instead of promising
  "same or next-day delivery".
- Retained: "first response in under 15 minutes during business hours" (a
  quote-response SLA the business controls directly, not an inventory or
  delivery-speed claim) appears on the product FAQ, the price box and the
  quote form; this predates this SEO pass and wasn't touched.
- Not part of this branch, flagged not changed: the homepage/about-page
  "SKUs In Stock" stats and "Same/Next-Day" delivery badge, the studio
  laminate-pressing page's "same-day" turnaround line, and three "confirmed
  rate comes back the same day" lines in `lib/pricePages.ts` — all
  pre-existing site-wide copy outside the SEO-page surface this branch
  touches. Also flagged: `app/api/google-merchant-feed/route.ts` hardcodes
  `availability: "in_stock"` for every priced product in the Google Shopping
  feed — a live, outward-facing signal this branch doesn't modify; needs a
  business decision (real inventory data, `backorder`, or excluding
  unconfirmed SKUs from the feed) before it's accurate.

Events (GA4 + Meta via `lib/analytics.ts`, no new framework):

| Event | Where | Key params |
|---|---|---|
| `product_view` | product page | `product_slug`, `brand`, `category`, `product_code`, `price_shown` |
| `quote_modal_open` | every quote CTA, incl. the product page's inline form | `source` (label), `cta_location`, product context |
| `quote_request` | submit (single + list) | `cta_location` / `modal_source`, `product_slug`, UTM |
| `whatsapp_click` | every WhatsApp CTA | `source`, `cta_location`, product context |
| `boq_file_attached` | file added in the modal | `file_type`, `file_kb` |
| `phone_click` | tel links | `source` |

`cta_location` values: `product_price_box`, `product_price_box_boq`,
`product_pricing_band`, `product_alternatives`, `category_hero`,
`collection_hero`, `brand_hero`, `guides_products`, `comparisons_products`,
`mobile_sticky_cta` (source). In GA4, register `cta_location`,
`product_slug` and `price_shown` as event-scoped custom dimensions.

## 8. Opportunity framework — `lib/seoOpportunity.ts`

`Opportunity = Impressions × Position Opportunity × CTR Gap`

- Position opportunity: 1.0 at positions 4–10, 0.7 at 11–15, 0.4 at 16–20,
  0.25 in the top 3 (protect, don't churn), 0.1 beyond 20.
- CTR gap: expected CTR at position 3 (a conservative curve) minus actual CTR.
- Buckets: `protect`, `fix-snippet` (top 3, clicked under half the curve),
  `striking-distance` (4–10), `page-two` (11–20), `long-tail`.

Monthly routine:

1. Search Console → Performance → Pages, last 28 days → Export CSV.
2. `node scripts/seo/opportunities.mjs ~/Downloads/Pages.csv --start YYYY-MM-DD --end YYYY-MM-DD`
3. Review the printed top 25, commit `seo/opportunities/latest.json`, deploy.

The "Most searched" hub links and guide grids follow the new snapshot on
deploy — pages that reached the top 3 drop out, new page-1/page-2 SKUs come in.

## 9. Search Console monitoring

Compare 28-day windows against the 2026-08-12 → 2026-09-08 baseline above,
product pages filtered with page contains `/products/`:

- **Clicks and CTR on product pages** — the primary success metric.
- **Position 5–10 band** — count of product URLs, their impressions and CTR.
  Success = the band shrinks because URLs moved up, and its CTR rises.
- **Top-5 product URLs** — count with position ≤ 5.
- **Brand + code queries** — query regex `\d{3,6}`; CTR (0.23% at baseline).
- **Non-branded transactional queries** — queries without a brand or code
  (e.g. "laminate price", "designer veneers").
- **Parameter URLs** — pages containing `?`: should decline towards zero as the
  canonicals and 308s are processed (68 at baseline).
- **Indexing → Pages** — "Alternate page with proper canonical tag" will rise
  (the filter URLs) — expected; "Duplicate without user-selected canonical"
  should not. Indexed product count should hold at ~3,100.
- **Sitemaps** — all four child sitemaps "Success"; content.xml was failing
  (HTTP 500) before 2026-09-11 and should now report its URLs.
- **Conversions** — GA4 `quote_request` and `whatsapp_click` from organic
  sessions, by `cta_location` and landing page.

Re-baselining: the product H1 changed on 2026-09-03 (code-led) and again on
2026-09-11 (brand + code + shade + type), alongside titles, descriptions and
internal links. The 2026-09-24 decor-code re-check
(`seo/baselines/decor-code-baseline-2026-09-03.md`) now measures the combined
change; read positions from 2026-10-09 onward (four weeks after deploy) before
judging it.

## 10. Known gaps (data, not code)

- 1,994 SKUs have no rate on file (Century Laminates, Greenlam, veneers, most
  solid surface). They say "Price on Request" and can't carry Product rich
  results until priced.
- ~1,100 Century Laminates / Virgo rows show a brand-logo stand-in instead of
  the shade swatch.
- 9 brand+code pairs are shared by different designs or misspelt names
  (e.g. Merino 22133 "Loto Green"/"Lotto Green", Greenlam 9006) — worth
  cleaning at source.
