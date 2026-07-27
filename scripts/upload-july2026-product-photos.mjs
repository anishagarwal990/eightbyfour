// One-off: uploads product photos and a brand range thumbnail supplied in the
// project root's "Product images ", "Birch ply images " folders, and sets
// brands.range_image_url for Green Panel. Verified against DB rows by content
// (not filename) before running — see conversation history for the mapping.
//
// Usage: node scripts/upload-july2026-product-photos.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
config({ path: join(ROOT, ".env") });

const BUCKET = "product-images";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function contentTypeFor(path) {
  const ext = path.toLowerCase().split(".").pop();
  return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[ext] || "application/octet-stream";
}

async function upload(storagePath, localPath) {
  const buffer = readFileSync(join(ROOT, localPath));
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: contentTypeFor(localPath),
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${localPath} -> ${storagePath}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function appendGallery(productId, urls) {
  const { data: row, error } = await supabase
    .from("products")
    .select("gallery_img_urls")
    .eq("id", productId)
    .single();
  if (error) throw new Error(`Read failed for product ${productId}: ${error.message}`);
  const existing = row.gallery_img_urls || [];
  const merged = [...existing, ...urls.filter((u) => !existing.includes(u))];
  const { error: updErr } = await supabase.from("products").update({ gallery_img_urls: merged }).eq("id", productId);
  if (updErr) throw new Error(`Gallery update failed for product ${productId}: ${updErr.message}`);
}

async function setMain(productId, url, extra = {}) {
  const { error } = await supabase.from("products").update({ main_img_url: url, ...extra }).eq("id", productId);
  if (error) throw new Error(`Main image update failed for product ${productId}: ${error.message}`);
}

async function main() {
  const P = "Product images ";
  const B = "Birch ply images ";

  // ---- New main images (products that had none) ----
  const mains = [
    { id: 1113, file: `${P}/1 greenpanel interior mdf.webp` }, // Green Panel Interior MDF (REG Grade)
    { id: 1112, file: `${P}/2 greenpanel-exterior-grade-mdf-board.jpg` }, // Green Panel Exterior MDF (MR Grade)
    { id: 1114, file: `${P}/Greenpanel hdhwr.png` }, // Green Panel HDWR
    { id: 26, file: `${P}/Greenply 710 Marine Plywood BWP.jpeg` }, // Greenply Green BWP 710
    { id: 23, file: `${P}/greenply club 500 ply.jpeg` }, // Greenply Green Club
    { id: 1117, file: `${P}/century premium plus HDHMR:HDF.png` }, // Century Premium Plus (Lower Emission)
    { id: 6, file: `${P}/wigwam excel mr.jpg` }, // Wigwam Excel MR
    { id: 7, file: `${P}/wigwam-excel-fr-fire-retardant-grade-plywood.jpeg` }, // Wigwam Excel FR
  ];
  for (const { id, file } of mains) {
    const ext = file.split(".").pop();
    const url = await upload(`products/${id}-main.${ext}`, file);
    await setMain(id, url);
    console.log(`Set main image for product ${id}`);
  }

  // ---- Gallery additions (products that already had a main image) ----
  const galleries = [
    { id: 1112, files: [`${P}/3 greenpanel exterior mdf .jpeg`, `${P}/Green panel exterior MDF image.webp`] },
    { id: 8, files: [`${P}/greenpanel club ply.png`] }, // Green Panel Club
    { id: 9, files: [`${P}/Greenpanel Firex ply.png`] }, // Green Panel Firex
    { id: 17, files: [`${P}/Austin Lincoln MR.webp`] }, // actually Lincoln 710 branding — filename is wrong
    { id: 24, files: [`${P}/greenply platinum ply .jpeg`] }, // Greenply Green Platinum
    { id: 25, files: [`${P}/greenply gold ply .jpeg`] }, // Greenply Green Gold
    { id: 400, files: [`${B}/WhatsApp Image 2026-07-20 at 16.28.47.jpeg`] }, // Russian Birch Ply — full sheet
  ];
  for (const { id, files } of galleries) {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].split(".").pop();
      const path = `products/${id}-gallery-extra-${i}.${ext}`;
      urls.push(await upload(path, files[i]));
    }
    await appendGallery(id, urls);
    console.log(`Appended ${urls.length} gallery image(s) for product ${id}`);
  }

  // ---- Edge image for Russian Birch Ply ----
  {
    const edgeUrl = await upload(`products/400-edge.jpeg`, `${B}/WhatsApp Image 2026-07-20 at 16.28.47 (1).jpeg`);
    const { error } = await supabase.from("products").update({ edge_img_url: edgeUrl }).eq("id", 400);
    if (error) throw new Error(`Edge image update failed for product 400: ${error.message}`);
    console.log("Set edge image for product 400");
  }

  // ---- Brand range thumbnail: Green Panel ----
  {
    const url = await upload(`brands/green-panel-range.png`, `${P}/Greenpanel All MDF Product Display .png`);
    const { error } = await supabase.from("brands").update({ range_image_url: url }).eq("slug", "green-panel");
    if (error) throw new Error(`Brand range image update failed: ${error.message}`);
    console.log("Set range_image_url for Green Panel brand");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
