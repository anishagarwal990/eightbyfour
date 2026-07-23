// Uploads the second batch of veneer photos (8 collections: Burma Teak, Designer,
// Hybrid, Natural Smoke, Engineered, Exotic, Texture, Natural) to Supabase Storage
// and inserts rows into public.products under category "Veneers", brand "Propperly".
//
// Usage: node scripts/upload-veneer-collections.mjs <dir-of-cropped-jpgs> [--dry-run]

import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const BUCKET = "product-images";
const CATEGORY = "Veneers";
const BRAND = "Propperly";

const PDF_TO_COLLECTION = {
  "DesignerPremiumVeneerpdf": "Designer Veneer",
  "DesignerPremiumVeneers2pdf": "Designer Veneer",
  "PremiumNaturalTeakDesignerpdf": "Designer Veneer",
  "NewBurmaTeakCrownpdf": "Burma Teak Veneer",
  "PremiumBurmaTeakpdf": "Burma Teak Veneer",
  "PremiumBurmaTeak2pdf": "Burma Teak Veneer",
  "RoyalBurmaTeakCrownpdf": "Burma Teak Veneer",
  "HybridVeneerspdf": "Hybrid Veneer",
  "PremiumHybridVeneerspdf": "Hybrid Veneer",
  "DyedNaturalSmokeVennerpdf": "Natural Smoke Veneer",
  "NaturalSmokeVeneerspdf": "Natural Smoke Veneer",
  "EngineeredVeneerspdf": "Engineered Veneer",
  "PremiumExoticVeneers1pdf": "Exotic Veneer",
  "PremiumTextureVeneerpdf": "Texture Veneer",
  "NewNaturalVeneerspdf": "Natural Veneer",
  "NewPremiumNaturalVeneerspdf": "Natural Veneer",
  "PremiumNaturalDyedVeneerspdf": "Natural Veneer",
  "PremiumNaturalVeneerpdf": "Natural Veneer",
  "PremiumNaturalVeneerspdf": "Natural Veneer",
  "PremiumNaturalveneers2pdf": "Natural Veneer",
};

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function collectionFor(filename) {
  const slug = filename.split("__page")[0];
  return PDF_TO_COLLECTION[slug] || null;
}

async function main() {
  const srcDir = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!srcDir) {
    console.error("Usage: node scripts/upload-veneer-collections.mjs <dir-of-cropped-jpgs> [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(srcDir).filter(f => /\.jpe?g$/i.test(f)).sort();
  console.log(`Found ${files.length} image(s) in ${srcDir}.${dryRun ? " (dry run)" : ""}`);

  // Per-collection sequence counters, so names read "Designer Veneer 01", "Designer Veneer 02", etc.
  const seqByCollection = {};
  const rows = [];
  const unmapped = [];
  for (const f of files) {
    const collection = collectionFor(f);
    if (!collection) { unmapped.push(f); continue; }
    seqByCollection[collection] = (seqByCollection[collection] || 0) + 1;
    rows.push({ file: f, collection, seq: seqByCollection[collection] });
  }
  if (unmapped.length) {
    console.error(`Could not map ${unmapped.length} file(s) to a collection:`, unmapped.slice(0, 10));
    process.exitCode = 1;
    return;
  }

  let nextId = 1;
  if (!dryRun) {
    const { data: maxRow, error: maxErr } = await supabase
      .from("products")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxErr) throw new Error(`Could not read current max id: ${maxErr.message}`);
    nextId = (maxRow?.id || 0) + 1;
  }
  console.log(`Assigning fresh ids starting at ${nextId}.`);

  const finalRows = [];
  let uploaded = 0, failed = 0;
  for (let i = 0; i < rows.length; i++) {
    const id = nextId + i;
    const { file, collection, seq } = rows[i];
    const name = `${collection} ${String(seq).padStart(2, "0")}`;
    const storagePath = `products/${id}-main.jpg`;

    if (!dryRun) {
      const buffer = readFileSync(join(srcDir, file));
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) {
        failed++;
        console.error(`Upload failed for ${file}:`, error.message);
        continue;
      }
      uploaded++;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    finalRows.push({
      id, category: CATEGORY, brand: BRAND, name, collection: collection,
      main_img_url: data.publicUrl,
    });
  }
  if (!dryRun) console.log(`Uploaded ${uploaded} image(s) (${failed} failure(s)).`);

  if (dryRun) {
    console.log("Dry run: skipping Supabase upsert. Sample rows:", finalRows.slice(0, 3));
    const counts = {};
    for (const r of finalRows) counts[r.collection] = (counts[r.collection] || 0) + 1;
    console.log("Per-collection counts:", counts);
    return;
  }

  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < finalRows.length; i += chunkSize) {
    const chunk = finalRows.slice(i, i + chunkSize);
    const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Insert failed for rows ${i}-${i + chunk.length}:`, error.message);
      process.exitCode = 1;
    } else {
      inserted += chunk.length;
    }
  }
  console.log(`Inserted/updated ${inserted} of ${finalRows.length} product row(s) in Supabase.`);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exitCode = 1;
});
