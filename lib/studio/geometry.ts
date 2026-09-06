/**
 * Parametric furniture geometry.
 *
 * This is the single source of truth for what the furniture looks like. The 2D
 * elevation, the 3D scene, the exploded view and the layout-derived quote lines
 * all read the same panel list — so a shelf added in the editor cannot appear
 * in one view and not another, and cannot appear visually without also being
 * priced. Two renderers computing their own geometry from the same config is
 * exactly how those three things drift apart.
 *
 * Units are millimetres throughout. The origin is the centre of the back panel
 * at floor level: x runs left(−) to right(+), y up from the floor, z forward
 * from the back (0) to the front face (depth).
 */

import type { FurnitureArchetype, LayoutPresetSpec } from "./archetypes";

// ------------------------------------------------------------------ model ---

export type FittingKind = "shelf" | "drawer" | "rail" | "accessory";

export interface Fitting {
  id: string;
  kind: FittingKind;
  /** Height within the compartment, 0 (floor) to 1 (ceiling). Drawers ignore
   *  this — they stack from the compartment floor in list order. */
  at: number;
  /** Catalogue accessory id, when kind is "accessory". */
  accessoryId?: string;
}

export interface Section {
  id: string;
  /** Relative width. Normalised across the row, so weights are unitless. */
  weight: number;
  fittings: Fitting[];
}

export type DoorType = "hinged" | "sliding" | "open";

export interface FurnitureLayout {
  sections: Section[];
  loft: { enabled: boolean; heightMm: number };
  doors: { type: DoorType; count: number };
  /** Which preset the layout came from, for the "Suggested layout" label. */
  presetId: string;
}

export interface Dimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

// -------------------------------------------------------------- id source ---

let fittingSeq = 0;
export function newFittingId(): string {
  fittingSeq += 1;
  return `f${fittingSeq}`;
}
let sectionSeq = 0;
export function newSectionId(): string {
  sectionSeq += 1;
  return `s${sectionSeq}`;
}

// ---------------------------------------------------------------- presets ---

/** Build a layout from a preset, for a given compartment count. */
export function layoutFromPreset(
  preset: LayoutPresetSpec,
  sectionCount: number,
  archetype: FurnitureArchetype,
  previous?: FurnitureLayout
): FurnitureLayout {
  const sections: Section[] = [];
  for (let i = 0; i < sectionCount; i += 1) {
    const spec = preset.pattern[i % preset.pattern.length];
    const fittings: Fitting[] = [];
    if (archetype.fittings.includes("rail")) {
      for (let r = 0; r < spec.rails; r += 1) fittings.push({ id: newFittingId(), kind: "rail", at: 0.72 });
    }
    for (let d = 0; d < spec.drawers; d += 1) fittings.push({ id: newFittingId(), kind: "drawer", at: 0 });
    for (let s = 0; s < spec.shelves; s += 1) fittings.push({ id: newFittingId(), kind: "shelf", at: 0 });
    sections.push({ id: newSectionId(), weight: 1, fittings: redistributeShelves(fittings) });
  }
  return {
    sections,
    loft: previous?.loft ?? { enabled: false, heightMm: archetype.defaultLoftMm },
    doors: previous?.doors ?? { type: archetype.defaultDoorType, count: Math.max(2, sectionCount) },
    presetId: preset.id,
  };
}

/**
 * Space shelves evenly through whatever height the drawers and rails leave.
 * Called after every add/remove so a compartment never ends up with two
 * shelves at the same height, which is the failure mode of storing positions
 * and not recomputing them.
 */
export function redistributeShelves(fittings: Fitting[]): Fitting[] {
  const drawers = fittings.filter((f) => f.kind === "drawer").length;
  const rails = fittings.filter((f) => f.kind === "rail");
  const shelves = fittings.filter((f) => f.kind === "shelf");
  // Drawers occupy the bottom; a rail needs hanging length under it.
  const floor = Math.min(0.55, drawers * 0.12);
  const ceiling = rails.length > 0 ? Math.min(...rails.map((r) => r.at)) - 0.06 : 0.97;
  const span = Math.max(0.08, ceiling - floor);
  const spaced = shelves.map((s, i) => ({
    ...s,
    at: shelves.length === 1 ? floor + span * 0.62 : floor + (span * (i + 1)) / (shelves.length + 1),
  }));
  return [...rails, ...fittings.filter((f) => f.kind === "drawer" || f.kind === "accessory"), ...spaced];
}

// ---------------------------------------------------------------- metrics ---

export interface SectionMetric {
  id: string;
  /** Left and right edge of the clear opening, mm, in world x. */
  xStart: number;
  xEnd: number;
  widthMm: number;
  centerX: number;
}

export interface Metrics {
  dims: Dimensions;
  archetype: FurnitureArchetype;
  /** Loft height actually applied — 0 when disabled or unsupported. */
  loftMm: number;
  /** Carcass band: the main body, above the plinth and below the loft. */
  carcassBottomY: number;
  carcassTopY: number;
  carcassHeight: number;
  /** Clear internal opening inside the carcass. */
  innerBottomY: number;
  innerTopY: number;
  innerHeight: number;
  innerDepth: number;
  sections: SectionMetric[];
  /** World x of each vertical partition centre. */
  partitionX: number[];
}

export function computeMetrics(dims: Dimensions, layout: FurnitureLayout, archetype: FurnitureArchetype): Metrics {
  const { panelMm, plinthMm, backMm } = archetype;
  const loftMm = archetype.supportsLoft && layout.loft.enabled ? layout.loft.heightMm : 0;

  const carcassBottomY = plinthMm;
  const carcassTopY = dims.heightMm - loftMm;
  const carcassHeight = Math.max(panelMm * 4, carcassTopY - carcassBottomY);

  const innerBottomY = carcassBottomY + panelMm;
  const innerTopY = carcassTopY - panelMm;
  const innerHeight = Math.max(1, innerTopY - innerBottomY);
  const innerDepth = Math.max(1, dims.depthMm - backMm);

  // Compartments share the clear width left after the two side panels and the
  // partitions between them.
  const count = Math.max(1, layout.sections.length);
  const innerWidth = dims.widthMm - panelMm * 2;
  const availableWidth = Math.max(1, innerWidth - (count - 1) * panelMm);
  const weightSum = layout.sections.reduce((s, x) => s + Math.max(0.2, x.weight), 0);

  const sections: SectionMetric[] = [];
  const partitionX: number[] = [];
  let cursor = -dims.widthMm / 2 + panelMm;
  layout.sections.forEach((s, i) => {
    const w = (availableWidth * Math.max(0.2, s.weight)) / weightSum;
    sections.push({ id: s.id, xStart: cursor, xEnd: cursor + w, widthMm: w, centerX: cursor + w / 2 });
    cursor += w;
    if (i < count - 1) {
      partitionX.push(cursor + panelMm / 2);
      cursor += panelMm;
    }
  });

  return {
    dims,
    archetype,
    loftMm,
    carcassBottomY,
    carcassTopY,
    carcassHeight,
    innerBottomY,
    innerTopY,
    innerHeight,
    innerDepth,
    sections,
    partitionX,
  };
}

// ----------------------------------------------------------------- panels ---

export type PanelRole =
  | "plinth"
  | "side"
  | "top"
  | "bottom"
  | "back"
  | "partition"
  | "shelf"
  | "drawer"
  | "rail"
  | "shutter"
  | "accessory"
  | "loft-carcass"
  | "loft-shutter";

/** Which material group paints a panel. Drives both 3D colour and quote group. */
export type SurfaceGroup = "carcass" | "shutter" | "internal" | "hardware";

export interface Panel {
  id: string;
  role: PanelRole;
  label: string;
  /** Width (x), height (y), depth (z), mm. */
  size: [number, number, number];
  /** Centre of the box in world space, mm. */
  center: [number, number, number];
  surface: SurfaceGroup;
  /** Unit direction the piece travels in an exploded view. */
  explode: [number, number, number];
  /** Multiplier on the explode distance — shutters travel furthest. */
  explodeScale: number;
  sectionId?: string;
  /** Set on fittings, so clicking a shelf in 3D can select it in the editor. */
  fittingId?: string;
  /** Shutters only: which vertical edge the hinges are on. */
  hinge?: "left" | "right";
  /** Sliding shutters only: which way the leaf travels, −1 left, +1 right. */
  slide?: number;
}

/**
 * Turn a layout into a positioned box list.
 *
 * Everything is an axis-aligned box on purpose. Furniture at this level of
 * abstraction genuinely is boxes, and boxes keep the 3D scene at a few hundred
 * triangles — which is what lets this run on a mid-range Android phone.
 */
/**
 * Which way a piece travels when the assembly comes apart.
 *
 * Shell panels have an obvious canonical direction — a side goes sideways, a
 * top goes up. Internal fittings do not: sending every shelf, drawer and rail
 * straight forward stacks the left compartment's contents on top of the right
 * compartment's, which is exactly the pile the exploded view is supposed to
 * prevent. So a fitting travels radially, outward from the centre of the
 * carcass, with a forward bias — its own position in the box decides where it
 * goes, which is what makes the result read as a diagram of the assembly
 * rather than a heap.
 */
function radialExplode(
  center: [number, number, number],
  metrics: Metrics,
  forwardBias = 0.9
): [number, number, number] {
  const cx = 0;
  const cy = metrics.carcassBottomY + metrics.carcassHeight / 2;
  const cz = metrics.dims.depthMm / 2;
  // Normalised offset from the carcass centre, so a compartment on the far
  // left contributes about −1 on x regardless of how wide the unit is.
  const dx = (center[0] - cx) / Math.max(1, metrics.dims.widthMm / 2);
  const dy = (center[1] - cy) / Math.max(1, metrics.carcassHeight / 2);
  const dz = (center[2] - cz) / Math.max(1, metrics.dims.depthMm / 2);
  const v: [number, number, number] = [dx * 0.9, dy * 0.55, dz * 0.3 + forwardBias];
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function buildPanels(metrics: Metrics, layout: FurnitureLayout): Panel[] {
  const { dims, archetype } = metrics;
  const { panelMm, backMm, plinthMm, shutterMm, drawerMm } = archetype;
  const panels: Panel[] = [];
  const halfW = dims.widthMm / 2;
  const depth = dims.depthMm;

  const push = (p: Panel) => panels.push(p);

  // --- plinth ---
  if (plinthMm > 0) {
    push({
      id: "plinth",
      role: "plinth",
      label: "Plinth",
      size: [dims.widthMm - panelMm * 2, plinthMm, depth * 0.82],
      center: [0, plinthMm / 2, depth * 0.42],
      surface: "carcass",
      explode: [0, -1, 0],
      explodeScale: 0.7,
    });
  }

  // --- carcass shell ---
  const shellY = metrics.carcassBottomY + metrics.carcassHeight / 2;
  push({
    id: "side-left",
    role: "side",
    label: "Side panel — left",
    size: [panelMm, metrics.carcassHeight, depth],
    center: [-halfW + panelMm / 2, shellY, depth / 2],
    surface: "carcass",
    explode: [-1, 0, 0],
    explodeScale: 1,
  });
  push({
    id: "side-right",
    role: "side",
    label: "Side panel — right",
    size: [panelMm, metrics.carcassHeight, depth],
    center: [halfW - panelMm / 2, shellY, depth / 2],
    surface: "carcass",
    explode: [1, 0, 0],
    explodeScale: 1,
  });
  push({
    id: "top",
    role: "top",
    label: "Top panel",
    size: [dims.widthMm, panelMm, depth],
    center: [0, metrics.carcassTopY - panelMm / 2, depth / 2],
    surface: "carcass",
    explode: [0, 1, 0],
    explodeScale: 1,
  });
  push({
    id: "bottom",
    role: "bottom",
    label: "Bottom panel",
    size: [dims.widthMm, panelMm, depth],
    center: [0, metrics.carcassBottomY + panelMm / 2, depth / 2],
    surface: "carcass",
    explode: [0, -1, 0],
    explodeScale: 1.15,
  });
  push({
    id: "back",
    role: "back",
    label: "Back panel",
    size: [dims.widthMm, metrics.carcassHeight, backMm],
    center: [0, shellY, backMm / 2],
    surface: "internal",
    explode: [0, 0, -1],
    explodeScale: 1.3,
  });

  // --- partitions ---
  metrics.partitionX.forEach((x, i) => {
    push({
      id: `partition-${i}`,
      role: "partition",
      label: `Vertical partition ${i + 1}`,
      size: [panelMm, metrics.innerHeight, metrics.innerDepth],
      center: [x, metrics.innerBottomY + metrics.innerHeight / 2, backMm + metrics.innerDepth / 2],
      surface: "carcass",
      explode: radialExplode([x, metrics.innerBottomY + metrics.innerHeight / 2, backMm + metrics.innerDepth / 2], metrics, 0.55),
      explodeScale: 1.05 + i * 0.12,
    });
  });

  // --- fittings, per compartment ---
  layout.sections.forEach((section, si) => {
    const m = metrics.sections[si];
    if (!m) return;
    const clearW = m.widthMm;
    const drawers = section.fittings.filter((f) => f.kind === "drawer");
    const shelves = section.fittings.filter((f) => f.kind === "shelf");
    const rails = section.fittings.filter((f) => f.kind === "rail");
    const accessories = section.fittings.filter((f) => f.kind === "accessory");

    drawers.forEach((f, di) => {
      const y = metrics.innerBottomY + drawerMm * di + drawerMm / 2;
      if (y + drawerMm / 2 > metrics.innerTopY) return;
      push({
        id: `drawer-${f.id}`,
        role: "drawer",
        label: `Drawer — ${sectionLabel(si)}`,
        size: [clearW - 6, drawerMm - 6, metrics.innerDepth - 40],
        center: [m.centerX, y, backMm + (metrics.innerDepth - 40) / 2 + 12],
        surface: "internal",
        explode: radialExplode([m.centerX, y, backMm + metrics.innerDepth / 2], metrics, 1.15),
        explodeScale: 1.75 + di * 0.34,
        sectionId: section.id,
        fittingId: f.id,
      });
    });

    shelves.forEach((f, si2) => {
      const y = metrics.innerBottomY + metrics.innerHeight * f.at;
      push({
        id: `shelf-${f.id}`,
        role: "shelf",
        label: `Shelf — ${sectionLabel(si)}`,
        size: [clearW, panelMm, metrics.innerDepth - 25],
        center: [m.centerX, y, backMm + (metrics.innerDepth - 25) / 2],
        surface: "internal",
        explode: radialExplode([m.centerX, y, backMm + metrics.innerDepth / 2], metrics, 0.75),
        explodeScale: 1.2 + si2 * 0.22,
        sectionId: section.id,
        fittingId: f.id,
      });
    });

    rails.forEach((f) => {
      const y = metrics.innerBottomY + metrics.innerHeight * f.at;
      push({
        id: `rail-${f.id}`,
        role: "rail",
        label: `Hanging rail — ${sectionLabel(si)}`,
        size: [clearW - 20, 28, 28],
        center: [m.centerX, y, backMm + metrics.innerDepth * 0.55],
        surface: "hardware",
        explode: radialExplode([m.centerX, y, backMm + metrics.innerDepth * 0.55], metrics, 0.95),
        explodeScale: 1.55,
        sectionId: section.id,
        fittingId: f.id,
      });
    });

    accessories.forEach((f, ai) => {
      const y = metrics.innerBottomY + metrics.innerHeight * f.at;
      push({
        id: `accessory-${f.id}`,
        role: "accessory",
        label: `${f.accessoryId ?? "Accessory"} — ${sectionLabel(si)}`,
        size: [clearW - 30, 90, metrics.innerDepth - 70],
        center: [m.centerX, y, backMm + (metrics.innerDepth - 70) / 2 + 20],
        surface: "hardware",
        explode: radialExplode([m.centerX, y, backMm + metrics.innerDepth / 2], metrics, 1.05),
        explodeScale: 1.7 + ai * 0.28,
        sectionId: section.id,
        fittingId: f.id,
      });
    });
  });

  // --- loft ---
  if (metrics.loftMm > 0) {
    const loftCenterY = metrics.carcassTopY + metrics.loftMm / 2;
    push({
      id: "loft-carcass",
      role: "loft-carcass",
      label: "Loft carcass",
      size: [dims.widthMm, metrics.loftMm, depth],
      center: [0, loftCenterY, depth / 2],
      surface: "carcass",
      explode: [0, 1, 0],
      explodeScale: 1.9,
    });
  }

  // --- shutters ---
  if (layout.doors.type !== "open") {
    const count = Math.max(1, layout.doors.count);
    const sliding = layout.doors.type === "sliding";
    // Sliding leaves overlap, so each leaf is wider than width/count.
    const leafW = sliding ? (dims.widthMm / count) * 1.06 : dims.widthMm / count;
    const gap = sliding ? 0 : 3;
    for (let i = 0; i < count; i += 1) {
      const x = -halfW + leafW * i + leafW / 2;
      const z = sliding ? depth + shutterMm / 2 + (i % 2) * (shutterMm + 6) : depth + shutterMm / 2;
      // Hinges go on the outer edge of each leaf, so the doors part in the
      // middle rather than all swinging the same way.
      const hinge: "left" | "right" = x < 0 ? "left" : "right";
      push({
        id: `shutter-${i}`,
        role: "shutter",
        label: `Shutter ${i + 1}`,
        size: [leafW - gap, metrics.carcassHeight - 4, shutterMm],
        center: [x, shellY, z],
        surface: "shutter",
        explode: [x < 0 ? -0.45 : 0.45, 0, 1],
        explodeScale: 2.5 + i * 0.16,
        hinge,
        slide: x < 0 ? -1 : 1,
      });
    }
    if (metrics.loftMm > 0) {
      const loftLeaves = Math.max(2, Math.round(count / 1.5));
      const lw = dims.widthMm / loftLeaves;
      for (let i = 0; i < loftLeaves; i += 1) {
        push({
          id: `loft-shutter-${i}`,
          role: "loft-shutter",
          label: `Loft shutter ${i + 1}`,
          size: [lw - 3, metrics.loftMm - 4, shutterMm],
          center: [-halfW + lw * i + lw / 2, metrics.carcassTopY + metrics.loftMm / 2, depth + shutterMm / 2],
          surface: "shutter",
          explode: [0, 0.55, 1],
          explodeScale: 2.9,
          hinge: i % 2 === 0 ? "left" : "right",
          slide: i % 2 === 0 ? -1 : 1,
        });
      }
    }
  }

  return panels;
}

function sectionLabel(index: number): string {
  return `compartment ${index + 1}`;
}

/** Human name for a compartment, used in the editor and in 3D tooltips. */
export function compartmentName(index: number, total: number): string {
  if (total === 1) return "Single compartment";
  if (index === 0) return "Left compartment";
  if (index === total - 1) return "Right compartment";
  if (total === 3) return "Centre compartment";
  return `Compartment ${index + 1}`;
}

// ----------------------------------------------------------------- counts ---

export interface LayoutCounts {
  sections: number;
  partitions: number;
  shelves: number;
  drawers: number;
  rails: number;
  accessories: number;
  shutters: number;
  /** Carried so the quote can price a sliding track set instead of hinges. */
  doorType: DoorType;
  loft: boolean;
  /** Board area of shelves and drawer boxes, sq ft. */
  shelfAreaSqft: number;
  /** Board area of the vertical partitions, sq ft. */
  partitionAreaSqft: number;
  /** Carcass area the loft adds, sq ft. 0 when there is no loft. */
  loftCarcassSqft: number;
  /** Shutter face the loft adds, sq ft. */
  loftShutterSqft: number;
  /** Running feet of shutter edge — drives banding and hinge counts. */
  shutterFaceSqft: number;
}

/**
 * What the layout adds up to. The pricing engine reads this rather than the
 * panel list, so adding a shelf in the editor and the shelf appearing on the
 * quote are the same event.
 */
export function countLayout(metrics: Metrics, layout: FurnitureLayout): LayoutCounts {
  let shelves = 0;
  let drawers = 0;
  let rails = 0;
  let accessories = 0;
  let shelfAreaMm2 = 0;

  layout.sections.forEach((section, si) => {
    const m = metrics.sections[si];
    for (const f of section.fittings) {
      if (f.kind === "shelf") {
        shelves += 1;
        if (m) shelfAreaMm2 += m.widthMm * metrics.innerDepth;
      } else if (f.kind === "drawer") {
        drawers += 1;
        if (m) shelfAreaMm2 += m.widthMm * metrics.innerDepth * 1.8; // box: base + 4 sides
      } else if (f.kind === "rail") rails += 1;
      else accessories += 1;
    }
  });

  const MM2_PER_SQFT = 92903;
  const partitions = Math.max(0, layout.sections.length - 1);
  const partitionAreaMm2 = partitions * metrics.innerHeight * metrics.innerDepth;

  // The loft is a second carcass sitting on the first: two sides, a top, a
  // bottom and a back, plus its own shutters.
  const loftCarcassMm2 =
    metrics.loftMm > 0
      ? metrics.loftMm * metrics.dims.depthMm * 2 + metrics.dims.widthMm * metrics.dims.depthMm * 2 + metrics.dims.widthMm * metrics.loftMm
      : 0;
  const loftShutterMm2 = metrics.loftMm > 0 ? metrics.dims.widthMm * metrics.loftMm : 0;

  const shutterFaceMm2 =
    layout.doors.type === "open" ? 0 : metrics.dims.widthMm * metrics.carcassHeight * (layout.doors.type === "sliding" ? 1.06 : 1);

  return {
    sections: layout.sections.length,
    partitions,
    shelves,
    drawers,
    rails,
    accessories,
    shutters: layout.doors.type === "open" ? 0 : layout.doors.count,
    doorType: layout.doors.type,
    loft: metrics.loftMm > 0,
    shelfAreaSqft: shelfAreaMm2 / MM2_PER_SQFT,
    partitionAreaSqft: partitionAreaMm2 / MM2_PER_SQFT,
    loftCarcassSqft: loftCarcassMm2 / MM2_PER_SQFT,
    loftShutterSqft: loftShutterMm2 / MM2_PER_SQFT,
    shutterFaceSqft: shutterFaceMm2 / MM2_PER_SQFT,
  };
}
