import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Generic BIS/ISI standard per grade - not brand-specific license numbers.
// IS 303:1989 covers general-purpose plywood in MR and BWR grades; India's
// commercial/structural "PLY" lines are conventionally BWR grade under the
// same standard. FR lines add the fire-retardant treatment standard.
const CERTIFICATIONS_BY_GRADE = {
  MR: ["IS 303:1989 (MR Grade)"],
  BWP: ["IS 303:1989 (BWR Grade)"],
  PLY: ["IS 303:1989 (BWR Grade)"],
  FR: ["IS 303:1989 (BWR Grade)", "IS 5509:1969 (Fire Retardant Treatment)"],
};

async function main() {
  const { data: products, error } = await supabase.from("products").select("id,slug,grade").eq("category", "Plywood");
  if (error) throw error;

  let updated = 0;
  for (const p of products) {
    const certifications = CERTIFICATIONS_BY_GRADE[p.grade];
    if (!certifications) {
      console.log(`Skipping ${p.slug}: unknown grade "${p.grade}"`);
      continue;
    }
    const { error: updErr } = await supabase.from("products").update({ certifications }).eq("id", p.id);
    if (updErr) throw updErr;
    updated++;
    console.log(`${p.slug}: ${certifications.join(", ")}`);
  }
  console.log(`Done. ${updated}/${products.length} updated.`);
}

main().catch((err) => {
  console.error("Plywood certifications update failed:", err);
  process.exitCode = 1;
});
