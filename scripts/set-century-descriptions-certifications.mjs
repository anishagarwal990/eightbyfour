import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Descriptions rephrased from centuryply.com's own product pages, with
// certifications corrected to what each page actually states (replacing the
// earlier generic per-grade guess).
const PRODUCTS = {
  "century-architect-ply-ply": {
    description:
      "Architect Ply is Century's premium BWP marine-grade plywood, treated with Firewall (fire protection) and ViroKill (kills 99.9% of viruses) technology plus a two-tier GLP and ACC preservative treatment for borer and termite resistance. Built with a Gurjan face and a gapless core for negligible warp, it holds glue shear strength above 1450N and water absorption under 5%. Backed by a Lifetime Warranty and Century's 4x money-back promise.",
    certifications: ["IS 5509 (Fire Retardant Compliant)"],
  },
  "century-club-prime-ply": {
    description:
      "Club Prime is Century's BWP marine-grade plywood, tested against 25 stringent BIS requirements, with Firewall and ViroKill technology and 65% higher glue shear strength than ordinary plywood. Reinforced for strength and shape retention, it holds screw strength above 150kg and nail strength above 120kg. Backed by a 30-year warranty.",
    certifications: ["IS 710 (BWP Marine Grade)"],
  },
  "century-bond-shield-ply": {
    description:
      "Bond Shield is Century's safety-first BWP plywood, compliant with IS 5509 for fire retardance and treated with Aqua Armour for boiling-water resistance, GLP protection and ViroKill technology against viruses. It holds screw strength above 250kg and nail strength above 150kg. Backed by a 21-year warranty.",
    certifications: ["IS 5509 (Fire Retardant Compliant)"],
  },
  "century-sainik-710-ply": {
    description:
      "Sainik 710 is Century's 'Asli Waterproof' plywood, compliant with IS 303 BWP (General Purpose Plywood) grade. Built with more plies for added strength, it's bend-resistant, chemically treated against borer and termite damage, and CenturyPromise QR-coded for authenticity. Backed by a 10-year warranty at a uniform price across India.",
    certifications: ["IS 303 (BWR Grade)"],
  },
  "century-sainik-mr-mr": {
    description:
      "Sainik MR is Century's water-resistant (MR grade) plywood, bonded with melamine-fortified urea formaldehyde adhesive for dimensional stability against climate swings. Chemically treated against borer and termite damage, it's available in sheets up to 2440x1220mm. Backed by a 5-year warranty.",
    certifications: ["IS 303 (MR Grade)"],
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
  console.error("Century descriptions/certifications update failed:", err);
  process.exitCode = 1;
});
