import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Sourced from Century's incl-GST rate card (4mm-19mm range per product line).
// excl-GST = incl / 1.18, rounded to the nearest rupee.
const PRICING = {
  "century-architect-ply-ply": { min: 71, max: 179 },
  "century-club-prime-ply": { min: 56, max: 142 },
  "century-bond-shield-ply": { min: 51, max: 117 },
  "century-sainik-710-ply": { min: 40, max: 103 },
  "century-sainik-mr-mr": { min: 33, max: 89 },
};

async function main() {
  for (const [slug, { min, max }] of Object.entries(PRICING)) {
    const price_table = { min_price: min, max_price: max, unit: "sqft", currency: "INR", gst: "excl", cashback_pct: 5 };
    const { error, count } = await supabase
      .from("products")
      .update({ price_table }, { count: "exact" })
      .eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated -> ₹${min}-${max}/sqft excl. GST`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Century Ply pricing update failed:", err);
  process.exitCode = 1;
});
