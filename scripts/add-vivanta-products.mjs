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

const IMG_DIR = "/private/tmp/claude-501/-Users-anishagarwal-Downloads-eightbyfour/e89fb87c-bb59-4031-b02f-55fbc8d7c5e6/scratchpad/vivanta_imgs";
const MANIFEST = JSON.parse(readFileSync(join(IMG_DIR, "manifest.json"), "utf-8"));

const CATEGORY = "Corian - Acrylic Solid Surface";
const BRAND = "Vivanta";

// From the Vivanta technical-specifications sheet — identical across the
// whole acrylic solid-surface range (Whites/Premium Solids/Bright
// Solids/Sparkles/Granites), not per-shade data.
const SPEC_TABLE = [
  { label: "Specific Gravity (23/23°C)", value: "1.74" },
  { label: "Rockwell Hardness (HRM)", value: "82" },
  { label: "Barcol Hardness", value: "66" },
  { label: "Flexural Strength", value: "69.8 MPa" },
  { label: "Flexural Modulus of Elasticity", value: "9.97 GPa" },
  { label: "Izod Impact Strength", value: "23 J/m" },
  { label: "Deflection Temperature Under Load", value: "100°C" },
  { label: "Thermal Expansion", value: "4.1×10⁻⁵ /°C" },
  { label: "Tensile Strength", value: "45.4 MPa" },
  { label: "Water Absorption Rate (24h immersion)", value: "0.05%" },
];

const CERTIFICATIONS = ["ISO 9001", "NSF 51", "CE", "GREENGUARD", "ISFA"];
const SIZE = "760×2490mm / 760×3680mm (30×98in / 30×145in)";
const THICKNESSES = ["6mm", "12mm"];

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureBrand() {
  const { data: existing, error: fetchErr } = await supabase.from("brands").select("id").eq("slug", "vivanta").maybeSingle();
  if (fetchErr) throw fetchErr;
  if (existing) {
    console.log("Brand row already exists, skipping insert");
    return;
  }
  const { error } = await supabase.from("brands").insert({
    name: BRAND,
    slug: "vivanta",
    overview:
      "Vivanta manufactures acrylic solid surface sheets in Korea across Luxe, Quartz, Granites and Premium colour collections. The material is non-porous and seamlessly jointable, resists heat, stains, mould and mildew, and pairs cleanly with wood, metal, glass and laminate -- its malleability suits curved counters and custom fabrication across kitchens, office furniture, retail, hospitality and healthcare fit-outs. Backed by certified installation and a 10-year warranty.",
    website_url: "https://vivantasurfaces.com",
    logo_url: "/brand-logos/vivanta.jpeg",
  });
  if (error) throw error;
  console.log("Inserted brand row");
}

async function uploadImage(code, file) {
  const bytes = readFileSync(join(IMG_DIR, file));
  const ext = file.split(".").pop();
  const storagePath = `products/vivanta-${code.toLowerCase()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(storagePath, bytes, {
    contentType: ext === "png" ? "image/png" : "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  await ensureBrand();

  // id has no default/sequence attached in this schema (other seed scripts
  // hit the same gap) — assign explicitly from the current max.
  const { data: maxRow, error: maxErr } = await supabase
    .from("products")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();
  if (maxErr) throw maxErr;
  let nextId = maxRow.id + 1;

  let inserted = 0;
  let skipped = 0;
  for (const { code, name, collection, file } of MANIFEST) {
    const slug = `vivanta-${slugify(name)}-${code.toLowerCase()}`;

    const { data: existing, error: fetchErr } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (existing) {
      skipped++;
      continue;
    }

    const main_img_url = await uploadImage(code, file);

    const { error } = await supabase.from("products").insert({
      id: nextId++,
      category: CATEGORY,
      brand: BRAND,
      name,
      slug,
      collection,
      sd_code: code,
      size: SIZE,
      thicknesses: THICKNESSES,
      warranty: "10 Years Warranty",
      certifications: CERTIFICATIONS,
      spec_table: SPEC_TABLE,
      price_table: { starting_price: 480, unit: "sqft", cashback_pct: 5 },
      main_img_url,
    });
    if (error) throw error;
    inserted++;
    console.log(`Inserted ${slug}`);
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped} (already present).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
