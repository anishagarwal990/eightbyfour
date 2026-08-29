import type { ProductRow } from "@/lib/supabase/types";

// Two separate things, deliberately not merged:
//
//   discountPct — fixed, published, applies to every order. The stored rate is
//     the LIST price, and this is what gets cut off it. The site shows both
//     numbers, list struck through.
//   cashbackPct — negotiated per deal and variable. Displayed as an "up to"
//     figure alongside the price, never subtracted from it, because the real
//     number is settled in conversation rather than on the page.
export type PriceInfo =
  | { kind: "single"; amount: number; unit: string; cashbackPct: number | null; discountPct: number | null }
  | { kind: "range"; min: number; max: number; unit: string; cashbackPct: number | null; discountPct: number | null };

/** A discount stored as 0 or ≥100 is bad data, not a real rate — treat it as absent rather than let `applyDiscount` zero out or invert a price. Shared by the product-level rate on `price_table` and the per-thickness override on `VariantThickness`. */
export function validDiscountPct(value: unknown): number | null {
  return typeof value === "number" && value > 0 && value < 100 ? value : null;
}

export function resolvePrice(product: ProductRow): PriceInfo | null {
  const table = product.price_table;
  if (!table) return null;

  // Per-pack pricing (e.g. Fevicol): an array of {size, price} entries rather
  // than a single rate/range object. Show it as a min-max range across packs.
  if (Array.isArray(table)) {
    const prices = table
      .map((entry) => (entry && typeof entry === "object" && typeof (entry as { price?: unknown }).price === "number" ? (entry as { price: number }).price : null))
      .filter((p): p is number => p !== null);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return { kind: "single", amount: min, unit: "pack", cashbackPct: null, discountPct: null };
    return { kind: "range", min, max, unit: "pack", cashbackPct: null, discountPct: null };
  }

  if (typeof table !== "object") return null;
  const t = table as {
    starting_price?: unknown;
    min_price?: unknown;
    max_price?: unknown;
    unit?: unknown;
    cashback_pct?: unknown;
    discount_pct?: unknown;
  };
  const unit = typeof t.unit === "string" ? t.unit : "sqft";
  const cashbackPct = typeof t.cashback_pct === "number" ? t.cashback_pct : null;
  const discountPct = validDiscountPct(t.discount_pct);
  if (typeof t.min_price === "number" && typeof t.max_price === "number") {
    return { kind: "range", min: t.min_price, max: t.max_price, unit, cashbackPct, discountPct };
  }
  if (typeof t.starting_price === "number") {
    return { kind: "single", amount: t.starting_price, unit, cashbackPct, discountPct };
  }
  return null;
}

/**
 * The percentage as shown to a visitor — whole numbers, never the raw stored
 * figure. A per-thickness discount_pct is deliberately kept at full precision
 * (see VariantThickness) so `applyDiscount` reproduces the exact rupee a
 * supplier sheet quoted; printing that precision (e.g. "12.4749% off")
 * would read as noise rather than a real published rate.
 */
export function formatDiscountPct(discountPct: number): string {
  return `${Math.round(discountPct)}`;
}

/** Apply a fixed discount to a list price. Rounded to the rupee — nobody quotes paise on a sheet. */
export function applyDiscount(value: number, discountPct: number | null): number {
  if (!discountPct) return value;
  return Math.round(value * (1 - discountPct / 100));
}

export interface DisplayPrice {
  /** What the customer pays — the list price with any fixed discount applied. */
  netLabel: string;
  /** The pre-discount figure, for striking through. Null when there is no discount. */
  listLabel: string | null;
  discountPct: number | null;
  cashbackPct: number | null;
}

/**
 * One place that decides how a price reads, so a card, a table row, a product
 * page and the JSON-LD can never disagree about what a product costs.
 */
export function displayPrice(price: PriceInfo): DisplayPrice {
  const unit = unitLabel(price.unit);
  const format = (discounted: boolean) => {
    const at = (value: number) => (discounted ? applyDiscount(value, price.discountPct) : value);
    return price.kind === "range" ? `₹${at(price.min)} – ₹${at(price.max)}/${unit}` : `₹${at(price.amount)}/${unit}`;
  };
  return {
    netLabel: format(true),
    listLabel: price.discountPct ? format(false) : null,
    discountPct: price.discountPct,
    cashbackPct: price.cashbackPct,
  };
}

export function unitLabel(unit: string): string {
  return unit === "sqft" ? "sq.ft" : unit;
}

/** Parses "8×4 ft" / "6.25x3 ft (...)" / "760×2490mm (30×98in)" style size labels into total sq.ft. */
export function sqftFromSizeLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = label.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|in|ft)?/i);
  if (!match) return null;
  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  if (!isFinite(a) || !isFinite(b)) return null;
  const unit = (match[3] || "ft").toLowerCase();
  const feetPerUnit: Record<string, number> = {
    mm: 1 / 304.8,
    cm: 1 / 30.48,
    m: 1 / 0.3048,
    in: 1 / 12,
    ft: 1,
  };
  const factor = feetPerUnit[unit] ?? 1;
  return a * factor * (b * factor);
}

export interface VariantThickness {
  key: string;
  label: string;
  /**
   * When `discount_pct` is set on this thickness, `price` is the LIST rate
   * and the discount is this thickness's own — not the product-level one on
   * `price_table`. Optional because a real supplier discount schedule is
   * usually two- or three-tiered (thin gauges cut less than thick ones), so a
   * single product-wide percentage can't reproduce every thickness's actual
   * customer price without drift. Falls back to `price_table.discount_pct`
   * when absent, which is the old, single-discount behaviour.
   */
  discount_pct?: number;
  price: number;
}

export interface VariantSize {
  key: string;
  label: string;
  thicknesses: VariantThickness[];
}

export interface VariantCore {
  key: string;
  label: string;
  sizes: VariantSize[];
}

export interface ProductVariants {
  unit: string;
  currency: string;
  gst: string;
  cores: VariantCore[];
}

export function parseVariants(value: unknown): ProductVariants | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { cores?: unknown; unit?: unknown; currency?: unknown; gst?: unknown };
  if (!Array.isArray(v.cores) || v.cores.length === 0) return null;
  return value as ProductVariants;
}

/** First size/thickness available for a given core — used to seed default selection. */
export function firstSize(core: VariantCore): VariantSize {
  return core.sizes[0];
}

export function firstThickness(size: VariantSize): VariantThickness {
  return size.thicknesses[0];
}
