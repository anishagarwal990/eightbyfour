import type { ProductRow } from "@/lib/supabase/types";

// Per-thickness rates live in `variants`, nested three deep:
// cores -> sizes -> thicknesses -> price. Right shape for the app, wrong
// shape for an editor. This module is the flat view both the admin grid and
// the CSV tool work against.

export interface RateGridRow {
  core: string;
  size: string;
  thickness: string;
  /** Raw cell text, exactly as typed: "" = unknown, "n/a" = not stocked, otherwise a rate. */
  rate: string;
}

interface VariantsShape {
  unit?: string;
  currency?: string;
  gst?: string;
  cores?: { key: string; label: string; sizes: { key: string; label: string; thicknesses: { key: string; label: string; price: number }[] }[] }[];
}

const DEFAULT_META = { unit: "sqft", currency: "INR", gst: "excl" };

function asVariants(value: unknown): VariantsShape | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as VariantsShape;
  return Array.isArray(v.cores) ? v : null;
}

/** "8×4 ft (2440×1220mm)" -> "8x4"; matches the keys already in the data. */
function sizeKey(label: string): string {
  const match = label.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/);
  return match ? `${match[1]}x${match[2]}` : label.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

function thicknessKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "");
}

/**
 * Flatten a product into editable rows.
 *
 * Products with `variants` yield their real rates, so an unedited save is a
 * no-op. Products without are seeded from `thicknesses` with blank rates —
 * that is the fill-in grid for a rate card.
 *
 * Row order is preserved, never sorted: the product page seeds its default
 * thickness from the first entry (`firstThickness` in lib/pricing.ts), and the
 * catalogue stores thicknesses thickest-first, so sorting would quietly make
 * every plywood page open on a 4mm sheet.
 */
export function rateGridFromProduct(product: ProductRow): RateGridRow[] {
  const variants = asVariants(product.variants);
  if (variants?.cores?.length) {
    return variants.cores.flatMap((core) =>
      core.sizes.flatMap((size) =>
        size.thicknesses.map((thickness) => ({
          core: core.label,
          size: size.label,
          thickness: thickness.label,
          rate: String(thickness.price),
        }))
      )
    );
  }

  const thicknesses = Array.isArray(product.thicknesses) ? product.thicknesses : [];
  return thicknesses.map((thickness) => ({
    core: "Standard",
    size: product.size ?? "",
    thickness,
    rate: "",
  }));
}

type ParsedRate =
  | { kind: "blank" }
  | { kind: "not-stocked" }
  | { kind: "rate"; value: number }
  | { kind: "invalid"; raw: string };

export function parseRateCell(cell: string): ParsedRate {
  const raw = cell.trim();
  if (raw === "") return { kind: "blank" };
  if (/^n\/?a$/i.test(raw)) return { kind: "not-stocked" };
  // Tolerate a rate card pasted with currency symbols and thousands commas.
  const value = Number(raw.replace(/[₹,\s]/g, ""));
  if (!isFinite(value) || value <= 0) return { kind: "invalid", raw };
  return { kind: "rate", value };
}

export interface RateGridResult {
  patch: Record<string, unknown>;
  problems: string[];
  /** Whether the headline price_table band was re-derived from a complete grid. */
  bandSynced: boolean;
}

/** A percentage cell — used for both the fixed discount and the cashback figure. */
export function parsePercentCell(cell: string): { kind: "none" } | { kind: "pct"; value: number } | { kind: "invalid"; raw: string } {
  const raw = cell.trim().replace(/%/g, "");
  if (raw === "") return { kind: "none" };
  const value = Number(raw);
  // A "discount" over 100% is always a typo, and a negative one would render
  // as a cashback offer that charges the customer more.
  if (!isFinite(value) || value <= 0 || value > 100) return { kind: "invalid", raw: cell.trim() };
  return { kind: "pct", value };
}

/**
 * Merge a cashback percentage into `price_table`.
 *
 * Separate from the band sync because the two answer different questions: the
 * band is only safe to re-derive from a complete grid, but an offer can be set
 * or cleared at any time regardless of how much of the grid is filled.
 *
 * Returns null when nothing should change, so an untouched field never
 * rewrites the row.
 */
export function offersPatch(
  discount: ReturnType<typeof parsePercentCell>,
  cashback: ReturnType<typeof parsePercentCell>,
  product: ProductRow,
  pendingPriceTable: unknown
): Record<string, unknown> | null {
  if (discount.kind === "invalid" || cashback.kind === "invalid") return null;

  const base = pendingPriceTable ?? product.price_table;
  // Array price tables are per-pack pricing (the Fevicol range). They have no
  // single object to hang an offer on, and spreading one into an array would
  // silently destroy every pack row.
  if (Array.isArray(base)) return null;
  if (!base || typeof base !== "object") {
    // No price table at all: only worth creating one if there is an offer to put in it.
    if (discount.kind === "none" && cashback.kind === "none") return null;
    const created: Record<string, unknown> = { unit: DEFAULT_META.unit, currency: DEFAULT_META.currency, gst: DEFAULT_META.gst };
    if (discount.kind === "pct") created.discount_pct = discount.value;
    if (cashback.kind === "pct") created.cashback_pct = cashback.value;
    return created;
  }

  const next = { ...(base as Record<string, unknown>) };
  if (discount.kind === "none") delete next.discount_pct;
  else next.discount_pct = discount.value;
  if (cashback.kind === "none") delete next.cashback_pct;
  else next.cashback_pct = cashback.value;
  return next;
}

function percentFromTable(product: ProductRow, key: "discount_pct" | "cashback_pct"): string {
  const table = product.price_table;
  if (!table || typeof table !== "object" || Array.isArray(table)) return "";
  const value = (table as Record<string, unknown>)[key];
  return typeof value === "number" ? String(value) : "";
}

export function discountFromProduct(product: ProductRow): string {
  return percentFromTable(product, "discount_pct");
}

export function cashbackFromProduct(product: ProductRow): string {
  return percentFromTable(product, "cashback_pct");
}

/** Rebuild `variants` (and, when the grid is complete, the `price_table` band) from flat rows. */
export function variantsFromGrid(rows: RateGridRow[], product: ProductRow): RateGridResult {
  const problems: string[] = [];
  const parsed = rows.map((row) => ({ ...row, parsed: parseRateCell(row.rate) }));

  for (const row of parsed) {
    if (row.parsed.kind === "invalid") problems.push(`"${row.parsed.raw}" is not a rate (${row.thickness}).`);
  }
  if (problems.length > 0) return { patch: {}, problems, bandSynced: false };

  const priced = parsed.filter((r) => r.parsed.kind === "rate") as (RateGridRow & { parsed: { kind: "rate"; value: number } })[];
  const notStocked = parsed.filter((r) => r.parsed.kind === "not-stocked").map((r) => r.thickness);
  const patch: Record<string, unknown> = {};

  if (priced.length > 0) {
    const existing = asVariants(product.variants) ?? {};
    const cores = new Map<string, Map<string, { key: string; label: string; price: number }[]>>();
    for (const row of priced) {
      const coreLabel = row.core.trim() || "Standard";
      const sizeLabel = row.size.trim();
      if (!cores.has(coreLabel)) cores.set(coreLabel, new Map());
      const sizes = cores.get(coreLabel)!;
      if (!sizes.has(sizeLabel)) sizes.set(sizeLabel, []);
      sizes.get(sizeLabel)!.push({ key: thicknessKey(row.thickness), label: row.thickness, price: row.parsed.value });
    }
    patch.variants = {
      unit: existing.unit ?? DEFAULT_META.unit,
      currency: existing.currency ?? DEFAULT_META.currency,
      gst: existing.gst ?? DEFAULT_META.gst,
      cores: [...cores].map(([coreLabel, sizes]) => ({
        key: coreLabel.toLowerCase().replace(/\s+/g, "-"),
        label: coreLabel,
        sizes: [...sizes].map(([sizeLabel, thicknesses]) => ({ key: sizeKey(sizeLabel), label: sizeLabel, thicknesses })),
      })),
    };
  } else {
    // Every cell cleared — drop the rates rather than leaving a stale object
    // the price pages would keep quoting.
    if (product.variants) patch.variants = null;
  }

  if (notStocked.length > 0 && Array.isArray(product.thicknesses)) {
    const remaining = product.thicknesses.filter((t) => !notStocked.includes(t));
    if (remaining.length !== product.thicknesses.length) patch.thicknesses = remaining.length ? remaining : null;
  }

  // Only re-derive the headline band when every stocked thickness has a rate.
  // Deriving it from a partly-filled grid would narrow the band to whatever
  // three thicknesses someone typed first and present that as the full range.
  const stockedCount = parsed.filter((r) => r.parsed.kind !== "not-stocked").length;
  const bandSynced = priced.length > 0 && priced.length === stockedCount;
  if (bandSynced) {
    const values = priced.map((r) => r.parsed.value);
    const existingTable =
      product.price_table && typeof product.price_table === "object" && !Array.isArray(product.price_table)
        ? (product.price_table as Record<string, unknown>)
        : {};
    const nextTable: Record<string, unknown> = {
      ...existingTable,
      unit: existingTable.unit ?? DEFAULT_META.unit,
      currency: existingTable.currency ?? DEFAULT_META.currency,
      gst: existingTable.gst ?? DEFAULT_META.gst,
      min_price: Math.min(...values),
      max_price: Math.max(...values),
    };
    delete nextTable.starting_price;
    patch.price_table = nextTable;
  }

  return { patch, problems, bandSynced };
}
