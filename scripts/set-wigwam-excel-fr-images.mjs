import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SLUG = "wigwam-excel-fr-fr";
const NEW_IMAGE_PATH = join(__dirname, "..", "..", "eightbyfour-assets", "Product images ", "wigwam-excel-fr-fire-retardant-grade-plywood.jpeg");
const STORAGE_PATH = "products/7-main-2.jpeg";
const BUCKET = "product-images";

async function main() {
  const file = readFileSync(NEW_IMAGE_PATH);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(STORAGE_PATH, file, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
  const newMainUrl = pub.publicUrl;
  console.log("Uploaded:", newMainUrl);

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("main_img_url")
    .eq("slug", SLUG)
    .single();
  if (fetchError) throw fetchError;

  const { error: updateError, count } = await supabase
    .from("products")
    .update({ main_img_url: newMainUrl, gallery_img_urls: [existing.main_img_url] }, { count: "exact" })
    .eq("slug", SLUG);
  if (updateError) throw updateError;

  console.log(`${SLUG}: ${count} row(s) updated. First: ${newMainUrl}, Second: ${existing.main_img_url}`);
}

main().catch((err) => {
  console.error("Wigwam Excel FR image update failed:", err);
  process.exitCode = 1;
});
