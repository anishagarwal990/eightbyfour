import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Round 2 — corrected against mikasaply.com/no-nonsense-ply screenshots (exact
// badge text per product). Fixes: Sapphire's cert badge is IS 10701
// (Structural Plywood), not IS 5509 — earlier fetch mismatched it. Adds CARB
// Certified (Sapphire + Marine Blue), corrects Sapphire face veneer to
// 0.6mm/side, names Sapphire's "6X Press Technology". Rephrased from source,
// not copied verbatim.
const BRAND_OVERVIEW =
  "Mikasa Plywood delivers certified strength in every board -- structural-grade panels with a 100% calibrated finish for durability and precision across every space. It's manufactured by Greenlam Industries, ranked among the top three laminate makers globally and a leading integrated substrate and surface solutions provider serving 120+ countries. Greenlam runs five manufacturing facilities across India -- Behror, Nalagarh, Prantij, Tindivanam and Naidupeta -- ethically sources its raw material, and holds certifications including FSC, PEFC, ISO 9001, ISO 14001 and GREENPRO.";
const BRAND_WEBSITE_URL = "https://www.mikasaply.com";

const PRODUCTS = {
  "mikasa-sapphire-ply": {
    core: "100% composed veneer, Deca Edge Technology, 6X Press Technology",
    certifications: ["IS 10701 (Structural Plywood)", "CARB Certified"],
    features: [
      "Premium structural-grade plywood, 100% composed veneer with Deca Edge and 6X press technology",
      "0.6mm face veneer on each side for a premium, durable finish",
      "E0-certified resin for zero-emission, eco-friendly construction",
      "Inherently fire-retardant",
      "Vacuum-pressed and chemically treated against pests and microbes",
      "CARB certified",
      "Lifetime warranty",
    ],
    spec_table: [
      { label: "Face Veneer Thickness", value: "0.6 mm (each side)" },
      { label: "Press Technology", value: "6X Press, Deca Edge Technology" },
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
      "Sapphire is Mikasa's premium structural-grade plywood, built from 100% composed veneer with Deca Edge and 6X press technology for a dense, uniform core. A 0.6mm face veneer on each side, E0-certified resin and vacuum-pressure chemical treatment give it a premium finish along with pest and microbe resistance. Inherently fire-retardant, CARB certified to IS 10701, and backed by a lifetime warranty.",
  },
  "mikasa-marine-blue-ply": {
    certifications: ["IS 710 (BWP Grade)", "CARB Certified"],
    features: [
      "BWP (boiling water proof) marine-grade plywood, built from 100% tropical wood to stringent emission standards",
      "Uniform thickness and smoothness for a flawless, premium finish",
      "High tensile strength — resists bending, warping and deformation",
      "Decay-resistant and fire-safe for long-term durability",
      "Pest-resistant against bacteria, fungi, borers and termites",
      "Built to endure high-pressure impact in heavy-use areas",
      "CARB certified",
      "30-year warranty",
    ],
    description:
      "Marine Blue is Mikasa's BWP (boiling water proof) marine-grade plywood, built from 100% tropical wood to stringent emission standards. Uniform thickness, high tensile strength and decay resistance keep it stable under bending and warping stress, while fire-safe, pest-resistant construction protects against bacteria, fungi, borers and termites. CARB certified to IS 710 and backed by a 30-year warranty, it's built for high-pressure, heavy-use areas.",
  },
  "mikasa-mr-mr": {
    features: [
      "Moisture-resistant plywood built from durable tropical wood for demanding applications",
      "Resists warping, delamination and humidity damage",
      "E1-certified resin, meets E1 emission standards",
      "Precision-calibrated, machine-composed veneer for uniform thickness and smooth finish",
      "15-year warranty",
    ],
    description:
      "MR+ is Mikasa's moisture-resistant plywood, built from durable tropical wood with a precision-calibrated, machine-composed veneer core for a uniform, smooth finish. It resists warping, delamination and humidity damage, bonded with E1-certified resin to meet E1 emission standards. Certified to IS 303 (MR grade) and backed by a 15-year warranty, it suits general-purpose interior furniture.",
  },
  "mikasa-fire-guardian-ply": {
    features: [
      "Fire-retardant plywood built for domestic and commercial fire safety",
      "100% composed veneer for uniform quality, strength and durability",
      "Quad-Core press technology for structural integrity under high pressure",
      "Sturdy surface for kitchens, offices and commercial entryways",
      "Antifungal and antibacterial treatment for a hygienic finish",
      "30-year warranty",
    ],
    description:
      "Fire Guardian is Mikasa's fire-retardant plywood, built from 100% composed veneer with Quad-Core press technology for structural integrity under high pressure. Antifungal and antibacterial treatment keeps surfaces hygienic, making it a sturdy choice for kitchens, offices and commercial entryways. Certified to IS 5509, E1 emission compliant, and backed by a 30-year warranty.",
  },
};

async function main() {
  const { error: brandError, count: brandCount } = await supabase
    .from("brands")
    .update({ overview: BRAND_OVERVIEW, website_url: BRAND_WEBSITE_URL }, { count: "exact" })
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
  console.error("Mikasa content v2 update failed:", err);
  process.exitCode = 1;
});
