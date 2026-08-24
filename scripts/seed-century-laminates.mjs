import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "product-images";
const PDF_LOCAL_PATH = "/Users/anishagarwal/Downloads/eightbyfour-assets/Century_Laminates_Look_Book_compressed_4e10341470.pdf";
const PDF_STORAGE_PATH = "century/catalogue/century-laminates-lookbook-2026-27.pdf";
// One row per unique Code+Finish combination, extracted from the PDF's own
// "Design Index" pages (physical pages 196-205) via coordinate-based table
// parsing (pdfplumber word positions, not text-layout heuristics — this
// table's optional columns, e.g. the texture-premium-tier digit and the
// 10x4-ft asterisk, don't align to fixed character offsets the way Virgo's
// index did). physical_pdf_page = printed_page + 15, a constant offset
// confirmed against 6+ independent anchor points spanning the full printed
// page range (footer page numbers extracted directly, not eyeballed).
const PRODUCTS_JSON = join(__dirname, "data", "century-laminates.json");
// Served straight from /public, not Supabase storage — the Next.js image
// loader (lib/cloudflareImageLoader.ts) only rewrites Supabase-hosted URLs
// through Cloudflare Images, which requires a separate registration step
// (scripts/migrate-images.mjs) for every new image or it 404s silently
// (0x0, no console error). A local /public path skips that entirely, same
// as Virgo's brand-logo-as-placeholder pattern.
const LOGO_PUBLIC_PATH = "/brand-logos/century-laminates.jpg";

// Printed, brand-wide claims from the lookbook's "Why Century Laminates?"
// page (footnoted "*Specifications as per IS2046:2025 (Part-3) Standards") —
// not per-SKU data, applies to the whole 1mm range this catalogue covers.
// The IS2046:2025 numeric property table later in the PDF has 4 value
// columns that are all identically labelled "HGS" with nothing in the
// extracted text distinguishing which pair applies to which product line,
// so — same call as Virgo's merged columns — it's left out rather than
// guessed at.
const CERTIFICATIONS = ["10-Year Warranty", "Greenguard Gold Certified", "FSC Certified", "Fire-Retardant Grade 2 Conformant"];
const FEATURES = [
  "ViroKill Antimicrobial Technology",
  "Scratch & Abrasion Resistant",
  "Stain Resistant",
  "Impact Resistant",
  "Uniform Sanding",
  "Colour Fastness (Surface Tissue Technology)",
  "Precision & Consistency with Imported Plates",
];

async function main() {
  if (!existsSync(PDF_LOCAL_PATH)) throw new Error(`PDF not found: ${PDF_LOCAL_PATH}`);
  const pdfBuffer = readFileSync(PDF_LOCAL_PATH);
  const { error: pdfErr } = await supabase.storage.from(BUCKET).upload(PDF_STORAGE_PATH, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (pdfErr) throw pdfErr;
  const catalogueUrl = supabase.storage.from(BUCKET).getPublicUrl(PDF_STORAGE_PATH).data.publicUrl;
  console.log("Catalogue PDF uploaded:", catalogueUrl);

  // "Century Laminates" is its own brand identity in the source lookbook
  // (distinct wordmark on the cover — CENTURYLAMINATES®, not the generic
  // Century/CenturyPly plywood branding) — a separate brand row, not folded
  // into the existing "Century" (CenturyPly plywood/MDF/Boil Boards) brand.
  const { error: brandErr } = await supabase.from("brands").upsert(
    [
      {
        slug: "century-laminates",
        name: "Century Laminates",
        logo_url: LOGO_PUBLIC_PATH,
        overview:
          "Century Laminates is CenturyPly's decorative laminate range — a full shade catalogue across solids, woodgrains, stones, fabrics and specialty finishes, backed by a 10-year warranty and Greenguard Gold / FSC certification.",
      },
    ],
    { onConflict: "slug" }
  );
  if (brandErr) throw brandErr;
  console.log("Century Laminates brand seeded.");

  const rows = JSON.parse(readFileSync(PRODUCTS_JSON, "utf8"));
  console.log(`Building ${rows.length} Century laminate product rows...`);

  const products = rows.map((r) => {
    const pdfAnchorUrl = `${catalogueUrl}#page=${r.physical_pdf_page}`;
    const specTable = [{ label: "Catalogue Page", value: String(r.printed_page) }];
    if (r.collection) specTable.push({ label: "Collection", value: r.collection });
    if (r.texture_premium_tier) specTable.push({ label: "Texture Premium Tier", value: r.texture_premium_tier });
    if (r.available_10x4) specTable.push({ label: "10x4 ft Sheet", value: "Available" });

    const description = `Century Laminates ${r.name} (design code ${r.code} ${r.finish})${
      r.collection ? ` from the ${r.collection} collection` : ""
    } — a ${r.thickness_mm}mm decorative laminate sheet. Shade shown is the manufacturer's own catalogue reference; view the original page for the authentic texture and colour before ordering. Backed by a 10-year warranty, Greenguard Gold and FSC certification, with ViroKill antimicrobial technology and Grade 2 fire-retardant conformance across the range.`;

    // r.slug in the source data file predates the brand split (Century
    // Laminates used to be folded into the CenturyPly "Century" brand) —
    // reprefix rather than regenerate the data file.
    const slug = r.slug.replace(/^century-/, "century-laminates-");

    return {
      slug,
      category: "Laminates",
      brand: "Century Laminates",
      name: r.name,
      collection: r.collection || null,
      sd_code: r.code,
      finish: r.finish,
      thicknesses: [`${r.thickness_mm} mm`],
      size: "8×4 ft (2440×1220mm)",
      description,
      // No pricing found anywhere in this lookbook — "Price on Request"
      // rather than inventing a number.
      price_table: null,
      certifications: CERTIFICATIONS,
      features: FEATURES,
      main_img_url: LOGO_PUBLIC_PATH,
      catalogue_url: pdfAnchorUrl,
      spec_table: specTable,
    };
  });

  const slugs = products.map((p) => p.slug);
  const existingIdBySlug = new Map();
  const CHUNK = 200;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const chunk = slugs.slice(i, i + CHUNK);
    const { data: existing, error: existingErr } = await supabase.from("products").select("id, slug").in("slug", chunk);
    if (existingErr) throw existingErr;
    for (const r of existing) existingIdBySlug.set(r.slug, r.id);
  }

  const { data: maxRow, error: maxErr } = await supabase.from("products").select("id").order("id", { ascending: false }).limit(1);
  if (maxErr) throw maxErr;
  let nextId = (maxRow[0]?.id ?? 0) + 1;

  for (const p of products) {
    p.id = existingIdBySlug.get(p.slug) ?? nextId++;
  }

  console.log(`Upserting ${products.length} products...`);

  async function withRetry(fn, tries = 5) {
    for (let i = 0; i < tries; i++) {
      try {
        return await fn();
      } catch (e) {
        if (i === tries - 1) throw e;
        await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
      }
    }
  }

  const BATCH = 100;
  let upserted = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    await withRetry(async () => {
      const { error } = await supabase.from("products").upsert(batch, { onConflict: "slug" });
      if (error) throw error;
    });
    upserted += batch.length;
    console.log(`  upserted ${upserted}/${products.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Century laminates seed failed:", err);
  process.exitCode = 1;
});
