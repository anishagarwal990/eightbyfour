import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// "PLY" is not a real IS grade code -- it was a placeholder standing in for
// whatever grade each row's own `certifications` text already states. Real
// grade codes: BWP (IS 710, boiling-water-proof/marine -- also BS 1088
// internationally), MR (IS 303, moisture-resistant), FR (IS 5509,
// fire-retardant), STR (IS 10701, structural plywood). Remapping every
// "PLY"-tagged row off its own cited standard; Green Panel Club's cert had
// IS 10701 mislabeled "(BWP Grade)" when IS 10701 is the Structural
// standard -- IS 710 is BWP -- corrected here too. Austin Lincoln 710 only
// carried an emission cert; verified via web search that "710" in the name
// is literally IS 710 (BWP), so added that cert.
const UPDATES = {
  "greenply-green-club-ply": { grade: "BWP" },
  "greenply-green-platinum-ply": { grade: "BWP" },
  "greenply-green-gold-ply": { grade: "BWP" },
  "greenply-optima-g-710-ply": { grade: "BWP" },
  "green-panel-club-ply": { grade: "STR", certifications: ["IS 10701 (Structural Grade)"] },
  "mikasa-sapphire-ply": { grade: "STR" },
  "austin-platinum-plus-ply": { grade: "BWP" },
  "austin-lincoln-710-ply": { grade: "BWP", certifications: ["IS 710 (BWP Grade)", "E-0 Emission Certified"] },
  "green-panel-firex-ply": { grade: "BWP" },
  "austin-gold-ply": { grade: "BWP" },
  "austin-club-plus-ply": { grade: "STR" },
};

async function main() {
  for (const [slug, fields] of Object.entries(UPDATES)) {
    const { error, count } = await supabase.from("products").update(fields, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated -> ${JSON.stringify(fields)}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("PLY grade fix failed:", err);
  process.exitCode = 1;
});
