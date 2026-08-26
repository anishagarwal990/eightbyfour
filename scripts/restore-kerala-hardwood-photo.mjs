import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Fresh path (not "products/2477-main.png" or "-v2", both of which now hold
// the site favicon after scripts/upload-eightbyfour-logo.mjs clobbered them)
// so the Cloudflare Images id (cfImageId, derived from this exact path) is
// guaranteed new — no stale-cache collision like last time.
const PATH = "products/2477-main-v3.png";
const buffer = readFileSync("/Users/anishagarwal/Downloads/eightbyfour-assets/Product images /commercial ply updated.png");

const { error: upErr } = await supabase.storage.from("product-images").upload(PATH, buffer, {
  contentType: "image/png",
  upsert: true,
});
if (upErr) throw new Error(upErr.message);

const { data } = supabase.storage.from("product-images").getPublicUrl(PATH);
console.log("Uploaded:", data.publicUrl);

const { error: updErr } = await supabase.from("products").update({ main_img_url: data.publicUrl }).eq("id", 2477);
if (updErr) throw new Error(updErr.message);

console.log("products.id=2477 main_img_url updated");
