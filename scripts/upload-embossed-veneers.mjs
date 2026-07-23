// Uploads the cropped Embossed Veneer catalog photos to the "product-images"
// Supabase Storage bucket and inserts corresponding rows into public.products
// under category "Veneers", collection "Embossed Veneer", brand "Propperly".
//
// Usage: node scripts/upload-embossed-veneers.mjs <dir-of-cropped-jpgs> [--dry-run]

import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const BUCKET = "product-images";
const CATEGORY = "Veneers";
const COLLECTION = "Embossed Veneer";
const BRAND = "Propperly";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const srcDir = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!srcDir) {
    console.error("Usage: node scripts/upload-embossed-veneers.mjs <dir-of-cropped-jpgs> [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(srcDir).filter(f => /\.jpe?g$/i.test(f)).sort();
  console.log(`Found ${files.length} image(s) in ${srcDir}.${dryRun ? " (dry run)" : ""}`);
  if (!files.length) return;

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

  const rows = [];
  let uploaded = 0, failed = 0;
  for (let i = 0; i < files.length; i++) {
    const id = nextId + i;
    const seq = String(i + 1).padStart(2, "0");
    const name = `Embossed Veneer ${seq}`;
    const storagePath = `products/${id}-main.jpg`;

    if (!dryRun) {
      const buffer = readFileSync(join(srcDir, files[i]));
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) {
        failed++;
        console.error(`Upload failed for ${files[i]}:`, error.message);
        continue;
      }
      uploaded++;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    rows.push({
      id,
      category: CATEGORY,
      brand: BRAND,
      name,
      collection: COLLECTION,
      main_img_url: data.publicUrl,
    });
  }
  if (!dryRun) console.log(`Uploaded ${uploaded} image(s) (${failed} failure(s)).`);

  if (dryRun) {
    console.log("Dry run: skipping Supabase upsert. Sample row:", rows[0]);
    return;
  }

  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Insert failed for rows ${i}-${i + chunk.length}:`, error.message);
      process.exitCode = 1;
    } else {
      inserted += chunk.length;
    }
  }
  console.log(`Inserted/updated ${inserted} of ${rows.length} product row(s) in Supabase.`);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exitCode = 1;
});
