import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Fevicol "UPDATED PRICELIST 01-JULY-2026" - "Price we can quote" column,
// which is MRP-based (incl. GST), so excl-GST = quote / 1.18. price_table is
// an array of {size, price} per pack size (existing convention for this brand).
const PRICING = {
  "fevicol-fevicol-sh": [
    { size: "60 kg", price: 11853.73 },
    { size: "50 kg", price: 10257.02 },
    { size: "30 kg", price: 6306.34 },
    { size: "20 kg", price: 4395.41 },
    { size: "10 kg", price: 2368.18 },
    { size: "5 kg", price: 1233.44 },
    { size: "2 kg", price: 594.14 },
    { size: "1 kg", price: 313.64 },
    { size: "500 gm", price: 169.05 },
    { size: "250 gm", price: 94.43 },
    { size: "125 gm", price: 51.4 },
    { size: "50 gm", price: 27.52 },
  ],
  "fevicol-fevicol-speedx": [
    { size: "50 kg", price: 11939.53 },
    { size: "30 kg", price: 7321.71 },
    { size: "20 kg", price: 4960.95 },
    { size: "10 kg", price: 2589.54 },
    { size: "5 kg", price: 1347.02 },
    { size: "2 kg", price: 560.31 },
    { size: "1 kg", price: 291.56 },
    { size: "500 gm", price: 156.56 },
  ],
  "fevicol-fevicol-marine": [
    { size: "60 kg", price: 15614.11 },
    { size: "50 kg", price: 13172.65 },
    { size: "30 kg", price: 8076.72 },
    { size: "20 kg", price: 5480.53 },
    { size: "10 kg", price: 2850.19 },
    { size: "5 kg", price: 1473.78 },
    { size: "2 kg", price: 617.34 },
    { size: "1 kg", price: 321.84 },
    { size: "500 gm", price: 172.27 },
  ],
  "fevicol-fevicol-hiper": [
    { size: "60 kg", price: 18313.32 },
    { size: "50 kg", price: 15261.27 },
    { size: "30 kg", price: 9251.24 },
    { size: "20 kg", price: 6282.58 },
    { size: "10 kg", price: 3246.37 },
    { size: "5 kg", price: 1689.67 },
    { size: "2 kg", price: 703.03 },
    { size: "1 kg", price: 365.69 },
    { size: "500 gm", price: 198.2 },
  ],
  "fevicol-fevicol-heatx": [
    { size: "5 L", price: 2235.42 },
    { size: "2 L", price: 924.44 },
    { size: "1 L", price: 476.65 },
    { size: "500 ml", price: 245.67 },
    { size: "200 ml", price: 115.07 },
    { size: "100 ml", price: 63.36 },
  ],
  "fevicol-fevicol-sr-998": [
    { size: "25 L", price: 9187.42 },
    { size: "5 L", price: 1907.58 },
    { size: "2 L", price: 794.74 },
    { size: "1 L", price: 408.89 },
    { size: "500 ml", price: 246.94 },
    { size: "200 ml", price: 122.97 },
    { size: "100 ml", price: 70.25 },
  ],
  "fevicol-fevicol-probond": [
    { size: "20 kg", price: 7057.84 },
    { size: "10 kg", price: 3558.2 },
    { size: "5 kg", price: 1855.17 },
    { size: "1 kg", price: 385.94 },
    { size: "500 gm", price: 214.56 },
  ],
  "fevicol-fevicol-ezee-spray": [{ size: "383 gm", price: 551.19 }],
};

async function main() {
  for (const [slug, price_table] of Object.entries(PRICING)) {
    const { error, count } = await supabase.from("products").update({ price_table }, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated (${price_table.length} pack sizes)`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fevicol pricing update failed:", err);
  process.exitCode = 1;
});
