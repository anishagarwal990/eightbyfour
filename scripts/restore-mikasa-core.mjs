import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Reverts shorten-mikasa-core.mjs -- the actual fix was the Technical
// Specifications dl layout in ProductPageView.tsx (label-above-value instead
// of a cramped label-left/value-right flex row), not shortening the content.
const CORE = {
  "mikasa-sapphire-ply": "100% Composed Veneer, Deca Edge Technology, 6X Press Technology",
  "mikasa-marine-blue-ply": "Tropical Wood Blend, Machine-Composed Veneer, Phenolic-Bonded",
  "mikasa-mr-mr": "Premium Tropical Wood, Machine-Composed Veneer",
  "mikasa-fire-guardian-ply": "100% Composed Veneer, Phenolic-Bonded",
};

async function main() {
  for (const [slug, core] of Object.entries(CORE)) {
    const { error, count } = await supabase.from("products").update({ core }, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated -> "${core}"`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Core restore failed:", err);
  process.exitCode = 1;
});
