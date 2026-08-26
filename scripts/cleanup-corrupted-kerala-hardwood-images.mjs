import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Both hold the site favicon after scripts/upload-eightbyfour-logo.mjs
// clobbered them by reusing a live product's storage path. Neither is
// referenced by any product/brand row (verified via SQL before running
// this) — products.id=2477 now points at 2477-main-v3.png instead.
const STORAGE_PATHS = ["products/2477-main.png", "products/2477-main-v2.png"];
const CF_IMAGE_IDS = ["ebf-products-2477-main", "ebf-products-2477-main-v2"];

const { data, error } = await supabase.storage.from("product-images").remove(STORAGE_PATHS);
if (error) throw new Error(error.message);
console.log("Deleted from Supabase storage:", data.map((d) => d.name));

const CF_TOKEN = process.env.CF_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
for (const id of CF_IMAGE_IDS) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${CF_TOKEN}` },
  });
  const json = await res.json();
  if (json.success) {
    console.log("Deleted from Cloudflare Images:", id);
  } else if (json.errors?.[0]?.code === 5408) {
    console.log("Not in Cloudflare Images (never mirrored):", id);
  } else {
    console.error("FAIL", id, JSON.stringify(json.errors));
  }
}
