// Finishes the one incomplete step from upload-july2026-product-photos.mjs:
// the edge_img_url for product 400 (Russian Birch Ply / Baltic Birch Plywood)
// never got set. Uploads the remaining local file and writes the column.
//
// Usage: node scripts/finish-birch-edge-image.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
config({ path: join(ROOT, ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const localPath = join(ROOT, "..", "eightbyfour-assets", "Birch ply images ", "WhatsApp Image 2026-07-20 at 16.28.47 (1).jpeg");
  const buffer = readFileSync(localPath);
  const storagePath = "products/400-edge.jpeg";

  const { error: uploadErr } = await supabase.storage.from("product-images").upload(storagePath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
  const { error: updErr } = await supabase.from("products").update({ edge_img_url: data.publicUrl }).eq("id", 400);
  if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

  console.log("Set edge_img_url for product 400 ->", data.publicUrl);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
