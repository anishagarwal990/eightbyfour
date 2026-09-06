/**
 * Wardrobe estimator — V1 pricing configuration.
 *
 * This is the ONLY place rupee assumptions live. Nothing in the engine or the
 * UI hardcodes a rate; every number a quote is built from is here, so a quote
 * can always be traced back to one edited row.
 *
 * ⚠️  EVERY VALUE BELOW IS AN EDITABLE V1 ASSUMPTION, not a confirmed
 *     commercial rate. They are the worked-example figures from the estimator
 *     brief. Replace them with real numbers before this drives anything
 *     customer-facing. When this eventually comes from an admin backend, this
 *     file becomes the shape of that payload — keep it a plain data object.
 *
 * Units:
 *   - board / laminate "ratePerSqft" and "ratePerSheet" are ₹.
 *   - all "*RatePerSqft" that feed the final buckets are ₹ per sq ft of
 *     ELEVATION area (width × height), except shutter rates which are ₹ per
 *     sq ft of SHUTTER area (elevation × shutterAreaMultiplier).
 */

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
  /**
   * True for boards that ship already decorated (prelam MDF, prelam particle
   * board). When true the carcass-finish bucket is skipped entirely and the
   * UI says so — it is never a silent ₹0 laminate line.
   */
  prelaminated: boolean;
  /** One line a homeowner can read. */
  note: string;
}

export const CARCASS_MATERIALS: CarcassMaterial[] = [
  { id: "mdf", label: "MDF", ratePerSqft: 55, prelaminated: false, note: "Smooth and flat. Dry areas only." },
  { id: "hdhmr", label: "HDHMR", ratePerSqft: 70, prelaminated: false, note: "Denser, moisture-resistant. Holds screws well." },
  { id: "mr-ply", label: "MR / Commercial Ply", ratePerSqft: 65, prelaminated: false, note: "Standard interior grade for bedrooms and dry storage." },
  { id: "bwr-ply", label: "BWR Plywood", ratePerSqft: 80, prelaminated: false, note: "Boiling-water-resistant bonding. The usual wardrobe default." },
  { id: "bwp-ply", label: "BWP Plywood", ratePerSqft: 95, prelaminated: false, note: "Boiling-water-proof. Worth it in kitchens and bathrooms." },
  { id: "fr-ply", label: "FR Plywood", ratePerSqft: 105, prelaminated: false, note: "Fire-retardant grade. Often required in commercial fit-outs." },
  { id: "prelam-mdf", label: "Prelaminated MDF", ratePerSqft: 62, prelaminated: true, note: "Ships pre-finished. No separate carcass laminate." },
  { id: "prelam-pb", label: "Prelaminated Particle Board", ratePerSqft: 42, prelaminated: true, note: "Lowest cost. Ships pre-finished. Dry areas only." },
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
  ratePerSqft: number;
  /** Prelam cores default the finish to "prelam" (₹0) but can still take one. */
  prelaminated: boolean;
}

export const SHUTTER_CORES: ShutterCore[] = [
  { id: "mdf", label: "MDF", ratePerSqft: 85, prelaminated: false },
  { id: "hdhmr", label: "HDHMR", ratePerSqft: 100, prelaminated: false },
  { id: "plywood", label: "Plywood", ratePerSqft: 110, prelaminated: false },
  { id: "blockboard", label: "Blockboard", ratePerSqft: 95, prelaminated: false },
  { id: "prelam-mdf", label: "Prelaminated MDF", ratePerSqft: 95, prelaminated: true },
  { id: "prelam-pb", label: "Prelaminated Particle Board", ratePerSqft: 70, prelaminated: true },
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

export const BUILD_METHODS: BuildMethod[] = [
  { id: "carpenter", label: "Carpenter", sub: "Made at site", labourRatePerSqft: 600 },
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
