import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const INDEX_HTML_PATH = join(__dirname, "..", "index.html");
const BUCKET = "product-images";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function extractGrade(name) {
  const m = name.match(/\b(BWP|MR\+|MR|FR)\b/i);
  return m ? m[0].toUpperCase() : "PLY";
}

function mimeToExt(mime) {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "bin";
}

function parseHtmlData(html) {
  const rawLinesMatch = html.match(/const RAW_LINES = (\[[\s\S]*?\]);/);
  const stdThicknessMatch = html.match(/const STD_THICKNESS = (\[.*?\]);/);
  const laminateMatch = html.match(/const LAMINATE_PRODUCTS = (\[.*\]);/);
  const decorMatch = html.match(/const DECOR2023_PRODUCTS = (\[.*\]);/);

  if (!rawLinesMatch || !stdThicknessMatch || !laminateMatch || !decorMatch) {
    throw new Error("Could not locate one or more product data arrays in index.html");
  }

  const rawLines = JSON.parse(rawLinesMatch[1]);
  const stdThickness = JSON.parse(stdThicknessMatch[1]);
  const laminateProducts = JSON.parse(laminateMatch[1]);
  const decorProducts = JSON.parse(decorMatch[1]);

  const plywoodProducts = rawLines.map((row, i) => {
    const [brand, name] = row;
    return {
      id: i + 1,
      category: "Plywood",
      brand,
      name,
      grade: extractGrade(name),
      size: "8×4 ft",
      thicknesses: stdThickness.slice(),
    };
  });

  return { plywoodProducts, laminateProducts, decorProducts };
}

async function uploadImage(id, field, dataUri) {
  const match = dataUri.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  const [, mime, base64] = match;
  const ext = mimeToExt(mime);
  const path = `products/${id}-${field}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function toRow(p) {
  const finishes = p.finishes || (p.finish ? [p.finish] : []);
  return {
    id: p.id,
    category: p.category,
    brand: p.brand,
    name: p.name,
    collection: p.collection || null,
    grade: p.grade || null,
    size: p.size || null,
    thicknesses: p.thicknesses || null,
    sd_code: p.sdCode || null,
    eb_code: p.ebCode || null,
    finish: p.finish || null,
    finishes: finishes.length ? finishes : null,
    mood: p.mood || null,
    tone: p.tone || null,
    main_img_url: p._mainImgUrl || null,
    edge_img_url: p._edgeImgUrl || null,
  };
}

async function main() {
  const html = readFileSync(INDEX_HTML_PATH, "utf8");
  const { plywoodProducts, laminateProducts, decorProducts } = parseHtmlData(html);
  const laminates = [...laminateProducts, ...decorProducts];

  console.log(`Parsed ${plywoodProducts.length} plywood + ${laminates.length} laminate products.`);

  let uploaded = 0;
  let failed = 0;
  for (const p of laminates) {
    try {
      if (p.mainImg) {
        p._mainImgUrl = await uploadImage(p.id, "main", p.mainImg);
        uploaded++;
      }
      if (p.edgeImg) {
        p._edgeImgUrl = await uploadImage(p.id, "edge", p.edgeImg);
        uploaded++;
      }
    } catch (err) {
      failed++;
      console.error(`Image upload failed for product ${p.id} (${p.name}):`, err.message);
    }
  }
  console.log(`Uploaded ${uploaded} images (${failed} failures).`);

  const allProducts = [...plywoodProducts, ...laminates];
  const rows = allProducts.map(toRow);

  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Insert failed for rows ${i}-${i + chunk.length}:`, error.message);
      process.exitCode = 1;
    } else {
      inserted += chunk.length;
    }
  }

  console.log(`Inserted/updated ${inserted} of ${rows.length} product rows.`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exitCode = 1;
});
