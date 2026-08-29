import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// The five Mikasa SKUs that were on "Mikasa pricing updated for customers.xlsx"
// but had no row in the catalogue, so scripts/catalogue.mjs (update-only, keyed
// on an existing slug) skipped them. Rates are the sheet's "Price to customer"
// column — post-discount, excl. GST, ₹/sqft — rounded to the rupee, which is
// what the four existing Mikasa products already carry.
//
// Grade, ISI number, emission grade and warranty all come from the same sheet.
// Construction copy follows the existing Mikasa rows; no images yet, so the
// tiles fall back to the brand mark until photography lands.

const SIZE = "8×4 ft (2440×1220mm)";

const PRODUCTS = [
  {
    slug: "mikasa-marine-ply",
    category: "Plywood",
    name: "Marine",
    grade: "BWP",
    warranty: "25 Year Warranty",
    core: "Tropical Wood Blend, Machine-Composed Veneer, Phenolic-Bonded",
    density: "~700 kg/CBM",
    certifications: ["IS 710 (BWP Grade)"],
    applications: ["Modular kitchens", "Bathroom vanities", "Indoor furniture", "High-moisture areas"],
    description:
      "Marine is Mikasa's IS 710 boiling-water-proof plywood — phenolic-bonded tropical hardwood built for sustained moisture exposure. It holds screws and hardware over decades in kitchens, vanities and utility areas, and is E1 emission compliant with a 25-year warranty.",
    features: [
      "IS 710 BWP (boiling water proof) grade for sustained moisture exposure",
      "Phenolic-bonded tropical hardwood core for dimensional stability",
      "Holds hinges, channels and hardware securely at 19mm and above",
      "E1 emission compliant",
      "25-year warranty",
    ],
    spec: [
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E1" },
      { label: "Bond Quality", value: "IS 710 (BWP)" },
    ],
    rates: { "25mm": 183, "19mm": 119, "16mm": 106, "12mm": 83, "9mm": 68, "6mm": 57, "4mm": 49 },
  },
  {
    slug: "mikasa-bwp-plus-ply",
    category: "Plywood",
    name: "BWP+",
    grade: "BWP",
    warranty: "20 Year Warranty",
    core: "Tropical Wood Blend, Machine-Composed Veneer",
    density: "~650 kg/CBM",
    certifications: ["IS 303:1989 (Plywood for General Purposes)"],
    applications: ["Wardrobes", "Bedrooms", "Living rooms", "Indoor furniture"],
    description:
      "BWP+ is Mikasa's boiling-water-proof plywood to IS 303, the everyday grade for wardrobes, storage and interior carcass work where moisture is occasional rather than constant. E1 emission compliant, backed by a 20-year warranty.",
    features: [
      "Boiling-water-proof bonding to IS 303 for general interior work",
      "Machine-composed veneer for uniform thickness and a flat, paintable face",
      "Stable under bending and warping stress",
      "E1 emission compliant",
      "20-year warranty",
    ],
    spec: [
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E1" },
      { label: "Standard", value: "IS 303:1989" },
    ],
    rates: { "25mm": 165, "19mm": 108, "16mm": 96, "12mm": 75, "8mm": 61, "6mm": 51, "4mm": 44 },
  },
  {
    slug: "mikasa-marine-blue-blockboard",
    category: "Blockboard",
    name: "Marine Blue Blockboard",
    grade: "FR+BWP",
    warranty: "25 Year Warranty",
    core: "Seasoned Softwood Batten Core, Phenolic-Bonded",
    density: null,
    certifications: ["IS 1659 (Blockboard)", "IS 5509:2021 (Fire Retardant)"],
    applications: ["Wardrobe shutters", "Door panels", "Long shelves", "Commercial fit-outs"],
    description:
      "Marine Blue Blockboard pairs Mikasa's fire-retardant, boiling-water-proof bonding with a seasoned softwood batten core — the combination for long shutters and shelves that must stay flat and meet fire-safety requirements. E0 emission grade, 25-year warranty.",
    features: [
      "Fire-retardant and boiling-water-proof bonding (IS 5509 + IS 1659)",
      "Seasoned softwood batten core resists sag over long spans",
      "Lighter than plywood at the same thickness for shutters and doors",
      "E0 emission grade — the lowest formaldehyde class Mikasa offers",
      "25-year warranty",
    ],
    spec: [
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E0" },
      { label: "Core", value: "Seasoned softwood batten" },
    ],
    rates: { "25mm": 169, "19mm": 136 },
  },
  {
    slug: "mikasa-bwp-plus-blockboard",
    category: "Blockboard",
    name: "BWP+ Blockboard",
    grade: "BWP",
    warranty: "20 Year Warranty",
    core: "Seasoned Softwood Batten Core, Phenolic-Bonded",
    density: null,
    certifications: ["IS 1659 (Blockboard)"],
    applications: ["Wardrobe shutters", "Door panels", "Long shelves"],
    description:
      "BWP+ Blockboard is Mikasa's boiling-water-proof batten-core board for shutters, door panels and long shelves that need to stay flat without the weight of solid plywood. E1 emission compliant, 20-year warranty.",
    features: [
      "Boiling-water-proof bonding on an IS 1659 batten core",
      "Stays flat over long spans where plywood would sag",
      "Lighter than plywood at the same thickness",
      "E1 emission compliant",
      "20-year warranty",
    ],
    spec: [
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E1" },
      { label: "Core", value: "Seasoned softwood batten" },
    ],
    rates: { "19mm": 110 },
  },
  {
    slug: "mikasa-mr-plus-blockboard",
    category: "Blockboard",
    name: "MR+ Blockboard",
    grade: "MR",
    warranty: "15 Year Warranty",
    core: "Seasoned Softwood Batten Core, Amino-Bonded",
    density: null,
    certifications: ["IS 1659 (Blockboard)"],
    applications: ["Bedrooms", "Living rooms", "Dry-area shelving", "Door panels"],
    description:
      "MR+ Blockboard is Mikasa's moisture-resistant batten-core board for dry interior work — shelving, door panels and wardrobe internals where cost matters more than boil-proof bonding. E1 emission compliant, 15-year warranty.",
    features: [
      "Moisture-resistant bonding on an IS 1659 batten core",
      "For dry interior applications — not for kitchens or bathrooms",
      "Stays flat over long spans where plywood would sag",
      "E1 emission compliant",
      "15-year warranty",
    ],
    spec: [
      { label: "Adhesive", value: "Amino" },
      { label: "Emission Grade", value: "E1" },
      { label: "Core", value: "Seasoned softwood batten" },
    ],
    rates: { "25mm": 131, "19mm": 110 },
  },
];

function buildRow(p) {
  // Thickest-first, matching the rest of the catalogue: lib/pricing.ts seeds the
  // product page's default selection from the first entry.
  const thicknesses = Object.keys(p.rates).sort((a, b) => parseFloat(b) - parseFloat(a));
  const prices = thicknesses.map((t) => p.rates[t]);

  return {
    slug: p.slug,
    brand: "Mikasa",
    category: p.category,
    name: p.name,
    grade: p.grade,
    size: SIZE,
    thicknesses,
    core: p.core,
    density: p.density,
    warranty: p.warranty,
    certifications: p.certifications,
    applications: p.applications,
    description: p.description,
    features: p.features,
    spec_table: p.spec,
    price_table: {
      unit: "sqft",
      currency: "INR",
      gst: "excl",
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
    },
    variants: {
      unit: "sqft",
      currency: "INR",
      gst: "excl",
      cores: [
        {
          key: "standard",
          label: "Standard",
          sizes: [
            {
              key: "8x4",
              label: SIZE,
              thicknesses: thicknesses.map((t) => ({ key: t, label: t, price: p.rates[t] })),
            },
          ],
        },
      ],
    },
  };
}

const apply = process.argv.includes("--apply");

const rows = PRODUCTS.map(buildRow);
const slugs = rows.map((r) => r.slug);

const { data: existing, error: readError } = await supabase.from("products").select("slug").in("slug", slugs);
if (readError) throw new Error(`Read failed: ${readError.message}`);

const taken = new Set((existing ?? []).map((r) => r.slug));
const toInsert = rows.filter((r) => !taken.has(r.slug));

for (const row of rows) {
  const state = taken.has(row.slug) ? "SKIP (slug already exists)" : "INSERT";
  const t = row.variants.cores[0].sizes[0].thicknesses;
  console.log(`\n${state}  ${row.category} — ${row.brand} ${row.name}  [${row.slug}]`);
  console.log(`  ${row.grade} · ${row.warranty} · ${row.certifications.join(", ")}`);
  console.log(`  rates: ${t.map((x) => `${x.label} ₹${x.price}`).join("  ")}`);
  console.log(`  band:  ₹${row.price_table.min_price} – ₹${row.price_table.max_price}/sqft excl. GST`);
}

console.log(`\n${toInsert.length} to insert, ${rows.length - toInsert.length} skipped.`);

if (!apply) {
  console.log("\nDry run — nothing written. Re-run with --apply to insert.");
  process.exit(0);
}

if (toInsert.length === 0) process.exit(0);

// `products.id` is a plain not-null integer with no identity/sequence default,
// so an insert has to carry its own key. Read the current maximum and continue
// from there rather than guessing.
const { data: maxRow, error: maxError } = await supabase
  .from("products")
  .select("id")
  .order("id", { ascending: false })
  .limit(1);
if (maxError) throw new Error(`Read failed: ${maxError.message}`);
let nextId = (maxRow?.[0]?.id ?? 0) + 1;
const keyed = toInsert.map((row) => ({ id: nextId++, ...row }));

const { data, error } = await supabase.from("products").insert(keyed).select("id,slug");
if (error) throw new Error(`Insert failed: ${error.message}`);
console.log(`\nInserted ${data.length}:`);
for (const r of data) console.log(`  ${r.id}  ${r.slug}`);
console.log("\nUndo with: delete from products where slug in (" + data.map((r) => `'${r.slug}'`).join(", ") + ");");
