import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const BUCKET = "product-images";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// id -> official brand-site product image URL (verified 200 + image content-type)
const IMAGES = {
  1: "https://www.centuryply.com/uploads/Architect_Ply_Plywood_Facelift_72_mm_200224_1a80156a4c.jpg",
  2: "https://www.centuryply.com/uploads/Club_Prime_Plywood_72_mm_200224_26a1f84bff.jpg",
  3: "https://www.centuryply.com/uploads/21year_new_47d62f77c9.webp",
  4: "https://www.centuryply.com/uploads/Sainik_710_Plywood_Facelift_72_mm_280325_f2a82393a1.jpg",
  5: "https://www.centuryply.com/uploads/Sainik_MR_Plywood_Facelift_16_09_21_c916adba77.jpg",
  14: "https://www.austinplywood.com/img/product-detail/Plywood/Plywood_Facelift_Gold.jpg",
  15: "https://www.austinplywood.com/img/Club_Plus.webp",
  16: "https://www.austinplywood.com/img/Platinum_Plus.webp",
  17: "https://www.austinplywood.com/img/product-detail/Plywood_Facelift_Lincoln_710.jpg",
  8: "https://www.greenpanel.com/images/innerpagebanner/clubplywoodbanner-d0979b.webp",
  9: "https://www.greenpanel.com/images/innerpagebanner/Firexplywoodbanner-b05628.webp",
  10: "https://www.greenpanel.com/images/innerpagebanner/Goldplywoodbanner-ebd0a1.webp",
  12: "https://www.greenpanel.com/images/innerpagebanner/bwp710banner-8eabd4.webp",
  13: "https://www.greenpanel.com/images/innerpagebanner/MR-plywood-3ade51.webp",
  24: "https://www.greenply.com:5001/thumbnail1710915962554-9648.jpg",
  25: "https://www.greenply.com:5001/thumbnail1715592919776-8165.jpg",
  27: "https://www.greenply.com:5001/originalthumbnail1782364874037-2003.jpg",
  19: "https://www.mikasaply.com/content_admin/lib/image/2026/4/4212026120000131644554.jpg",
  20: "https://www.mikasaply.com/content_admin/lib/image/2026/4/4232026120000123554810.jpg",
  21: "https://www.mikasaply.com/content_admin/lib/image/2026/4/430202612000095555947.jpg",
  22: "https://www.mikasaply.com/content_admin/lib/image/2026/5/512026120000102553897.jpg",
};

function extFromContentType(ct) {
  if (ct.includes("webp")) return "webp";
  if (ct.includes("png")) return "png";
  return "jpg";
}

async function main() {
  let uploaded = 0;
  let failed = 0;

  for (const [idStr, url] of Object.entries(IMAGES)) {
    const id = Number(idStr);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = extFromContentType(contentType);
      const path = `products/${id}-main.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType,
        upsert: true,
      });
      if (uploadError) throw new Error(`upload: ${uploadError.message}`);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("products")
        .update({ main_img_url: data.publicUrl })
        .eq("id", id);
      if (updateError) throw new Error(`db update: ${updateError.message}`);

      console.log(`OK  id=${id}  ${buffer.length}b  ${data.publicUrl}`);
      uploaded++;
    } catch (err) {
      console.error(`FAIL id=${id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exitCode = 1;
});
