# Decor-code query baseline — 2026-09-03

Baseline for the "push page-2 decor codes to page 1" work. Shipped the same day:
shade code now leads the product-page `<h1>` and three code-targeted FAQs were
added (`components/ProductPageView.tsx`, branch `seo/decor-code-pdp-hardening`).
Re-check these positions in ~2–3 weeks to see if the change moved the band.

## Source

- Google Search Console, property `sc-domain:eightbyfour.com`
- Window: **2026-08-07 → 2026-09-03** (28 days), search type WEB
- Dimensions: query × page, sorted by impressions
- Pull: top 400 query/page pairs, then filtered to shade-code queries
  (query contains a 3–6 digit number or a finish code like `lu` / `su` / `si` /
  `shg` / `sud`) with position ≤ 20

Full rows: `decor-code-positions-2026-09-03.csv` (269 query/page pairs, 200 pages).

## Baseline numbers

| Metric | Value |
|---|---|
| Shade-code query/page pairs, pos ≤ 20 | 269 |
| Distinct product pages | 200 |
| Total impressions (28d) | 1,159 |
| Total clicks (28d) | 5 |
| Impression-weighted avg position | 9.0 |
| **Core stuck band (pos 7–11)** | **181 queries · 869 impressions · 2 clicks** |

The core band is the target: real impressions, position 7–11, essentially no
clicks because the listing sits at the bottom of page 1 or top of page 2.

## Highest-impression stuck queries (the ones to watch)

| Query | Page | Pos | Impr (28d) | Clicks |
|---|---|---:|---:|---:|
| 21317 merino | /products/merino-21317-dusk-brown | 7.7 | 44 | 0 |
| 14602 merino | /products/merino-14602-gigan-lowa-walnut | 8.4 | 36 | 0 |
| 22153 merino | /products/merino-22153-saga-green | 9.4 | 36 | 0 |
| 22212 merino | /products/merino-22212-toned-blue | 10.0 | 23 | 0 |
| 14016 merino | /products/merino-14016-malmok-natal-walnut | 10.1 | 21 | 0 |
| 21184 rose chalk | /products/merino-21184-rose-chalk | 9.8 | 20 | 0 |
| 21184 merino | /products/merino-21184-rose-chalk | 6.8 | 16 | 0 |
| 21302 merino | /products/merino-21302-misty-lilac | 10.4 | 16 | 0 |
| 85117 ft | /products/merino-85117-vasantha | 7.1 | 15 | 0 |
| 22153 saga green | /products/merino-22153-saga-green | 8.9 | 15 | 0 |
| 27106 merino | /products/merino-27106-charcoal | 6.8 | 14 | 0 |
| 22133 merino | /products/merino-22133-loto-green | 8.1 | 14 | 0 |
| 21303 merino | /products/merino-21303-sea-jade | 8.9 | 14 | 0 |
| 44281 merino | /products/merino-44281-livid-krakato | 9.3 | 14 | 0 |
| 10459 oak blend | /products/merino-10459-oak-blend | 6.3 | 13 | 0 |
| 99988 merino | /products/merino-99988-bronze | 9.5 | 13 | 1 |
| 3245 lu century laminates | /products/century-laminates-3245-lu-arctic-blue | 7.7 | 12 | 0 |
| 14603 merino | /products/merino-14603-huron-lowa-walnut | 8.2 | 12 | 0 |
| 4929 lu century laminates | /products/century-laminates-4929-lu-blanco-gold-marble | 5.6 | 10 | 0 |
| 10459 merino | /products/merino-10459-oak-blend | 7.3 | 10 | 0 |

Almost all Merino; a smaller Century-Laminates `NNNN lu/su/si` cluster behind it.

## Re-check procedure (do this ~2026-09-24)

1. Pull the **same 28-day window shape** — start date + 28 days — with
   `get_advanced_search_analytics`, dimensions `query,page`, sort impressions,
   row_limit 400.
2. Regenerate the CSV with the same filter, save as
   `decor-code-positions-<date>.csv`.
3. Compare the **core band (pos 7–11)**: did the count shrink and clicks rise?
   And check the 20 watch queries above individually — position delta and any
   first clicks.
4. Confirm the shipped PR is actually deployed to production before reading the
   result (check the H1 on `/products/merino-21317-dusk-brown` shows
   `21317 — Dusk Brown`).

### Read

- Band moves up 3–5 and picks up clicks → the H1/FAQ lever works; scale it
  (internal links between finishes of a design, code in image alt/filename,
  breadcrumb tweaks) and move to the category-hub rebuild.
- No movement → lever is not enough on its own; the blocker is authority/links,
  not on-page. Shift effort to internal linking + the comparison-content cluster
  that feeds links to these pages.

## Caveats

- 28-day average position smears daily movement; a code that jumped from 14 to 7
  mid-window shows ~10. The re-check's job is trend, not precision.
- Per-query impression counts are tiny (new domain, thin coverage) — read the
  band in aggregate, not any single low-impression row.
- GSC only lists queries that got an impression in the window, so the row set
  itself will shift between pulls; the CSV is the anchor for what to compare.
