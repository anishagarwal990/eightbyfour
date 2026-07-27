// One-off follow-up: replaces the Green Panel range banner with a cropped
// horizontal band (the full poster is portrait and was getting its headline/
// footer text sliced off by the banner's wide aspect ratio), and gives
// BoilBLACK BWP HDF (id 1115, previously imageless) a cropped product shot —
// both cropped from "Greenpanel All MDF Product Display .png" via Pillow.
//
// Usage: node scripts/fix-boilblack-and-range-crop.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
config({ path: join(ROOT, ".env") });

const SCRATCH = "/private/tmp/claude-501/-Users-anishagarwal-Downloads-eightbyfour/fb732c44-ad03-488f-965c-410a1339ccba/scratchpad";
const BUCKET = "product-images";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function upload(storagePath, localPath) {
  const buffer = readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${localPath} -> ${storagePath}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function main() {
  const rangeUrl = await upload("brands/green-panel-range.jpg", join(SCRATCH, "range-band.jpg"));
  const { error: brandErr } = await supabase.from("brands").update({ range_image_url: rangeUrl }).eq("slug", "green-panel");
  if (brandErr) throw new Error(`Brand update failed: ${brandErr.message}`);
  console.log("Replaced Green Panel range_image_url with cropped, compressed JPEG.");

  const boilblackUrl = await upload("products/1115-main.jpg", join(SCRATCH, "boilblack-crop2.jpg"));
  const { error: prodErr } = await supabase.from("products").update({ main_img_url: boilblackUrl }).eq("id", 1115);
  if (prodErr) throw new Error(`Product update failed: ${prodErr.message}`);
  console.log("Set main image for BoilBLACK (id 1115).");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
