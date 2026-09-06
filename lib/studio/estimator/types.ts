/**
 * Wardrobe estimator — input and result types.
 *
 * The input is the full set of possible selections. Fields that do not apply
 * to the current selection (a shutter core when the system is aluminium, a
 * carcass finish when the board is prelaminated) are simply ignored by the
 * engine — see engine.ts, which reads only what the active branch needs. The
 * UI is still responsible for not SHOWING stale controls, but a stale value
 * left in the input can never reach the total.
 */

import type { BuildMethodId, ShutterSystemId } from "./config";

export interface WardrobeEstimateInput {
  widthFt: number;
  heightFt: number;
  /** Kept because it matters to the product; V1 does not price against it. */
  depthFt: number;

  buildMethod: BuildMethodId;

  carcassMaterialId: string;
  /** Ignored when the carcass material is prelaminated. */
  carcassFinishId: string;

  shutterSystem: ShutterSystemId;

  /** Board-shutter branch. Ignored when shutterSystem !== "board". */
  shutterCoreId: string;
  shutterFinishId: string;

  /** Aluminium + glass branch. Ignored when shutterSystem !== "aluminium-glass". */
  aluProfileId: string;
  glassTypeId: string;

  hardwarePackageId: string;
}

/** One line in the transparent breakdown. */
export interface EstimateBucket {
  /** Stable key, e.g. "carcassCore". */
  key: string;
  /** What the customer reads, e.g. "BWR Plywood carcass". */
  label: string;
  /** ₹ per sq ft of elevation this bucket contributes. */
  ratePerSqft: number;
  /** ₹ total this bucket contributes. */
  total: number;
  /** Sub-line shown under the label in the breakdown, when useful. */
  detail?: string;
}

export interface WardrobeEstimate {
  elevationAreaSqft: number;
  depthFt: number;

  carcass: {
    /** Board area consumed, sq ft. */
    materialAreaSqft: number;
    /** Whole sheets purchased. */
    sheets: number;
    /** ₹ per sq ft of purchased board. */
    boardRatePerSqft: number;
    /** ₹ per sq ft of elevation. */
    ratePerSqft: number;
    total: number;
  };

  carcassFinish: {
    ratePerSqft: number;
    total: number;
    /** True when the carcass board was prelaminated and no finish was priced. */
    includedBecausePrelaminated: boolean;
  };

  shutters: {
    system: ShutterSystemId;
    /** Shutter face area, sq ft. */
    areaSqft: number;
    /** ₹ per sq ft of shutter face. */
    ratePerSqft: number;
    /** The composed rate, itemised — core/finish/fab or profile/glass/fab. */
    components: { label: string; ratePerSqft: number }[];
    total: number;
  };

  hardware: { ratePerSqft: number; total: number };
  labour: { ratePerSqft: number; total: number };
  miscellaneous: { ratePerSqft: number; total: number };
  margin: { ratePerSqft: number; total: number };

  /** Every bucket, in display order. Headline total === sum of these totals. */
  buckets: EstimateBucket[];

  /** ₹ per sq ft of elevation, all buckets. */
  finalRatePerSqft: number;
  /** ₹, all buckets. Exactly the sum of bucket totals. */
  finalTotal: number;
}
