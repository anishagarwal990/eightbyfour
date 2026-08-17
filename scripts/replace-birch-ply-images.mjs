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

async function upload(localPath, remotePath) {
  const buffer = readFileSync(localPath);
  const { error } = await supabase.storage.from("product-images").upload(remotePath, buffer, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Upload failed for ${remotePath}: ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(remotePath);
  return data.publicUrl;
}

async function main() {
  const mainUrl = await upload(join(ROOT, "Product images ", "Updated Birch Image 1.png"), "products/400-main.png");
  const edgeUrl = await upload(join(ROOT, "Product images ", "Updated Birch Image 2 .png"), "products/400-edge.png");

  const { error } = await supabase
    .from("products")
    .update({ main_img_url: mainUrl, edge_img_url: edgeUrl, app_img_url: null, gallery_img_urls: null })
    .eq("id", 400);
  if (error) throw error;

  console.log("main_img_url ->", mainUrl);
  console.log("edge_img_url ->", edgeUrl);
  console.log("Cleared app_img_url and gallery_img_urls");
}

main().catch((err) => {
  console.error("Replace birch ply images failed:", err);
  process.exitCode = 1;
});
