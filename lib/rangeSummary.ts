import type { ProductSummary } from "./productRelations.ts";
import { applyDiscount, resolvePrice, unitLabel } from "./pricing.ts";
import { finishLabel } from "./finishGlossary.ts";

// Facts about one manufacturer range, counted from its own SKUs — the intro,
// title and description of a collection landing page are built from these and
// nothing else, so every range page says something specific and true about
// that range instead of sharing its category's copy.

export interface RangeSummary {
  count: number;
  pricedCount: number;
  /** Lowest listed net rate, in the range's most common price unit — "₹1145/sheet". Null when nothing is priced. */
  priceFrom: string | null;
  /** Lowest and highest shade code, as stored, when the range is numbered. */
  codeRange: { from: string; to: string } | null;
  /** Finish labels, most common first. */
  finishes: string[];
  thicknesses: string[];
}

type RangeRow = Pick<ProductSummary, "brand" | "sd_code" | "finish" | "finishes" | "price_table" | "thicknesses">;

export function summarizeRange(rows: RangeRow[]): RangeSummary {
  const prices: { amount: number; unit: string }[] = [];
  for (const row of rows) {
    const price = resolvePrice(row);
    if (!price) continue;
    prices.push({ amount: applyDiscount(price.kind === "range" ? price.min : price.amount, price.discountPct), unit: price.unit });
  }
  const unitCounts = new Map<string, number>();
  for (const p of prices) unitCounts.set(p.unit, (unitCounts.get(p.unit) ?? 0) + 1);
  const unit = [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const inUnit = prices.filter((p) => p.unit === unit).map((p) => p.amount);
  const priceFrom = unit && inUnit.length > 0 ? `₹${Math.min(...inUnit)}/${unitLabel(unit)}` : null;

  const coded = rows
    .map((r) => ({ code: r.sd_code?.trim() ?? "", n: Number(r.sd_code?.match(/\d+/)?.[0] ?? Number.NaN) }))
    .filter((c) => c.code && Number.isFinite(c.n))
    .sort((a, b) => a.n - b.n);
  // Span the range's plain numeric codes when it has them — one odd code
  // like "27K21" in a 21xxx–37xxx range would otherwise set the "from" end.
  const plain = coded.filter((c) => /^\d+$/.test(c.code));
  const span = plain.length >= 2 ? plain : coded;
  const codeRange =
    span.length >= 2 && span[0].code !== span[span.length - 1].code ? { from: span[0].code, to: span[span.length - 1].code } : null;

  const finishCounts = new Map<string, number>();
  for (const row of rows) {
    const values = row.finishes?.length ? row.finishes : row.finish ? [row.finish] : [];
    for (const value of new Set(values.map((v) => v.trim()).filter(Boolean))) {
      const label = finishLabel(row.brand, value);
      finishCounts.set(label, (finishCounts.get(label) ?? 0) + 1);
    }
  }
  const finishes = [...finishCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label]) => label);
  const thicknesses = [...new Set(rows.flatMap((r) => r.thicknesses ?? []).map((t) => t.trim()).filter(Boolean))];

  return { count: rows.length, pricedCount: prices.length, priceFrom, codeRange, finishes, thicknesses };
}

function listJoin(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "Merino Luvih Laminates — 48 Designs & Prices" — "& Shade Codes" when nothing in the range carries a rate. */
export function collectionLandingTitle(landing: { name: string }, summary: RangeSummary): string {
  return `${landing.name} — ${summary.count} Designs & ${summary.priceFrom ? "Prices" : "Shade Codes"}`;
}

/** ≤155 chars where it can be: identity, count, codes, finishes, price, then the commercial close. */
export function collectionLandingDescription(landing: { name: string }, summary: RangeSummary): string {
  const codes = summary.codeRange ? ` (codes ${summary.codeRange.from}–${summary.codeRange.to})` : "";
  const finishes = summary.finishes.length > 0 ? ` in ${listJoin(summary.finishes.slice(0, 2))}${summary.finishes.length > 2 ? " and more" : ""} finishes` : "";
  const price = summary.priceFrom ? `, listed from ${summary.priceFrom}` : "";
  const close = summary.priceFrom ? "Compare shades and get project pricing with Hyderabad delivery." : "Compare shades; prices on request with Hyderabad delivery.";
  const candidates = [
    `${landing.name}: ${summary.count} designs${codes}${finishes}${price}. ${close}`,
    `${landing.name}: ${summary.count} designs${codes}${price}. ${close}`,
    `${landing.name}: ${summary.count} designs${price}. ${close}`,
  ];
  return candidates.find((c) => c.length <= 155) ?? candidates[candidates.length - 1];
}
