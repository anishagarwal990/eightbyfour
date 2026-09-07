// Enquiry OS — Rate Book domain model.
//
// The EightByFour commercial Rate Book holds the rate EightByFour quotes at —
// NOT a supplier/purchase cost. Values here stay in sync with the CHECK
// constraints in supabase/enquiry-os-slice2.sql.

export const PRICING_BASES = [
  "PER_SQFT",
  "PER_SHEET",
  "PER_UNIT",
  "PER_PIECE",
  "PER_PAIR",
  "PER_SET",
  "PER_BOX",
  "PER_RUNNING_FT",
  "PER_RUNNING_M",
  "PER_KG",
  "PER_PACK",
  "MANUAL",
] as const;

export type PricingBasis = (typeof PRICING_BASES)[number];

/** Long name for dropdowns. */
export const PRICING_BASIS_LABELS: Record<PricingBasis, string> = {
  PER_SQFT: "Per sqft",
  PER_SHEET: "Per sheet",
  PER_UNIT: "Per unit",
  PER_PIECE: "Per piece",
  PER_PAIR: "Per pair",
  PER_SET: "Per set",
  PER_BOX: "Per box",
  PER_RUNNING_FT: "Per running ft",
  PER_RUNNING_M: "Per running m",
  PER_KG: "Per kg",
  PER_PACK: "Per pack",
  MANUAL: "Manual amount",
};

/** Short suffix for a rate, e.g. `₹137.30 / sqft`. */
export const PRICING_BASIS_UNIT: Record<PricingBasis, string> = {
  PER_SQFT: "sqft",
  PER_SHEET: "sheet",
  PER_UNIT: "unit",
  PER_PIECE: "piece",
  PER_PAIR: "pair",
  PER_SET: "set",
  PER_BOX: "box",
  PER_RUNNING_FT: "rft",
  PER_RUNNING_M: "rm",
  PER_KG: "kg",
  PER_PACK: "pack",
  MANUAL: "lot",
};

export function basisLabel(basis: string | null | undefined): string {
  if (!basis) return "—";
  return PRICING_BASIS_LABELS[basis as PricingBasis] ?? basis;
}

export function basisUnit(basis: string | null | undefined): string {
  if (!basis) return "";
  return PRICING_BASIS_UNIT[basis as PricingBasis] ?? "";
}

/** Only PER_SQFT multiplies quantity by a sheet area; everything else is 1:1. */
export function basisUsesArea(basis: string | null | undefined): boolean {
  return basis === "PER_SQFT";
}

export const RATE_INPUT_MODES = ["EX_GST", "INCL_GST"] as const;
export type RateInputMode = (typeof RATE_INPUT_MODES)[number];

export const RATE_INPUT_MODE_LABELS: Record<RateInputMode, string> = {
  EX_GST: "Excl. GST",
  INCL_GST: "Incl. GST",
};

/** Legally valid GST slabs. Item-level — a quote snapshots the rate it used. */
export const GST_RATES = [0, 5, 12, 18, 28] as const;
export const DEFAULT_GST_RATE = 18;

/** The common board sheet: 8 ft × 4 ft = 32 sqft. A default the form offers,
 *  never a value the schema forces. */
export const DEFAULT_SHEET_WIDTH_FT = 4;
export const DEFAULT_SHEET_LENGTH_FT = 8;
export const DEFAULT_SHEET_AREA_SQFT = 32;

/** Board categories that are normally quoted per sqft. Used only to pre-select
 *  the basis in the rate form — always overridable. */
export const SQFT_CATEGORIES = [
  "Plywood",
  "MDF",
  "HDHMR",
  "Particle Board",
  "Blockboard",
  "Veneer",
  "Corian",
  "Solid Surface",
];

/** Categories usually quoted per sheet. */
export const SHEET_CATEGORIES = ["Laminates", "Liner", "Balancing Laminate"];

export function suggestedBasisForCategory(category: string | null | undefined): PricingBasis {
  if (!category) return "PER_SQFT";
  const c = category.toLowerCase();
  if (SHEET_CATEGORIES.some((s) => c.includes(s.toLowerCase()))) return "PER_SHEET";
  if (SQFT_CATEGORIES.some((s) => c.includes(s.toLowerCase()))) return "PER_SQFT";
  return "PER_UNIT";
}

export interface RateMatchKey {
  brand?: string | null;
  rangeName?: string | null;
  productName?: string | null;
  thickness?: string | null;
  grade?: string | null;
  finish?: string | null;
  size?: string | null;
}

/** Ref for a quote: Q-<base36 time><random>, uppercase. */
export function generateQuoteRef(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `Q-${stamp}${rand}`;
}

/** Whole days since an ISO date, for the quote list "Age" column. */
export function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/** A rate whose effective window has closed or that is inactive. */
export function isRateStale(row: {
  active: boolean;
  effective_to: string | null;
}): boolean {
  if (!row.active) return true;
  if (row.effective_to && new Date(row.effective_to).getTime() < Date.now()) return true;
  return false;
}
