import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Descriptions rephrased from austinplywood.com's own product pages, with
// certifications corrected to what's actually printed on each product's
// packaging/badges there (replacing the earlier generic per-grade guess).
const PRODUCTS = {
  "austin-club-plus-ply": {
    description:
      "Austin Club Plus is the structural workhorse of the range, certified to IS 10701 (Structural Grade) for superior strength. It's treated against pests and decay and built emission-free, making it suited to load-bearing furniture and framework. Backed by a 500% Lifetime Warranty.",
    certifications: ["IS 10701 (Structural Grade)"],
  },
  "austin-gold-ply": {
    description:
      "Austin Gold is a marine-grade plywood certified to IS 710, built from 100% high-density timber and bonded with un-extended BWP-grade phenol formaldehyde resin for genuine boiling-water resistance. Quadruple-pressed and calibrated on both sides for a warp-free, uniform panel, with a two-tier preservative treatment against decay and pests. Comes with a 30-year warranty.",
    certifications: ["IS 710:2010 (Marine Grade)"],
  },
  "austin-platinum-plus-ply": {
    description:
      "Austin Platinum Plus is the top of Austin's plywood range, approved by Lloyd's Register (UK) to British Standard BS 1088 and crafted from premium imported Gurjan timber. Built for luxury furniture where only the highest plywood grade will do, it carries a 750% Lifetime Warranty.",
    certifications: ["BS 1088 (Lloyd's Register Approved)"],
  },
  "austin-lincoln-710-ply": {
    description:
      "Lincoln 710 is Austin's waterproof plywood, E-0 emission certified for low-VOC interiors. Borer-proof and calibrated on both sides for consistent thickness, it's built for moisture-prone applications and backed by a 15-year warranty.",
    certifications: ["E-0 Emission Certified"],
  },
};

async function main() {
  for (const [slug, fields] of Object.entries(PRODUCTS)) {
    const { error, count } = await supabase.from("products").update(fields, { count: "exact" }).eq("slug", slug);
    if (error) throw error;
    console.log(`${slug}: ${count} row(s) updated`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Austin descriptions/certifications update failed:", err);
  process.exitCode = 1;
});
