import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Plywood already uses bare grade codes (PLY, MR, BWP, FR, BWR). MDF/HDHMR
// and Boil Boards mixed in a "Grade" suffix and, in one case, reversed word
// order ("Marine Grade BWP" vs "BWP Grade") for what's the same standard.
// Standardizing every category to the bare-code convention.
const RENAMES = [
  { category: "MDF and HDHMR", from: "HMR-GP Grade", to: "HMR-GP" },
  { category: "MDF and HDHMR", from: "MR Grade", to: "MR" },
  { category: "MDF and HDHMR", from: "REG Grade", to: "REG" },
  { category: "Boil Boards", from: "BWP Grade", to: "BWP" },
  { category: "Boil Boards", from: "Marine Grade BWP", to: "BWP" },
];

async function main() {
  for (const { category, from, to } of RENAMES) {
    const { error, count } = await supabase
      .from("products")
      .update({ grade: to }, { count: "exact" })
      .eq("category", category)
      .eq("grade", from);
    if (error) throw error;
    console.log(`${category} | "${from}" -> "${to}": ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Grade normalization failed:", err);
  process.exitCode = 1;
});
