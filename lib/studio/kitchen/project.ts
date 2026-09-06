/**
 * Project construction: defaults, the built-in sample, and the single
 * `rebuild` entry point that regenerates runs whenever the room, the brief or
 * the layout changes.
 */

import { generateRuns, layoutOptions } from "./layout";
import { newId } from "./cabinets";
import {
  type ApplianceChoice,
  type Brief,
  type KitchenProject,
  type LayoutKind,
  type Opening,
  type Room,
  type WallId,
} from "./types";

export const DEFAULT_APPLIANCES: ApplianceChoice[] = [
  { kind: "fridge", variantId: "double", widthMm: 700 },
  { kind: "hob", variantId: "4b", widthMm: 600 },
  { kind: "chimney", variantId: "60", widthMm: 600 },
  { kind: "sink", variantId: "single-drain", widthMm: 900 },
  { kind: "dishwasher", variantId: "none", widthMm: 0 },
  { kind: "oven", variantId: "none", widthMm: 0 },
  { kind: "microwave", variantId: "counter", widthMm: 520 },
  { kind: "ro", variantId: "under", widthMm: 250 },
];

export const DEFAULT_BRIEF: Brief = {
  cooking: "regular",
  household: "3-4",
  cooks: 1,
  priorities: ["pots", "spices", "groceries"],
  budget: null,
};

export const DEFAULT_ROOM: Room = {
  widthMm: 3300,
  depthMm: 2800,
  ceilingMm: 2700,
  openings: [
    { id: "o-door", kind: "door", wall: "S", offsetMm: 300, widthMm: 900, heightMm: 2100, sillMm: 0 },
    { id: "o-window", kind: "window", wall: "N", offsetMm: 1200, widthMm: 1200, heightMm: 1200, sillMm: 1000 },
  ],
};

/** Everything except the runs, which are generated. */
function shell(room: Room, brief: Brief, appliances: ApplianceChoice[], layout: LayoutKind, walls: WallId[]): KitchenProject {
  return {
    id: newId("k"),
    name: "My kitchen",
    room,
    brief,
    appliances,
    layout,
    walls,
    runs: generateRuns(room, layout, walls, appliances, brief),
    carcassId: "bwp-ply",
    shutterId: "hdhmr",
    finishId: "lam-1",
    internalId: "white-lam",
    hardwareId: "premium",
    handleId: "profile",
    countertop: { materialId: "quartz", thicknessMm: 20, upstandMm: 0, waterfall: false },
    backsplash: { materialId: "tile", heightMm: 600 },
    lighting: ["led-under"],
    method: "factory",
  };
}

/** The first layout the room can actually take, best-ranked first. */
export function bestLayout(room: Room): { kind: LayoutKind; walls: WallId[] } {
  const opts = layoutOptions(room).filter((o) => o.fits);
  const first = opts[0];
  return first ? { kind: first.kind, walls: first.walls } : { kind: "straight", walls: ["N"] };
}

export function createProject(
  room: Room = DEFAULT_ROOM,
  brief: Brief = DEFAULT_BRIEF,
  appliances: ApplianceChoice[] = DEFAULT_APPLIANCES,
  chosen?: { kind: LayoutKind; walls: WallId[] }
): KitchenProject {
  const l = chosen ?? bestLayout(room);
  return shell(room, brief, appliances, l.kind, l.walls);
}

/**
 * Regenerate the cabinet runs after something upstream of them changed.
 *
 * Material, hardware and countertop choices survive; the runs do not, because
 * they are a function of the room, the brief and the appliances.
 */
/**
 * Regenerate the runs after the room, brief or appliances changed.
 *
 * Walls come from `project.walls` unless a new set is passed in (which is what
 * choosing a different layout does). Deriving them from the existing runs is
 * what produced duplicate kitchens.
 */
export function rebuildRuns(project: KitchenProject, walls?: WallId[]): KitchenProject {
  const next = walls ?? project.walls;
  return {
    ...project,
    walls: next,
    runs: generateRuns(project.room, project.layout, next, project.appliances, project.brief),
  };
}

/** §57's test project, used by the dev sample button and for manual checking. */
export const SAMPLE_PROJECT: () => KitchenProject = () =>
  createProject(
    {
      widthMm: 3300,
      depthMm: 2800,
      ceilingMm: 2700,
      openings: [
        { id: "s-door", kind: "door", wall: "S", offsetMm: 200, widthMm: 900, heightMm: 2100, sillMm: 0 },
        { id: "s-window", kind: "window", wall: "N", offsetMm: 1300, widthMm: 1200, heightMm: 1200, sillMm: 1000 },
      ],
    },
    { cooking: "heavy", household: "3-4", cooks: 2, priorities: ["pots", "spices", "oils", "groceries", "waste"], budget: 250000 },
    [
      { kind: "fridge", variantId: "side-by-side", widthMm: 900 },
      { kind: "hob", variantId: "5b", widthMm: 750 },
      { kind: "chimney", variantId: "90", widthMm: 900 },
      { kind: "sink", variantId: "single-drain", widthMm: 900 },
      { kind: "dishwasher", variantId: "12", widthMm: 600 },
      { kind: "oven", variantId: "none", widthMm: 0 },
      { kind: "microwave", variantId: "counter", widthMm: 520 },
      { kind: "ro", variantId: "under", widthMm: 250 },
    ]
  );

export function newOpening(wall: WallId, kind: Opening["kind"]): Opening {
  const isDoor = kind === "door";
  return {
    id: newId("o"),
    kind,
    wall,
    offsetMm: 300,
    widthMm: isDoor ? 900 : 1200,
    heightMm: isDoor ? 2100 : 1200,
    sillMm: isDoor ? 0 : 1000,
  };
}
