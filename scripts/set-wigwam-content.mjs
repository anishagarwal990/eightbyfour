import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Sourced from wigwamply.com/our-story and wigwamply.com/products. Only
// filling `applications` (was null on both rows) -- NOT touching
// grade/cert/density/warranty/core/spec_table, since Wigwam's current site
// markets fire-retardant and MR plywood as several named tiers (Visor,
// Contender, Club Plus / Fabricate Birch, MDP, HDP, Prime, Classic) with
// different warranty/cashback numbers than our generic "Excel FR"/"Excel MR"
// rows already carry. Overwriting with a tier's numbers risked corrupting
// data that's already internally consistent and plausible.
const BRAND_OVERVIEW =
  "Wigwam Ply (Savitri Woods) is a Punjab-based plywood manufacturer, established in 2003 and rebranded to Wigwam in 2018. It runs North India's largest plywood manufacturing unit in Hoshiarpur, was India's largest raw-material supplier to the plywood industry by 2008, and markets itself as the first brand to offer only calibrated plywood -- backed by a lifetime guarantee across its range.";
const BRAND_WEBSITE_URL = "https://wigwamply.com";

const PRODUCTS = {
  "wigwam-excel-fr-fr": {
    applications: ["Offices", "Hotels & Theatres", "Electrical Panels & Server Rooms", "Wall Partitions", "Commercial Interiors"],
  },
  "wigwam-excel-mr-mr": {
    applications: ["Interior Furniture", "Wardrobes & Cabinets", "Partitions & Panelling", "General Carpentry"],
  },
};

async function main() {
  const { error: brandError, count: brandCount } = await supabase
    .from("brands")
    .update({ overview: BRAND_OVERVIEW, website_url: BRAND_WEBSITE_URL }, { count: "exact" })
    .eq("slug", "wigwam-excel");
  if (brandError) throw brandError;
  console.log(`brand wigwam-excel: ${brandCount} row(s) updated`);

  for (const [slug, fields] of Object.entries(PRODUCTS)) {
    const { error, count } = await supabase.from("products").update(fields, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Wigwam content update failed:", err);
  process.exitCode = 1;
});
