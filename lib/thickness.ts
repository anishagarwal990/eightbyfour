// Thickness strings in `products.thicknesses` are author-entered and come in
// several shapes across categories — "18mm", "1.00 mm", "0.72 - 0.82 mm",
// "1.5mm". Price pages filter on thickness, so they need a numeric view of
// those strings rather than string equality, which would miss "19mm" when a
// contractor searched for the 18mm sheet they actually buy.

export interface ParsedThickness {
  /** Original label, preserved for display so we never re-render an author's value differently. */
  label: string;
  /** Lower bound in mm (equal to `max` for a single value). */
  min: number;
  /** Upper bound in mm. */
  max: number;
}

export function parseThickness(label: string): ParsedThickness | null {
  const nums = label.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number).filter((n) => isFinite(n));
  if (values.length === 0) return null;
  return { label, min: Math.min(...values), max: Math.max(...values) };
}

export function parseThicknesses(labels: string[] | null | undefined): ParsedThickness[] {
  return (labels ?? []).map(parseThickness).filter((t): t is ParsedThickness => t !== null);
}

/**
 * Does a product stock a sheet at (or near) `targetMm`?
 *
 * `tolerance` exists because nominal and actual board thicknesses diverge in
 * this trade: what Hyderabad carpenters buy and search for as "18mm plywood"
 * is stocked by every plywood brand in this catalogue as 19mm, and 16mm/16.75mm
 * are the same board in two brands' spec sheets. Matching on the exact string
 * would return an empty 18mm price page while the shelf is full of the sheet
 * the searcher meant.
 */
export function hasThickness(labels: string[] | null | undefined, targetMm: number, tolerance = 0): boolean {
  return parseThicknesses(labels).some((t) => t.min - tolerance <= targetMm && targetMm <= t.max + tolerance);
}

/** The stocked label closest to `targetMm` — what the price table shows in its Thickness column. */
export function closestThicknessLabel(labels: string[] | null | undefined, targetMm: number): string | null {
  const parsed = parseThicknesses(labels);
  if (parsed.length === 0) return null;
  let best = parsed[0];
  let bestGap = Math.abs((best.min + best.max) / 2 - targetMm);
  for (const t of parsed.slice(1)) {
    const gap = Math.abs((t.min + t.max) / 2 - targetMm);
    if (gap < bestGap) {
      best = t;
      bestGap = gap;
    }
  }
  return best.label;
}

/** "4mm – 25mm" for a product's full stocked span; null when nothing parses. */
export function thicknessRangeLabel(labels: string[] | null | undefined): string | null {
  const parsed = parseThicknesses(labels);
  if (parsed.length === 0) return null;
  const min = Math.min(...parsed.map((t) => t.min));
  const max = Math.max(...parsed.map((t) => t.max));
  const fmt = (n: number) => `${Number(n.toFixed(2))}mm`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}
