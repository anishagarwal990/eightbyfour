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

// Replaced with the clean white-background studio shot the user supplied.
await upload(
  "/Users/anishagarwal/Downloads/eightbyfour-assets/Product images /bison panel updated image .png",
  "products/3598-main.png",
  "image/png"
);
