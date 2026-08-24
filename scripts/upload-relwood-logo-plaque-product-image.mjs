import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const buffer = readFileSync("/Users/anishagarwal/Downloads/eightbyfour-assets/Brand logo/relwood_logo.jpeg");
const path = "products/2382-gallery-1.jpeg";
const { error } = await supabase.storage.from("product-images").upload(path, buffer, { contentType: "image/jpeg", upsert: true });
if (error) throw new Error(error.message);
const { data } = supabase.storage.from("product-images").getPublicUrl(path);
console.log(data.publicUrl);
