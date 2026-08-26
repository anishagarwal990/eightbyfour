import type { ProductRow } from "@/lib/supabase/types";
import { parseVariants, resolvePrice, sqftFromSizeLabel, unitLabel, type PriceInfo } from "@/lib/pricing";
import { closestThicknessLabel, thicknessRangeLabel } from "@/lib/thickness";
import { productDisplayName } from "@/lib/productDisplay";

// A single row of a Hyderabad price table. Everything here is either read
// straight off the product row or derived by arithmetic from it — there is no
// estimated, interpolated or otherwise invented price anywhere in this file.
// When the database has no rate for a product, `price` stays null and the
// table renders "Request current price" rather than a number.
export interface PriceRow {
  slug: string;
  brand: string;
  name: string;
  /** Brand + name, de-duplicated — some product names already carry the brand. */
  displayName: string;
  collection: string | null;
  grade: string | null;
  size: string | null;
  core: string | null;
  warranty: string | null;
  certifications: string[] | null;
  imageUrl: string | null;
  /** The rate exactly as stored — per sq.ft, per sheet or per pack. */
  price: PriceInfo | null;
  /** Full stocked thickness span, e.g. "4mm – 25mm". */
  thicknessSpan: string | null;
  /** The stocked label nearest this page's focus thickness, when the page has one. */
  focusThicknessLabel: string | null;
  /**
   * Exact rate for the page's focus thickness, available only for products
   * whose `variants` JSON carries per-thickness pricing. Most rows have a
   * whole-product min/max spanning 4–25mm instead, which is why the table
   * always labels the span the rate belongs to.
   */
  focusThicknessPrice: number | null;
  /**
   * Per-sheet cost derived from a per-sq.ft rate × the sheet's own area from
   * its size label (8×4 ft = 32 sq.ft). Arithmetic on two stored values, not
   * a quoted price — the table labels it as such.
   */
  perSheet: { min: number; max: number } | null;
}

/**
 * Sheet sizes from the `variants` JSON, for products whose flat `size` column
 * is empty because they're stocked in several sizes (e.g. Kerala Hardwood at
 * 8×4, 6×3, 6×4 and 6.25×3). Reading them back keeps the size column real
 * instead of an em dash.
 */
function variantSizeLabels(product: ProductRow): string[] {
  const variants = parseVariants(product.variants);
  if (!variants) return [];
  return [...new Set(variants.cores.flatMap((core) => core.sizes.map((size) => size.label)))];
}

/** Look up an exact per-thickness rate in `variants`, if this product carries one. */
function variantPriceForThickness(product: ProductRow, focusThicknessMm: number | null): number | null {
  if (focusThicknessMm === null) return null;
  const variants = parseVariants(product.variants);
  if (!variants) return null;
  const prices: number[] = [];
  for (const core of variants.cores) {
    for (const size of core.sizes) {
      for (const thickness of size.thicknesses) {
        const value = parseFloat(thickness.label);
        if (isFinite(value) && Math.abs(value - focusThicknessMm) < 0.01) prices.push(thickness.price);
      }
    }
  }
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function toPriceRow(product: ProductRow, focusThicknessMm: number | null = null): PriceRow {
  const price = resolvePrice(product);
  const variantSizes = variantSizeLabels(product);
  const sizeLabel = product.size ?? (variantSizes.length ? variantSizes.join(", ") : null);
  // Only derive a per-sheet figure when there is exactly one sheet size to
  // derive it from — a product stocked in four sizes has four sheet prices,
  // and picking one of them silently would be a fabricated number.
  const sheetSqft = product.size ? sqftFromSizeLabel(product.size) : variantSizes.length === 1 ? sqftFromSizeLabel(variantSizes[0]) : null;

  // Only per-sq.ft rates convert to a per-sheet figure; a rate already quoted
  // per sheet or per pack is left alone rather than multiplied by an area.
  const perSheet =
    price && price.unit === "sqft" && sheetSqft
      ? price.kind === "range"
        ? { min: Math.round(price.min * sheetSqft), max: Math.round(price.max * sheetSqft) }
        : { min: Math.round(price.amount * sheetSqft), max: Math.round(price.amount * sheetSqft) }
      : null;

  return {
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    displayName: productDisplayName(product),
    collection: product.collection,
    grade: product.grade,
    size: sizeLabel,
    core: product.core,
    warranty: product.warranty,
    certifications: product.certifications,
    imageUrl: product.main_img_url,
    price,
    thicknessSpan: thicknessRangeLabel(product.thicknesses),
    focusThicknessLabel: focusThicknessMm === null ? null : closestThicknessLabel(product.thicknesses, focusThicknessMm),
    focusThicknessPrice: variantPriceForThickness(product, focusThicknessMm),
    perSheet,
  };
}

/** Lowest number a row quotes, for sorting cheapest-first and for "best value" picks. */
export function rowFromPrice(row: PriceRow): number | null {
  if (row.focusThicknessPrice !== null) return row.focusThicknessPrice;
  if (!row.price) return null;
  return row.price.kind === "range" ? row.price.min : row.price.amount;
}

export function formatPrice(row: PriceRow): string | null {
  if (row.focusThicknessPrice !== null && row.price) return `₹${row.focusThicknessPrice}/${unitLabel(row.price.unit)}`;
  if (!row.price) return null;
  const unit = unitLabel(row.price.unit);
  return row.price.kind === "range" ? `₹${row.price.min} – ₹${row.price.max}/${unit}` : `₹${row.price.amount}/${unit}`;
}

/** Aggregate min/max across every priced row, for the page's headline range and ItemList schema. */
export function priceSpan(rows: PriceRow[]): { min: number; max: number; unit: string } | null {
  const priced = rows.filter((r) => r.price !== null);
  if (priced.length === 0) return null;
  const unit = priced[0].price!.unit;
  // Mixed units (a page spanning per-sq.ft boards and per-sheet laminates)
  // can't collapse into one headline figure without misleading the reader.
  if (priced.some((r) => r.price!.unit !== unit)) return null;
  const lows = priced.map((r) => (r.price!.kind === "range" ? r.price!.min : r.price!.amount));
  const highs = priced.map((r) => (r.price!.kind === "range" ? r.price!.max : r.price!.amount));
  return { min: Math.min(...lows), max: Math.max(...highs), unit };
}

// --- Buying recommendations -------------------------------------------------
// Resolved against the live rows every render, so a "best value" callout can
// never contradict the price table directly above it, and disappears on its
// own when the product it named leaves the catalogue.

import type { PickCriterion, PickSpec } from "@/lib/pricePages";

export interface ResolvedPick {
  label: string;
  note: string;
  row: PriceRow;
}

function matchesCertification(row: PriceRow, pattern: string): boolean {
  const re = new RegExp(pattern, "i");
  return (row.certifications ?? []).some((c) => re.test(c));
}

function pickRow(rows: PriceRow[], criterion: PickCriterion): PriceRow | null {
  const priced = rows.filter((r) => rowFromPrice(r) !== null);
  switch (criterion.kind) {
    case "cheapest":
      return priced.sort((a, b) => rowFromPrice(a)! - rowFromPrice(b)!)[0] ?? null;
    case "dearest": {
      const ceiling = (r: PriceRow) => (r.price!.kind === "range" ? r.price!.max : r.price!.amount);
      return priced.sort((a, b) => ceiling(b) - ceiling(a))[0] ?? null;
    }
    case "cheapestWithGrade": {
      const grades = new Set(criterion.grades.map((g) => g.toUpperCase()));
      return priced.filter((r) => r.grade && grades.has(r.grade.toUpperCase())).sort((a, b) => rowFromPrice(a)! - rowFromPrice(b)!)[0] ?? null;
    }
    case "cheapestWithCertification":
      return priced.filter((r) => matchesCertification(r, criterion.pattern)).sort((a, b) => rowFromPrice(a)! - rowFromPrice(b)!)[0] ?? null;
    case "product":
      return rows.find((r) => r.slug === criterion.slug) ?? null;
  }
}

/**
 * Resolve each configured pick slot, dropping any that no live row satisfies
 * and de-duplicating so the same product doesn't fill three slots on a page
 * with a thin catalogue (which is what "best value / best waterproof / best
 * premium" collapses into when only two SKUs are priced).
 */
export function resolvePicks(specs: PickSpec[] | undefined, rows: PriceRow[]): ResolvedPick[] {
  if (!specs?.length) return [];
  const used = new Set<string>();
  const resolved: ResolvedPick[] = [];
  for (const spec of specs) {
    const row = pickRow(rows, spec.criterion);
    if (!row || used.has(row.slug)) continue;
    used.add(row.slug);
    resolved.push({ label: spec.label, note: spec.note, row });
  }
  return resolved;
}

// --- Range rollups ----------------------------------------------------------

export interface PriceRangeGroup {
  brand: string;
  collection: string | null;
  count: number;
  thicknesses: string[];
  sizes: string[];
  price: PriceInfo | null;
  /** Whether every SKU in the group shares one rate, or the group spans several. */
  mixedRates: boolean;
  href: string;
  /** A few real SKUs from the group, for the "shades in this range" links. */
  samples: { slug: string; name: string; code: string | null }[];
}

/**
 * Collapse a large single-rate catalogue (laminates: one rate across hundreds
 * of shades) into one row per brand + collection. A 700-row shade table is a
 * worse answer to "what do Greenlam laminates cost" than a dozen rows saying
 * which ranges exist, what they cost and how many shades each holds.
 */
export function toRangeGroups(
  products: ProductRow[],
  hrefFor: (product: ProductRow) => string
): PriceRangeGroup[] {
  const groups = new Map<string, { products: ProductRow[]; href: string }>();
  for (const product of products) {
    const key = `${product.brand}||${product.collection ?? ""}`;
    const existing = groups.get(key);
    if (existing) existing.products.push(product);
    else groups.set(key, { products: [product], href: hrefFor(product) });
  }

  return [...groups.values()]
    .map(({ products: items, href }) => {
      const prices = items.map(resolvePrice).filter((p): p is PriceInfo => p !== null);
      const lows = prices.map((p) => (p.kind === "range" ? p.min : p.amount));
      const highs = prices.map((p) => (p.kind === "range" ? p.max : p.amount));
      const min = lows.length ? Math.min(...lows) : null;
      const max = highs.length ? Math.max(...highs) : null;
      const unit = prices[0]?.unit ?? "sheet";
      const price: PriceInfo | null =
        min === null || max === null
          ? null
          : min === max
            ? { kind: "single", amount: min, unit, cashbackPct: null }
            : { kind: "range", min, max, unit, cashbackPct: null };

      return {
        brand: items[0].brand,
        collection: items[0].collection,
        count: items.length,
        thicknesses: [...new Set(items.flatMap((p) => p.thicknesses ?? []))],
        sizes: [...new Set(items.map((p) => p.size).filter((s): s is string => Boolean(s)))],
        price,
        // Some SKUs priced and others not is a real, visible caveat — say so
        // rather than quietly quoting the priced subset as the whole range.
        mixedRates: prices.length > 0 && prices.length < items.length,
        href,
        samples: items.slice(0, 6).map((p) => ({ slug: p.slug, name: p.name, code: p.sd_code })),
      };
    })
    .sort((a, b) => b.count - a.count);
}
