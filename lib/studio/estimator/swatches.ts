/**
 * Board colours for the estimator's boards.
 *
 * The catalogue already carries a swatch per board, and the 3D scene reads it
 * (see lib/studio/appearance.ts). This file exists because the estimator knows
 * about eight boards and the catalogue currently lists five — so the mapping
 * cannot be a straight lookup, and pretending it is would silently paint three
 * boards the wrong colour.
 *
 * Boards WITH a catalogue equivalent read their colour from it, so a re-tuned
 * shade moves everywhere at once. The three without are declared here, and
 * should be deleted from this file the day those products are catalogued.
 */

import { CARCASS_OPTIONS } from "../catalogue.ts";

export interface Swatch {
  from: string;
  to: string;
}

/** Estimator board id → catalogue carcass id, where one exists. */
const CATALOGUE_ID: Record<string, string> = {
  "prelam-pb": "particle",
  mdf: "mdf",
  hdhmr: "hdhmr",
  "mr-ply": "commercial-ply",
  "bwp-ply": "bwp-ply",
};

/** Boards the catalogue does not stock a page for yet. */
const UNCATALOGUED: Record<string, Swatch> = {
  "prelam-mdf": { from: "#c2a079", to: "#987954" },
  "bwr-ply": { from: "#cfa267", to: "#9c7440" },
  "fr-ply": { from: "#b8905e", to: "#8a6a3e" },
};

const NEUTRAL: Swatch = { from: "#c9b79c", to: "#9d8b71" };

export function boardSwatch(estimatorMaterialId: string): Swatch {
  const catalogueId = CATALOGUE_ID[estimatorMaterialId];
  if (catalogueId) {
    const hit = CARCASS_OPTIONS.find((o) => o.id === catalogueId);
    if (hit) return { from: hit.swatch, to: hit.swatchTo ?? hit.swatch };
  }
  return UNCATALOGUED[estimatorMaterialId] ?? NEUTRAL;
}

/**
 * Shutter cores share the carcass board vocabulary except for "plywood",
 * which the shutter list spells differently from the carcass list.
 */
export function shutterSwatch(shutterCoreId: string): Swatch {
  if (shutterCoreId === "plywood") return boardSwatch("bwr-ply");
  return boardSwatch(shutterCoreId);
}
