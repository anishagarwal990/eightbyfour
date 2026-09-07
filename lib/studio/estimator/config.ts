/**
 * Wardrobe estimator — pricing configuration.
 *
 * The ONLY place rupee assumptions live. Nothing in the engine or the UI
 * hardcodes a rate, so any quote traces back to one edited row here.
 *
 * ── RATE PROVENANCE ────────────────────────────────────────────────────────
 * Every rate carries a `source`, and the UI surfaces it. There are two:
 *
 *   "catalogue"  — derived from a real EightByFour product in
 *                  lib/studio/catalogue.ts (₹ per 8×4 sheet ÷ 32 sq ft).
 *                  Changing the catalogue changes the estimate.
 *
 *   "assumption" — a working figure we have set ourselves. NOT a validated
 *                  commercial rate. These are what a customer-facing estimate
 *                  rests on until they are replaced, which is why every
 *                  estimate is labelled indicative.
 *
 * When this moves to an admin backend, this file becomes the payload shape —
 * keep it plain data.
 */

import { CARCASS_OPTIONS, SHEET_SQFT, SHUTTER_OPTIONS } from "../catalogue.ts";

/** Where a number came from. Surfaced to the customer, not just to us. */
export type RateSource = "catalogue" | "assumption";

/** ₹ per sq ft from a catalogue product's ₹-per-sheet rate. */
function fromCatalogue(list: { id: string; rate: number }[], id: string): number {
  const hit = list.find((o) => o.id === id);
  if (!hit) throw new Error(`estimator config: no catalogue product "${id}"`);
  return Math.round((hit.rate / SHEET_SQFT) * 10) / 10;
}

// --------------------------------------------------------------- geometry ---

export const GEOMETRY = {
  /** A standard board: 4 ft × 8 ft. Used to convert board area to whole sheets. */
  sheetAreaSqft: 32,
  /**
   * How many sq ft of board a wardrobe carcass consumes per sq ft of front
   * elevation. Carcass ONLY — sides, top, bottom, back, partitions, shelves.
   * Shutters are a separate bucket and are NOT in this number.
   */
  carcassConsumptionMultiplier: 4,
  /**
   * Shutter face area as a fraction of elevation area. 1.0 = the shutters
   * cover the full elevation. Kept configurable so a part-open wardrobe or a
   * loft band can be modelled later.
   */
  shutterAreaMultiplier: 1.0,
  /**
   * Carcass laminate: sheets of laminate needed per carcass board sheet.
   * 1 = one laminate sheet set (internal + external face) per board sheet.
   * This is the lever to pull when the laminate maths is refined later.
   */
  laminateConsumptionMultiplier: 1,
} as const;

// -------------------------------------------------------- carcass options ---

export interface CarcassMaterial {
  id: string;
  label: string;
  /** ₹ per sq ft of purchased board. */
  ratePerSqft: number;
  source: RateSource;
  /** The catalogue product this rate came from, when source is "catalogue". */
  catalogueId?: string;
  /** Where the customer can go and read about the actual product. */
  catalogueHref: string;
  /**
   * True for boards that ship already decorated. The carcass-finish bucket is
   * then skipped entirely and the UI says so — never a silent ₹0.
   */
  prelaminated: boolean;

  // --- what a customer needs in order to choose, not marketing ---
  /** One line, no jargon. */
  plain: string;
  /** 1–5. Relative within this list only; not an absolute industry rating. */
  moisture: number;
  durability: number;
  /** How many finishes this board will take. */
  finishFlex: number;
  bestFor: string;
  /** The honest caveat. Every board has one. */
  watchFor: string;
}

/**
 * Ordered cheapest to dearest. That order is the product: a customer scans it
 * as a ladder and stops where their budget stops.
 */
export const CARCASS_MATERIALS: CarcassMaterial[] = [
  {
    id: "prelam-pb",
    label: "Prelaminated Particle Board",
    ratePerSqft: fromCatalogue(CARCASS_OPTIONS, "particle"),
    source: "catalogue",
    catalogueId: "particle",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: true,
    plain: "Chipboard that arrives with its decorative surface already on it.",
    moisture: 1,
    durability: 2,
    finishFlex: 1,
    bestFor: "Economical factory-made furniture in dry rooms.",
    watchFor: "Standing water will swell it. Keep it out of kitchens and bathrooms.",
  },
  {
    id: "mdf",
    label: "MDF",
    ratePerSqft: fromCatalogue(CARCASS_OPTIONS, "mdf"),
    source: "catalogue",
    catalogueId: "mdf",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: false,
    plain: "Dense engineered board with a very flat, smooth face.",
    moisture: 2,
    durability: 3,
    finishFlex: 5,
    bestFor: "Shutters and anywhere a perfectly flat painted or laminated face matters.",
    watchFor: "Holds screws less well than plywood. Not for wet areas.",
  },
  {
    id: "prelam-mdf",
    label: "Prelaminated MDF",
    ratePerSqft: 62,
    source: "assumption",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: true,
    plain: "MDF that arrives already finished, so no separate laminate is needed.",
    moisture: 2,
    durability: 3,
    finishFlex: 1,
    bestFor: "Clean factory-made carcasses where the inside finish is decided up front.",
    watchFor: "The finish is fixed at the factory — you cannot change it later.",
  },
  {
    id: "mr-ply",
    label: "MR / Commercial Plywood",
    ratePerSqft: fromCatalogue(CARCASS_OPTIONS, "commercial-ply"),
    source: "catalogue",
    catalogueId: "commercial-ply",
    catalogueHref: "/products/plywood",
    prelaminated: false,
    plain: "Standard interior-grade plywood. Moisture-resistant, not waterproof.",
    moisture: 2,
    durability: 3,
    finishFlex: 4,
    bestFor: "Bedroom wardrobes and dry storage where budget matters.",
    watchFor: "The glue is not rated for prolonged damp. Avoid sink and bathroom runs.",
  },
  {
    id: "hdhmr",
    label: "HDHMR",
    ratePerSqft: fromCatalogue(CARCASS_OPTIONS, "hdhmr"),
    source: "catalogue",
    catalogueId: "hdhmr",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: false,
    plain: "High-density board built to resist moisture better than ordinary MDF.",
    moisture: 4,
    durability: 4,
    finishFlex: 5,
    bestFor: "Kitchens and anywhere you want a machined edge and a flat face together.",
    watchFor: "Heavier than plywood, so long unsupported shelves need care.",
  },
  {
    id: "bwr-ply",
    label: "BWR Plywood",
    ratePerSqft: 80,
    source: "assumption",
    catalogueHref: "/products/plywood",
    prelaminated: false,
    plain: "Boiling-water-resistant plywood — the common step up for furniture meant to last.",
    moisture: 4,
    durability: 4,
    finishFlex: 4,
    bestFor: "Long-life wardrobes and general cabinetry.",
    watchFor: "Grade and brand vary a lot at this level. The certification matters.",
  },
  {
    id: "bwp-ply",
    label: "BWP Plywood",
    ratePerSqft: fromCatalogue(CARCASS_OPTIONS, "bwp-ply"),
    source: "catalogue",
    catalogueId: "bwp-ply",
    catalogueHref: "/products/plywood",
    prelaminated: false,
    plain: "Boiling-waterPROOF plywood. The most water-tolerant board in normal use.",
    moisture: 5,
    durability: 5,
    finishFlex: 4,
    bestFor: "Kitchen base units, bathroom vanities, anything near water.",
    watchFor: "You are paying for the bonding. In a dry bedroom it is often more than you need.",
  },
  {
    id: "fr-ply",
    label: "FR Plywood",
    ratePerSqft: 105,
    source: "assumption",
    catalogueHref: "/products/plywood",
    prelaminated: false,
    plain: "Fire-retardant plywood — slows flame spread rather than stopping it.",
    moisture: 4,
    durability: 5,
    finishFlex: 4,
    bestFor: "Offices, retail and commercial fit-outs where the brief requires it.",
    watchFor: "Usually specified because a regulation asks for it, not for daily performance.",
  },
];

// -------------------------------------------------- carcass finish (V1) ---

/**
 * V1 carcass finish is laminate only, priced per laminate sheet.
 *
 * carcassFinishCost = carcassSheets
 *                   × laminateConsumptionMultiplier
 *                   × (internalLaminateRatePerSheet + externalLaminateRatePerSheet)
 *
 * The two rates are stored separately (not pre-summed) so each can be edited
 * on its own and the arithmetic is always done from the live values.
 */
export const CARCASS_FINISH = {
  /** Balancing / liner laminate on the hidden faces, ₹ per sheet. */
  internalLaminateRatePerSheet: 500,
  /** Decorative laminate on the visible faces, ₹ per sheet. */
  externalLaminateRatePerSheet: 1300,
} as const;

// ------------------------------------------------------- shutter systems ---

export type ShutterSystemId = "board" | "aluminium-glass";

export interface ShutterSystem {
  id: ShutterSystemId;
  label: string;
  sub: string;
}

export const SHUTTER_SYSTEMS: ShutterSystem[] = [
  { id: "board", label: "Board shutter", sub: "A board core with a decorative finish." },
  { id: "aluminium-glass", label: "Aluminium + glass", sub: "A metal profile frame around a glass panel." },
];

// --- board shutters: rate = core + finish + fabrication, all ₹/sq ft ---

export interface ShutterCore {
  id: string;
  label: string;
  /** ₹ per sq ft of shutter face. */
  ratePerSqft: number;
  source: RateSource;
  catalogueId?: string;
  catalogueHref: string;
  /** Prelam cores default the finish to "none" but can still take one later. */
  prelaminated: boolean;
  plain: string;
}

export const SHUTTER_CORES: ShutterCore[] = [
  {
    id: "prelam-pb",
    label: "Prelaminated Particle Board",
    ratePerSqft: fromCatalogue(SHUTTER_OPTIONS, "particle"),
    source: "catalogue",
    catalogueId: "particle",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: true,
    plain: "Cheapest front. Arrives finished, so nothing else is applied to it.",
  },
  {
    id: "mdf",
    label: "MDF",
    ratePerSqft: fromCatalogue(SHUTTER_OPTIONS, "mdf"),
    source: "catalogue",
    catalogueId: "mdf",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: false,
    plain: "The flattest face of the lot. What most painted and acrylic fronts start as.",
  },
  {
    id: "prelam-mdf",
    label: "Prelaminated MDF",
    ratePerSqft: 66,
    source: "assumption",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: true,
    plain: "MDF with the finish already on it. No separate finishing step.",
  },
  {
    id: "blockboard",
    label: "Blockboard",
    ratePerSqft: 78,
    source: "assumption",
    catalogueHref: "/products/blockboards",
    prelaminated: false,
    plain: "Timber battens between veneers. Light and stiff over a long span.",
  },
  {
    id: "hdhmr",
    label: "HDHMR",
    ratePerSqft: fromCatalogue(SHUTTER_OPTIONS, "hdhmr"),
    source: "catalogue",
    catalogueId: "hdhmr",
    catalogueHref: "/products/mdf-and-hdhmr",
    prelaminated: false,
    plain: "Handles damp better than MDF and machines just as cleanly.",
  },
  {
    id: "plywood",
    label: "Plywood",
    ratePerSqft: fromCatalogue(SHUTTER_OPTIONS, "ply"),
    source: "catalogue",
    catalogueId: "ply",
    catalogueHref: "/products/plywood",
    prelaminated: false,
    plain: "Strongest screw hold. The usual choice where a shutter is heavy or tall.",
  },
];

export interface ShutterFinish {
  id: string;
  label: string;
  ratePerSqft: number;
  /** The "no additional finish" row — only valid on a prelaminated core. */
  isPrelam?: boolean;
}

export const SHUTTER_FINISHES: ShutterFinish[] = [
  { id: "laminate", label: "Laminate", ratePerSqft: 100 },
  { id: "acrylic", label: "Acrylic", ratePerSqft: 260 },
  { id: "pu", label: "PU paint", ratePerSqft: 320 },
  { id: "veneer", label: "Veneer", ratePerSqft: 300 },
  { id: "membrane", label: "Membrane", ratePerSqft: 140 },
  { id: "prelam", label: "Prelaminated / none", ratePerSqft: 0, isPrelam: true },
];

/** Edge-banding, pressing and hanging of a board shutter, ₹ per sq ft. */
export const SHUTTER_FABRICATION_RATE_PER_SQFT = 50;

// --- aluminium + glass: rate = profile + glass + fabrication, all ₹/sq ft ---

export interface AluProfile {
  id: string;
  label: string;
  ratePerSqft: number;
}

export const ALU_PROFILES: AluProfile[] = [
  { id: "natural", label: "Natural aluminium", ratePerSqft: 240 },
  { id: "black", label: "Black", ratePerSqft: 280 },
  { id: "champagne", label: "Champagne", ratePerSqft: 300 },
  { id: "premium", label: "Premium / other", ratePerSqft: 360 },
];

export interface GlassType {
  id: string;
  label: string;
  ratePerSqft: number;
}

export const GLASS_TYPES: GlassType[] = [
  { id: "clear", label: "Clear", ratePerSqft: 90 },
  { id: "tinted", label: "Tinted", ratePerSqft: 120 },
  { id: "frosted", label: "Frosted", ratePerSqft: 130 },
  { id: "fluted", label: "Fluted", ratePerSqft: 220 },
  { id: "back-painted", label: "Back painted", ratePerSqft: 180 },
];

/** Cutting, glazing and assembly of an aluminium + glass shutter, ₹ per sq ft. */
export const ALU_GLASS_FABRICATION_RATE_PER_SQFT = 120;

// ------------------------------------------------------------- hardware ---

export interface HardwarePackage {
  id: string;
  label: string;
  /** ₹ per sq ft of elevation. */
  ratePerSqft: number;
  note: string;
}

export const HARDWARE_PACKAGES: HardwarePackage[] = [
  { id: "basic", label: "Basic", ratePerSqft: 80, note: "Standard hinges and channels. No soft-close." },
  { id: "standard", label: "Standard", ratePerSqft: 120, note: "Soft-close hinges and drawer runners." },
  { id: "premium", label: "Premium", ratePerSqft: 190, note: "Premium hardware systems, tandem boxes, lift-ups." },
];

// ---------------------------------------------------- labour by method ---

export type BuildMethodId = "carpenter" | "factory";

export interface BuildMethod {
  id: BuildMethodId;
  label: string;
  sub: string;
  /** Fabrication + install labour, ₹ per sq ft of elevation. */
  labourRatePerSqft: number;
}

/**
 * ⚠️ BOTH RATES ARE IDENTICAL ON PURPOSE.
 *
 * We have no quotations yet, and inventing a difference between site carpentry
 * and factory work would be fabricating the exact number a customer would most
 * reasonably ask us to justify. Until three real quotations exist for each, the
 * build-method choice is a genuine product decision (lead time, site
 * disruption, edge-banding quality) that happens not to move the price — and
 * the UI says so rather than implying otherwise.
 *
 * See docs/STUDIO-PRICING-VALIDATION.md §7.
 */
export const BUILD_METHODS: BuildMethod[] = [
  { id: "carpenter", label: "Carpenter", sub: "Made at your site", labourRatePerSqft: 600 },
  { id: "factory", label: "Factory", sub: "Machined, then fitted", labourRatePerSqft: 600 },
];

// -------------------------------------------------- misc + margin (V1) ---

/**
 * V1 keeps these as flat ₹/sq ft of elevation. They are the last two buckets
 * in the total and are the easiest levers to move a quote up or down without
 * touching material assumptions.
 */
export const OVERHEADS = {
  miscellaneousRatePerSqft: 50,
  marginRatePerSqft: 100,
} as const;

// --------------------------------------------------- dimension defaults ---

export const DIMENSIONS = {
  defaultWidthFt: 8,
  defaultHeightFt: 8,
  defaultDepthFt: 2,
  widthRangeFt: [3, 20] as [number, number],
  heightRangeFt: [6, 10] as [number, number],
  depthRangeFt: [1.5, 3] as [number, number],
} as const;
