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

const SHADES_DIR = join(__dirname, "..", "Merino Shades");
const BUCKET = "product-images";
const STORAGE_PREFIX = "merino/laminates";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[×]/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].trim().split(",");
  return lines.slice(1).map((line) => {
    const cols = line.trim().split(",");
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i] ?? ""));
    row.is_flat = row.is_flat === "1";
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

async function uploadImage(category, imageFile, code, finishLabel) {
  const localPath = join(SHADES_DIR, category, imageFile);
  const buffer = readFileSync(localPath);
  const ext = extname(imageFile);
  const storagePath = `${STORAGE_PREFIX}/${slugify(code)}-${slugify(finishLabel)}${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: contentTypeFor(imageFile),
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  if (!existsSync(SHADES_DIR)) throw new Error(`Not found: ${SHADES_DIR}`);

  const rows = parseCsv(readFileSync(join(SHADES_DIR, "manifest.csv"), "utf8"));

  // Seed the Merino brand row.
  const logoPath = join(__dirname, "..", "Brand logo", "merino logo.webp");
  let logoUrl = null;
  if (existsSync(logoPath)) {
    const buffer = readFileSync(logoPath);
    const storagePath = "brands/merino.webp";
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: "image/webp",
      upsert: true,
    });
    if (error) throw error;
    logoUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }
  const { error: brandErr } = await supabase.from("brands").upsert(
    [
      {
        slug: "merino",
        name: "Merino",
        logo_url: logoUrl,
        overview:
          "Merino is one of India's largest manufacturers of decorative laminates and surface solutions, offering an extensive range of finishes across woodgrains, solids, stones and specialty textures.",
      },
    ],
    { onConflict: "slug" }
  );
  if (brandErr) throw brandErr;
  console.log("Merino brand seeded.", logoUrl ? "(logo uploaded)" : "(no logo found)");

  // Group rows into one product per design (code + name), finishes as variants.
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.design_code}||${r.shade_name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  console.log(`Uploading images and building ${groups.size} product rows...`);

  const products = [];
  let uploaded = 0;
  let failed = 0;
  for (const [, variants] of groups) {
    variants.sort((a, b) => (a.finish_suffix || "").localeCompare(b.finish_suffix || ""));
    const code = variants[0].design_code;
    const name = variants[0].shade_name;
    const collection = variants[0].category; // Laminates / Special Laminates / Luvih

    const imageUrls = [];
    const finishes = [];
    let mainImgUrl = null;
    let defaultFinish = null;

    for (const v of variants) {
      const finishLabel = v.finish_suffix || "Standard";
      try {
        const url = await uploadImage(v.category, v.image_file, code, finishLabel);
        imageUrls.push(url);
        finishes.push(finishLabel);
        uploaded++;
        // Prefer a real photo as the main image; fall back to first variant.
        if (mainImgUrl === null || (defaultFinish === null && !v.is_flat)) {
          if (mainImgUrl === null || !v.is_flat) {
            mainImgUrl = url;
            defaultFinish = finishLabel;
          }
        }
      } catch (err) {
        failed++;
        console.error(`Upload failed: ${code} ${finishLabel} (${v.image_file}):`, err.message || err);
      }
    }
    if (!mainImgUrl) continue; // every variant failed to upload - skip the product

    products.push({
      slug: `merino-${slugify(code)}-${slugify(name)}`,
      category: "Laminates",
      brand: "Merino",
      name,
      collection,
      sd_code: code,
      finish: defaultFinish,
      finishes,
      main_img_url: mainImgUrl,
      gallery_img_urls: imageUrls,
    });
  }

  console.log(`Images uploaded: ${uploaded}, failed: ${failed}`);

  // The `id` column has no default/sequence configured, so we have to supply
  // it ourselves: reuse the existing id for a slug we've already inserted
  // (keeps upsert idempotent across re-runs), otherwise hand out the next
  // free id after the current max.
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

  // Upsert in batches to stay well under any request-size limits.
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
  console.error("Merino laminates seed failed:", err);
  process.exitCode = 1;
});
