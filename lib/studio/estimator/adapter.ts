/**
 * The bridge between the visual wardrobe designer and the one commercial model.
 *
 * WHY THIS EXISTS
 * The designer and the quick estimator used to price wardrobes with two
 * different engines, and the same 8′ × 8′ × 2′ wardrobe came out ₹1,06,560 in
 * one and ₹1,23,861 in the other. A customer who used both would have no
 * reason to believe either. There is now ONE commercial model — the seven
 * buckets in engine.ts — and this file maps the designer's geometry onto it.
 *
 * WHAT THE DESIGNER IS STILL ALLOWED TO CHANGE
 * The base spec (carcass, finish, shutters, hardware, labour, overheads) always
 * comes from the shared model. What the designer legitimately adds on top is
 * the fit-out the customer drew: extra drawers, hanging rails, a loft, and
 * accessories. Those are ADDITIONS with their own visible lines — never a
 * different way of pricing the same board.
 */

import { ACCESSORIES } from "../catalogue.ts";
import type { LayoutCounts } from "../geometry.ts";
import { CARCASS_MATERIALS, SHUTTER_CORES, SHUTTER_FINISHES } from "./config.ts";
import type { WardrobeEstimateInput } from "./types.ts";

/**
 * Catalogue option id → estimator material id.
 *
 * The catalogue and the estimator grew separate id sets. Rather than rename
 * across the whole shop, this table is the single place the two vocabularies
 * meet. An id with no entry falls back to the nearest sensible board, which is
 * always a real board rather than a crash.
 */
const CARCASS_FROM_CATALOGUE: Record<string, string> = {
  particle: "prelam-pb",
  mdf: "mdf",
  hdhmr: "hdhmr",
  "commercial-ply": "mr-ply",
  "bwp-ply": "bwp-ply",
};

const SHUTTER_CORE_FROM_CATALOGUE: Record<string, string> = {
  particle: "prelam-pb",
  mdf: "mdf",
  hdhmr: "hdhmr",
  ply: "plywood",
};

/**
 * Catalogue finish id → estimator shutter finish id.
 * The catalogue splits laminate by thickness and gloss; the commercial model
 * prices laminate as one step, so several ids collapse onto "laminate".
 */
const SHUTTER_FINISH_FROM_CATALOGUE: Record<string, string> = {
  "lam-08": "laminate",
  "lam-1": "laminate",
  "lam-woodgrain": "laminate",
  "lam-gloss": "laminate",
  "acrylic-gloss": "acrylic",
  "acrylic-matt": "acrylic",
  veneer: "veneer",
  pu: "pu",
};

const safe = (map: Record<string, string>, id: string, list: { id: string }[], fallback: string) => {
  const mapped = map[id];
  return mapped && list.some((o) => o.id === mapped) ? mapped : fallback;
};

/**
 * A specification written in catalogue vocabulary — everything the price needs
 * and nothing else.
 *
 * Kept separate from VisualWardrobeState because three screens now speak
 * catalogue ids (the hero configurator, the spec/price demo and the visual
 * designer) and only one of them has geometry to count. Requiring a layout
 * from the two that have none would be a lie in the type.
 */
export interface CatalogueSpec {
  widthFt: number;
  heightFt: number;
  depthFt: number;
  method: "carpenter" | "factory";
  /** Catalogue ids, as the material pickers produce them. */
  carcassId: string;
  shutterId: string;
  finishId: string;
  hardwareId: string;
}

/** What the designer drew, in the shape the visual configurator holds it. */
export interface VisualWardrobeState extends CatalogueSpec {
  accessoryIds: string[];
  /** Counted from the geometry — see lib/studio/geometry.ts. */
  counts: LayoutCounts;
}

/** One extra the fit-out adds, shown as its own line on the quote. */
export interface LayoutAddition {
  key: string;
  label: string;
  detail: string;
  total: number;
}

/**
 * Per-piece rates for the fit-out the customer drew.
 *
 * These sit here rather than in config.ts because they only apply to the
 * visual designer — the quick estimator has no per-shelf geometry. Same
 * provenance rule: assumptions until validated.
 */
export const FIT_OUT_RATES = {
  /** Cut, band and hang one shelf. */
  shelf: 165,
  /** One drawer box, runners and front. */
  drawer: 2400,
  /** Oval rail, end caps and a centre bracket. */
  rail: 1450,
  /** One vertical partition, cut and banded. */
  partition: 340,
  /** Loft band, ₹ per sq ft of loft elevation. */
  loftPerSqft: 620,
} as const;

/**
 * Map the designer's state onto the shared commercial model.
 *
 * Note what is deliberately NOT passed through: the catalogue's internal
 * finish and its per-sheet board rates. The commercial model owns those.
 */
export function toEstimateInput(state: CatalogueSpec): WardrobeEstimateInput {
  const carcassMaterialId = safe(CARCASS_FROM_CATALOGUE, state.carcassId, CARCASS_MATERIALS, "bwr-ply");
  const carcass = CARCASS_MATERIALS.find((m) => m.id === carcassMaterialId)!;
  const shutterCoreId = safe(SHUTTER_CORE_FROM_CATALOGUE, state.shutterId, SHUTTER_CORES, "hdhmr");
  const core = SHUTTER_CORES.find((c) => c.id === shutterCoreId)!;
  const mappedFinish = safe(SHUTTER_FINISH_FROM_CATALOGUE, state.finishId, SHUTTER_FINISHES, "laminate");

  return {
    widthFt: state.widthFt,
    heightFt: state.heightFt,
    depthFt: state.depthFt,
    buildMethod: state.method,
    carcassMaterialId,
    // Ignored by the engine when the board is prelaminated; passed anyway so
    // switching back to a plain board restores the finish without a re-pick.
    carcassFinishId: carcass.prelaminated ? "laminate" : "laminate",
    // The designer has no aluminium option yet, so the system is always board.
    shutterSystem: "board",
    shutterCoreId,
    shutterFinishId: core.prelaminated ? "prelam" : mappedFinish,
    aluProfileId: "natural",
    glassTypeId: "clear",
    hardwarePackageId: mapHardware(state.hardwareId),
  };
}

/**
 * Catalogue hardware tier → estimator package.
 *
 * Both vocabularies have three steps, and they collide on the word "premium":
 * the catalogue's tiers are essential / premium / luxury, the commercial
 * model's are basic / standard / premium. Catalogue "premium" is the MIDDLE
 * step and therefore maps to "standard", not to the model's top step. Written
 * out in full rather than inferred, because the obvious reading is wrong.
 */
const HARDWARE_FROM_CATALOGUE: Record<string, string> = {
  essential: "basic",
  premium: "standard",
  luxury: "premium",
};

function mapHardware(id: string): string {
  return HARDWARE_FROM_CATALOGUE[id] ?? "standard";
}

/**
 * The fit-out the customer drew, priced as additions to the base estimate.
 *
 * Partitions are excluded on purpose: compartment count is already implied by
 * the base carcass consumption multiplier, and charging for both would be the
 * double-count this whole rework exists to remove.
 */
export function layoutAdditions(state: VisualWardrobeState, elevationAreaSqft: number): LayoutAddition[] {
  const c = state.counts;
  const out: LayoutAddition[] = [];

  if (c.shelves > 0) {
    out.push({
      key: "shelves",
      label: "Shelves",
      detail: `${c.shelves} × ₹${FIT_OUT_RATES.shelf} — cut, edge-banded and fitted`,
      total: c.shelves * FIT_OUT_RATES.shelf,
    });
  }
  if (c.drawers > 0) {
    out.push({
      key: "drawers",
      label: "Drawers",
      detail: `${c.drawers} × ₹${FIT_OUT_RATES.drawer.toLocaleString("en-IN")} — box, runners and front`,
      total: c.drawers * FIT_OUT_RATES.drawer,
    });
  }
  if (c.rails > 0) {
    out.push({
      key: "rails",
      label: "Hanging rails",
      detail: `${c.rails} × ₹${FIT_OUT_RATES.rail.toLocaleString("en-IN")} — rail, caps and centre bracket`,
      total: c.rails * FIT_OUT_RATES.rail,
    });
  }
  if (c.loft) {
    const loftArea = Math.max(0, c.loftCarcassSqft);
    out.push({
      key: "loft",
      label: "Loft",
      detail: `${Math.round(loftArea)} sq ft of additional carcass and fronts`,
      total: Math.round(loftArea * FIT_OUT_RATES.loftPerSqft * 0.35),
    });
  }

  for (const id of state.accessoryIds) {
    const acc = ACCESSORIES.find((a) => a.id === id);
    // Drawers and the loft are geometry here, not checkbox accessories —
    // counting them again would be a double charge.
    if (!acc || id === "drawers" || id === "loft") continue;
    out.push({
      key: `accessory-${acc.id}`,
      label: acc.label,
      detail: `${acc.brand} · 1 ${acc.unit}`,
      total: acc.rate,
    });
  }

  void elevationAreaSqft;
  return out;
}
