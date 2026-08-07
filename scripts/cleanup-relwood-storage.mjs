import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Stray objects left behind by the crop/revert iterations on the RelWOOD
// product (id 2382) — not referenced by any products row. Keeps only
// 2382-gallery-2.jpeg (spec-plaque, main_img_url) and 2382-main.png
// (collage, gallery_img_urls[1]); the RelWOOD logo lives separately at
// brands/relwood.jpeg and is untouched.
const stray = [
  "products/2382-gallery-1-v2.png",
  "products/2382-gallery-1.png",
  "products/2382-gallery-2-v2.png",
  "products/2382-gallery-2.png",
  "products/2382-main-v2.png",
  "products/2382-main.jpg",
];

const { data, error } = await supabase.storage.from("product-images").remove(stray);
if (error) throw error;
console.log("Removed:", data.map((f) => f.name));
