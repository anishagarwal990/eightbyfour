import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { readFileSync, existsSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SHADES_DIR = join(__dirname, "..", "Sky Decor Shades");
const BUCKET = "product-images";
const STORAGE_PREFIX = "skydecor/liner-laminates";

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[×]/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
}

const contentTypeFor = (file) => {
  const ext = extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpeg" || ext === ".jpg") return "image/jpeg";
  return "application/octet-stream";
};

async function uploadImage(category, imageFile, code) {
  const localPath = join(SHADES_DIR, category, imageFile);
  const buffer = readFileSync(localPath);
  const ext = extname(imageFile);
  const storagePath = `${STORAGE_PREFIX}/${slugify(code)}${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: contentTypeFor(imageFile),
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// Starting price for the whole Liner Laminates line, per explicit instruction.
const PRICE_TABLE = { starting_price: 441, unit: "sheet", currency: "INR", gst: "excl", cashback_pct: 3 };

async function main() {
  if (!existsSync(SHADES_DIR)) throw new Error(`Not found: ${SHADES_DIR}`);

  const rows = parseCsv(readFileSync(join(SHADES_DIR, "manifest.csv"), "utf8"));

  const logoPath = join(__dirname, "..", "Brand logo", "skydecor .png");
  let logoUrl = null;
  if (existsSync(logoPath)) {
    const buffer = readFileSync(logoPath);
    const storagePath = "brands/skydecor.png";
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) throw error;
    logoUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }
  const { error: brandErr } = await supabase.from("brands").upsert(
    [
      {
        slug: "skydecor",
        name: "Sky Decor",
        logo_url: logoUrl,
        overview:
          "Sky Decor is a decorative surfaces brand offering Liner Laminates for furniture back panels, shutter interiors and carcass linings, across fabric, woodgrain and solid finishes.",
      },
    ],
    { onConflict: "slug" }
  );
  if (brandErr) throw brandErr;
  console.log("Sky Decor brand seeded.", logoUrl ? "(logo uploaded)" : "(no logo found)");

  // Group rows into one product per design (code without finish suffix + name),
  // same pattern as Merino/Greenlam: Suede/Matt become finish variants of one
  // product rather than separate SKUs, since they share the same swatch photo
  // and design identity on the source site.
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.name.toLowerCase().trim()}||${r.category.toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  console.log(`Uploading images and building ${groups.size} product rows from ${rows.length} manifest rows...`);

  const products = [];
  let uploaded = 0;
  let failed = 0;
  for (const [, variants] of groups) {
    const sorted = [...variants].sort((a, b) => (a.finish || "").localeCompare(b.finish || ""));
    const first = sorted[0];
    const baseCode = first.name.replace(/^SD\s*/i, "SD-"); // "SD 001" -> "SD-001"
    const designName = first.design_name;
    const subCategory = first.category; // Fabric / Woodgrain / Solid
    const collection = "Liner Laminates"; // single product line, matching Greenlam/Merino's per-line collections

    const imageUrls = [];
    const finishes = [];
    const skuCodes = [];
    let mainImgUrl = null;
    let defaultFinish = null;

    for (const v of sorted) {
      try {
        const url = await uploadImage(v.category, v.image_file, v.code);
        imageUrls.push(url);
        finishes.push(v.finish);
        skuCodes.push(v.code);
        uploaded++;
        if (mainImgUrl === null) {
          mainImgUrl = url;
          defaultFinish = v.finish;
        }
      } catch (err) {
        failed++;
        console.error(`Upload failed: ${subCategory} ${v.code} ${v.finish} (${v.image_file}):`, err.message || err);
      }
    }
    if (!mainImgUrl) continue; // every variant failed to upload - skip the product

    products.push({
      slug: `skydecor-${slugify(baseCode)}-${slugify(designName || first.name)}`,
      category: "Laminates",
      brand: "Sky Decor",
      name: designName || first.name,
      collection,
      sd_code: baseCode,
      finish: defaultFinish,
      finishes,
      main_img_url: mainImgUrl,
      gallery_img_urls: imageUrls,
      size: first.size,
      thicknesses: [first.thickness],
      description: `Sky Decor Liner Laminate — ${designName || first.name}, ${subCategory} collection. Suitable for furniture back panels, shutter interiors and carcass linings. Width ${first.width}, size ${first.size}.`,
      price_table: PRICE_TABLE,
    });
  }

  console.log(`Images uploaded: ${uploaded}, failed: ${failed}`);

  const slugs = products.map((p) => p.slug);
  const { data: existing, error: existingErr } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", slugs);
  if (existingErr) throw existingErr;
  const existingIdBySlug = new Map(existing.map((r) => [r.slug, r.id]));

  const { data: maxRow, error: maxErr } = await supabase
    .from("products")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  if (maxErr) throw maxErr;
  let nextId = (maxRow[0]?.id ?? 0) + 1;

  for (const p of products) {
    p.id = existingIdBySlug.get(p.slug) ?? nextId++;
  }

  console.log(`Upserting ${products.length} products...`);

  const BATCH = 100;
  let upserted = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const { error } = await supabase.from("products").upsert(batch, { onConflict: "slug" });
    if (error) throw error;
    upserted += batch.length;
    console.log(`  upserted ${upserted}/${products.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Sky Decor laminates seed failed:", err);
  process.exitCode = 1;
});
