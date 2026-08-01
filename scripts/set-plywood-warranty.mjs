import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Warranty periods taken directly from each brand's own rate card / product
// packaging shown in their price list.
const WARRANTY = {
  // Century warranty table
  "century-architect-ply-ply": "Life Time Warranty",
  "century-club-prime-ply": "30 Years Warranty",
  "century-bond-shield-ply": "21 Years Warranty",
  "century-sainik-710-ply": "10 Years Warranty",
  "century-sainik-mr-mr": "5 Years Warranty",
  // Austin Plywood packaging
  "austin-club-plus-ply": "500% Lifetime Warranty",
  "austin-gold-ply": "30 Years Warranty",
  "austin-lincoln-710-ply": "15 Years Warranty",
  "austin-platinum-plus-ply": "750% Lifetime Warranty",
};

async function main() {
  for (const [slug, warranty] of Object.entries(WARRANTY)) {
    const { error, count } = await supabase.from("products").update({ warranty }, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated -> ${warranty}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Plywood warranty update failed:", err);
  process.exitCode = 1;
});
