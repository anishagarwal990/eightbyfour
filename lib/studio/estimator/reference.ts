/**
 * The reference wardrobe.
 *
 * Five surfaces quote a wardrobe: the hero, the material explorer, the price
 * DNA section, the quick estimator and the visual designer. Until now each
 * held its own default, which is how a page ends up showing two prices for
 * the same furniture without anyone writing a bug.
 *
 * This is that wardrobe, once. A screen may of course diverge from it — that
 * is what the controls are for — but every screen STARTS here, so a visitor
 * scrolling the landing page and then opening the product page sees the same
 * number for the same thing.
 *
 * 8′ × 8′ × 2′ is the common Hyderabad bedroom wardrobe; the specification is
 * the middle of our own ladder rather than the cheapest thing we can show.
 */

import { DIMENSIONS } from "./config.ts";
import type { WardrobeEstimateInput } from "./types.ts";

export const REFERENCE_WARDROBE: WardrobeEstimateInput = {
  widthFt: DIMENSIONS.defaultWidthFt,
  heightFt: DIMENSIONS.defaultHeightFt,
  depthFt: DIMENSIONS.defaultDepthFt,
  buildMethod: "factory",
  carcassMaterialId: "bwr-ply",
  carcassFinishId: "laminate",
  shutterSystem: "board",
  shutterCoreId: "hdhmr",
  shutterFinishId: "laminate",
  aluProfileId: "natural",
  glassTypeId: "clear",
  hardwarePackageId: "standard",
};
