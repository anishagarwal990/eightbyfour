// Takes the JSON exported by laminate-extractor.html, uploads each shade's
// images (main/edge/application) to the existing "product-images" Supabase
// Storage bucket, then upserts the resulting rows — with real hosted URLs,
// not base64 — into the public.products table. Also writes a CSV/JSON copy
// of the final rows next to the input file for reference.
//
// Usage: node scripts/upload-extracted-shades.mjs path/to/laminate-shades.json

import { readFileSync, writeFileSync } from "fs";
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

function mimeToExt(mime) {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "bin";
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
  return {
    id: p.id,
    category: p.category || "Laminates",
    brand: p.brand,
    name: p.name,
    collection: p.collection || null,
    grade: null,
    size: p.size || null,
    thicknesses: p.thicknesses && p.thicknesses.length ? p.thicknesses : null,
    sd_code: p.sdCode || null,
    eb_code: p.ebCode || null,
    finish: p.finishes && p.finishes.length ? p.finishes[0] : null,
    finishes: p.finishes && p.finishes.length ? p.finishes : null,
    mood: p.mood || null,
    tone: p.tone || null,
    main_img_url: p._mainImgUrl || null,
    edge_img_url: p._edgeImgUrl || null,
    app_img_url: p._appImgUrl || null,
  };
}

function csvCell(v) {
  if (Array.isArray(v)) v = v.join("; ");
  v = String(v ?? "");
  return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvCell).join(",")];
  rows.forEach(r => lines.push(headers.map(h => csvCell(r[h])).join(",")));
  return lines.join("\r\n");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/upload-extracted-shades.mjs <path-to-laminate-shades.json> [--dry-run]");
    process.exitCode = 1;
    return;
  }
  const dryRun = process.argv.includes("--dry-run");

  const shades = JSON.parse(readFileSync(inputPath, "utf8"));
  console.log(`Loaded ${shades.length} shade(s) from ${inputPath}.${dryRun ? " (dry run — no uploads or writes to Supabase)" : ""}`);
  if (!shades.length) return;

  // Ignore the ids the browser tool assigned (it has no way to know what's
  // already live) and hand out fresh ones based on the current table state,
  // so this can never silently overwrite an existing product.
  let nextId = 1;
  if (!dryRun) {
    const { data: maxRow, error: maxErr } = await supabase
      .from("products")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxErr) throw new Error(`Could not read current max id: ${maxErr.message}`);
    nextId = (maxRow?.id || 0) + 1;
  }
  console.log(`Assigning fresh ids starting at ${nextId}${dryRun ? " (placeholder — dry run doesn't check the live table)" : ""}.`);

  let uploaded = 0;
  let failed = 0;
  for (const p of shades) {
    p.id = nextId++;
    if (dryRun) continue;
    try {
      if (p.mainImg) { p._mainImgUrl = await uploadImage(p.id, "main", p.mainImg); uploaded++; }
      if (p.edgeImg) { p._edgeImgUrl = await uploadImage(p.id, "edge", p.edgeImg); uploaded++; }
      if (p.appImg) { p._appImgUrl = await uploadImage(p.id, "app", p.appImg); uploaded++; }
    } catch (err) {
      failed++;
      console.error(`Image upload failed for shade ${p.id} (${p.name}):`, err.message);
    }
  }
  if (!dryRun) console.log(`Uploaded ${uploaded} image(s) (${failed} failure(s)).`);

  const rows = shades.map(toRow);

  let inserted = 0;
  if (dryRun) {
    console.log("Dry run: skipping Supabase upsert.");
  } else {
    const chunkSize = 50;
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
  }
  if (!dryRun) console.log(`Inserted/updated ${inserted} of ${rows.length} product row(s) in Supabase.`);

  const base = inputPath.replace(/\.json$/i, "");
  writeFileSync(`${base}-with-urls.csv`, toCsv(rows));
  writeFileSync(`${base}-with-urls.json`, JSON.stringify(rows, null, 2));
  console.log(`Wrote ${base}-with-urls.csv and ${base}-with-urls.json with the final hosted URLs.`);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exitCode = 1;
});
