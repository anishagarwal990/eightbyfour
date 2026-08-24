# Meta Ads & Marketing Infrastructure

Event tracking, Meta Pixel, and UTM attribution for the Meta Ad → Landing Page → WhatsApp/Quote funnel. Built on top of the existing site — no new product data, no new conversion surfaces, no duplicate analytics systems.

## How it's wired

- **`lib/analytics.ts`** — the only place that calls `window.gtag`/`window.fbq`. Every tracked interaction calls `trackEvent(name, params)`; it fires GA4 always, and fires the mapped Meta standard event only for the events that map to one (see table below). This is what prevents duplicate/diverging events between the two platforms.
- **`components/MarketingTracking.tsx`** — mounted once in [app/layout.tsx](../app/layout.tsx). Loads the GA4 and Meta Pixel loader scripts (each gated on its own env var, so it's safe to ship before either account exists), and fires `page_view`/`PageView` on every route change. This is the *only* place `page_view` fires — components don't fire it themselves.
- **`lib/utm.ts`** — captures `utm_*` params off the landing URL into `sessionStorage` (survives in-app navigation, dies with the tab). Read back by the quote forms when logging an inquiry.
- **`components/ViewTracker.tsx`** — a null-rendering client component that fires one event on mount, for view events that belong on server components (`product_view`, `category_view`, `product_search`).
- **`components/WhatsAppTrackedLink.tsx`** / **`components/TrackedTelLink.tsx`** — client wrappers for `tel:`/`wa.me` links living inside server components (a server component can't attach an `onClick` itself).

## Events

| Event | Fires from | Meta event |
|---|---|---|
| `page_view` | Every route change (MarketingTracking) | `PageView` |
| `product_view` | [ProductPageView.tsx](../components/ProductPageView.tsx) on mount | `ViewContent` |
| `category_view` | [CategoryPageView.tsx](../components/CategoryPageView.tsx) on mount | — |
| `product_search` | [app/search/page.tsx](../app/search/page.tsx) when a query resolves | `Search` |
| `laminate_code_search` | [ShadeFinishPicker.tsx](../components/ShadeFinishPicker.tsx) — picking a shade from the code dropdown | `Search` |
| `laminate_finish_selection` | [ShadeFinishPicker.tsx](../components/ShadeFinishPicker.tsx) — choosing a finish | — |
| `product_filter` | [FinishFilterableGrid.tsx](../components/FinishFilterableGrid.tsx) — finish chip click on a catalogue page | — |
| `product_image_view` | [ProductGallery.tsx](../components/ProductGallery.tsx) — opening the lightbox | — |
| `whatsapp_click` | Every direct WhatsApp CTA (see below) | `Contact` |
| `quote_request` | Successful submit of the quote modal or product quote form | `Lead` |
| `phone_click` | `tel:` links (mobile sticky bar, contact page) | — |

**`whatsapp_click` vs `quote_request`**: a direct WhatsApp link (product/brand/footer/contact/sticky-bar CTAs — no form, no DB row) fires `whatsapp_click`/`Contact`. Submitting the quote modal or product quote form (name + phone captured, row written to `inquiries`, *then* WhatsApp opens) fires `quote_request`/`Lead` instead — not both, so one action isn't double-classified across two funnel stages. This also means Lead never fires from merely opening a product page.

There's no separate `contact_submit`/contact-form event: the site doesn't have a distinct contact form — [app/contact/page.tsx](../app/contact/page.tsx) is `tel:`/`wa.me`/`mailto:` links plus the same quote modal used everywhere else, which already fires `quote_request`.

## UTM attribution

`captureUtmFromLocation()` runs on every route change and stores `utm_source/medium/campaign/content/term` + `landing_path` in `sessionStorage` under `e8x4_utm`, but only overwrites what's stored when the URL actually carries `utm_*` params (so navigating deeper into the site doesn't erase the original campaign). Both quote-submission paths (`context/QuoteModalContext.tsx`, `components/QuoteRequestForm.tsx`) read it back via `getStoredUtm()` and:

1. Spread it into the `inquiries` row (new nullable columns — see below).
2. Include it in the `quote_request` analytics event as `campaign`/`source`/`medium`.

**Bug fixed as part of this**: [PlywoodFilterableGrid.tsx](../components/PlywoodFilterableGrid.tsx) syncs its own filter state to the URL via `history.replaceState`, and was rebuilding the URL from only its own 3 filter keys — silently dropping any `utm_*` params a visitor arrived with on `/products/plywood`. Now merges into the existing query string instead of replacing it.

### DB schema

`public.inquiries` gained 6 nullable columns (applied via migration `add_utm_attribution_to_inquiries`, mirrored in [supabase/schema.sql](../supabase/schema.sql)):

```sql
utm_source text, utm_medium text, utm_campaign text,
utm_content text, utm_term text, landing_path text
```

## Environment variables

Neither is set yet — both features stay off (no scripts load, no console errors) until you add them.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_ID` | GA4 Measurement ID (`G-XXXXXXX`) — enables the GA4 loader + all `trackEvent` GA calls |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID — enables the Pixel loader + the Meta-mapped events above |

Add to `.env.local` (client-side, `NEXT_PUBLIC_*` is required for both since they're read in the browser).

## CSP

[next.config.ts](../next.config.ts)'s report-only CSP now allow-lists `googletagmanager.com`, `google-analytics.com`, `connect.facebook.net` and `facebook.com` in `script-src`/`connect-src`/`img-src` — needed before this policy can go from report-only to enforced without breaking either script.

## Testing events locally

1. Set `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` in `.env.local`, or without them, verify by monkey-patching in the browser console before interacting:
   ```js
   window.gtag = (...a) => console.log("GA", a);
   window.fbq = (...a) => console.log("Meta", a);
   ```
2. GA4: DebugView (Admin → DebugView) with the [GA Debugger extension](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna), or just the console log above.
3. Meta: [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) browser extension, or Events Manager → Test Events.
4. UTM: land on any page with `?utm_source=...&utm_medium=...&utm_campaign=...`, then `sessionStorage.getItem("e8x4_utm")` in the console.

## Adding a new tracked interaction

Add the event name to `AnalyticsEventName` in `lib/analytics.ts` (and to `META_EVENT_MAP` only if it's a genuine conversion, not engagement/browsing), then call `trackEvent(name, params)` at the interaction — or drop a `<ViewTracker event=... params=... dedupeKey=... />` into a server component if the interaction is a page-level view.

## Campaign landing pages

Not built. The existing `/products/[category]` pages already carry UTM params cleanly (canonical URLs stay bare, per `lib/seo.ts`) and now correctly preserve them end-to-end after the PlywoodFilterableGrid fix. Revisit only if real campaign data shows a specific category/brand page underperforming and needing dedicated ad-matched copy — building `/plywood/compare`-style pages speculatively isn't justified yet.
