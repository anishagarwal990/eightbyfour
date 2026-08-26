# Catalogue tool

Edit the Supabase `products` table through CSV instead of writing a new one-off `scripts/set-*.mjs` for every change.

There are 53 of those scripts. Each hardcodes its values, runs once, records nothing about what it changed, and cannot be reversed. This replaces them.

```bash
node scripts/catalogue.mjs --help
```

## Safety model

1. **Nothing writes without `--apply`.** Every import prints a diff and stops.
2. **Every `--apply` snapshots first** to `scripts/snapshots/<timestamp>-<label>.json` — the full rows as they were, before the write. The command prints the exact restore command when it finishes.
3. **Column allowlist.** `id`, `slug`, `created_at` and `updated_at` are unreachable. `slug` is the product's live URL — renaming it in a spreadsheet would 404 an indexed page.
4. **Update, never upsert.** An upsert on a partial object nulls every column absent from the payload. A CSV carrying only descriptions would wipe images, specs and pricing for every row in it.
5. **Round-trip is a no-op.** Export then re-import reports zero changes across all 3,118 products. Verified for every category, for both the field and rate grids.

## Editing text and list columns

```bash
# everything, or narrow it
node scripts/catalogue.mjs export fields -o all.csv
node scripts/catalogue.mjs export fields --category Plywood -o ply.csv
node scripts/catalogue.mjs export fields --brand Merino --fields description,applications -o merino.csv
```

Edit in Excel / Sheets / any editor, then:

```bash
node scripts/catalogue.mjs import fields ply.csv           # diff only
node scripts/catalogue.mjs import fields ply.csv --apply    # write
```

**Cell conventions**

| Column type | In the CSV | Notes |
|---|---|---|
| Text | plain value | An **empty cell means NULL**, which is what the app checks for. It does not mean empty string. |
| `text[]` | `a \| b \| c` | Pipe-separated. `thicknesses`, `certifications`, `applications`, `features`, `how_to_apply`, `finishes`, `gallery_img_urls`. |

Editable: `category`, `brand`, `name`, `collection`, `grade`, `size`, `thicknesses`, `sd_code`, `eb_code`, `finish`, `finishes`, `mood`, `tone`, `description`, `core`, `density`, `warranty`, `certifications`, `applications`, `features`, `how_to_apply`, `catalogue_url`, `tech_sheet_url`, `installation_guide_url`, `main_img_url`, `edge_img_url`, `app_img_url`, `gallery_img_urls`.

`category` and `brand` are editable but flagged in the diff — they move the product to a different page.

## Editing per-thickness rates

This is the one that matters for pricing. `variants` is nested three deep (cores → sizes → thicknesses → price), which is right for the app and wrong for a spreadsheet. The tool flattens it to one row per priced combination and rebuilds the nesting on import.

```bash
node scripts/catalogue.mjs export rates --category Plywood -o rates.csv
```

```
slug,brand,product,core,size,thickness,rate,current_band
century-sainik-mr-mr,Century,Sainik MR,Standard,8×4 ft (2440×1220mm),25mm,,33-89
century-sainik-mr-mr,Century,Sainik MR,Standard,8×4 ft (2440×1220mm),19mm,,33-89
...
```

Products with no rates yet are seeded with blank cells — that is the fill-in grid for a rate card. Products that already have rates export their real numbers, so a re-import is a no-op.

**Fill the `rate` column only.** Three states:

| Cell | Meaning |
|---|---|
| a number | A real rate for that thickness. `₹` and thousands commas are tolerated. |
| blank | No rate yet. The thickness stays stocked, just unpriced — the site shows "Request current price". |
| `n/a` | Not stocked at that thickness. Removed from the product's `thicknesses` array. |

```bash
node scripts/catalogue.mjs import rates rates.csv           # diff
node scripts/catalogue.mjs import rates rates.csv --apply
```

**Row order is meaningful.** The product page seeds its default thickness selection from the first entry (`firstThickness` in `lib/pricing.ts`). The catalogue stores thicknesses thickest-first, so a plywood product opens on 25mm rather than 4mm. Neither export nor import re-sorts. If you want a different default, move the row.

**The headline band re-derives itself, but only when the grid is complete.** If every stocked thickness for a product has a rate, `price_table.min_price` / `max_price` are recomputed from those rates so the band and the grid can never contradict each other. If the grid is partly filled, `price_table` is left alone — deriving a band from the three thicknesses someone typed first would present that as the product's full range.

## Rolling back

```bash
node scripts/catalogue.mjs snapshots
node scripts/catalogue.mjs restore scripts/snapshots/2026-08-26T…-rates.json          # diff
node scripts/catalogue.mjs restore scripts/snapshots/2026-08-26T…-rates.json --apply
```

Restore is itself an import, so it prints a diff and snapshots before writing. You can undo an undo.

Snapshots are gitignored — they are a local safety net, not source, and they go stale as soon as the catalogue moves on.

## What this does not cover yet

- **Pack pricing** (`price_table` as an array — the 10 Fevicol products, priced per pack size). Left untouched by both importers. Needs its own `export packs` mode.
- **`spec_table` and `custom_faqs`** — nested JSON, no CSV mode yet.
- **Creating or deleting products.** Update only, keyed on an existing slug. A row whose slug is not in the database is reported and skipped, never inserted.
- **The `brands`, `inquiries`, `testimonials` and `product_comments` tables.**
- **Any web UI.** This is a developer CLI running on the service-role key. A non-technical editor needs the `/admin` route described in the backlog.
