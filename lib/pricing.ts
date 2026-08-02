import type { ProductRow } from "@/lib/supabase/types";

export type PriceInfo =
  | { kind: "single"; amount: number; unit: string; cashbackPct: number | null }
  | { kind: "range"; min: number; max: number; unit: string; cashbackPct: number | null };

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
    if (min === max) return { kind: "single", amount: min, unit: "pack", cashbackPct: null };
    return { kind: "range", min, max, unit: "pack", cashbackPct: null };
  }

  if (typeof table !== "object") return null;
  const t = table as { starting_price?: unknown; min_price?: unknown; max_price?: unknown; unit?: unknown; cashback_pct?: unknown };
  const unit = typeof t.unit === "string" ? t.unit : "sqft";
  const cashbackPct = typeof t.cashback_pct === "number" ? t.cashback_pct : null;
  if (typeof t.min_price === "number" && typeof t.max_price === "number") {
    return { kind: "range", min: t.min_price, max: t.max_price, unit, cashbackPct };
  }
  if (typeof t.starting_price === "number") {
    return { kind: "single", amount: t.starting_price, unit, cashbackPct };
  }
  return null;
}

export function unitLabel(unit: string): string {
  return unit === "sqft" ? "sq.ft" : unit;
}
