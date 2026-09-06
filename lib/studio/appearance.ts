/**
 * How a specification looks in 3D.
 *
 * Base colours are read from the catalogue swatch each option already carries,
 * rather than kept in a second table here. That is deliberate: the swatch chip
 * on the option card and the surface in the 3D scene are then the same value,
 * and cannot drift apart when a shade is re-tuned.
 *
 * What this file adds on top is the part a hex colour cannot express — how the
 * light behaves. Acrylic gloss and a matt laminate can be the same colour and
 * still be obviously different materials, and that difference is the whole
 * reason someone pays for one over the other.
 */

import { CARCASS_OPTIONS, FINISH_OPTIONS, INTERNAL_FINISH_OPTIONS, SHUTTER_OPTIONS } from "./catalogue";
import type { SurfaceGroup } from "./geometry";

export interface SurfaceAppearance {
  color: string;
  roughness: number;
  metalness: number;
  /** Strength of the procedural woodgrain, 0 = none. */
  grain: number;
  /** Reflective clear coat, as on acrylic and PU. */
  clearcoat: number;
  /**
   * Where a real catalogue texture will be loaded from once shade-level images
   * exist. Nothing reads it yet — it is here so that adding textures later is a
   * data change, not a rewrite of the material code.
   */
  textureUrl?: string;
}

const FALLBACK: SurfaceAppearance = { color: "#c9b79c", roughness: 0.72, metalness: 0, grain: 0.25, clearcoat: 0 };

/** Finish-specific light behaviour, keyed by the catalogue finish id. */
const FINISH_LOOK: Record<string, Pick<SurfaceAppearance, "roughness" | "metalness" | "grain" | "clearcoat">> = {
  "lam-08": { roughness: 0.78, metalness: 0, grain: 0.1, clearcoat: 0 },
  "lam-1": { roughness: 0.7, metalness: 0, grain: 0.14, clearcoat: 0.05 },
  "lam-woodgrain": { roughness: 0.66, metalness: 0, grain: 0.85, clearcoat: 0.05 },
  "lam-gloss": { roughness: 0.16, metalness: 0.04, grain: 0, clearcoat: 0.5 },
  "acrylic-gloss": { roughness: 0.05, metalness: 0.06, grain: 0, clearcoat: 1 },
  "acrylic-matt": { roughness: 0.62, metalness: 0.02, grain: 0, clearcoat: 0.12 },
  veneer: { roughness: 0.52, metalness: 0, grain: 1, clearcoat: 0.22 },
  pu: { roughness: 0.3, metalness: 0, grain: 0, clearcoat: 0.45 },
};

function find(list: { id: string; swatch: string; swatchTo?: string }[], id: string) {
  return list.find((o) => o.id === id) ?? list[0];
}

/**
 * The look of every surface group for one specification.
 *
 * Carcass and internal surfaces are driven by the internal finish rather than
 * by the board, because that is what is actually visible once the wardrobe is
 * lined — a BWP ply carcass finished in white laminate looks white inside, and
 * showing raw ply there would misrepresent the specification the customer
 * chose. The board colour still shows on the exploded view, where the panel is
 * genuinely the board.
 */
export function appearanceFor(config: {
  carcassId: string;
  shutterId: string;
  finishId: string;
  internalId: string;
}): Record<SurfaceGroup, SurfaceAppearance> {
  const finish = find(FINISH_OPTIONS, config.finishId);
  const internal = find(INTERNAL_FINISH_OPTIONS, config.internalId);
  const look = FINISH_LOOK[finish.id] ?? { roughness: 0.7, metalness: 0, grain: 0.2, clearcoat: 0 };

  return {
    // The external finish is what the shutter is faced in, not the board under it.
    shutter: { color: finish.swatch, ...look },
    // Exposed carcass edges carry the same external finish; the visible inner
    // faces carry the internal finish.
    carcass: {
      color: internal.id === "matching" ? finish.swatch : internal.swatch,
      roughness: internal.id === "matching" ? look.roughness : 0.8,
      metalness: 0,
      grain: internal.id === "matching" ? look.grain : internal.id === "decorative" ? 0.5 : 0.08,
      clearcoat: 0,
    },
    internal: {
      color: internal.id === "matching" ? finish.swatch : internal.swatch,
      roughness: 0.84,
      metalness: 0,
      grain: internal.id === "decorative" ? 0.5 : 0.06,
      clearcoat: 0,
    },
    hardware: { color: "#8d9299", roughness: 0.34, metalness: 0.85, grain: 0, clearcoat: 0.2 },
  };
}

/** Board colour, for the exploded view where the panel is the raw board. */
export function boardAppearance(carcassId: string, shutterId: string): { carcass: string; shutter: string } {
  return {
    carcass: find(CARCASS_OPTIONS, carcassId).swatch,
    shutter: find(SHUTTER_OPTIONS, shutterId).swatch,
  };
}

export { FALLBACK as FALLBACK_APPEARANCE };
