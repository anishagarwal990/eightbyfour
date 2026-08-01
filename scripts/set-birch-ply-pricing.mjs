import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Rate card given directly excl-GST (6mm-18mm range): 95.5, 117.5, 142, 167, 180.
const PRICING = {
  "russian-birch-ply-baltic-birch-plywood-bb-bb": { min: 96, max: 180 },
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
  console.error("Birch Ply pricing update failed:", err);
  process.exitCode = 1;
});
