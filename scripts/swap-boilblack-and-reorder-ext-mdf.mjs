// One-off: replaces BoilBLACK's product image with the new supplied poster
// ("Greenpanel BoilBlack .png", converted to JPEG), and rotates Green Panel
// Exterior MDF's (id 1112) image order so the current main photo moves to
// the end of the gallery instead.
//
// Usage: node scripts/swap-boilblack-and-reorder-ext-mdf.mjs

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

async function main() {
  // ---- BoilBLACK: swap in the new poster ----
  const buffer = readFileSync(join(SCRATCH, "boilblack-poster.jpg"));
  const { error: upErr } = await supabase.storage.from(BUCKET).upload("products/1115-main.jpg", buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  const boilblackUrl = supabase.storage.from(BUCKET).getPublicUrl("products/1115-main.jpg").data.publicUrl;
  const { error: prodErr } = await supabase.from("products").update({ main_img_url: boilblackUrl }).eq("id", 1115);
  if (prodErr) throw new Error(`Product update failed: ${prodErr.message}`);
  console.log("Replaced BoilBLACK main image with new poster.");

  // ---- Exterior MDF (id 1112): rotate — current main goes last ----
  const { data: row, error: readErr } = await supabase
    .from("products")
    .select("main_img_url, gallery_img_urls")
    .eq("id", 1112)
    .single();
  if (readErr) throw new Error(`Read failed: ${readErr.message}`);
  const [newMain, ...restGallery] = row.gallery_img_urls || [];
  if (!newMain) throw new Error("No gallery images to rotate in for product 1112");
  const newGallery = [...restGallery, row.main_img_url];
  const { error: rotErr } = await supabase
    .from("products")
    .update({ main_img_url: newMain, gallery_img_urls: newGallery })
    .eq("id", 1112);
  if (rotErr) throw new Error(`Rotate failed: ${rotErr.message}`);
  console.log("Rotated Exterior MDF (1112) image order — old main now last in gallery.");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
