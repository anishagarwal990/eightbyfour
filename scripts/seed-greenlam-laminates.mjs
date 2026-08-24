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

const SHADES_DIR = join(__dirname, "..", "..", "eightbyfour-assets", "Greenlam Shades");
const BUCKET = "product-images";
const STORAGE_PREFIX = "greenlam/laminates";

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[×]/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Manifest fields can contain commas inside quotes (none currently do, but be safe).
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
  const lines = text.trim().split("\n");
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

  let rows = parseCsv(readFileSync(join(SHADES_DIR, "manifest.csv"), "utf8"));
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  if (onlyArg) {
    const wanted = new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim().toLowerCase()));
    rows = rows.filter((r) => wanted.has(r.category.toLowerCase()));
    console.log(`--only filter applied: ${rows.length} manifest rows across ${wanted.size} categor${wanted.size === 1 ? "y" : "ies"}.`);
  }

  // Seed the Greenlam brand row. No website_url is set, matching every other
  // brand in this table (none link out to the manufacturer's own site) and
  // per explicit instruction to keep this site and greenlam.co.in unlinked.
  const logoPath = join(__dirname, "..", "Brand logo", "greenlam_lam_9c52d965-da1a-4271-9633-dea1277362a7.webp");
  let logoUrl = null;
  if (existsSync(logoPath)) {
    const buffer = readFileSync(logoPath);
    const storagePath = "brands/greenlam.webp";
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
        slug: "greenlam",
        name: "Greenlam",
        logo_url: logoUrl,
        overview:
          "Greenlam is one of India's largest laminate manufacturers, offering an extensive decorative laminate range across solids, woodgrains, stones and specialty finishes.",
      },
    ],
    { onConflict: "slug" }
  );
  if (brandErr) throw brandErr;
  console.log("Greenlam brand seeded.", logoUrl ? "(logo uploaded)" : "(no logo found)");

  // Group rows into one product per design (code + name), regardless of
  // which Greenlam sub-catalog (HPL, HD Gloss, Four X Ten, ...) it was
  // scraped from - Greenlam reuses the same code+name for the same decor
  // across substrates/finishes, so e.g. "163 Bay" from HPL, HD Gloss and
  // Four X Ten is one product with three finishes, not three products.
  // Keyed case-insensitively since the source site itself is inconsistent
  // about name casing for a handful of codes (e.g. "Crest Oak" vs "Crest
  // oak", both code 5329).
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.code.toLowerCase().trim()}||${r.name.toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  console.log(`Uploading images and building ${groups.size} product rows from ${rows.length} manifest rows...`);

  // Keyed by slug as a defensive backstop (the case-insensitive grouping key
  // above already merges casing variants), not because collisions are still
  // expected here.
  const productsBySlug = new Map();
  let uploaded = 0;
  let skippedDuplicateFinish = 0;
  let failed = 0;
  for (const [, variants] of groups) {
    const code = variants[0].code;
    const name = variants[0].name;
    const collection = variants[0].category; // first sub-catalog this design was scraped from

    const sorted = [...variants].sort((a, b) => (a.finish_code || "").localeCompare(b.finish_code || ""));

    const imageUrls = [];
    const finishes = [];
    const seenFinishes = new Set();
    let mainImgUrl = null;
    let defaultFinish = null;

    for (const v of sorted) {
      const finishLabel = v.finish_code || v.finish || "Standard";
      const finishKey = finishLabel.toLowerCase();
      if (seenFinishes.has(finishKey)) {
        // Same design + finish scraped from more than one Greenlam sub-catalog
        // (e.g. "163 Bay" listed under both HPL and Four X Ten) - same photo,
        // don't attach it twice.
        skippedDuplicateFinish++;
        continue;
      }
      seenFinishes.add(finishKey);
      try {
        const url = await uploadImage(v.category, v.image_file, code, finishLabel);
        imageUrls.push(url);
        finishes.push(finishLabel);
        uploaded++;
        if (mainImgUrl === null) {
          mainImgUrl = url;
          defaultFinish = finishLabel;
        }
      } catch (err) {
        failed++;
        console.error(`Upload failed: ${collection} ${code} ${finishLabel} (${v.image_file}):`, err.message || err);
      }
    }
    if (!mainImgUrl) continue; // every variant failed to upload - skip the product

    const slug = `greenlam-${slugify(code)}-${slugify(name)}`;
    const existing = productsBySlug.get(slug);
    if (existing) {
      for (let i = 0; i < finishes.length; i++) {
        if (!existing.finishes.includes(finishes[i])) {
          existing.finishes.push(finishes[i]);
          existing.gallery_img_urls.push(imageUrls[i]);
        }
      }
      continue;
    }

    productsBySlug.set(slug, {
      slug,
      category: "Laminates",
      brand: "Greenlam",
      name,
      collection,
      sd_code: code,
      finish: defaultFinish,
      finishes,
      main_img_url: mainImgUrl,
      gallery_img_urls: imageUrls,
    });
  }
  const products = [...productsBySlug.values()];

  console.log(`Images uploaded: ${uploaded}, duplicate finishes skipped: ${skippedDuplicateFinish}, failed: ${failed}`);

  // The `id` column has no default/sequence configured, so supply it
  // ourselves: reuse the existing id for a slug already inserted (keeps
  // upsert idempotent across re-runs), otherwise hand out the next free id.
  const slugs = products.map((p) => p.slug);
  const existingIdBySlug = new Map();
  const CHUNK = 200; // keep the `.in()` filter well under any URL/param limits
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const chunk = slugs.slice(i, i + CHUNK);
    const { data: existing, error: existingErr } = await supabase
      .from("products")
      .select("id, slug")
      .in("slug", chunk);
    if (existingErr) throw existingErr;
    for (const r of existing) existingIdBySlug.set(r.slug, r.id);
  }

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
  console.error("Greenlam laminates seed failed:", err);
  process.exitCode = 1;
});
