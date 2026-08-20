import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Sourced and rephrased from greenpanel.com/Products/... per-product pages,
// plus web search for company history (Greenpanel demerged from Greenply
// Industries in 2018, listed independently Oct 2019). Not copied verbatim.
const BRAND_OVERVIEW =
  "Greenpanel Industries is India's largest MDF manufacturer and wood panel producer, demerged from Greenply Industries in 2018 and listed independently in 2019. It runs MDF and HDF manufacturing at Pantnagar (Uttarakhand) and Chittoor (Andhra Pradesh), alongside a plywood, blockboard and door range -- all BIS/IS-standard certified with E1/E2/CARB P2 emission compliance.";
const BRAND_WEBSITE_URL = "https://www.greenpanel.com";

const PRODUCTS = {
  // ---- Plywood ----
  "green-panel-club-ply": {
    core: "100% Composed Hardwood Core",
    warranty: "Lifetime Warranty",
    certifications: ["IS 10701 (Structural Grade)", "CARB P2 Compliant"],
    applications: ["Furniture", "Cabinets & Wardrobes", "Shelving", "False Ceilings", "Marine-Grade Projects", "Structural Components"],
    features: [
      "Boiling waterproof structural-grade plywood, 100% composed hardwood core with Quadra Pro bonding technology",
      "VVShield vacuum pressure impregnation for termite, borer and fungus protection",
      "Zero formaldehyde emissions -- Emission Free + E1 + CARB P2 compliant",
      "Fire-retardant treated",
      "3X money-back guarantee against manufacturing defects",
      "Lifetime warranty",
    ],
    spec_table: [
      { label: "Adhesive/Technology", value: "Quadra Pro, VVShield VPI" },
      { label: "Emission Grade", value: "E1, CARB P2" },
      { label: "Guarantee", value: "3X Money-Back on Defects" },
    ],
    description:
      "Club is Greenpanel's top-tier structural-grade plywood, built to IS 10701 with a 100% composed hardwood core bonded using Quadra Pro technology. VVShield vacuum-pressure impregnation protects against termites, borers and fungus, and the panel is fire-retardant treated with zero formaldehyde emissions (E1 + CARB P2 compliant). Backed by a lifetime warranty and 3X money-back guarantee, it's built for structural, marine-grade and heavy-use furniture applications.",
  },
  "green-panel-firex-ply": {
    grade: "FR",
    core: "100% Composed Hardwood Core",
    warranty: "30 Year Warranty",
    certifications: ["IS 5509 (Fire Retardant)"],
    applications: ["Outdoor & Semi-Outdoor Furniture", "Shipbuilding & Marine", "Commercial Interiors", "Partitions & Panelling", "High-Rise Buildings"],
    features: [
      "Fire-retardant boiling-waterproof plywood, 100% hardwood composed core, certified to IS 5509",
      "Quadra Pro bonding with VVShield vacuum pressure impregnation",
      "Slows flame spread and reduces smoke emission",
      "Emission Free + E1 compliant",
      "Dimensionally stable across weather extremes",
      "30-year warranty",
    ],
    spec_table: [
      { label: "Adhesive/Technology", value: "Quadra Pro, VVShield VPI" },
      { label: "Emission Grade", value: "E1" },
    ],
    description:
      "Firex is Greenpanel's fire-retardant plywood, certified to IS 5509 and engineered to slow flame spread and reduce smoke emission in a fire. Built from a 100% composed hardwood core with Quadra Pro bonding and VVShield vacuum-pressure impregnation, it stays dimensionally stable and emission-free (E1 compliant) across weather extremes. Backed by a 30-year warranty, it suits shipbuilding, marine, commercial interior and high-rise applications where fire safety is critical.",
  },
  "green-panel-gold-bwp-bwp": {
    core: "100% Composed Hardwood Core",
    warranty: "30 Year Warranty",
    applications: ["Outdoor & Semi-Outdoor Furniture", "Marine & Shipbuilding", "Commercial Interiors", "Modular Kitchens", "Partitions"],
    features: [
      "Fully boiling-waterproof plywood certified to IS 710, 100% hardwood composed core",
      "Quadra Pro bonding with VVShield vacuum pressure impregnation",
      "Fire-retardant properties",
      "Emission Free + E1 compliant",
      "30-year warranty",
    ],
    spec_table: [
      { label: "Adhesive/Technology", value: "Quadra Pro, VVShield VPI" },
      { label: "Emission Grade", value: "E1" },
    ],
    description:
      "Gold is Greenpanel's premium BWP (boiling waterproof) plywood, certified to IS 710 and built from a 100% composed hardwood core with Quadra Pro bonding and VVShield vacuum-pressure impregnation. It carries fire-retardant properties and is emission-free (E1 compliant), suited to marine, shipbuilding and modular kitchen applications where genuine waterproofing matters. Backed by a 30-year warranty.",
  },
  "green-panel-gold-mr-mr": {
    core: "100% Composed Hardwood Core",
    warranty: "15 Year Warranty",
    applications: ["Interior Furniture", "Partitions & Panelling", "Cabinets & Wardrobes", "Modular Kitchens"],
    features: [
      "Moisture-resistant plywood, 100% composed hardwood core with Quadra Pro bonding",
      "VVShield vacuum pressure impregnation for termite, borer and fungus protection",
      "Emission Free + E1 compliant",
      "15-year warranty",
    ],
    spec_table: [
      { label: "Adhesive/Technology", value: "Quadra Pro, VVShield VPI" },
      { label: "Emission Grade", value: "E1" },
    ],
    description:
      "Gold MR is Greenpanel's moisture-resistant plywood, certified to IS 303 and built from a 100% composed hardwood core with Quadra Pro bonding. VVShield vacuum-pressure impregnation protects against termites, borers and fungus, and the panel is emission-free (E1 compliant). Backed by a 15-year warranty, it suits interior furniture, cabinets and modular kitchen applications.",
  },
  "green-panel-bwp-bwp": {
    core: "100% Hardwood Timber Core",
    warranty: "25 Year Warranty",
    applications: ["Outdoor & Semi-Outdoor Furniture", "Shipbuilding & Marine", "Kitchens & Bathrooms", "Interior Fittings & Joinery"],
    features: [
      "Boiling waterproof plywood certified to IS 710, 100% hardwood timber core",
      "Glue Line Treatment (GLT) on every layer for termite, borer, fungus and virus protection",
      "Resists delamination, swelling and warping in all-weather use",
      "Emission Free + E1 compliant",
      "25-year warranty",
    ],
    spec_table: [
      { label: "Adhesive/Technology", value: "Glue Line Treatment (GLT)" },
      { label: "Emission Grade", value: "E1" },
    ],
    description:
      "BWP is Greenpanel's boiling-waterproof plywood, certified to IS 710 and built from a 100% hardwood timber core. Glue Line Treatment (GLT) is applied to every layer for protection against termites, borers, fungi and viruses, giving it exceptional resistance to delamination, swelling and warping in all-weather use. Emission-free (E1 compliant) and backed by a 25-year warranty, it's suited to kitchens, bathrooms and other moisture-prone interiors.",
  },
  "green-panel-mr-mr": {
    warranty: "15 Year Warranty",
    applications: ["Partitions & Panelling", "Door Panels", "False Ceilings", "Furniture", "Decorative Elements", "Musical Instruments"],
    features: [
      "Moisture-resistant interior-grade plywood certified to IS 303",
      "Protection against borers, termites and fungus",
      "Withstands moderate humidity and weather fluctuation",
      "Low emission classification",
      "Smooth, consistent finish",
      "15-year warranty",
    ],
    description:
      "MR is Greenpanel's moisture-resistant, interior-grade plywood certified to IS 303, protected against borers, termites and fungus and built to withstand moderate humidity and weather fluctuation. It carries a low-emission classification and a smooth, consistent finish suited to furniture, partitions, false ceilings and decorative work. Backed by a 15-year warranty.",
  },
  // ---- Boil Boards ----
  "green-panel-boilblack-bwp-hdf-bwp-grade": {
    core: "Eucalyptus Fiber",
    density: "1100 kg/m³",
    warranty: "25 Year Warranty",
    certifications: ["BWP Grade"],
    applications: ["Bathroom Vanities", "Marine Interiors", "Premium Furniture", "Flooring", "High Load-Bearing Areas", "Restroom Cubicles"],
    features: [
      "Ultra-high-density boiling-waterproof HDF, engineered on a German Dieffenbacher CPS+ continuous press",
      "1100 kg/m³ density for exceptional dimensional stability",
      "Smooth, finish-ready surface for laminates, veneers, PU or digital print",
      "Low emission",
      "25-year warranty",
    ],
    spec_table: [
      { label: "Manufacturing", value: "Dieffenbacher CPS+ Continuous Press" },
      { label: "Core Material", value: "Eucalyptus Fiber" },
    ],
  },
  // ---- MDF and HDHMR ----
  "green-panel-hdwr-high-density-water-resistant-hmr-gp-grade": {
    core: "Eucalyptus Fiber",
    warranty: "15 Year Warranty",
    certifications: ["IS 12406:2025 (HMR-GP Grade)"],
    applications: ["Kitchen Cabinets", "Bathroom Vanities", "Wardrobes & Shelves", "Doors & Cupboards", "Retail Fixtures", "Interior Paneling"],
    features: [
      "High-density water-resistant fibreboard bonded with premium MUF resin",
      "Resistant to termites, borers and fungus",
      "Strong screw-holding strength",
      "Super-smooth surface for painting, polishing or laminating",
      "E1, E2 and CARB P2 compliant",
      "15-year warranty",
    ],
    spec_table: [
      { label: "Adhesive", value: "Premium MUF Resin" },
      { label: "Emission Grade", value: "E1, E2, CARB P2" },
    ],
  },
  "green-panel-exterior-mdf-mr-grade-mr-grade": {
    core: "Eucalyptus Fiber",
    certifications: ["IS 12406:2025 (MR Grade)"],
    applications: ["Kitchen Shutters", "Vanity Cabinets", "Retail Fixtures", "Carved Wall Panels", "Designer Partitions"],
    features: [
      "Moisture-resistant MDF bonded with premium melamine resin",
      "Resistant to termites, borers and fungus",
      "Strong internal bonding and dimensional stability",
      "Smooth, homogenous surface for painting and 3D routing",
      "E1, E2 and CARB P2 compliant",
    ],
    spec_table: [
      { label: "Adhesive", value: "Melamine Resin" },
      { label: "Emission Grade", value: "E1, E2, CARB P2" },
    ],
  },
  "green-panel-interior-mdf-reg-grade-reg-grade": {
    core: "Eucalyptus Fiber",
    certifications: ["IS 12406:2025 (REG Grade)"],
    applications: ["Furniture", "Decorative Panels", "Toys & Handicrafts", "Retail & Residential Installations"],
    // Was truncated to just ["1.7mm", "30mm"] -- full range confirmed on
    // greenpanel.com's own Interior MDF spec page.
    thicknesses: [
      "1.7mm", "1.9mm", "2.1mm", "2.7mm", "3.3mm", "4mm", "4.6mm", "5.5mm",
      "7mm", "7.3mm", "9.75mm", "11mm", "14.5mm", "16mm", "16.5mm", "17mm",
      "18mm", "25mm", "30mm",
    ],
    features: [
      "Regular-density interior MDF with uniform fine texture and excellent machinability",
      "Strong internal bonding, high load-bearing capacity",
      "Superior dimensional stability, smooth surface finish",
      "E1, E2 and CARB P2 compliant",
      "Not suited to damp or high-humidity areas",
    ],
    spec_table: [{ label: "Emission Grade", value: "E1, E2, CARB P2" }],
  },
};

async function main() {
  const { error: brandError, count: brandCount } = await supabase
    .from("brands")
    .update({ overview: BRAND_OVERVIEW, website_url: BRAND_WEBSITE_URL }, { count: "exact" })
    .eq("slug", "green-panel");
  if (brandError) throw brandError;
  console.log(`brand green-panel: ${brandCount} row(s) updated`);

  for (const [slug, fields] of Object.entries(PRODUCTS)) {
    const { error, count } = await supabase.from("products").update(fields, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Green Panel content update failed:", err);
  process.exitCode = 1;
});
