import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Sitewide `size` values were inconsistent -- 877 rows already carry the
// "8×4 ft (2440×1220mm)" mm-suffixed format, but 123 rows across other
// brands (including all 4 Mikasa SKUs) were missing the mm equivalent or
// used a different ft notation entirely. Normalizing every row to the
// dominant format so the Technical Specifications "Size" field is
// consistent across the whole catalogue, not just Mikasa.
const RENAMES = {
  "8×4 ft": "8×4 ft (2440×1220mm)",
  "8x4 ft": "8×4 ft (2440×1220mm)",
  "4ft x 8ft": "8×4 ft (2440×1220mm)",
  "8×2.5 ft": "8×2.5 ft (2440×762mm)",
};

async function main() {
  for (const [from, to] of Object.entries(RENAMES)) {
    const { error, count } = await supabase.from("products").update({ size: to }, { count: "exact" }).eq("size", from);
    if (error) throw error;
    console.log(`"${from}" -> "${to}": ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Size normalization failed:", err);
  process.exitCode = 1;
});
