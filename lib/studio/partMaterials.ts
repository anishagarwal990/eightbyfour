/**
 * What each part of the furniture is actually made of.
 *
 * The whole argument of Studio EightxFour is that the material does not
 * disappear inside the quotation. The exploded view is where that argument is
 * hardest to dodge: a panel floating on its own has to be able to say "this one
 * is 19 mm Century BWP Plywood, and here is the catalogue page for it".
 *
 * Resolved from the same catalogue records the quote prices and the swatches
 * are drawn from, so a callout cannot name a material the estimate did not
 * charge for.
 */

import {
  CARCASS_OPTIONS,
  FINISH_OPTIONS,
  HARDWARE_TIERS,
  INTERNAL_FINISH_OPTIONS,
  SHUTTER_OPTIONS,
} from "./catalogue";
import type { Panel, SurfaceGroup } from "./geometry";

export interface PartMaterial {
  /** "Carcass", "Shutters" — the part of the build, not the panel. */
  role: string;
  /** "BWP Plywood" */
  material: string;
  brand: string;
  /** "19 mm boiling-water-proof" */
  spec: string;
  /** Second line, where a face material sits on top of a board. */
  facing?: string;
  /** Why this material is here, one line a homeowner can read. */
  why: string;
  swatch: string;
  swatchTo?: string;
  catalogue?: string;
  /** Indicative rate, shown with its unit. */
  rate?: { amount: number; unit: string };
}

export interface SpecIds {
  carcassId: string;
  shutterId: string;
  finishId: string;
  internalId: string;
  hardwareId: string;
}

function pick<T extends { id: string }>(list: T[], id: string): T {
  return list.find((o) => o.id === id) ?? list[0];
}

/**
 * The material behind one surface group.
 *
 * Carcass and internal are the same board — they differ in what is on the face
 * of it, which is exactly the distinction a customer is trying to understand
 * when they click a panel.
 */
export function materialForSurface(spec: SpecIds, surface: SurfaceGroup): PartMaterial {
  const carcass = pick(CARCASS_OPTIONS, spec.carcassId);
  const shutter = pick(SHUTTER_OPTIONS, spec.shutterId);
  const finish = pick(FINISH_OPTIONS, spec.finishId);
  const internal = pick(INTERNAL_FINISH_OPTIONS, spec.internalId);
  const hardware = pick(HARDWARE_TIERS, spec.hardwareId);

  if (surface === "shutter") {
    return {
      role: "Shutters",
      material: shutter.label,
      brand: shutter.brand,
      spec: shutter.spec,
      facing: `${finish.brand} ${finish.label}`,
      why: finish.note,
      swatch: finish.swatch,
      swatchTo: finish.swatchTo,
      catalogue: finish.catalogue ?? shutter.catalogue,
      rate: { amount: shutter.rate, unit: "per 8×4 sheet" },
    };
  }

  if (surface === "internal") {
    return {
      role: "Interiors",
      material: carcass.label,
      brand: carcass.brand,
      spec: carcass.spec,
      facing: internal.id === "matching" ? `${finish.brand} ${finish.label}` : internal.label,
      why: internal.note,
      swatch: internal.id === "matching" ? finish.swatch : internal.swatch,
      swatchTo: internal.id === "matching" ? finish.swatchTo : internal.swatchTo,
      catalogue: carcass.catalogue,
      rate: { amount: carcass.rate, unit: "per 8×4 sheet" },
    };
  }

  if (surface === "hardware") {
    return {
      role: "Hardware",
      material: `${hardware.label} hardware`,
      brand: hardware.brand,
      spec: hardware.components.map((c) => c.label).slice(0, 2).join(", "),
      why: hardware.note,
      swatch: "#9aa0a6",
      swatchTo: "#6f757b",
      catalogue: "/products/hardware",
      rate: { amount: hardware.hingeRate, unit: "per hinge" },
    };
  }

  return {
    role: "Carcass",
    material: carcass.label,
    brand: carcass.brand,
    spec: carcass.spec,
    why: carcass.note,
    swatch: carcass.swatch,
    swatchTo: carcass.swatchTo,
    catalogue: carcass.catalogue,
    rate: { amount: carcass.rate, unit: "per 8×4 sheet" },
  };
}

/**
 * Where to hang a material callout.
 *
 * One pin per material, not one per panel: fifteen dots on a wardrobe is noise,
 * and the question being answered is "what is this made of", which has four
 * answers. Each pin anchors to a representative panel that a viewer would
 * naturally point at for that material.
 */
export interface Hotspot {
  id: string;
  surface: SurfaceGroup;
  /** Anchor in model millimetres. */
  at: [number, number, number];
  material: PartMaterial;
}

type PanelRoleName = Panel["role"];

const ANCHOR_PRIORITY: Record<SurfaceGroup, PanelRoleName[]> = {
  carcass: ["side", "top", "partition", "bottom"],
  shutter: ["shutter", "loft-shutter"],
  internal: ["shelf", "back", "drawer"],
  hardware: ["rail", "accessory"],
};

export function buildHotspots(panels: Panel[], spec: SpecIds): Hotspot[] {
  const out: Hotspot[] = [];

  for (const surface of ["carcass", "shutter", "internal", "hardware"] as SurfaceGroup[]) {
    const priority = ANCHOR_PRIORITY[surface];
    let anchor: Panel | undefined;
    for (const role of priority) {
      // Prefer a panel near the middle of the group so the pin does not land on
      // the piece that flies furthest in the exploded view.
      const matches = panels.filter((p) => p.role === role);
      if (matches.length > 0) {
        anchor = matches[Math.floor(matches.length / 2)];
        break;
      }
    }
    if (!anchor) continue;

    // Sit the pin slightly proud of the panel's front face, so it reads as
    // attached to the piece rather than buried inside it.
    out.push({
      id: `hotspot-${surface}`,
      surface,
      at: [anchor.center[0], anchor.center[1], anchor.center[2] + anchor.size[2] / 2 + 12],
      material: materialForSurface(spec, surface),
    });
  }

  return out;
}
