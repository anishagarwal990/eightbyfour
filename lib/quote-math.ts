// Enquiry OS — the one quotation calculation engine.
//
// Money is stored as Postgres numeric; here it is plain JS number, rounded to
// a fixed number of decimals at every boundary (round2 for amounts, round4 for
// rates). This matches the rest of the codebase (the Studio estimator does the
// same) and is exact for the values a plywood quote actually produces. The one
// place precision matters — reverse-calculating an ex-GST rate from an
// inclusive one — keeps 4 decimals so 118 / 1.18 stays 100.0000.
//
// GST is always computed from the normalised base (ex-GST) rate, never from a
// rounded displayed number.

import type { PricingBasis, RateInputMode } from "./rate-book";

/** Only PER_SQFT multiplies quantity by a sheet area. Inlined (not imported
 *  from ./rate-book) so this module has zero runtime imports and the test
 *  file can load it directly under `node --test`. */
function basisUsesArea(basis: PricingBasis): boolean {
  return basis === "PER_SQFT";
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

// ---------------------------------------------------------------- rate maths --

export interface NormalizedRate {
  /** Taxable / ex-GST rate. 4dp. */
  baseRateExGst: number;
  /** Rate with GST folded in. 4dp. */
  rateInclGst: number;
}

/**
 * One source rate + its mode -> both equivalents.
 *   EX_GST   : incl = rate × (1 + g)
 *   INCL_GST : base = rate ÷ (1 + g)
 */
export function normalizeRate(enteredRate: number, mode: RateInputMode, gstPercentRaw: number): NormalizedRate {
  const g = gstPercentRaw / 100;
  if (mode === "INCL_GST") {
    const base = round4(enteredRate / (1 + g));
    return { baseRateExGst: base, rateInclGst: round4(enteredRate) };
  }
  return { baseRateExGst: round4(enteredRate), rateInclGst: round4(enteredRate * (1 + g)) };
}

export function markupToInclFromEx(exRate: number, gstPercent: number): number {
  return round4(exRate * (1 + gstPercent / 100));
}

// ---------------------------------------------------------------- line maths --

export interface LineInput {
  basis: PricingBasis;
  quantity: number;
  sheetAreaSqft?: number | null;
  gstRate: number;
  inputMode: RateInputMode;
  /** Rate the operator typed for this line. null = not priced yet. */
  enteredRate?: number | null;
  lineDiscount?: number;
  /** Commercial amount for basis MANUAL (taxable value). */
  manualAmount?: number | null;
}

export interface LineResult {
  pricingQuantity: number;
  baseRateExGst: number | null;
  rateInclGst: number | null;
  /** pricingQuantity × baseRate, before the line discount. */
  grossTaxable: number;
  lineDiscount: number;
  taxableAmount: number;
  gstAmount: number;
  amountInclGst: number;
  /** Enough information present to produce a real number. */
  priced: boolean;
}

const EMPTY_LINE: LineResult = {
  pricingQuantity: 0,
  baseRateExGst: null,
  rateInclGst: null,
  grossTaxable: 0,
  lineDiscount: 0,
  taxableAmount: 0,
  gstAmount: 0,
  amountInclGst: 0,
  priced: false,
};

/** Sheets × area for PER_SQFT; the quantity itself for every other basis. */
export function pricingQuantity(basis: PricingBasis, quantity: number, sheetAreaSqft?: number | null): number {
  if (!basisUsesArea(basis)) return quantity;
  if (!sheetAreaSqft || sheetAreaSqft <= 0) return 0;
  return round4(quantity * sheetAreaSqft);
}

export function computeLine(input: LineInput): LineResult {
  const lineDiscount = input.lineDiscount ?? 0;
  const g = input.gstRate / 100;

  if (input.basis === "MANUAL") {
    if (input.manualAmount == null) return { ...EMPTY_LINE, lineDiscount };
    const taxable = Math.max(0, round2(input.manualAmount - lineDiscount));
    const gst = round2(taxable * g);
    return {
      pricingQuantity: 0,
      baseRateExGst: null,
      rateInclGst: null,
      grossTaxable: round2(input.manualAmount),
      lineDiscount,
      taxableAmount: taxable,
      gstAmount: gst,
      amountInclGst: round2(taxable + gst),
      priced: true,
    };
  }

  const pq = pricingQuantity(input.basis, input.quantity, input.sheetAreaSqft);
  if (input.enteredRate == null || pq <= 0) {
    return { ...EMPTY_LINE, pricingQuantity: pq, lineDiscount };
  }

  const { baseRateExGst, rateInclGst } = normalizeRate(input.enteredRate, input.inputMode, input.gstRate);
  const grossTaxable = round2(pq * baseRateExGst);
  const taxable = Math.max(0, round2(grossTaxable - lineDiscount));
  const gst = round2(taxable * g);

  return {
    pricingQuantity: pq,
    baseRateExGst,
    rateInclGst,
    grossTaxable,
    lineDiscount,
    taxableAmount: taxable,
    gstAmount: gst,
    amountInclGst: round2(taxable + gst),
    priced: true,
  };
}

// -------------------------------------------------------------- option maths --

export interface ChargeInput {
  amount: number;
  taxable: boolean;
}

export interface OptionInput {
  lines: LineResult[];
  optionDiscount?: number;
  freight?: ChargeInput;
  loading?: ChargeInput;
  packing?: ChargeInput;
  other?: ChargeInput;
  chargesGstRate: number;
  /** null / undefined = auto-round the grand total to the nearest rupee. */
  roundOff?: number | null;
}

export interface OptionResult {
  lineCount: number;
  pricedLineCount: number;
  unresolvedLineCount: number;

  /** Σ line taxable (after any per-line discounts), before the option discount. */
  materialTaxable: number;
  materialGstGross: number;
  optionDiscount: number;
  /** After the option discount. */
  materialTaxableNet: number;
  /** GST scaled down in proportion to the option discount. */
  materialGst: number;

  chargesTaxableBase: number;
  chargesNonTaxable: number;
  chargesGst: number;

  /** materialTaxableNet + chargesTaxableBase. */
  taxableSubtotal: number;
  /** materialGst + chargesGst. */
  totalGst: number;
  roundOff: number;
  grandTotal: number;
}

export function computeOption(input: OptionInput): OptionResult {
  const lines = input.lines;
  const materialTaxable = round2(lines.reduce((s, l) => s + l.taxableAmount, 0));
  const materialGstGross = round2(lines.reduce((s, l) => s + l.gstAmount, 0));

  const optionDiscount = Math.min(input.optionDiscount ?? 0, materialTaxable);
  const factor = materialTaxable > 0 ? (materialTaxable - optionDiscount) / materialTaxable : 1;
  const materialTaxableNet = round2(materialTaxable - optionDiscount);
  const materialGst = round2(materialGstGross * factor);

  const charges: ChargeInput[] = [input.freight, input.loading, input.packing, input.other].filter(
    (c): c is ChargeInput => !!c && c.amount > 0
  );
  const chargesTaxableBase = round2(charges.filter((c) => c.taxable).reduce((s, c) => s + c.amount, 0));
  const chargesNonTaxable = round2(charges.filter((c) => !c.taxable).reduce((s, c) => s + c.amount, 0));
  const chargesGst = round2(chargesTaxableBase * (input.chargesGstRate / 100));

  const taxableSubtotal = round2(materialTaxableNet + chargesTaxableBase);
  const totalGst = round2(materialGst + chargesGst);

  const grandRaw = materialTaxableNet + chargesTaxableBase + chargesNonTaxable + materialGst + chargesGst;
  const roundOff =
    input.roundOff == null || Number.isNaN(input.roundOff)
      ? round2(Math.round(grandRaw) - grandRaw)
      : round2(input.roundOff);
  const grandTotal = round2(grandRaw + roundOff);

  return {
    lineCount: lines.length,
    pricedLineCount: lines.filter((l) => l.priced).length,
    unresolvedLineCount: lines.filter((l) => !l.priced).length,
    materialTaxable,
    materialGstGross,
    optionDiscount,
    materialTaxableNet,
    materialGst,
    chargesTaxableBase,
    chargesNonTaxable,
    chargesGst,
    taxableSubtotal,
    totalGst,
    roundOff,
    grandTotal,
  };
}

// --------------------------------------------------------------- quote maths --

/**
 * The value of a quote with multiple options is a RANGE across the option
 * grand totals — the customer picks one. NEVER a sum. This function cannot add
 * them even if asked: it returns min/max only.
 */
export function quoteValueRange(optionGrandTotals: number[]): { min: number; max: number } | null {
  const vals = optionGrandTotals.filter((n) => Number.isFinite(n) && n > 0);
  if (vals.length === 0) return null;
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

// -------------------------------------------------------------------- format --

export function formatINR(n: number): string {
  return `₹${round2(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatINR0(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatRate(n: number): string {
  // Rates carry up to 2 shown decimals; trailing-zero rates read cleaner flat.
  const r = round4(n);
  const dp = Number.isInteger(r) ? 0 : 2;
  return `₹${r.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: 2 })}`;
}

export function compactINR(n: number): string {
  if (n >= 1e7) return `₹${round2(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })}Cr`;
  if (n >= 1e5) return `₹${round2(n / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })}L`;
  if (n >= 1e3) return `₹${round2(n / 1e3).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k`;
  return `₹${Math.round(n)}`;
}

export function valueRangeLabel(range: { min: number; max: number } | null): string {
  if (!range) return "—";
  if (Math.abs(range.min - range.max) < 0.005) return compactINR(range.min);
  return `${compactINR(range.min)} – ${compactINR(range.max)}`;
}
