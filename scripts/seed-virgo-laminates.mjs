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
const PDF_LOCAL_PATH = "/Users/anishagarwal/Downloads/VIRGO1.00 MM FILE.pdf";
const PDF_STORAGE_PATH = "virgo/catalogue/virgo-1.00mm-laminates.pdf";
const PRODUCTS_JSON = join(
  "/private/tmp/claude-501/-Users-anishagarwal-Downloads-eightbyfour/8d8b07f1-2c71-41a6-b9ae-b997c65468fe/scratchpad/virgo",
  "virgo_products.json"
);

async function main() {
  // 1. Upload the source catalogue PDF once — every Virgo product row links to
  // this same file (optionally with a #page= anchor for the ~83 SKUs whose
  // printed catalogue page was reliably matched to a physical PDF page).
  if (!existsSync(PDF_LOCAL_PATH)) throw new Error(`PDF not found: ${PDF_LOCAL_PATH}`);
  const pdfBuffer = readFileSync(PDF_LOCAL_PATH);
  const { error: pdfErr } = await supabase.storage.from(BUCKET).upload(PDF_STORAGE_PATH, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (pdfErr) throw pdfErr;
  const catalogueUrl = supabase.storage.from(BUCKET).getPublicUrl(PDF_STORAGE_PATH).data.publicUrl;
  console.log("Catalogue PDF uploaded:", catalogueUrl);

  // 2. Seed the Virgo brand row. Logo reuses the existing local asset already
  // referenced by SOURCE_ONLY_BRANDS/BRAND_LOGOS (public/brand-logos/virgo.jpg)
  // rather than re-uploading a duplicate copy to storage.
  const { error: brandErr } = await supabase.from("brands").upsert(
    [
      {
        slug: "virgo",
        name: "Virgo",
        logo_url: "/brand-logos/virgo.jpg",
        overview:
          "Virgo Mica is a decorative laminate manufacturer offering an extensive shade catalogue across gloss, matte, textured, stone and wood-grain finishes.",
      },
    ],
    { onConflict: "slug" }
  );
  if (brandErr) throw brandErr;
  console.log("Virgo brand seeded.");

  // 3. Build product rows from the pre-parsed catalogue index
  // (virgo_products.json — one row per unique Code+Finish combination,
  // extracted from the PDF's own index pages).
  const rows = JSON.parse(readFileSync(PRODUCTS_JSON, "utf8"));
  console.log(`Building ${rows.length} Virgo product rows...`);

  const GLOSS_TIP =
    " High-gloss finishes read premium but show fingerprints and scratches more readily — better suited to accent panels or wardrobe interiors than daily-use kitchen counters.";
  const MATTE_TIP =
    " This finish resists fingerprints and daily wear better than a high-gloss surface, making it a practical pick for high-touch areas.";
  const STONE_TIP =
    " Stone and marble-effect finishes read closer to natural material and suit feature walls and counters where a glossy sheen would look out of place.";

  function finishTip(finishFullName) {
    if (!finishFullName) return "";
    const lower = finishFullName.toLowerCase();
    if (lower.includes("gloss")) return GLOSS_TIP;
    if (lower.includes("matt") || lower.includes("matte") || lower.includes("suede")) return MATTE_TIP;
    if (lower.includes("stone") || lower.includes("marble")) return STONE_TIP;
    return "";
  }

  // From the "TECHNICAL SPECIFICATION" table on the PDF's own index page
  // (right half, VGS/1.00mm column — matches this file's product line).
  // Only the values that render unambiguously in the source PDF; several
  // other rows in that table have their IS2046-95-standard and Typical-Value
  // sub-columns visually merged with no separator in the source file itself
  // (e.g. "150>150", "12%8%") and aren't confidently splittable, so they're
  // deliberately left out rather than guessed.
  const VGS_SPECS = [
    { label: "Thickness Tolerance", value: "±10% (IS 2046-95)" },
    { label: "Surface Appearance", value: "No ABC Defect (IS 2046-95)" },
    { label: "High Temperature Resistance", value: "Slight Effect" },
    { label: "Stain Resistance", value: "No Effect (mild reagents) · Slight Effect (aggressive reagents)" },
  ];
  const CARE_FAQ = {
    question: "How do I care for and maintain Virgo laminate sheets?",
    answer:
      "Avoid chemical cleaners — wipe with a soft cloth using mild soap and water. Keep sheets out of direct or continuous sunlight, which can cause colour fading over time. Extra care is needed when pasting sheets vertically, since uneven pressure can trap air bubbles. To avoid cracking at corners and cuts, ensure proper conditioning, bonding and planing during fabrication.",
  };

  const products = rows.map((r) => {
    const pdfAnchorUrl = r.physical_pdf_page ? `${catalogueUrl}#page=${r.physical_pdf_page}` : catalogueUrl;
    const specTable = [{ label: "Catalogue Page", value: String(r.printed_catalogue_page) }, ...VGS_SPECS];
    if (r.finish_full_name) specTable.push({ label: "Finish Name", value: `${r.finish_full_name} (${r.finish})` });

    const finishLabel = r.finish_full_name ? `${r.finish_full_name} (${r.finish})` : r.finish;
    const description = `Virgo ${r.name} (design code ${r.sd_code}) in ${finishLabel} finish — a 1.00mm decorative laminate sheet from the Virgo Mica catalogue. Shade shown is the manufacturer's own catalogue reference; view the original page for the authentic texture and colour before ordering.${finishTip(r.finish_full_name)}`;

    return {
      slug: r.slug,
      category: "Laminates",
      brand: "Virgo",
      name: r.name,
      collection: r.collection,
      sd_code: r.sd_code,
      finish: r.finish,
      thicknesses: ["1.00 mm"],
      // Standard sheet size across every laminate brand already on the site
      // (see e.g. Greenlam/Merino product rows) — not brand-specific data
      // extracted from the Virgo PDF, which doesn't list a sheet size.
      size: "8×4 ft (2440×1220mm)",
      description,
      price_table: { starting_price: 1145, unit: "sheet" },
      // No per-shade swatch photo was extracted from the PDF — the brand
      // logo stands in as the product card/gallery image instead of a blank
      // placeholder, per owner request.
      main_img_url: "/brand-logos/virgo.jpg",
      catalogue_url: pdfAnchorUrl,
      spec_table: specTable,
      custom_faqs: [CARE_FAQ],
    };
  });

  // The `id` column has no default/sequence — reuse existing ids for slugs
  // already present (idempotent re-runs), hand out fresh ids otherwise.
  const slugs = products.map((p) => p.slug);
  const existingIdBySlug = new Map();
  const CHUNK = 200;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const chunk = slugs.slice(i, i + CHUNK);
    const { data: existing, error } = await supabase.from("products").select("id, slug").in("slug", chunk);
    if (error) throw error;
    for (const row of existing) existingIdBySlug.set(row.slug, row.id);
  }

  const { data: maxRow, error: maxErr } = await supabase.from("products").select("id").order("id", { ascending: false }).limit(1);
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
  console.error("Virgo laminates seed failed:", err);
  process.exitCode = 1;
});
