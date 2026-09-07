/**
 * One price for one specification, wherever it is shown.
 *
 * Studio has three screens that price a wardrobe from catalogue ids — the hero
 * configurator on /studio, the spec/price demo below it, and the visual
 * designer. They must never disagree; a customer who sees ₹1,09,125 in the
 * hero and ₹1,05,523 on the product page has learned that neither number is
 * real. This is the single entry point they all call.
 *
 * WHY IT IS NOT UNCONDITIONAL: the commercial seven-bucket model is a WARDROBE
 * model. Elevation area × rate is the right shape for a box of shutters on a
 * wall; it is not the right shape for a kitchen, which has base and wall runs,
 * a countertop, appliances and a plumbing wall, and which has its own engine.
 * Forcing every furniture type through the wardrobe model to make the code
 * tidy would make the kitchen number wrong — so anything that is not a
 * wardrobe stays on the general per-sheet estimator, which is what its own
 * product page uses. Each type is internally consistent, which is the property
 * that actually matters.
 */

import { priceFurniture, type FurnitureConfig } from "../furniture.ts";
import { toEstimateInput, type CatalogueSpec } from "./adapter.ts";
import { estimateWardrobe } from "./engine.ts";

export interface QuickPrice {
  total: number;
  ratePerSqft: number;
  /** Which model produced this, so a caller can say so if it needs to. */
  engine: "wardrobe" | "general";
}

/** Furniture types that the commercial wardrobe model is the right shape for. */
const WARDROBE_ENGINE_TYPES = new Set(["wardrobe"]);

export function usesWardrobeEngine(typeId: string): boolean {
  return WARDROBE_ENGINE_TYPES.has(typeId);
}

export function toCatalogueSpec(config: FurnitureConfig): CatalogueSpec {
  return {
    widthFt: config.width,
    heightFt: config.height,
    depthFt: config.depth,
    method: config.method,
    carcassId: config.carcassId,
    shutterId: config.shutterId,
    finishId: config.finishId,
    hardwareId: config.hardwareId,
  };
}

export function quickPrice(config: FurnitureConfig): QuickPrice {
  if (usesWardrobeEngine(config.typeId)) {
    const e = estimateWardrobe(toEstimateInput(toCatalogueSpec(config)));
    return { total: e.finalTotal, ratePerSqft: e.finalRatePerSqft, engine: "wardrobe" };
  }
  const q = priceFurniture(config);
  return { total: q.total, ratePerSqft: q.rate?.amount ?? 0, engine: "general" };
}
