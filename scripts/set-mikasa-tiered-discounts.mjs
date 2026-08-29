import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// "Mikasa pricing updated for customers .xlsx" carries three numbers per
// thickness: list price ("C Price wo GST"), a discount fraction, and
// "Price to customer" (= list × (1 − discount), the number already written to
// every Mikasa product's `variants` and `price_table` as a flat net rate).
//
// The discount is NOT one product-wide percentage — thin gauges (4-9mm) sit
// around 10-11%, thick gauges (12-25mm) around 12%. The rest of the catalogue
// (Century etc.) models discount as a single `price_table.discount_pct`
// applied to every thickness alike; forcing that here would move every
// thickness's shown price off the number this sheet actually quotes.
//
// So this script rewrites `variants` to carry the LIST price plus each
// thickness's OWN `discount_pct` (see lib/pricing.ts VariantThickness), which
// the site now reads in preference to the product-level discount wherever a
// specific thickness is in view (product page, Hyderabad price tables).
//
// The discount_pct stored is derived backward from the net rate already live
// on each product — (1 − net/list) × 100 — rather than forward from the
// sheet's own discount column, so re-applying it (applyDiscount rounds to the
// rupee) reproduces that exact net price, not a float-rounded approximation
// of it. `price_table` (the headline band) is left untouched: it already
// holds the net min/max, and the product summary shown there was already
// correct — only the per-thickness grid was missing its own discount.

// Generated from "Mikasa pricing updated for customers .xlsx" — see the
// snippet in the script's own history if the sheet needs re-reading; this
// repo has no xlsx-parsing dependency, so extraction happened out of band.
const SHEET_JSON = process.argv.find((a) => a.endsWith(".json") && !a.includes("node_modules"));
if (!SHEET_JSON) throw new Error("Usage: node scripts/set-mikasa-tiered-discounts.mjs <list-prices.json> [--apply]");
const sheetRows = JSON.parse(readFileSync(SHEET_JSON, "utf8"));

const NAME_TO_SLUG = {
  "Sapphire": "mikasa-sapphire-ply",
  "Marine Blue": "mikasa-marine-blue-ply",
  "Fire Guardian": "mikasa-fire-guardian-ply",
  "MR+": "mikasa-mr-mr",
  "Marine": "mikasa-marine-ply",
  "BWP+": "mikasa-bwp-plus-ply",
  "Marine Blue BB": "mikasa-marine-blue-blockboard",
  "BWP+ BB": "mikasa-bwp-plus-blockboard",
  "MR+ BB": "mikasa-mr-plus-blockboard",
};

// slug -> thickness label -> list price
const bySlug = new Map();
for (const r of sheetRows) {
  const slug = NAME_TO_SLUG[r.variant];
  if (!slug) continue;
  if (!bySlug.has(slug)) bySlug.set(slug, new Map());
  bySlug.get(slug).set(r.thickness, r.list);
}

const slugs = Object.values(NAME_TO_SLUG);
const { data: rows, error: readError } = await supabase.from("products").select("slug,name,variants").in("slug", slugs);
if (readError) throw new Error(`Read failed: ${readError.message}`);

const apply = process.argv.includes("--apply");
const updates = [];

for (const row of rows) {
  const lists = bySlug.get(row.slug);
  if (!lists) {
    console.log(`SKIP  ${row.slug} — not on the sheet`);
    continue;
  }
  const variants = row.variants;
  if (!variants?.cores?.length) {
    console.log(`SKIP  ${row.slug} — no variants JSON`);
    continue;
  }

  let changed = false;
  const nextVariants = {
    ...variants,
    cores: variants.cores.map((core) => ({
      ...core,
      sizes: core.sizes.map((size) => ({
        ...size,
        thicknesses: size.thicknesses.map((t) => {
          const list = lists.get(t.label);
          const net = t.price;
          if (list === undefined || !Number.isFinite(net)) return t;
          const discountPct = Math.round((1 - net / list) * 1e6) / 1e4; // 4 dp
          changed = true;
          return { ...t, price: list, discount_pct: discountPct };
        }),
      })),
    })),
  };

  if (!changed) {
    console.log(`SKIP  ${row.slug} — no matching thicknesses`);
    continue;
  }

  console.log(`\n${row.name}  [${row.slug}]`);
  for (const core of nextVariants.cores) {
    for (const size of core.sizes) {
      for (const t of size.thicknesses) {
        if (t.discount_pct === undefined) continue;
        const reproduced = Math.round(t.price * (1 - t.discount_pct / 100));
        const original = variants.cores
          .flatMap((c) => c.sizes)
          .flatMap((s) => s.thicknesses)
          .find((o) => o.key === t.key)?.price;
        const ok = reproduced === original ? "OK" : `MISMATCH (was ₹${original})`;
        console.log(`  ${t.label}  list ₹${t.price}  discount ${t.discount_pct}%  -> ₹${reproduced}  ${ok}`);
      }
    }
  }

  updates.push({ slug: row.slug, variants: nextVariants });
}

console.log(`\n${updates.length} product(s) to update.`);

if (!apply) {
  console.log("\nDry run — nothing written. Re-run with --apply to write these changes.");
  process.exit(0);
}

for (const u of updates) {
  const { error } = await supabase.from("products").update({ variants: u.variants }).eq("slug", u.slug);
  if (error) throw new Error(`Write failed for ${u.slug}: ${error.message}`);
}
console.log(`Updated ${updates.length} product(s).`);
