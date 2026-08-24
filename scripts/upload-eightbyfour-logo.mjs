import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const buffer = readFileSync("/Users/anishagarwal/Downloads/eightbyfour/app/icon.png");

const uploads = [
  { path: "brands/eightbyfour.png", contentType: "image/png" },
  { path: "products/2477-main.png", contentType: "image/png" },
];

for (const { path, contentType } of uploads) {
  const { error } = await supabase.storage.from("product-images").upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`${path}: ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  console.log(data.publicUrl);
}

const { error: brandErr } = await supabase
  .from("brands")
  .update({ logo_url: supabase.storage.from("product-images").getPublicUrl("brands/eightbyfour.png").data.publicUrl })
  .eq("slug", "eightbyfour");
if (brandErr) throw new Error(brandErr.message);

console.log("brands.logo_url updated for EightByFour");
