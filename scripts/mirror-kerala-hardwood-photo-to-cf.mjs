import { config } from "dotenv";
config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });

const CF_TOKEN = process.env.CF_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
if (!CF_TOKEN || !CF_ACCOUNT_ID) {
  console.error("Missing CF_TOKEN or CF_ACCOUNT_ID env vars");
  process.exit(1);
}

// Must match cfImageId() in lib/cloudflareImageLoader.ts byte-for-byte.
const url = "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/products/2477-main-v3.png";
const id = "ebf-products-2477-main-v3";

const form = new FormData();
form.set("url", url);
form.set("id", id);

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CF_TOKEN}` },
  body: form,
});
const json = await res.json();
if (json.success || json.errors?.[0]?.code === 5409) {
  console.log("Mirrored to Cloudflare Images:", id, json.success ? "(new)" : "(already existed)");
} else {
  console.error("FAIL", JSON.stringify(json.errors));
  process.exit(1);
}
