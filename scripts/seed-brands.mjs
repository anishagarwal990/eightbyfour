import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Known logos from the current site's BRAND_TILES array (index.html) — brands
// without an uploaded logo yet fall back to a text wordmark on the brand page.
const KNOWN_LOGOS = {
  Century: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/century.png",
  Austin: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/austin.png",
  "Green Panel": "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/green-panel.png",
  Greenply: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/greenply.svg",
  Mikasa: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/mikasa.png",
  "Wigwam Excel": "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/wigwam-excel.png",
  Propperly: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/propperly.png",
};

const OVERVIEWS = {
  Century: "CenturyPly manufactures plywood, block boards and door solutions trusted across Indian construction for over four decades.",
  Austin: "Austin is a plywood manufacturer supplying commercial and marine-grade panels through EightByFour's Hyderabad network.",
  "Green Panel": "Green Panel produces plywood and MDF/HDHMR boards, including boil-proof (BWP) grades for high-moisture applications.",
  Greenply: "Greenply is one of India's largest plywood and panel manufacturers, known for interior and exterior-grade plywood.",
  Mikasa: "Mikasa supplies commercial plywood for furniture and interior fit-out projects.",
  "Wigwam Excel": "Wigwam Excel manufactures MR and FR grade commercial plywood.",
  Propperly: "Propperly is EightByFour's in-house curated line of veneers and surface materials.",
  Durasein: "Durasein manufactures acrylic solid surface sheets used for countertops, wall cladding and Corian-style surfaces.",
  Tiara: "Tiara produces acrylic solid surface sheets in a wide range of shades for kitchen and bath surfaces.",
  Fevicol: "Fevicol (Pidilite) is India's leading brand of wood and construction adhesives.",
  "Russian Birch Ply": "Russian Birch Ply supplies imported birch plywood in BB/BB grade, prized for furniture and exposed-edge applications.",
};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[×]/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const { data, error } = await supabase.from("products").select("brand");
  if (error) throw error;

  const brands = [...new Set(data.map((r) => r.brand.trim()))].sort();
  console.log(`Seeding ${brands.length} brands:`, brands);

  const rows = brands.map((name) => ({
    slug: slugify(name),
    name,
    logo_url: KNOWN_LOGOS[name] || null,
    overview: OVERVIEWS[name] || null,
  }));

  const { error: upsertErr } = await supabase.from("brands").upsert(rows, { onConflict: "slug" });
  if (upsertErr) throw upsertErr;

  console.log("Brands seeded.");
}

main().catch((err) => {
  console.error("Brand seed failed:", err);
  process.exitCode = 1;
});
