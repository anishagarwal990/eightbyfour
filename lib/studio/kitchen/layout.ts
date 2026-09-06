/**
 * The auto-layout engine.
 *
 * Given a room, a brief and a set of appliances, produce cabinet runs that a
 * kitchen fitter would recognise. This is a rule engine, not a solver and not
 * a model — the rules below are the ones in every kitchen design guide (work
 * triangle, sink under the window, hob off the corner, fridge at the end of a
 * run) and they are written out so the UI can explain each decision.
 *
 * Every placement records `reason`, because a layout the customer cannot
 * interrogate is a layout they cannot trust.
 */

import { defaultInternals, getCabinetType, makeInternals, newId } from "./cabinets";
import { variantOf } from "./appliances";
import {
  K,
  WALL_IDS,
  type ApplianceChoice,
  type Brief,
  type CabinetRun,
  type LayoutKind,
  type PlacedCabinet,
  type Room,
  type WallId,
} from "./types";

/** Usable run length on a wall, i.e. the wall minus its door openings. */
export function wallLength(room: Room, wall: WallId): number {
  return wall === "N" || wall === "S" ? room.widthMm : room.depthMm;
}

/** Free spans on a wall once doors are removed. Windows do not block base units. */
export function freeSpans(room: Room, wall: WallId, tier: "base" | "wall"): { start: number; end: number }[] {
  const len = wallLength(room, wall);
  const blockers = room.openings
    .filter((o) => o.wall === wall)
    .filter((o) => (tier === "base" ? o.sillMm < K.counterTopMm : o.sillMm < K.wallSillMm + K.wallHeightMm))
    .map((o) => ({ start: Math.max(0, o.offsetMm), end: Math.min(len, o.offsetMm + o.widthMm) }))
    .sort((a, b) => a.start - b.start);

  const spans: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const b of blockers) {
    if (b.start - cursor > 300) spans.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (len - cursor > 300) spans.push({ start: cursor, end: len });
  return spans;
}

/** The longest uninterrupted run available on each wall, for base cabinets. */
function wallCapacity(room: Room): { wall: WallId; span: { start: number; end: number }; length: number }[] {
  return WALL_IDS.map((wall) => {
    const spans = freeSpans(room, wall, "base");
    const best = spans.reduce(
      (acc, s) => (s.end - s.start > acc.end - acc.start ? s : acc),
      { start: 0, end: 0 }
    );
    return { wall, span: best, length: best.end - best.start };
  }).sort((a, b) => b.length - a.length);
}

// ------------------------------------------------------- layout feasibility --

export interface LayoutOption {
  kind: LayoutKind;
  /** Which walls carry runs, in order. */
  walls: WallId[];
  /** Total base-cabinet run length, mm. */
  runMm: number;
  /** Clear walkway the layout leaves, mm. */
  walkwayMm: number;
  fits: boolean;
  /** Why Studio would or would not suggest it. */
  reasons: string[];
  warnings: string[];
}

/**
 * Which layouts the room can actually take.
 *
 * The constraint that decides almost everything is walkway: a run is 600 mm
 * deep, so two facing runs eat 1200 mm before anyone stands between them.
 */
export function layoutOptions(room: Room): LayoutOption[] {
  const caps = wallCapacity(room);
  const [a] = caps;
  const out: LayoutOption[] = [];
  const shortSide = Math.min(room.widthMm, room.depthMm);

  // --- straight: always possible if any wall has a metre of clear run -------
  out.push({
    kind: "straight",
    walls: [a.wall],
    runMm: a.length,
    walkwayMm: perpendicular(room, a.wall) - K.baseDepthMm,
    fits: a.length >= 1800,
    reasons: [
      "Everything on one wall — the simplest kitchen to build and the cheapest.",
      "Leaves the rest of the room completely free.",
    ],
    warnings: a.length < 3000 ? ["Under 3 m of run gets tight once the sink and hob are in."] : [],
  });

  // --- L: two adjacent walls ------------------------------------------------
  const lPair = caps.find((c) => isAdjacent(c.wall, a.wall) && c.length >= 1200);
  if (lPair) {
    out.push({
      kind: "l-shaped",
      walls: [a.wall, lPair.wall],
      runMm: a.length + lPair.length,
      walkwayMm: Math.min(perpendicular(room, a.wall), perpendicular(room, lPair.wall)) - K.baseDepthMm,
      fits: true,
      reasons: [
        "Sink and hob land on different legs, which is what makes two people workable.",
        "The corner is the only compromise, and a carousel recovers most of it.",
        "Keeps a clear walking route through the room.",
      ],
      warnings: [],
    });
  }

  // --- parallel: two facing walls -------------------------------------------
  const facing = caps.find((c) => c.wall === opposite(a.wall) && c.length >= 1500);
  if (facing) {
    const gap = perpendicular(room, a.wall) - K.baseDepthMm * 2;
    out.push({
      kind: "parallel",
      walls: [a.wall, facing.wall],
      runMm: a.length + facing.length,
      walkwayMm: gap,
      fits: gap >= K.minWalkwayMm,
      reasons: [
        "The most counter and storage per square foot of room.",
        "Short distance between the two runs — everything is a turn away.",
      ],
      warnings:
        gap < K.goodWalkwayMm
          ? [`${Math.round(gap)} mm between the runs. Below ${K.goodWalkwayMm} mm two people cannot pass, and a bent-over open dishwasher blocks it entirely.`]
          : [],
    });
  }

  // --- U: three walls -------------------------------------------------------
  if (lPair) {
    const third = caps.find((c) => c.wall === opposite(lPair.wall) && c.length >= 1200);
    if (third) {
      const gap = perpendicular(room, lPair.wall) - K.baseDepthMm * 2;
      out.push({
        kind: "u-shaped",
        walls: [a.wall, lPair.wall, third.wall],
        runMm: a.length + lPair.length + third.length,
        walkwayMm: gap,
        fits: gap >= K.minWalkwayMm,
        reasons: [
          "The most storage of any layout, and the tightest work triangle.",
          "Three work zones without crossing anyone's path.",
        ],
        warnings:
          gap < K.goodWalkwayMm
            ? [`Only ${Math.round(gap)} mm between the facing legs. This will feel enclosed.`]
            : ["Two corners to solve, and corner units cost more than the run they replace."],
      });
    }
  }

  // --- island: only when circulation genuinely allows it --------------------
  // 600 island + 900 either side is the floor, and that is before the run.
  const islandNeeds = K.baseDepthMm + 900 * 2 + K.baseDepthMm;
  if (shortSide >= islandNeeds && a.length >= 2400) {
    out.push({
      kind: "island",
      walls: [a.wall],
      runMm: a.length + 1800,
      walkwayMm: (shortSide - K.baseDepthMm - 600) / 2,
      fits: true,
      reasons: [
        `The room is ${Math.round(shortSide)} mm across, which leaves a real walkway on both sides of an island.`,
        "Prep space facing into the room instead of into a wall.",
      ],
      warnings: ["An island needs its services run under the floor if it carries a sink or a hob."],
    });
  }

  return out.sort((x, y) => score(y, room) - score(x, room));
}

/** Ranking. Fit first, then usable run, then walkway comfort. */
function score(o: LayoutOption, room: Room): number {
  if (!o.fits) return -1000;
  const walkBonus = Math.min(o.walkwayMm, 1500) / 100;
  const runBonus = Math.min(o.runMm, 8000) / 400;
  const cornerPenalty = o.walls.length > 2 ? 4 : 0;
  const roomBonus = o.kind === "l-shaped" && room.widthMm > 2400 ? 6 : 0;
  return runBonus + walkBonus - cornerPenalty + roomBonus;
}

function perpendicular(room: Room, wall: WallId): number {
  return wall === "N" || wall === "S" ? room.depthMm : room.widthMm;
}
function opposite(w: WallId): WallId {
  return ({ N: "S", S: "N", E: "W", W: "E" } as const)[w];
}
function isAdjacent(a: WallId, b: WallId): boolean {
  return a !== b && a !== opposite(b);
}

// -------------------------------------------------------------- generation --

/**
 * Fill the chosen layout with cabinets.
 *
 * The order is the one a designer works in: fix the appliances first, because
 * their positions are constrained by services and by each other, then fill the
 * gaps with storage that answers the brief.
 */
export function generateRuns(
  room: Room,
  layout: LayoutKind,
  walls: WallId[],
  appliances: ApplianceChoice[],
  brief: Brief
): CabinetRun[] {
  const get = (k: string) => appliances.find((a) => a.kind === k);
  const sink = get("sink");
  const hob = get("hob");
  const fridge = get("fridge");
  const dishwasher = get("dishwasher");
  const oven = get("oven");
  const chimney = get("chimney");

  const runs: CabinetRun[] = [];
  // A wall listed twice would be furnished twice. Guard here as well as at the
  // call site, because this is the function that would silently double a
  // kitchen rather than fail.
  const uniqueWalls = [...new Set(walls)];
  const primary = uniqueWalls[0];
  const secondary = uniqueWalls[1];

  // The primary wall carries the sink; the secondary carries the hob, so the
  // two are never side by side and there is prep space between them.
  const hobWall = secondary ?? primary;

  for (const [wallIndex, wall] of uniqueWalls.entries()) {
    const spans = freeSpans(room, wall, "base");
    const span = spans.reduce((acc, s) => (s.end - s.start > acc.end - acc.start ? s : acc), { start: 0, end: 0 });
    // Where two runs meet in a corner they would otherwise occupy the same
    // 600 × 600 of floor. The later leg starts clear of the earlier one's depth.
    const cornerOffset = wallIndex > 0 ? K.baseDepthMm : 0;
    const runStart = span.start + cornerOffset;
    let remaining = span.end - runStart;
    if (remaining < 300) continue;

    const cabinets: PlacedCabinet[] = [];
    const push = (typeId: string, widthMm: number, reason?: string, internals?: PlacedCabinet["internals"]) => {
      const t = getCabinetType(typeId);
      const w = Math.min(widthMm, remaining);
      // Fillers are 30–100 mm by nature; only real cabinets need a floor.
      const floor = typeId === "filler" ? 30 : 150;
      if (w < floor) return false;
      cabinets.push({ id: newId("c"), typeId, widthMm: w, internals: internals ?? defaultInternals(t), reason });
      remaining -= w;
      return true;
    };

    // --- fridge goes at the end of a run, never between work zones ----------
    let fridgeCabinet: PlacedCabinet | null = null;
    if (fridge && wall === primary && layout !== "parallel") {
      const v = variantOf("fridge", fridge.variantId);
      const fw = Math.min(Math.max(700, v.widthMm + 60), remaining);
      if (fw >= 700) {
        fridgeCabinet = {
          id: newId("c"),
          typeId: "tall-fridge",
          widthMm: fw,
          internals: [],
          reason: "Fridge at the end of the run so its door never opens across the work zone.",
        };
        remaining -= fw;
      }
    }

    // --- sink ---------------------------------------------------------------
    if (sink && wall === primary) {
      const v = variantOf("sink", sink.variantId);
      const underWindow = room.openings.some(
        (o) => o.wall === wall && o.kind === "window" && o.offsetMm > span.start && o.offsetMm < span.end
      );
      push(
        "base-sink",
        Math.max(600, v.widthMm + 60),
        underWindow
          ? "Sink placed on the window wall — daylight where you spend the most time standing."
          : "Sink on the longest run, with counter on both sides for landing space."
      );

      if (dishwasher && dishwasher.variantId !== "none") {
        push(
          "base-dishwasher",
          600,
          "Dishwasher next to the sink so it shares the same waste and supply."
        );
      }
    }

    // --- hob ----------------------------------------------------------------
    if (hob && wall === hobWall) {
      const v = variantOf("hob", hob.variantId);
      // A hob needs landing space, and it must not sit hard against a corner.
      if (wall === secondary) push("filler", 100, "Corner filler so the drawer beside it clears the return wall.");
      push(
        "base-hob",
        Math.max(600, v.widthMm),
        "Hob kept off the corner and away from the sink so there is prep counter between them."
      );
      if (brief.priorities.includes("oils") || brief.cooking === "heavy") {
        push(
          "base-bottle",
          300,
          "Bottle pull-out beside the hob — you said heavy cooking, so oil and masala belong within reach of the pan.",
          makeInternals("pullout", 1, "bottle-pullout")
        );
      }
      if (oven && oven.variantId !== "none") {
        push("base-oven", 600, "Oven under the counter, out of the main prep stretch.");
      }
    }

    // --- fill what is left with storage that answers the brief -------------
    const wantsDrawers = brief.priorities.includes("pots") || brief.priorities.includes("pressure-cookers");
    let guard = 0;
    while (remaining >= 300 && guard < 12) {
      guard += 1;
      const w = remaining >= 600 ? 600 : remaining >= 450 ? 450 : 300;
      if (wantsDrawers && guard % 2 === 1) {
        push("base-drawers", w, "Deep drawers — you listed pots and pressure cookers, which are miserable in a shutter cabinet.");
      } else {
        push("base-shutter", w);
      }
    }

    if (fridgeCabinet) {
      runs.push({ id: newId("r"), wall, tier: "tall", startMm: runStart, cabinets: [fridgeCabinet] });
    }
    const baseStart = runStart + (fridgeCabinet?.widthMm ?? 0);
    if (cabinets.length > 0) {
      runs.push({ id: newId("r"), wall, tier: "base", startMm: baseStart, cabinets });
    }

    // --- wall tier ----------------------------------------------------------
    const wallSpans = freeSpans(room, wall, "wall");
    const wSpan = wallSpans.reduce((acc, s) => (s.end - s.start > acc.end - acc.start ? s : acc), { start: 0, end: 0 });
    const wallRunStart = wSpan.start + cornerOffset;
    let wRemaining = wSpan.end - wallRunStart;
    const wallCabs: PlacedCabinet[] = [];
    const pushW = (typeId: string, widthMm: number, reason?: string) => {
      const w = Math.min(widthMm, wRemaining);
      if (w < 250) return;
      wallCabs.push({ id: newId("c"), typeId, widthMm: w, internals: defaultInternals(getCabinetType(typeId)), reason });
      wRemaining -= w;
    };

    if (chimney && chimney.variantId !== "none" && wall === hobWall) {
      const v = variantOf("chimney", chimney.variantId);
      pushW("wall-chimney", v.widthMm, `Chimney bay sized to the ${v.label} hood over the hob.`);
    }
    let wGuard = 0;
    while (wRemaining >= 300 && wGuard < 10) {
      wGuard += 1;
      pushW("wall-shutter", wRemaining >= 600 ? 600 : wRemaining >= 450 ? 450 : 300);
    }
    if (wallCabs.length > 0) {
      runs.push({ id: newId("r"), wall, tier: "wall", startMm: wallRunStart, cabinets: wallCabs });
    }
  }

  // --- tall pantry, when the brief asks for bulk storage --------------------
  const wantsPantry = brief.priorities.includes("groceries") || brief.household === "5+";
  if (wantsPantry) {
    const spare = WALL_IDS.filter((w) => !uniqueWalls.includes(w))
      .map((w) => ({ w, spans: freeSpans(room, w, "base") }))
      .find((x) => x.spans.some((s) => s.end - s.start >= 600));
    if (spare) {
      const s = spare.spans.find((x) => x.end - x.start >= 600)!;
      runs.push({
        id: newId("r"),
        wall: spare.w,
        tier: "tall",
        startMm: s.start,
        cabinets: [
          {
            id: newId("c"),
            typeId: "tall-pantry",
            widthMm: 600,
            internals: defaultInternals(getCabinetType("tall-pantry")),
            reason: "Tall pantry on the free wall — you asked for bulk grocery storage, and shelves in a base unit will not hold it.",
          },
        ],
      });
    }
  }

  return runs;
}

/** Total run length of a tier, mm. */
export function runLength(runs: CabinetRun[], tier?: "base" | "wall" | "tall"): number {
  return runs
    .filter((r) => !tier || r.tier === tier)
    .reduce((sum, r) => sum + r.cabinets.reduce((s, c) => s + c.widthMm, 0), 0);
}
