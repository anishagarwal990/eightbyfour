import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Rephrased from Fevicol_Product_Pages_v4.docx (Overview + top Key Features
// per product), not copied verbatim.
const DESCRIPTIONS = {
  "fevicol-fevicol-sh":
    "Fevicol SH is India's benchmark PVA wood adhesive, a ready-to-use milky-white emulsion trusted by carpenters for wood-to-wood and panel bonding. It grips fast — unclamp in 2-3 hours, full cure in 24 — and is solvent-free, non-flammable and virtually odourless. MR (moisture-resistant) grade, suited to everyday interior carpentry, laminate pasting and furniture-making.",
  "fevicol-fevicol-marine":
    "Fevicol Marine is Pidilite's BWP (Boiling Water Proof) grade adhesive, built for wood-based work that can't afford to fail near moisture — outdoor furniture, kitchen and bathroom carcasses, window frames and genuine marine use. It withstands roughly 7 hours of boiling water and 7 days of normal water exposure, resists fungus and bacteria, and sets in about 4 hours.",
  "fevicol-fevicol-hiper":
    "Fevicol HiPer is a high-strength adhesive built for premium, thick laminates (1mm+) and veneer pasting, delivering a noticeably higher initial tack and handling strength in as little as 2 hours. It's the speed-focused choice for professional furniture manufacturing and fast-turnaround carpentry.",
  "fevicol-fevicol-probond":
    "Fevicol Pro Bond is a water-based adhesive engineered specifically for laminating PVC and acrylic sheet onto MDF, plywood and particle board, and for manual PVC edge-banding without machinery. GreenPro certified, it develops bond strength in 4-6 hours, reaches full strength in 24, and is heat- and moisture-resistant for kitchens and wardrobes.",
  "fevicol-fevicol-ezee-spray":
    "Fevicol Ezee Spray is a sprayable, high-temperature-resistant contact adhesive for fast, even coverage on vertical panels, ceilings and curved edges where brushing is impractical. It bonds HPL, fabric, foam and insulation panels to wood-based substrates, sets in as little as 5 minutes with up to 30 minutes of open time, and is heat resistant to 115°C.",
  "fevicol-fevicol-heatx":
    "Fevicol HeatX is a synthetic rubber contact adhesive built to hold where standard adhesives soften under heat, rated to 170°C. Its quick-grab, springback-resistant formulation is the specialist choice for insulation, HVAC ducting and high-temperature furniture and industrial bonding, drying in 4-6 minutes with full strength at 24 hours.",
  "fevicol-fevicol-hiper-star":
    "Fevicol HiPer Star is the premium, waterproof tier of the HiPer range, built for high-end laminate and veneer work with the highest anti-bubble performance in the line — large sheets go down flat without trapped air pockets. It offers faster trimming (1-1.5 hours), coverage of about 1.5 laminate sheets per kg, and heat resistance up to 150°C.",
  "fevicol-fevicol-nail-free-ultra":
    "Fevicol Nailfree (Nail Free Ultra) is a one-part, moisture-curing adhesive-sealant that replaces nails, screws and clamps for fixing skirting, panels, wall cladding, tiles and trims across wood, metal, glass, tile, stone and concrete. It's especially popular for wall panelling and louvers, holds roughly 18-20kg per sq.ft. after cure, is UV and weather resistant, and paintable after 24 hours.",
  "fevicol-fevicol-speedx":
    "Fevicol SpeedX is a high-resin PVA wood adhesive engineered for time-bound, high-volume laminate pasting, with quick setting speed and superior flow for faster large-scale application. Its water-resistant formulation also helps furniture hold up better in humid conditions, without sacrificing bond quality.",
  "fevicol-fevicol-sr-998":
    "Fevicol SR 998 is a synthetic rubber-based industrial contact adhesive built to bond dissimilar materials — metal, glass, rubber, leather and PVC — where wood glues can't. It dries into a flexible, water- and ageing-resistant film in about 5 minutes, and is the standard choice across automotive, railway, shipbuilding and electrical industries.",
};

async function main() {
  for (const [slug, description] of Object.entries(DESCRIPTIONS)) {
    const { error, count } = await supabase.from("products").update({ description }, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fevicol descriptions update failed:", err);
  process.exitCode = 1;
});
