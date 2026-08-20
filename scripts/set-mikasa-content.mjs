import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Sourced and rephrased from mikasaply.com (brand overview + per-product spec
// pages: /sapphire, /marine-blue, /mr-plus, /fire-guardian), not copied verbatim.
const BRAND_OVERVIEW =
  "Mikasa Plywood, from Greenlam Industries -- one of the world's largest laminate makers -- supplies fire-retardant, BWP marine-grade and moisture-resistant (MR) plywood built with Deca Edge Technology and ISI-certified construction.";

const PRODUCTS = {
  "mikasa-sapphire-ply": {
    grade: "PLY",
    core: "100% machine-composed veneer, phenolic-bonded",
    density: "~775 kg/CBM",
    warranty: "Lifetime Warranty",
    certifications: ["IS 5509:2021 (Fire Retardant)", "E0 Emission Grade"],
    applications: ["Living rooms", "Sitting rooms", "Sun decks"],
    thicknesses: ["25mm", "19mm", "16mm", "12mm", "9mm", "6mm", "4mm"],
    features: [
      "Premium hardwood plywood built from 100% machine-composed veneer, phenolic-bonded for a dense, void-free core",
      "0.9mm double-layer face veneer for a smoother, more even surface",
      "Vacuum Pressure Chemical Treatment on every veneer sheet",
      "Anti-termite, anti-borer, anti-fungal and anti-bacterial protection",
      "Inherently fire-retardant to IS 5509:2021",
      "E0 emission certified",
      "Lifetime warranty",
    ],
    spec_table: [
      { label: "Face Veneer Thickness", value: "0.9 mm (double layer)" },
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E0" },
      { label: "Glue Shear Strength", value: "≥1600 N" },
      { label: "Moisture Content", value: "5.0-15.0%" },
      { label: "Water Absorption", value: "<5%" },
      { label: "Screw Holding Strength", value: "≥275 kg" },
      { label: "Nail Holding Strength", value: "≥150 kg" },
      { label: "MOR (along grain)", value: "≥60 N/mm²" },
      { label: "MOE (along grain)", value: "≥8000 N/mm²" },
    ],
    description:
      "Sapphire is Mikasa's premium hardwood plywood, built from 100% machine-composed veneer bonded with phenolic adhesive for a dense, void-free core. A double-layer 0.9mm face veneer and Vacuum Pressure Chemical Treatment on every sheet give it a smoother finish along with anti-termite, anti-borer, anti-fungal and anti-bacterial protection. It's inherently fire-retardant to IS 5509:2021, E0 emission certified, and backed by a lifetime warranty -- built for premium living rooms, sitting rooms and sun deck furniture.",
  },
  "mikasa-marine-blue-ply": {
    grade: "BWP",
    core: "Tropical wood blend, machine-composed veneer, phenolic-bonded",
    density: "~700 kg/CBM",
    warranty: "30 Year Warranty",
    certifications: ["IS 710 (BWP Grade)", "IS 5509:2021 (Fire Retardant)"],
    applications: ["Indoor furniture", "Outdoor furniture", "High-moisture areas"],
    thicknesses: ["25mm", "19mm", "16mm", "12mm", "9mm", "6mm", "4mm"],
    features: [
      "BWP (boiling water proof) marine-grade plywood from a tropical wood blend, pressed with Quad Core Press technology",
      "Precision Calibration Technology for uniform thickness",
      "High-Impact Resistant Technology for heavy-use furniture",
      "Anti-termite, anti-borer, anti-fungal and anti-bacterial protection",
      "Fire-retardant certified to IS 5509:2021",
      "E0 emission grade",
      "30-year warranty",
    ],
    spec_table: [
      { label: "Face Veneer Thickness", value: "0.3 mm" },
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E0" },
      { label: "Glue Shear Strength", value: "≥1350 N" },
      { label: "Moisture Content", value: "5.0-15.0%" },
      { label: "Water Absorption", value: "<5%" },
      { label: "Screw Holding Strength", value: "≥250 kg" },
      { label: "Nail Holding Strength", value: "≥105 kg" },
      { label: "MOR (along grain)", value: "≥55 N/mm²" },
      { label: "MOR (across grain)", value: "≥40 N/mm²" },
      { label: "MOE (along grain)", value: "≥7500 N/mm²" },
      { label: "MOE (across grain)", value: "≥4800 N/mm²" },
    ],
    description:
      "Marine Blue is Mikasa's BWP (boiling water proof) marine-grade plywood, made from a tropical wood blend and pressed with Quad Core Press technology for uniform thickness and high impact resistance. Precision-calibrated veneers are treated for anti-termite, anti-borer, anti-fungal and anti-bacterial protection, and the panel is certified fire-retardant to IS 5509:2021. Backed by a 30-year warranty, it holds up in indoor furniture as well as high-moisture and outdoor applications that standard MR plywood can't handle.",
  },
  "mikasa-mr-mr": {
    grade: "MR",
    core: "Premium tropical wood, machine-composed veneer",
    density: "~600 kg/CBM",
    warranty: "15 Year Warranty",
    certifications: ["IS 303:1989 (MR Grade)"],
    applications: ["Bedrooms", "Living rooms", "Reading rooms", "Sitting rooms"],
    thicknesses: ["25mm", "18mm", "16mm", "12mm", "8mm", "6mm", "4mm"],
    features: [
      "Moisture-resistant plywood from premium tropical wood, Quad Core-pressed for humidity tolerance",
      "100% precision calibration technology",
      "Vacuum Pressure Chemical Treatment on face veneers",
      "Anti-termite, anti-borer, anti-fungal and anti-bacterial protection",
      "High-Impact Resistant Technology",
      "E1 emission certified",
      "15-year warranty",
    ],
    spec_table: [
      { label: "Face Veneer Thickness", value: "0.3 mm" },
      { label: "Adhesive", value: "Amino" },
      { label: "Emission Grade", value: "E1" },
      { label: "Screw Holding Strength", value: "≥200 kg" },
      { label: "Nail Holding Strength", value: "≥100 kg" },
    ],
    description:
      "MR+ is Mikasa's moisture-resistant general-purpose plywood, built from premium tropical wood with a machine-composed, Quad Core-pressed core for high humidity tolerance. Face veneers get Vacuum Pressure Chemical Treatment plus anti-termite, anti-borer, anti-fungal and anti-bacterial protection, and the panel meets E1 emission norms for low indoor air toxicity. Backed by a 15-year warranty, it's built for bedrooms, living rooms and everyday interior furniture.",
  },
  "mikasa-fire-guardian-ply": {
    grade: "FR",
    core: "100% machine-composed veneer, phenolic-bonded",
    density: "~700 kg/CBM",
    warranty: "30 Year Warranty",
    certifications: ["IS 5509:2021 (Fire Retardant)"],
    applications: ["Offices", "Dining areas", "Living rooms", "Entertainment rooms", "Backyards"],
    thicknesses: ["25mm", "19mm", "16mm", "12mm", "9mm", "6mm", "4mm"],
    features: [
      "Fire-retardant plywood certified to IS 5509:2021, slows flame spread and limits smoke generation",
      "100% machine-composed veneer core, Quad Core-pressed",
      "Vacuum Pressure Chemical Treatment on every veneer sheet",
      "Anti-termite, anti-borer, anti-fungal and anti-bacterial protection",
      "Precision Calibration Technology for a smooth, wave-free surface",
      "E1 emission certified",
      "30-year warranty",
    ],
    spec_table: [
      { label: "Face Veneer Thickness", value: "0.3 mm" },
      { label: "Adhesive", value: "Phenolic" },
      { label: "Emission Grade", value: "E1" },
      { label: "Glue Shear Strength", value: "≥1350 N" },
      { label: "Moisture Content", value: "5.0-15.0%" },
      { label: "Water Absorption", value: "<5%" },
      { label: "Screw Holding Strength", value: "≥250 kg" },
      { label: "Nail Holding Strength", value: "≥105 kg" },
      { label: "MOR (along grain)", value: "≥55 N/mm²" },
      { label: "MOE (along grain)", value: "≥7500 N/mm²" },
    ],
    description:
      "Fire Guardian is Mikasa's fire-retardant plywood, certified to IS 5509:2021 and built to slow flame spread and limit smoke generation in domestic and commercial interiors. Its 100% machine-composed veneer core is Quad Core-pressed and precision-calibrated, with Vacuum Pressure Chemical Treatment and anti-termite, anti-borer, anti-fungal and anti-bacterial protection built in. E1 emission certified with a 30-year warranty, it suits offices, dining areas, living rooms and entertainment spaces where fire safety matters.",
  },
};

async function main() {
  const { error: brandError, count: brandCount } = await supabase
    .from("brands")
    .update({ overview: BRAND_OVERVIEW }, { count: "exact" })
    .eq("slug", "mikasa");
  if (brandError) throw brandError;
  console.log(`brand mikasa: ${brandCount} row(s) updated`);

  for (const [slug, fields] of Object.entries(PRODUCTS)) {
    const { error, count } = await supabase.from("products").update(fields, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Mikasa content update failed:", err);
  process.exitCode = 1;
});
