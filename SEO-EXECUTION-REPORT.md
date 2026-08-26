# EightByFour — Traffic Acquisition Execution Report

**Date:** 26 August 2026 · **Scope:** Steps 1–7 and 13 of the execution plan (audit → price-page architecture → first cluster → BOQ hero page → internal linking → metadata/schema/sitemap → analytics).

Everything below was verified against the live Supabase catalogue (3,118 products) and a full `next build` (3,330 static pages, clean).

---

## A. Audit findings

### What already existed — and is good

This is not a bare site. Substantial SEO infrastructure was already in place and was **reused, not rebuilt**:

| System | State |
|---|---|
| Metadata | `lib/seo.ts` — shared `buildMetadata()` with canonical, OG, Twitter, three-tier title-length handling, description padding/truncation. Genuinely well built. |
| Sitemaps | Already segmented (`content` / `products` / `categories` / `brands`) via `app/sitemap.xml` + `app/sitemap/[id]`, with real per-row `lastModified`, paginated + collection-filtered category URLs included, noindexed empty categories excluded. |
| Schema | Breadcrumb, FAQ, Product, Organization (`HomeAndConstructionBusiness`), WebSite+SearchAction, Service, CollectionPage — all present and correctly scoped. |
| Content system | MDX-driven `/guides`, `/comparisons`, `/applications`, `/hyderabad` with frontmatter-driven cross-linking. |
| Pagination | `/products/[slug]/page/[N]` and `/brands/[slug]/page/[N]` with rel=next/prev and canonical handling in `lib/categoryPagination.ts`. |
| Quote flow | `QuoteModalContext` with file upload (20MB, Excel/PDF/Word/CSV/images), Supabase `inquiries` logging, UTM capture, WhatsApp handoff. |
| Analytics | Single `trackEvent()` dispatcher for GA4 + Meta Pixel with a deliberate split between engagement and conversion events. |

### What was missing

1. **No price pages at all.** The highest commercial-intent query class in this category ("18mm plywood price Hyderabad", "laminate price Hyderabad") had no landing page. Ads had nowhere to point.
2. **Supplier pages were thin.** `/hyderabad/plywood-supplier` was ~250 words of prose with zero products, zero prices, zero specs — a page that could not out-rank a directory listing.
3. **BOQ procurement — the single most differentiating page on the site — was a generic MDX page** with the same five headings as every other Hyderabad page. It did not explain the proposition.
4. **Product pages captured no price intent.** `century-sainik-710-ply` titled "Century Sainik 710 BWR Plywood" — invisible to "century sainik 710 price".
5. **No funnel instrumentation between page view and quote submit.** `quote_request` fired only on submit; nothing measured modal opens or BOQ attachments, so there was no way to tell a landing-page problem from a form problem.

### What was broken

| Issue | Detail |
|---|---|
| Wrong brand links | `content/hyderabad/laminates-supplier.mdx` listed `relatedBrandSlugs: ["greenply"]` — a plywood brand on the laminates page. Greenlam/Merino/Virgo/Century Laminates/Sky Decor were all missing. **Fixed.** |
| Dead-end internal links | Cross-sell to `/products/hardware` and other zero-SKU categories, which are `noindex`. **Avoided in all new linking.** |
| Frontmatter that rendered nothing | `relatedHyderabadSlugs` resolved only MDX files, so any link to a non-MDX `/hyderabad/*` page silently vanished. **Fixed** — now resolves MDX, price pages and bespoke routes. |
| Schema/content mismatch (introduced-and-caught) | `CollectionPageSchema` hard-coded `/products/{slug}` URLs. Now takes a full path so the grouped laminate tables mark up the ranges the reader actually sees. |
| Duplicate catalogue row | Century Laminates "Almond Ivory (127)" appears twice in the Solids collection. Data issue — see section G. |

---

## B. Changes implemented

### New architecture

| File | Purpose |
|---|---|
| `lib/pricePages.ts` | The price-page registry — 16 pages as typed configuration. Holds only prose (framing, comparison tables, applications, FAQs). **Contains no prices.** |
| `lib/priceRows.ts` | Normalises a product row into a priced table row; resolves data-backed "best X" picks; groups large single-rate catalogues into ranges. |
| `lib/thickness.ts` | Parses author-entered thickness strings (`"18mm"`, `"1.00 mm"`, `"0.72 - 0.82 mm"`) into numbers, with tolerance matching. |
| `lib/data/priceProducts.ts` | Pushes category/brand/collection filters to PostgREST; grade, thickness, name and certification filters in memory. Pages past the 1000-row cap. |
| `lib/data/pricePageData.ts` | Assembles rows + range groups for one page. |
| `lib/data/sampleBoq.ts` | Live-priced line items for the BOQ page's sample quotation. |
| `components/PricePageView.tsx` | The page template. |
| `components/PriceTable.tsx` / `PriceRangeTable.tsx` | Per-SKU and grouped-range tables, both horizontally scrollable inside their own container. |
| `components/PricePageLinks.tsx` | Reusable price-cluster link block. |
| `components/BoqCtaBlock.tsx` | The conversion module. |
| `app/hyderabad/boq-procurement/page.tsx` | The BOQ hero page (replaces the MDX file). |

### Modified

`app/hyderabad/[slug]/page.tsx` (dual-family routing) · `app/hyderabad/page.tsx` · `lib/sitemapData.ts` · `lib/hyderabadLinks.ts` · `lib/categories.ts` · `lib/analytics.ts` · `lib/productSeo.ts` · `context/QuoteModalContext.tsx` · `components/ContentDetailView.tsx` · `components/CategoryPageView.tsx` · `components/BrandPageView.tsx` · `components/ProductPageView.tsx` · `components/schema/CollectionPageSchema.tsx` · 6 MDX files.

### The one design decision that matters most

**No price on any page is invented, estimated or interpolated.** The plywood catalogue stores a single min/max band per product covering its whole 4–25mm thickness range — it does not store per-thickness rates (only 2 products carry `variants` with real per-thickness pricing). So:

- Price pages show each product's **own stated span**, labelled with the thickness range it covers.
- Where `variants` holds a real per-thickness rate (e.g. Kerala Hardwood MR at 18mm = ₹55/sq.ft), the **exact** figure is shown.
- On a thickness page, the headline ₹ range is **suppressed entirely** unless every figure behind it is an exact rate for that thickness — otherwise a 4mm price would be presented as an 18mm price.
- Products with no rate render "Request current price", never a borrowed or estimated number.
- Per-sheet figures are pure arithmetic (rate × the sheet's own area from its size label), labelled as a check figure, and omitted where a product has multiple sheet sizes.

### Internal linking

- **Category page → price cluster** (up to 8 links, derived automatically from each price page's own selector).
- **Brand page → its price page** (Century, Greenply, Greenlam, Merino, Virgo).
- **Product page → price cluster** for its category (5 links × 3,118 product pages).
- **Price page → adjacent price pages, guides, comparisons, supplier pages, BOQ** (10–12 curated links each).
- **`/hyderabad` hub** gained a "Price Guides" column and cards for all 16 pages.
- **Supplier + BOQ MDX pages** now link into the price cluster and back.

No footer keyword dumps. Every link is contextual and points at a page with live products.

### Analytics

Added to `lib/analytics.ts` and wired:

| Event | Fires | Meta mapping |
|---|---|---|
| `price_page_view` | Price page mount, with `price_page`, `products`, `priced_products` | GA only |
| `quote_modal_open` | Quote modal opens, with the CTA label as `source` | GA only (intent, not a Lead) |
| `boq_file_attached` | A file is attached, with `file_type` and `file_kb` | GA only |
| `quote_request` | Existing — now also carries `has_attachment` | Meta `Lead` |

`whatsapp_click` (already present) is fired from every new CTA with a page-specific `source` (`price_page_hero:18mm-plywood-price`, `boq_sample`, etc.), so WhatsApp conversions are attributable per landing page.

---

## C. Pages created / upgraded

### Created — 16 price pages

**Plywood (7)**
`/hyderabad/plywood-price` · `/hyderabad/18mm-plywood-price` · `/hyderabad/12mm-plywood-price` · `/hyderabad/6mm-plywood-price` · `/hyderabad/mr-plywood-price` · `/hyderabad/bwp-plywood-price` · `/hyderabad/marine-plywood-price`

**Brand (2)**
`/hyderabad/century-plywood-price` · `/hyderabad/greenply-plywood-price`

**Boards (2)**
`/hyderabad/hdhmr-board-price` · `/hyderabad/mdf-board-price`

**Laminates (5)**
`/hyderabad/laminate-price` · `/hyderabad/1mm-laminate-price` · `/hyderabad/greenlam-laminate-price` · `/hyderabad/merino-laminate-price` · `/hyderabad/virgo-laminate-price`

### Rebuilt

`/hyderabad/boq-procurement` — now a hero commercial page: proposition headline, upload/WhatsApp CTAs, 6-step process, live category grid with SKU counts, a **sample consolidated quotation built from real catalogue products and live rates** (quantities explicitly labelled illustrative), audience segments, differentiators, 8 FAQs, and links into the price cluster.

### Upgraded

- `/hyderabad/plywood-supplier` — corrected brand list, new "Current Rates" section linking the whole plywood price cluster.
- `/hyderabad/laminates-supplier` — corrected brands (was pointing at Greenply), real finish/shade-code guidance, price cluster links.
- `/products/*` board pages — titles now carry "Price in Hyderabad" where a rate exists **and** the title fits the length budget (26 products qualify; 3,092 laminate/veneer shade pages deliberately untouched).
- All category, brand and product pages — price-cluster link block.

### Two pages deliberately NOT created

`/hyderabad/century-sainik-710-price`, `/hyderabad/century-sainik-mr-price`, `/hyderabad/greenply-ecotec-price`, `/hyderabad/greenply-gold-price`.

**Reason:** each targets a single SKU that already has a page (`/products/century-sainik-710-ply` etc.). Two indexable URLs for one query is textbook cannibalisation, which your own Rule 4 forbids. I upgraded the product pages to capture the price query instead. (Greenply Ecotec also does not exist in the catalogue — Greenply's ranges here are Green Gold, Green Club, Green Platinum, Optima G 710, Green BWP 710.)

---

## D. Technical SEO status

| Area | Status |
|---|---|
| **Sitemap** | ✅ 16 price pages + `/hyderabad/boq-procurement` in `sitemap/content.xml`, driven off the registries so nothing can be added to the site and forgotten. Verified: 27 Hyderabad URLs, no duplicates. `lastModified` = `lib/pricePages.ts` mtime (a real signal). |
| **Robots** | ✅ Unchanged and correct — allows all, disallows `/search`. |
| **Canonical** | ✅ Self-canonical on every new page, verified in the production build. |
| **Schema** | ✅ BreadcrumbList + FAQPage + CollectionPage/ItemList on price pages; BreadcrumbList + FAQPage + Service on BOQ. **ItemList now mirrors exactly what the table renders** — grouped ranges on laminate pages, individual SKUs on board pages. No `Product`/`Offer` markup on price pages: the figures are spans across a thickness range, which a single-valued `price` field would misrepresent. |
| **Metadata** | ✅ Unique title + description per page, all within budget. |
| **Indexability** | ✅ All 16 indexable. All 22 `/hyderabad/[slug]` pages statically generated. |
| **Duplicate risk** | ✅ Low. Single route owns the segment with price pages resolved first, so a config slug can never silently collide with an MDX filename. Single-SKU price URLs deliberately not created. Thickness pages differ by product set, headline treatment, applications and FAQs — not just a swapped number. |
| **Pagination** | N/A — no price page exceeds one screen of table (largest is 105 grouped rows on `/hyderabad/laminate-price`). |
| **Filters/parameters** | ✅ Unchanged. Price pages link to already-canonical, already-sitemapped `?collection=` URLs; they create no new parameter space. |
| **Mobile** | ✅ Verified at 375px: no horizontal body scroll (tables scroll in their own containers), CTAs above the fold, existing sticky Call/WhatsApp/Quote bar intact. |
| **Build** | ✅ `tsc --noEmit` clean, `eslint` clean, `next build` clean — 3,330 static pages in ~30s. |

---

## E. Next priority backlog

### P0 — blocks revenue now

1. **Load per-thickness plywood pricing.** The single highest-value data gap. The `variants` JSON schema already supports it (Kerala Hardwood and Blockboard use it); every price page reads it automatically the moment it lands. Today 24 of 26 board products show a 4–25mm span instead of an exact 18mm rate.
2. **Load Greenply plywood rates** (5 SKUs, all ₹0 on file). `/hyderabad/greenply-plywood-price` cannot take paid traffic until this exists.
3. **Load Greenlam and Century Laminates rates** (1,442 SKUs unpriced — 59% of the laminate catalogue). Blocks `/hyderabad/greenlam-laminate-price` for Ads.
4. **Load Mikasa plywood rates** (4 SKUs).

### P1 — the next content wave

5. Supplier pages 21–40 from the brief. The pattern is proven — extend `PricePageView` with a supplier variant rather than writing MDX. Start with `plywood-wholesale`, `hdhmr-supplier`, `mdf-supplier`, `veneer-supplier`, `fevicol-dealer`.
6. Comparison pages 41–60. `/comparisons` exists with only 2 entries. Highest value: MR vs BWP, Plywood vs HDHMR, Century vs Greenply, Best Plywood for Kitchen (guide exists — upgrade it with live products), Greenlam vs Merino.
7. Rewrite the remaining thin `/hyderabad` MDX supplier pages to render live products the way the price pages do.

### P2

8. Calculators 61–70 (plywood/laminate quantity, 2BHK/3BHK requirement) — genuinely interactive, feeding the quote modal.
9. Application pages 75–80 under `/applications`.
10. Descriptions for the 655 products with none and applications for the 662 missing them (carried over from the July audit — still outstanding).

### P3

11. EightByFour Hyderabad Price Index. The architecture does not block it: `priceSpan()` already computes category-level aggregates from live data. Needs a price-history table to become a real index.
12. Case-study system.
13. Programmatic laminate shade pages — only after the pricing gaps above close.

---

## F. Google Ads landing-page readiness

### ✅ Ready now — real products, real rates

| Campaign | Landing page |
|---|---|
| A — Plywood Hyderabad | `/hyderabad/plywood-price`, `/hyderabad/18mm-plywood-price`, `/hyderabad/12mm-plywood-price`, `/hyderabad/6mm-plywood-price`, `/hyderabad/bwp-plywood-price`, `/hyderabad/mr-plywood-price`, `/hyderabad/marine-plywood-price` |
| B — Brand/product intent | `/hyderabad/century-plywood-price`, `/products/century-sainik-710-ply`, `/products/century-club-prime-ply` |
| C — Laminates | `/hyderabad/laminate-price`, `/hyderabad/1mm-laminate-price`, `/hyderabad/merino-laminate-price`, `/hyderabad/virgo-laminate-price` |
| Boards | `/hyderabad/hdhmr-board-price`, `/hyderabad/mdf-board-price` |
| D — Project procurement | `/hyderabad/boq-procurement` ← the differentiated page; do not send this traffic to the homepage |

### ⚠️ Not ready — will show "Request current price" against a price query

`/hyderabad/greenply-plywood-price` and `/hyderabad/greenlam-laminate-price`. Both are fine for organic (real specs, real products) but will convert poorly on a paid price query. Hold until P0 items 2–3 land.

Every page above fires `price_page_view` on load and a page-scoped `whatsapp_click` / `quote_modal_open` / `quote_request`, so cost-per-qualified-lead is measurable per landing page from day one.

---

## G. What I need from you

**Blocking for paid traffic (not for launch):**

1. **Per-thickness plywood rates.** A rate card by product × thickness. This unlocks exact-price thickness pages and roughly triples their conversion value.
2. **Greenply, Mikasa, Greenlam and Century Laminates rate cards.** 1,451 products currently unpriced.

**Worth confirming:**

3. **Manufacturer relationships.** I used "supplier" and "sourced through EightByFour" throughout and explicitly answered "we are a supplier, not an authorised dealer or distributor" in the Century, Greenply and Greenlam FAQs. If any authorised relationship genuinely exists, tell me and I'll update that language.
4. **Century Sainik 710's grade.** The database records it as IS 303 **BWR**, not IS 710 BWP. I wrote the pages to match the data and called the distinction out explicitly, because it is genuinely useful to a buyer. If the record is wrong, the pages inherit the error.
5. **Stock language.** No page claims stock levels. Everything says "request current price" / "confirmed against current stock". If real inventory data exists, availability becomes a strong differentiator.
6. **Duplicate row** — Century Laminates "Almond Ivory (127)" is in the Solids collection twice.

**Not blocking:** Carried over from the July audit and still open — the Canela Text trial-font licensing question, and 655 products with no description.

---

## Note on version control

A commit `f0f4dfe "Add Hyderabad price pages and a BOQ procurement route"` was created during this session — **not by me; I did not run `git commit`.** It captured most of this work along with pre-existing uncommitted changes and six untracked scripts that were already in your working tree. Two files from the tail of the session (`components/ProductPageView.tsx`, `lib/productSeo.ts`) remain uncommitted. Worth a look before you push.
