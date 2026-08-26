// Per-thickness rates live in the `variants` JSON column, nested three deep:
// cores -> sizes -> thicknesses -> price. That is the right shape for the app
// (a product can be stocked in several cores and sheet sizes at different
// rates) and the wrong shape for a spreadsheet. This module flattens it to
// one row per priced combination and rebuilds the nesting on import.

import { deepEqual } from "./fields.mjs";

const DEFAULT_META = { unit: "sqft", currency: "INR", gst: "excl" };
export const RATE_HEADERS = ["slug", "brand", "product", "core", "size", "thickness", "rate", "current_band"];

/** "8×4 ft (2440×1220mm)" -> "8x4"; matches the keys already in the data. */
function sizeKey(label) {
  const match = String(label).match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/);
  return match ? `${match[1]}x${match[2]}` : String(label).toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

function thicknessKey(label) {
  return String(label).toLowerCase().replace(/\s+/g, "");
}

function bandLabel(priceTable) {
  if (!priceTable || Array.isArray(priceTable) || typeof priceTable !== "object") return "";
  const min = priceTable.min_price ?? priceTable.starting_price;
  const max = priceTable.max_price ?? priceTable.starting_price;
  if (typeof min !== "number") return "";
  return min === max ? `${min}` : `${min}-${max}`;
}

/**
 * One CSV row per (product, core, size, thickness).
 *
 * Products that already carry `variants` export their real per-thickness
 * rates, so a re-import is a no-op. Products that do not are seeded from the
 * `thicknesses` array with a blank rate — which is what turns this file into
 * the fill-in grid for a rate card.
 */
export function toRateRows(products) {
  const rows = [];
  for (const product of products) {
    const band = bandLabel(product.price_table);
    const variants = product.variants && typeof product.variants === "object" && Array.isArray(product.variants.cores) ? product.variants : null;

    if (variants) {
      for (const core of variants.cores) {
        for (const size of core.sizes) {
          for (const thickness of size.thicknesses) {
            rows.push({
              slug: product.slug,
              brand: product.brand,
              product: product.name,
              core: core.label,
              size: size.label,
              thickness: thickness.label,
              rate: thickness.price,
              current_band: band,
            });
          }
        }
      }
      continue;
    }

    const thicknesses = Array.isArray(product.thicknesses) ? product.thicknesses : [];
    if (thicknesses.length === 0) continue;
    // Emitted in the stored order, not re-sorted. Order is meaningful: the
    // product page seeds its default thickness selection from the first entry
    // (lib/pricing.ts firstThickness), and the catalogue stores these
    // thickest-first, so re-sorting would silently change every plywood page
    // to open on a 4mm sheet.
    for (const thickness of thicknesses) {
      rows.push({
        slug: product.slug,
        brand: product.brand,
        product: product.name,
        core: "Standard",
        size: product.size ?? "",
        thickness,
        rate: "",
        current_band: band,
      });
    }
  }
  return rows;
}

function parseRate(cell) {
  const raw = String(cell ?? "").trim();
  if (raw === "") return { kind: "blank" };
  if (/^n\/?a$/i.test(raw)) return { kind: "not-stocked" };
  // Tolerate a rate card pasted with currency symbols and thousands commas.
  const cleaned = raw.replace(/[₹,\s]/g, "");
  const value = Number(cleaned);
  if (!isFinite(value) || value <= 0) return { kind: "invalid", raw };
  return { kind: "rate", value };
}

/**
 * Rebuild `variants` (and, when complete, the `price_table` band) from CSV rows.
 *
 * Returns one patch per product plus a list of problems. Three cell states:
 *   a number   -> a real rate for that thickness
 *   blank      -> no rate yet; the thickness stays stocked but unpriced
 *   "n/a"      -> not stocked at all; removed from the `thicknesses` array
 */
export function fromRateRows(records, productsBySlug) {
  const problems = [];
  const bySlug = new Map();

  records.forEach((record, index) => {
    const line = index + 2;
    const slug = record.slug?.trim();
    if (!slug) return;
    const product = productsBySlug.get(slug);
    if (!product) {
      problems.push(`Line ${line}: no product with slug "${slug}".`);
      return;
    }
    const parsed = parseRate(record.rate);
    if (parsed.kind === "invalid") {
      problems.push(`Line ${line} (${slug} ${record.thickness}): "${parsed.raw}" is not a rate.`);
      return;
    }
    if (!bySlug.has(slug)) bySlug.set(slug, { product, entries: [] });
    bySlug.get(slug).entries.push({ core: record.core?.trim() || "Standard", size: record.size?.trim() || "", thickness: record.thickness?.trim(), parsed });
  });

  const patches = [];
  for (const [slug, { product, entries }] of bySlug) {
    const priced = entries.filter((e) => e.parsed.kind === "rate");
    const notStocked = entries.filter((e) => e.parsed.kind === "not-stocked").map((e) => e.thickness);
    const patch = {};

    if (priced.length > 0) {
      const existingMeta = product.variants && typeof product.variants === "object" ? product.variants : {};
      const cores = new Map();
      for (const entry of priced) {
        if (!cores.has(entry.core)) cores.set(entry.core, new Map());
        const sizes = cores.get(entry.core);
        if (!sizes.has(entry.size)) sizes.set(entry.size, []);
        sizes.get(entry.size).push({ key: thicknessKey(entry.thickness), label: entry.thickness, price: entry.parsed.value });
      }
      patch.variants = {
        unit: existingMeta.unit ?? DEFAULT_META.unit,
        currency: existingMeta.currency ?? DEFAULT_META.currency,
        gst: existingMeta.gst ?? DEFAULT_META.gst,
        cores: [...cores].map(([coreLabel, sizes]) => ({
          key: coreLabel.toLowerCase().replace(/\s+/g, "-"),
          label: coreLabel,
          sizes: [...sizes].map(([sizeLabel, thicknesses]) => ({
            key: sizeKey(sizeLabel),
            label: sizeLabel,
            // CSV row order is preserved for the same reason the export does
            // not sort — the first thickness is the product page's default.
            thicknesses,
          })),
        })),
      };
    }

    if (notStocked.length > 0 && Array.isArray(product.thicknesses)) {
      const remaining = product.thicknesses.filter((t) => !notStocked.includes(t));
      if (remaining.length !== product.thicknesses.length) patch.thicknesses = remaining.length ? remaining : null;
    }

    // Only re-derive the headline band when every stocked thickness has a
    // rate. Deriving it from a partly-filled grid would narrow the band to
    // the three thicknesses someone happened to type first and present that
    // as the product's full range.
    const stockedCount = entries.filter((e) => e.parsed.kind !== "not-stocked").length;
    if (priced.length > 0 && priced.length === stockedCount) {
      const values = priced.map((e) => e.parsed.value);
      const existing = product.price_table && !Array.isArray(product.price_table) && typeof product.price_table === "object" ? product.price_table : {};
      patch.price_table = {
        ...existing,
        unit: existing.unit ?? DEFAULT_META.unit,
        currency: existing.currency ?? DEFAULT_META.currency,
        gst: existing.gst ?? DEFAULT_META.gst,
        min_price: Math.min(...values),
        max_price: Math.max(...values),
      };
      delete patch.price_table.starting_price;
    }

    // Drop anything that rebuilt to the same value — a re-import of an
    // unedited export must be a no-op, not a full rewrite.
    for (const key of Object.keys(patch)) {
      if (deepEqual(product[key], patch[key])) delete patch[key];
    }
    if (Object.keys(patch).length > 0) patches.push({ slug, patch });
  }

  return { patches, problems };
}
