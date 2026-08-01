import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Austin Plywood Telangana branch rate card (Sq.Ft column, incl-GST MRP).
// final = (card_price * 0.96 discount) / 1.18. Gold/Club Plus/Platinum Plus
// range spans 4mm-19mm; Lincoln 710's card only lists 6mm-18mm.
const PRICING = {
  "austin-gold-ply": { min: 55, max: 121 },
  "austin-club-plus-ply": { min: 60, max: 144 },
  "austin-platinum-plus-ply": { min: 64, max: 166 },
  "austin-lincoln-710-ply": { min: 52, max: 102 },
};

async function main() {
  for (const [slug, { min, max }] of Object.entries(PRICING)) {
    const price_table = { min_price: min, max_price: max, unit: "sqft", currency: "INR", gst: "excl" };
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
  console.error("Austin Ply pricing update failed:", err);
  process.exitCode = 1;
});
