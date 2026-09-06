/**
 * The canonical kitchen model.
 *
 * One object describes the kitchen. The plan, the elevations, the 3D scene,
 * the exploded view, the BOQ and the price are all *derived* from it — none of
 * them holds geometry of its own. That is the whole architectural bet: the
 * moment a 600 mm cabinet becomes 900 mm, every representation moves together
 * because there is only one thing to move.
 *
 * Millimetres throughout. Feet are an entry and display unit only.
 */

import type { BuildMethod } from "../furniture";

// ------------------------------------------------------------------- room ---

/** Walls are named by compass position looking at the plan from above. */
export type WallId = "N" | "E" | "S" | "W";

export const WALL_IDS: WallId[] = ["N", "E", "S", "W"];

export const WALL_LABEL: Record<WallId, string> = {
  N: "Back wall",
  E: "Right wall",
  S: "Front wall",
  W: "Left wall",
};

export type OpeningKind = "door" | "window" | "balcony" | "utility";

export interface Opening {
  id: string;
  kind: OpeningKind;
  wall: WallId;
  /** Distance from the wall's start corner to the opening's near edge. */
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  /** Floor to underside. 0 for a door. */
  sillMm: number;
}

export interface Room {
  /** Wall A — the N/S walls run this long. */
  widthMm: number;
  /** Wall B — the E/W walls run this long. */
  depthMm: number;
  ceilingMm: number;
  openings: Opening[];
}

// -------------------------------------------------------------- appliances ---

export type ApplianceKind =
  | "fridge"
  | "hob"
  | "chimney"
  | "sink"
  | "oven"
  | "microwave"
  | "dishwasher"
  | "ro";

export interface ApplianceChoice {
  kind: ApplianceKind;
  /** Catalogue variant id, e.g. "side-by-side". "none" means not fitted. */
  variantId: string;
  widthMm: number;
}

// ------------------------------------------------------------------ brief ---

export type CookingIntensity = "light" | "regular" | "heavy";
export type Household = "1-2" | "3-4" | "5+";

export type StoragePriority =
  | "pots"
  | "pressure-cookers"
  | "groceries"
  | "spices"
  | "oils"
  | "crockery"
  | "appliances"
  | "cleaning"
  | "baking"
  | "waste";

export interface Brief {
  cooking: CookingIntensity;
  household: Household;
  cooks: 1 | 2 | 3;
  priorities: StoragePriority[];
  /** Target budget in rupees. Null = not stated. */
  budget: number | null;
}

// --------------------------------------------------------------- cabinets ---

export type Tier = "base" | "wall" | "tall";

/**
 * What a cabinet is FOR. Drives layout placement, validation and the service
 * points — a sink cabinet needs plumbing, a hob cabinet needs gas and a
 * chimney above it, and neither is a matter of what is drawn on its front.
 */
export type CabinetRole =
  | "storage"
  | "sink"
  | "hob"
  | "oven"
  | "dishwasher"
  | "fridge"
  | "chimney"
  | "microwave"
  | "corner"
  | "filler"
  | "pantry"
  | "appliance-tower";

export type InternalKind = "shelf" | "drawer" | "pullout" | "carousel" | "bin" | "rail" | "open";

export interface Internal {
  id: string;
  kind: InternalKind;
  /** Accessory id from the accessories catalogue, when this is a fitted item. */
  accessoryId?: string;
  /** Drawer front height, mm. Only meaningful for drawers. */
  heightMm?: number;
}

export interface PlacedCabinet {
  id: string;
  typeId: string;
  widthMm: number;
  internals: Internal[];
  /** Set when Studio placed this itself, and why — shown to the user. */
  reason?: string;
}

export interface CabinetRun {
  id: string;
  wall: WallId;
  tier: Tier;
  /** Distance from the wall's start corner to the run's first cabinet. */
  startMm: number;
  cabinets: PlacedCabinet[];
}

// ------------------------------------------------------------ layout kinds ---

export type LayoutKind = "straight" | "l-shaped" | "parallel" | "u-shaped" | "island";

export const LAYOUT_LABEL: Record<LayoutKind, string> = {
  straight: "Straight",
  "l-shaped": "L-shaped",
  parallel: "Parallel",
  "u-shaped": "U-shaped",
  island: "Island",
};

// ------------------------------------------------------------- surfaces ----

export interface CountertopChoice {
  materialId: string;
  thicknessMm: number;
  /** Skirting up the wall behind the counter. 0 = none, tiles instead. */
  upstandMm: number;
  waterfall: boolean;
}

export interface BacksplashChoice {
  materialId: string;
  heightMm: number;
}

// ------------------------------------------------------------- the project --

export interface KitchenProject {
  id: string;
  name: string;
  room: Room;
  brief: Brief;
  appliances: ApplianceChoice[];
  layout: LayoutKind;
  /**
   * Which walls the layout runs along, in order.
   *
   * Stored rather than derived from `runs`: a wall carries a base run AND a
   * wall run AND sometimes a tall run, so reading the walls back out of the
   * runs returns each one two or three times — and regenerating from that list
   * builds the kitchen twice over, every time, compounding on each edit.
   */
  walls: WallId[];
  runs: CabinetRun[];
  /** Material ids resolved against the EightByFour catalogue. */
  carcassId: string;
  shutterId: string;
  finishId: string;
  internalId: string;
  hardwareId: string;
  handleId: string;
  countertop: CountertopChoice;
  backsplash: BacksplashChoice;
  lighting: string[];
  method: BuildMethod;
}

// ---------------------------------------------------------------- geometry --

/** Standard heights. Indian modular practice, in millimetres. */
export const K = {
  plinthMm: 100,
  /** Carcass height of a base unit, above the plinth and below the counter. */
  baseCarcassMm: 720,
  counterMm: 20,
  /** Floor to top of counter = plinth + carcass + counter. */
  get counterTopMm() {
    return this.plinthMm + this.baseCarcassMm + this.counterMm;
  },
  baseDepthMm: 600,
  /** Floor to underside of the wall cabinets. */
  wallSillMm: 1450,
  wallHeightMm: 700,
  wallDepthMm: 350,
  tallHeightMm: 2100,
  tallDepthMm: 600,
  panelMm: 18,
  backMm: 6,
  shutterMm: 18,
  /** Gap between a shutter and its neighbour. */
  revealMm: 3,
  /** Clear walkway a kitchen needs in front of a run. */
  minWalkwayMm: 900,
  /** Comfortable walkway between two facing runs. */
  goodWalkwayMm: 1200,
} as const;
