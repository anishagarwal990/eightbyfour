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
  console.log(remote, "restored,", buffer.length, "bytes");
}

await upload("/Users/anishagarwal/Downloads/eightbyfour-assets/Product images /reliance-relwood-plywood-in-jodhpur.png", "products/2382-main.png", "image/png");
await upload("/Users/anishagarwal/Downloads/eightbyfour-assets/Product images /relwood product images .png", "products/2382-gallery-1.png", "image/png");
