/**
 * Kitchen geometry.
 *
 * Turns a KitchenProject into positioned boxes in room space. The plan, the
 * elevations, the 3D scene and the exploded view all read this — none of them
 * computes a position of its own, which is what keeps them from disagreeing.
 *
 * Room space: x runs left to right along the N wall, z runs from the N wall
 * (0) towards the S wall, y is up from the floor. Millimetres.
 */

import { getCabinetType } from "./cabinets";
import { variantOf } from "./appliances";
import { K, type CabinetRun, type KitchenProject, type PlacedCabinet, type Tier, type WallId } from "./types";

export type BoxRole =
  | "carcass"
  | "shutter"
  | "drawer-front"
  | "counter"
  | "plinth"
  | "shelf"
  | "back"
  | "appliance"
  | "sink"
  | "hob"
  | "handle";

export interface Box {
  id: string;
  role: BoxRole;
  label: string;
  /** Centre in room space, mm. */
  center: [number, number, number];
  /** Full size, mm. */
  size: [number, number, number];
  /** Which cabinet this belongs to, for selection. */
  cabinetId?: string;
  tier?: Tier;
  /** Unit direction for the exploded view. */
  explode: [number, number, number];
  explodeScale: number;
  /** Surface group, for material colours. */
  surface: "carcass" | "shutter" | "internal" | "hardware" | "counter" | "appliance";
}

/** Where one cabinet sits, in room space. */
export interface CabinetPlacement {
  cabinet: PlacedCabinet;
  run: CabinetRun;
  wall: WallId;
  tier: Tier;
  /** Centre of the cabinet's front face. */
  center: [number, number, number];
  /** Width along the wall, depth into the room, height. */
  size: [number, number, number];
  /** Rotation about Y so the front faces into the room. */
  rotationY: number;
  /** Distance from the wall's start corner to this cabinet's near edge. */
  alongMm: number;
}

/** Y of a tier's carcass bottom and its height. */
function tierY(tier: Tier): { bottom: number; height: number; depth: number } {
  if (tier === "wall") return { bottom: K.wallSillMm, height: K.wallHeightMm, depth: K.wallDepthMm };
  if (tier === "tall") return { bottom: K.plinthMm, height: K.tallHeightMm, depth: K.tallDepthMm };
  return { bottom: K.plinthMm, height: K.baseCarcassMm, depth: K.baseDepthMm };
}

/**
 * Map a position along a wall to room coordinates.
 *
 * Each wall has its own direction and its own inward normal, and getting this
 * table wrong is the classic way a plan and a 3D scene end up mirrored.
 */
export function wallFrame(wall: WallId, room: { widthMm: number; depthMm: number }) {
  switch (wall) {
    case "N":
      return { origin: [0, 0] as const, dir: [1, 0] as const, inward: [0, 1] as const, rotationY: 0, length: room.widthMm };
    case "S":
      return { origin: [room.widthMm, room.depthMm] as const, dir: [-1, 0] as const, inward: [0, -1] as const, rotationY: Math.PI, length: room.widthMm };
    case "E":
      return { origin: [room.widthMm, 0] as const, dir: [0, 1] as const, inward: [-1, 0] as const, rotationY: -Math.PI / 2, length: room.depthMm };
    case "W":
      return { origin: [0, room.depthMm] as const, dir: [0, -1] as const, inward: [1, 0] as const, rotationY: Math.PI / 2, length: room.depthMm };
  }
}

/** Every cabinet in the project, placed in room space. */
export function placements(project: KitchenProject): CabinetPlacement[] {
  const out: CabinetPlacement[] = [];
  for (const run of project.runs) {
    const frame = wallFrame(run.wall, project.room);
    const t = tierY(run.tier);
    let along = run.startMm;
    for (const cab of run.cabinets) {
      const type = getCabinetType(cab.typeId);
      const depth = type.depthMm;
      // Centre along the wall, then push in by half the depth so the back sits
      // on the wall and the front faces the room.
      const mid = along + cab.widthMm / 2;
      const x = frame.origin[0] + frame.dir[0] * mid + frame.inward[0] * (depth / 2);
      const z = frame.origin[1] + frame.dir[1] * mid + frame.inward[1] * (depth / 2);
      out.push({
        cabinet: cab,
        run,
        wall: run.wall,
        tier: run.tier,
        center: [x, t.bottom + type.heightMm / 2, z],
        size: [cab.widthMm, type.heightMm, depth],
        rotationY: frame.rotationY,
        alongMm: along,
      });
      along += cab.widthMm;
    }
  }
  return out;
}

/**
 * Break the whole kitchen into boxes.
 *
 * `focusCabinetId` narrows the output to one cabinet's parts, which is what the
 * exploded view uses — exploding an entire kitchen at once is unreadable, and
 * the thing a customer wants taken apart is the unit they clicked.
 */
export function buildBoxes(project: KitchenProject, focusCabinetId?: string): Box[] {
  const boxes: Box[] = [];
  const all = placements(project);
  const list = focusCabinetId ? all.filter((p) => p.cabinet.id === focusCabinetId) : all;

  for (const p of list) {
    const type = getCabinetType(p.cabinet.typeId);
    const [w, h, d] = p.size;
    const [cx, cy, cz] = p.center;
    const isX = p.wall === "N" || p.wall === "S";
    // Along-wall and into-room axes swap on the side walls.
    const along = (v: number): [number, number, number] => (isX ? [v, 0, 0] : [0, 0, v]);
    const into = (v: number): [number, number, number] => (isX ? [0, 0, v] : [v, 0, 0]);
    const frame = wallFrame(p.wall, project.room);
    const inwardSign = isX ? frame.inward[1] : frame.inward[0];
    const dirSign = isX ? frame.dir[0] : frame.dir[1];

    const at = (alongOff: number, yOff: number, intoOff: number): [number, number, number] => [
      cx + (isX ? alongOff * dirSign : intoOff * inwardSign),
      cy + yOff,
      cz + (isX ? intoOff * inwardSign : alongOff * dirSign),
    ];
    const sized = (aw: number, hh: number, dd: number): [number, number, number] =>
      isX ? [aw, hh, dd] : [dd, hh, aw];

    const id = (s: string) => `${p.cabinet.id}-${s}`;
    const cabinetId = p.cabinet.id;

    if (type.role === "filler") {
      boxes.push({
        id: id("filler"),
        role: "carcass",
        label: "Filler panel",
        center: p.center,
        size: sized(w, h, d),
        cabinetId,
        tier: p.tier,
        explode: along(1),
        explodeScale: 1,
        surface: "carcass",
      });
      continue;
    }

    // --- carcass shell ------------------------------------------------------
    boxes.push({
      id: id("side-l"),
      role: "carcass",
      label: "Side panel — left",
      center: at(-(w / 2) + K.panelMm / 2, 0, 0),
      size: sized(K.panelMm, h, d),
      cabinetId,
      tier: p.tier,
      explode: along(-1),
      explodeScale: 1,
      surface: "carcass",
    });
    boxes.push({
      id: id("side-r"),
      role: "carcass",
      label: "Side panel — right",
      center: at(w / 2 - K.panelMm / 2, 0, 0),
      size: sized(K.panelMm, h, d),
      cabinetId,
      tier: p.tier,
      explode: along(1),
      explodeScale: 1,
      surface: "carcass",
    });
    boxes.push({
      id: id("bottom"),
      role: "carcass",
      label: "Bottom panel",
      center: at(0, -(h / 2) + K.panelMm / 2, 0),
      size: sized(w, K.panelMm, d),
      cabinetId,
      tier: p.tier,
      explode: [0, -1, 0],
      explodeScale: 1.2,
      surface: "carcass",
    });
    boxes.push({
      id: id("top"),
      role: "carcass",
      label: p.tier === "base" ? "Top rails" : "Top panel",
      center: at(0, h / 2 - K.panelMm / 2, 0),
      size: sized(w, K.panelMm, d),
      cabinetId,
      tier: p.tier,
      explode: [0, 1, 0],
      explodeScale: 1.1,
      surface: "carcass",
    });
    boxes.push({
      id: id("back"),
      role: "back",
      label: "Back panel",
      center: at(0, 0, -(d / 2) + K.backMm / 2),
      size: sized(w, h, K.backMm),
      cabinetId,
      tier: p.tier,
      explode: into(-1),
      explodeScale: 1.4,
      surface: "internal",
    });

    // --- plinth, base and tall only ----------------------------------------
    if (p.tier !== "wall") {
      boxes.push({
        id: id("plinth"),
        role: "plinth",
        label: "Plinth / skirting",
        center: [cx, K.plinthMm / 2, cz],
        size: sized(w, K.plinthMm, d * 0.85),
        cabinetId,
        tier: p.tier,
        explode: [0, -1, 0],
        explodeScale: 1.7,
        surface: "carcass",
      });
    }

    // --- internals ----------------------------------------------------------
    const shelves = p.cabinet.internals.filter((i) => i.kind === "shelf");
    const drawers = p.cabinet.internals.filter((i) => i.kind === "drawer");
    const pullouts = p.cabinet.internals.filter((i) => i.kind === "pullout" || i.kind === "carousel" || i.kind === "bin");

    shelves.forEach((s, i) => {
      const step = h / (shelves.length + 1);
      boxes.push({
        id: id(`shelf-${s.id}`),
        role: "shelf",
        label: `Shelf ${i + 1}`,
        center: at(0, -(h / 2) + step * (i + 1), 0),
        size: sized(w - K.panelMm * 2, K.panelMm, d - K.backMm - 20),
        cabinetId,
        tier: p.tier,
        explode: into(1),
        explodeScale: 1.3 + i * 0.2,
        surface: "internal",
      });
    });

    const drawerH = drawers.length > 0 ? (h - 20) / drawers.length : 0;
    drawers.forEach((dr, i) => {
      const y = -(h / 2) + drawerH * i + drawerH / 2;
      boxes.push({
        id: id(`drawer-box-${dr.id}`),
        role: "shelf",
        label: `Drawer box ${i + 1}`,
        center: at(0, y, 10),
        size: sized(w - K.panelMm * 2 - 26, drawerH * 0.72, d - 60),
        cabinetId,
        tier: p.tier,
        explode: into(1),
        explodeScale: 1.6 + i * 0.28,
        surface: "internal",
      });
      boxes.push({
        id: id(`drawer-front-${dr.id}`),
        role: "drawer-front",
        label: `Drawer front ${i + 1}`,
        center: at(0, y, d / 2 + K.shutterMm / 2),
        size: sized(w - K.revealMm * 2, drawerH - K.revealMm * 2, K.shutterMm),
        cabinetId,
        tier: p.tier,
        explode: into(1),
        explodeScale: 2.3 + i * 0.2,
        surface: "shutter",
      });
    });

    pullouts.forEach((po, i) => {
      boxes.push({
        id: id(`pullout-${po.id}`),
        role: "shelf",
        label: po.accessoryId ?? "Pull-out",
        center: at(0, 0, 10),
        size: sized(w - 40, h * 0.8, d - 70),
        cabinetId,
        tier: p.tier,
        explode: into(1),
        explodeScale: 1.9 + i * 0.2,
        surface: "hardware",
      });
    });

    // --- shutters -----------------------------------------------------------
    if (type.shutters > 0 && drawers.length === 0) {
      const leaf = w / type.shutters;
      for (let i = 0; i < type.shutters; i += 1) {
        boxes.push({
          id: id(`shutter-${i}`),
          role: "shutter",
          label: `Shutter ${i + 1}`,
          center: at(-(w / 2) + leaf * i + leaf / 2, 0, d / 2 + K.shutterMm / 2),
          size: sized(leaf - K.revealMm, h - K.revealMm * 2, K.shutterMm),
          cabinetId,
          tier: p.tier,
          explode: into(1),
          explodeScale: 2.6 + i * 0.15,
          surface: "shutter",
        });
      }
    }
  }

  if (focusCabinetId) return boxes;

  // --- countertop, one slab per base/tall run ------------------------------
  for (const run of project.runs.filter((r) => r.tier === "base")) {
    const frame = wallFrame(run.wall, project.room);
    const len = run.cabinets.reduce((s, c) => s + c.widthMm, 0);
    if (len <= 0) continue;
    const mid = run.startMm + len / 2;
    const x = frame.origin[0] + frame.dir[0] * mid + frame.inward[0] * (K.baseDepthMm / 2);
    const z = frame.origin[1] + frame.dir[1] * mid + frame.inward[1] * (K.baseDepthMm / 2);
    const isX = run.wall === "N" || run.wall === "S";
    boxes.push({
      id: `counter-${run.id}`,
      role: "counter",
      label: "Countertop",
      center: [x, K.counterTopMm - project.countertop.thicknessMm / 2, z],
      size: isX
        ? [len, project.countertop.thicknessMm, K.baseDepthMm + 20]
        : [K.baseDepthMm + 20, project.countertop.thicknessMm, len],
      explode: [0, 1, 0],
      explodeScale: 2.2,
      surface: "counter",
      tier: "base",
    });
  }

  // --- appliances that read as objects, not as cabinets --------------------
  for (const p of all) {
    const type = getCabinetType(p.cabinet.typeId);
    const isX = p.wall === "N" || p.wall === "S";
    const sized = (aw: number, hh: number, dd: number): [number, number, number] =>
      isX ? [aw, hh, dd] : [dd, hh, aw];

    if (type.role === "sink") {
      const v = variantOf("sink", project.appliances.find((a) => a.kind === "sink")?.variantId ?? "single");
      boxes.push({
        id: `${p.cabinet.id}-sink`,
        role: "sink",
        label: "Sink",
        center: [p.center[0], K.counterTopMm - 60, p.center[2]],
        size: sized(Math.min(v.widthMm, p.size[0] - 80), 120, 420),
        cabinetId: p.cabinet.id,
        explode: [0, 1, 0],
        explodeScale: 2.6,
        surface: "hardware",
      });
    }
    if (type.role === "hob") {
      const v = variantOf("hob", project.appliances.find((a) => a.kind === "hob")?.variantId ?? "4b");
      boxes.push({
        id: `${p.cabinet.id}-hob`,
        role: "hob",
        label: "Hob",
        center: [p.center[0], K.counterTopMm + 25, p.center[2]],
        size: sized(Math.min(v.widthMm, p.size[0] - 40), 50, 480),
        cabinetId: p.cabinet.id,
        explode: [0, 1, 0],
        explodeScale: 2.6,
        surface: "hardware",
      });
    }
    if (type.role === "fridge") {
      const v = variantOf("fridge", project.appliances.find((a) => a.kind === "fridge")?.variantId ?? "double");
      boxes.push({
        id: `${p.cabinet.id}-fridge`,
        role: "appliance",
        label: "Refrigerator",
        center: [p.center[0], v.heightMm / 2, p.center[2]],
        size: sized(v.widthMm, v.heightMm, v.depthMm),
        cabinetId: p.cabinet.id,
        explode: [0, 0, 1],
        explodeScale: 2,
        surface: "appliance",
      });
    }
  }

  return boxes;
}
