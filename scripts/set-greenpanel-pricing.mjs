import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// GreenPanel Hyderabad+Vijayawada+Rayalaseema rate card, "Price (In SFT) W/O
// GST" column. Despite the column label, these still carry GST, so final =
// (card_price * 0.62 discount) / 1.18. Range spans 4mm-19mm (25mm excluded).
const PRICING = {
  "green-panel-club-ply": { min: 54, max: 146 },
  "green-panel-gold-bwp-bwp": { min: 49, max: 122 },
  "green-panel-gold-mr-mr": { min: 37, max: 106 },
  "green-panel-bwp-bwp": { min: 47, max: 119 },
  "green-panel-firex-ply": { min: 53, max: 131 },
  "green-panel-mr-mr": { min: 36, max: 103 },
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
  console.error("GreenPanel pricing update failed:", err);
  process.exitCode = 1;
});
