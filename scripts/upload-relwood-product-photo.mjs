import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function upload(local, remote, contentType) {
  const buffer = readFileSync(local);
  const { error } = await supabase.storage.from("product-images").upload(remote, buffer, { contentType, upsert: true });
  if (error) throw new Error(`${remote}: ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(remote);
  console.log(remote, "->", data.publicUrl);
}

// Cropped from the collage in "Product images /reliance-relwood-plywood-in-jodhpur.png" —
// the source file bundles a sheet photo + two packaging shots on one white
// canvas, which produced huge letterboxing in the site's square product
// gallery. Split into three individual images instead. "-v2" suffix avoids
// serving stale cached bytes at the old 2382-main.png / gallery-1/2 URLs.
await upload("/tmp/relwood-sheet.png", "products/2382-main-v2.png", "image/png");
await upload("/tmp/relwood-cream-box.png", "products/2382-gallery-1-v2.png", "image/png");
await upload("/tmp/relwood-green-box.png", "products/2382-gallery-2-v2.png", "image/png");
