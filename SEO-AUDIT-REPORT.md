# EightByFour — SEO & Technical Audit

**Site:** https://www.eightbyfour.com · **Stack:** Next.js 16 (App Router) + Supabase · **Audit date:** 31 July 2026

Baseline was checked against the live site (robots.txt, sitemap.xml, homepage HTML/meta tags fetched directly) to confirm it matches this repository, then against the codebase and the live Supabase `products` table (1,975 rows). Everything below reflects real findings, not assumptions.

**Headline finding:** this is not a bare-bones site. Someone already built real technical SEO groundwork — dynamic `sitemap.ts`/`robots.ts`, per-page canonical + OG/Twitter metadata via a shared `buildMetadata()` helper, Product/Breadcrumb/FAQ/Organization JSON-LD, and unique category copy. The issues below are specific gaps and bugs on top of that foundation, not a rebuild.

---

## 1. Critical Issues (Must Fix Immediately)

1. **Next.js Image Optimization was fully disabled** (`images.unoptimized: true` in `next.config.ts`). Every `<Image>` on the site — including the product photos that are the LCP element on every product, category and brand page — was served at full original size with no AVIF/WebP conversion and no responsive `srcset`. This is the single biggest thing suppressing Core Web Vitals and mobile page speed scores site-wide. **Fixed.**
2. **The Laminates category page was rendering up to 1,313 product cards in one client-side component with no pagination** (`CategoryProductGrid.tsx`). That's thousands of DOM nodes and images hydrating on a single page load — a direct hit to DOM size, Interaction to Next Paint and Total Blocking Time on your highest-SKU, highest-intent category. **Fixed** with progressive "Show more" loading (48 at a time); every product is still in `sitemap.xml` regardless, so nothing becomes undiscoverable.
3. **132 products across 64 brand+name groups had identical `<title>` tags and meta descriptions** (e.g. four different Greenlam "Black" laminates in different finishes/shade codes all titled "Greenlam Black — Laminates in Hyderabad"). Confirmed via direct query against the `products` table. **Fixed** — titles/descriptions now include the shade code (or finish) as a disambiguator.
4. **655 of 1,975 products (33%) have no `description` in the database**, and 662 (34%) have no `applications` list. Their product pages currently fall back to a generic templated sentence and skip the Applications section entirely — thin content on a third of the catalogue. This is a data/content gap, not a code bug — see "Remaining Manual Tasks."
5. **No custom 404 page** — a broken/removed URL previously hit Next.js's bare default page instead of routing visitors back into the catalogue. **Fixed.**
6. **No web app manifest** — missing from the PWA/mobile-SEO checklist. **Fixed.**
7. Two dead static files at the project root, `robots.txt` and `sitemap.xml` (the sitemap contained only the homepage URL) — confirmed via live fetch that production actually serves the correct dynamic `app/robots.ts` / `app/sitemap.ts` output, so these two files are unused leftovers, not a live bug. Recommend deleting them so nobody mistakes them for the real source of truth (left in place — flagged for your review rather than deleted without asking).
8. **Brand wordmark headings are not using the intended serif display font.** `public/fonts/` has a full "Canela Text" webfont family, but `layout.tsx` binds *both* the sans and serif CSS variables to the same Google `Geist` font — so the `.serif` class used on every H1/H2 site-wide silently renders in Geist. You asked me to leave this as-is for now (the font files are also named "-Trial", i.e. an unlicensed trial version — not safe to ship on a commercial site without buying a license). **Not changed, per your instruction** — see Priority Roadmap.

---

## 2. Code Changes Applied

| File | Change | Why |
|---|---|---|
| `next.config.ts` | Removed `images.unoptimized: true`; added explicit AVIF/WebP `formats` | Re-enables Next.js image optimization — resizing, modern formats, responsive `srcset` — for every image on the site |
| `app/layout.tsx` | Added `viewport` export (`themeColor`), `manifest` + `icons` metadata fields | Wires up the new manifest, sets mobile theme color, completes the metadata checklist |
| `app/manifest.ts` (new) | Web app manifest via Next's file convention | PWA/mobile-SEO requirement that was entirely missing |
| `app/not-found.tsx` (new) | Branded 404 with links back to Products, Brands and top categories, `robots: noindex` | Replaces the bare default 404; keeps visitors and crawlers inside the site instead of dead-ending |
| `components/schema/OrganizationSchema.tsx` | Added `logo`, `telephone`, `email` to the JSON-LD | Strengthens the `HomeAndConstructionBusiness` structured data for local/business rich results |
| `app/products/[slug]/page.tsx` | Title/description now append shade code or finish when present | Fixes the 132-product duplicate-title/description issue found in the data |
| `components/CategoryProductGrid.tsx` | Added paginated "Show more" rendering (48 per page) instead of rendering the full category in one shot | Fixes the DOM-size/hydration problem on Laminates (1,313 SKUs) and Veneers (493 SKUs) |
| `components/BrandLogo.tsx` | Added `loading="lazy"` / `decoding="async"` | These logo `<img>` tags render dozens of times per page (mega menus, product cards) and were all loading eagerly |
| `components/SiteHeader.tsx`, `components/ManufacturerStrip.tsx` | Same lazy-loading fix on the remaining raw `<img>` brand logos | Consistency with the above |
| `app/brands/page.tsx` | Added `sizes` + `loading="lazy"` to the brand-tile logo `<Image fill>`; added `BreadcrumbSchema` | Missing `sizes` on a `fill` image forces Next to assume 100vw (oversized downloads); the index page had visible breadcrumbs but no matching JSON-LD |
| `app/brands/[slug]/page.tsx` | Added `sizes` + `priority` to the brand-page logo `<Image fill>` | Same `sizes` gap; `priority` because this logo is often the LCP candidate on a brand page |
| `app/products/page.tsx`, `components/ContentIndexView.tsx` | Added `BreadcrumbSchema` | These index pages (Products, and every Applications/Guides/Comparisons/Hyderabad listing built on `ContentIndexView`) had a visible breadcrumb trail but no structured-data equivalent — now consistent with every detail page |

All changes pass `tsc --noEmit` and `eslint` with zero errors. I could not run a full `next build` in this sandbox (no outbound network access to download the platform-specific SWC binary), so I'd recommend a quick `npm run build` on your end before deploying, though nothing in these changes touches anything build-sensitive (no new dependencies, no config beyond removing a flag).

---

## 3. Remaining Manual Tasks

These need you (or content/legal input) — I did not fabricate business content or make legal/licensing calls on your behalf:

- **Write real descriptions for the 655 products missing one**, and applications for the 662 missing that. I did not generate placeholder copy for these — specs like grade, thickness and certification need to be accurate for a procurement site, and invented copy risks misleading a customer. Prioritize by traffic/SKU volume (Laminates and Veneers first).
- **Decide on the Canela Text serif font.** Per your instruction I left headings on Geist. The files in `public/fonts/` are labeled "Trial" — before using them in production you'd need to either buy a commercial license for Canela Text, or I can swap the `.serif` class to a properly licensed alternative (e.g. a free Google Font like Fraunces or Playfair Display) with zero licensing risk. Just say the word.
- **Google Search Console**: submit `https://www.eightbyfour.com/sitemap.xml`, verify no crawl errors, request indexing for the homepage and top category pages once the image-optimization fix ships.
- **Run PageSpeed Insights / Lighthouse against the live site post-deploy** to get real Core Web Vitals numbers. I attempted this from the sandbox but the API call timed out (a full Lighthouse run doesn't fit the sandbox's request timeout) — this needs to be run from your side or via Search Console's Core Web Vitals report once there's real field data.
- **Confirm your hosting platform supports Next.js Image Optimization** (Vercel does natively; some other hosts need a loader configured). If you deploy anywhere other than Vercel, verify images actually resize in production after this change, or let me know your host so I can configure a custom loader instead.
- **Delete the two dead root files** `robots.txt` and `sitemap.xml` (outside `/public`, confirmed unused in production) — left in place pending your confirmation since I don't remove files without asking.
- **Backlinks / off-page SEO, Google Business Profile, and content marketing** (blog posts, city-specific landing pages beyond the existing Hyderabad persona pages) — outside what's fixable in the codebase.
- **Decide on real pricing in Product schema.** I deliberately did not add fake `offers`/price fields to the Product structured data — this is a quote-based (RFQ) business model, not fixed-price e-commerce, and inventing a price would create inaccurate rich-result data that Search Console could flag.

---

## 4. SEO Score

| Category | Before | After code fixes |
|---|---|---|
| Technical SEO | 70 / 100 | 88 / 100 |
| Content SEO | 62 / 100 | 68 / 100 *(capped by the 655 missing descriptions — needs content work)* |
| Performance | 45 / 100 | 75 / 100 *(code-level ceiling raised; actual number depends on a live Lighthouse run post-deploy)* |
| Crawlability | 85 / 100 | 92 / 100 |
| Internal Linking | 80 / 100 | 85 / 100 |
| Schema / Structured Data | 75 / 100 | 88 / 100 |
| Core Web Vitals | Unmeasured (image optimization was off) | Unmeasured — needs a live PSI/Search Console run |
| Accessibility | 78 / 100 | 82 / 100 |
| **Overall SEO** | **68 / 100** | **80 / 100** |

Scores are my assessment based on code inspection, live-site verification and the Supabase data query above — not a Lighthouse-certified number. Treat "Performance" and "Core Web Vitals" as provisional until you run PSI against the deployed site.

---

## 5. Priority Roadmap

**Priority 1 (Today)**
- Deploy the changes in this session (image optimization, category pagination, duplicate-title fix, 404 page, manifest).
- Run `npm run build` locally once to confirm a clean production build before pushing.
- Submit/resubmit the sitemap in Google Search Console.

**Priority 2 (This Week)**
- Run PageSpeed Insights (mobile + desktop) against the live site and record baseline Core Web Vitals now that image optimization is on.
- Decide on the Canela Text font licensing question above.
- Delete the two dead root `robots.txt` / `sitemap.xml` files (or tell me to).
- Start writing descriptions for the highest-traffic products among the 655 missing them.

**Priority 3 (This Month)**
- Fill in `applications` for the 662 products missing that field.
- Add real `lastModified` dates to `sitemap.ts` (currently every URL reports "now" on every build — add an `updated_at` column to `products` if you want accurate freshness signals).
- Consider adding a Reviews/UGC push — `ProductSchema` already supports `aggregateRating`/`review`, but most products have none yet.

**Priority 4 (Long Term)**
- Content marketing: expand the Guides/Comparisons/Applications library and the Hyderabad persona pages — these are your best differentiators against Kyzo-style competitors and currently the site has a good template but a small library.
- Backlink acquisition and Google Business Profile optimization (outside the codebase).
- Consider server-driven URL pagination (`/products/laminates?page=2`) instead of client-side "Show more" if the Laminates category keeps growing — the current fix solves the Core Web Vitals problem today, but a crawlable paginated URL structure scales further and lets Google discover deep products.
