/**
 * The parametric cabinet library.
 *
 * A kitchen is assembled from these types, never from hard-coded kitchens.
 * Each entry describes what a cabinet IS — its tier, what it is for, the widths
 * it is manufactured in, and what goes inside it by default. A placed cabinet
 * is that type plus a width plus its internals, which is all the geometry,
 * pricing and BOQ layers need.
 */

import { K, type CabinetRole, type Internal, type InternalKind, type Tier } from "./types";

export interface CabinetType {
  id: string;
  label: string;
  tier: Tier;
  role: CabinetRole;
  /** Manufactured widths, mm. Anything else needs a filler or a custom cut. */
  widths: number[];
  defaultWidth: number;
  depthMm: number;
  heightMm: number;
  /** Shutters across the front. 0 for open or drawer-fronted units. */
  shutters: number;
  /** What is inside when it is first placed. */
  defaults: { shelves: number; drawers: number };
  /** One line a homeowner can read. */
  blurb: string;
  /** Hardware this type needs beyond hinges — priced by the engine. */
  needs?: ("plumbing" | "gas" | "power" | "drain")[];
}

let seq = 0;
export const newId = (p: string) => `${p}-${(seq += 1).toString(36)}`;

export function makeInternals(kind: InternalKind, count: number, accessoryId?: string): Internal[] {
  return Array.from({ length: count }, () => ({ id: newId("i"), kind, accessoryId }));
}

const BASE_H = K.baseCarcassMm;
const WALL_H = K.wallHeightMm;
const TALL_H = K.tallHeightMm;
const BASE_D = K.baseDepthMm;
const WALL_D = K.wallDepthMm;

export const CABINET_TYPES: CabinetType[] = [
  // ------------------------------------------------------------------ base --
  {
    id: "base-shutter",
    label: "Base cabinet",
    tier: "base",
    role: "storage",
    widths: [300, 400, 450, 500, 600, 750, 800, 900],
    defaultWidth: 600,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 2,
    defaults: { shelves: 1, drawers: 0 },
    blurb: "Shutters with a shelf. The cheapest way to store bulk.",
  },
  {
    id: "base-drawers",
    label: "Drawer unit",
    tier: "base",
    role: "storage",
    widths: [300, 400, 450, 500, 600, 750, 900],
    defaultWidth: 600,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 3 },
    blurb: "Everything visible without kneeling. The upgrade people notice daily.",
  },
  {
    id: "base-sink",
    label: "Sink cabinet",
    tier: "base",
    role: "sink",
    widths: [600, 750, 800, 900, 1000],
    defaultWidth: 900,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 2,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Open under the bowl for the trap, with a bin behind the doors.",
    needs: ["plumbing", "drain"],
  },
  {
    id: "base-hob",
    label: "Hob cabinet",
    tier: "base",
    role: "hob",
    widths: [600, 750, 900],
    defaultWidth: 750,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 2 },
    blurb: "Hob cut into the counter, shallow drawers below it.",
    needs: ["gas"],
  },
  {
    id: "base-oven",
    label: "Oven housing",
    tier: "base",
    role: "oven",
    widths: [600],
    defaultWidth: 600,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 1 },
    blurb: "Built-in oven with a drawer underneath.",
    needs: ["power"],
  },
  {
    id: "base-dishwasher",
    label: "Dishwasher housing",
    tier: "base",
    role: "dishwasher",
    widths: [600],
    defaultWidth: 600,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 1,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Integrated or free-standing, next to the sink for the plumbing.",
    needs: ["plumbing", "drain", "power"],
  },
  {
    id: "base-bottle",
    label: "Bottle pull-out",
    tier: "base",
    role: "storage",
    widths: [150, 200, 300],
    defaultWidth: 300,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 1,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Oils and bottles at arm's reach of the hob.",
  },
  {
    id: "base-corner",
    label: "Corner unit",
    tier: "base",
    role: "corner",
    widths: [900, 1000],
    defaultWidth: 900,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 1,
    defaults: { shelves: 1, drawers: 0 },
    blurb: "The awkward corner. What goes in it decides whether it is usable.",
  },
  {
    id: "base-open",
    label: "Open shelf unit",
    tier: "base",
    role: "storage",
    widths: [300, 400, 600],
    defaultWidth: 400,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 0,
    defaults: { shelves: 2, drawers: 0 },
    blurb: "Open cubbies at the end of a run.",
  },
  // ------------------------------------------------------------------ wall --
  {
    id: "wall-shutter",
    label: "Wall cabinet",
    tier: "wall",
    role: "storage",
    widths: [300, 400, 450, 500, 600, 750, 800, 900],
    defaultWidth: 600,
    depthMm: WALL_D,
    heightMm: WALL_H,
    shutters: 2,
    defaults: { shelves: 1, drawers: 0 },
    blurb: "Everyday crockery and dry goods above the counter.",
  },
  {
    id: "wall-liftup",
    label: "Lift-up cabinet",
    tier: "wall",
    role: "storage",
    widths: [450, 600, 750, 900],
    defaultWidth: 600,
    depthMm: WALL_D,
    heightMm: WALL_H,
    shutters: 1,
    defaults: { shelves: 1, drawers: 0 },
    blurb: "Front lifts up and stays there — no door in your face.",
  },
  {
    id: "wall-chimney",
    label: "Chimney housing",
    tier: "wall",
    role: "chimney",
    widths: [600, 750, 900],
    defaultWidth: 750,
    depthMm: WALL_D,
    heightMm: WALL_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Open bay over the hob, sized to the chimney.",
    needs: ["power"],
  },
  {
    id: "wall-microwave",
    label: "Microwave cabinet",
    tier: "wall",
    role: "microwave",
    widths: [600, 750],
    defaultWidth: 600,
    depthMm: WALL_D,
    heightMm: WALL_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Open housing at eye level, with a socket behind it.",
    needs: ["power"],
  },
  {
    id: "wall-glass",
    label: "Glass-front cabinet",
    tier: "wall",
    role: "storage",
    widths: [450, 600, 750],
    defaultWidth: 600,
    depthMm: WALL_D,
    heightMm: WALL_H,
    shutters: 2,
    defaults: { shelves: 1, drawers: 0 },
    blurb: "Display, and it breaks up a long run of solid fronts.",
  },
  {
    id: "wall-open",
    label: "Open shelving",
    tier: "wall",
    role: "storage",
    widths: [300, 450, 600, 750],
    defaultWidth: 600,
    depthMm: WALL_D,
    heightMm: WALL_H,
    shutters: 0,
    defaults: { shelves: 2, drawers: 0 },
    blurb: "Cheapest span of the run, and the one that has to stay tidy.",
  },
  // ------------------------------------------------------------------ tall --
  {
    id: "tall-pantry",
    label: "Tall pantry",
    tier: "tall",
    role: "pantry",
    widths: [450, 500, 600],
    defaultWidth: 600,
    depthMm: K.tallDepthMm,
    heightMm: TALL_H,
    shutters: 2,
    defaults: { shelves: 5, drawers: 0 },
    blurb: "Floor-to-ceiling dry storage. The single best answer to bulk groceries.",
  },
  {
    id: "tall-pullout",
    label: "Pantry pull-out",
    tier: "tall",
    role: "pantry",
    widths: [450, 600],
    defaultWidth: 600,
    depthMm: K.tallDepthMm,
    heightMm: TALL_H,
    shutters: 1,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "The whole pantry slides out. Expensive, and you reach everything.",
  },
  {
    id: "tall-tower",
    label: "Appliance tower",
    tier: "tall",
    role: "appliance-tower",
    widths: [600],
    defaultWidth: 600,
    depthMm: K.tallDepthMm,
    heightMm: TALL_H,
    shutters: 2,
    defaults: { shelves: 2, drawers: 0 },
    blurb: "Oven and microwave stacked at working height.",
    needs: ["power"],
  },
  {
    id: "tall-fridge",
    label: "Refrigerator surround",
    tier: "tall",
    role: "fridge",
    widths: [700, 800, 900, 1000],
    defaultWidth: 800,
    depthMm: K.tallDepthMm,
    heightMm: TALL_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Panels and a loft cabinet framing the fridge so the run reads as one.",
    needs: ["power"],
  },
  {
    id: "tall-broom",
    label: "Cleaning cabinet",
    tier: "tall",
    role: "storage",
    widths: [300, 450],
    defaultWidth: 450,
    depthMm: K.tallDepthMm,
    heightMm: TALL_H,
    shutters: 1,
    defaults: { shelves: 2, drawers: 0 },
    blurb: "Brooms, mops and the vacuum, out of the cooking zone.",
  },
  // ---------------------------------------------------------------- filler --
  {
    id: "filler",
    label: "Filler panel",
    tier: "base",
    role: "filler",
    widths: [30, 50, 80, 100, 150, 200],
    defaultWidth: 50,
    depthMm: BASE_D,
    heightMm: BASE_H,
    shutters: 0,
    defaults: { shelves: 0, drawers: 0 },
    blurb: "Closes the gap so a corner drawer can open without hitting the wall.",
  },
];

export function getCabinetType(id: string): CabinetType {
  return CABINET_TYPES.find((c) => c.id === id) ?? CABINET_TYPES[0];
}

export function typesForTier(tier: Tier): CabinetType[] {
  return CABINET_TYPES.filter((c) => c.tier === tier && c.role !== "filler");
}

/** Default internals for a freshly placed cabinet of this type. */
export function defaultInternals(type: CabinetType): Internal[] {
  return [
    ...makeInternals("drawer", type.defaults.drawers),
    ...makeInternals("shelf", type.defaults.shelves),
  ];
}

// ------------------------------------------------------------- accessories ---

export interface KitchenAccessory {
  id: string;
  label: string;
  brand: string;
  rate: number;
  /** Which cabinet roles it can go into. Empty = any base cabinet. */
  fits: CabinetRole[];
  tier: Tier[];
  what: string;
  /**
   * Honest advice, not a sales line. "recommended" is reserved for things that
   * earn their money in daily use; the rest say so.
   */
  verdict: "recommended" | "nice-to-have" | "aesthetic";
  why: string;
}

export const KITCHEN_ACCESSORIES: KitchenAccessory[] = [
  {
    id: "cutlery",
    label: "Cutlery tray",
    brand: "Hettich",
    rate: 3400,
    fits: ["storage", "hob"],
    tier: ["base"],
    what: "Divided insert in the top drawer.",
    verdict: "recommended",
    why: "Cheap, and it is the drawer you open twenty times a day.",
  },
  {
    id: "bottle-pullout",
    label: "Bottle pull-out",
    brand: "Hafele",
    rate: 4650,
    fits: ["storage"],
    tier: ["base"],
    what: "Narrow tower for oils and sauces beside the hob.",
    verdict: "recommended",
    why: "Puts oil within reach of the pan. Heavy cooking makes this pay for itself.",
  },
  {
    id: "pot-drawer",
    label: "Pot & pan drawer",
    brand: "Hettich",
    rate: 6800,
    fits: ["storage", "hob"],
    tier: ["base"],
    what: "Deep drawer on heavy-duty runners.",
    verdict: "recommended",
    why: "Stacked pots in a shutter cabinet means unloading three to reach one.",
  },
  {
    id: "magic-corner",
    label: "Magic corner",
    brand: "Hafele",
    rate: 18500,
    fits: ["corner"],
    tier: ["base"],
    what: "Sprung baskets that swing the blind corner out to you.",
    verdict: "nice-to-have",
    why: "Real storage recovered, but it is one of the first things to drop if the budget is tight — a plain shelf costs a fraction.",
  },
  {
    id: "carousel",
    label: "Corner carousel",
    brand: "Ebco",
    rate: 9200,
    fits: ["corner"],
    tier: ["base"],
    what: "Rotating tray in the corner.",
    verdict: "nice-to-have",
    why: "Half the price of a magic corner and recovers most of the same space.",
  },
  {
    id: "waste-bin",
    label: "Waste segregation bin",
    brand: "Hafele",
    rate: 5400,
    fits: ["sink"],
    tier: ["base"],
    what: "Two-bin pull-out under the sink.",
    verdict: "recommended",
    why: "The bin goes somewhere. Under the sink is where you scrape plates.",
  },
  {
    id: "detergent",
    label: "Under-sink organiser",
    brand: "Ebco",
    rate: 2800,
    fits: ["sink"],
    tier: ["base"],
    what: "Shaped tray that works around the trap.",
    verdict: "nice-to-have",
    why: "Uses the awkward space around the plumbing. Small money.",
  },
  {
    id: "spice-pullout",
    label: "Spice pull-out",
    brand: "Hettich",
    rate: 5200,
    fits: ["storage", "hob"],
    tier: ["base"],
    what: "Narrow tiered rack for masala dabbas.",
    verdict: "recommended",
    why: "Indian cooking reaches for spice constantly. Worth the width beside the hob.",
  },
  {
    id: "plate-organiser",
    label: "Plate organiser",
    brand: "Hettich",
    rate: 4100,
    fits: ["storage"],
    tier: ["base"],
    what: "Pegged insert that holds plates upright in a drawer.",
    verdict: "nice-to-have",
    why: "Good if you keep crockery low. Wall cabinets do the same job for nothing.",
  },
  {
    id: "pantry-baskets",
    label: "Pantry baskets",
    brand: "Ebco",
    rate: 7600,
    fits: ["pantry"],
    tier: ["tall"],
    what: "Wire baskets on runners inside the tall unit.",
    verdict: "nice-to-have",
    why: "Easier than deep shelves for bulk grocery, but shelves work.",
  },
  {
    id: "appliance-garage",
    label: "Appliance garage",
    brand: "Hafele",
    rate: 12400,
    fits: ["storage"],
    tier: ["wall"],
    what: "Roller shutter that hides the mixer and toaster on the counter.",
    verdict: "nice-to-have",
    why: "Keeps the counter clear without unplugging anything. Purely about how tidy it looks.",
  },
  {
    id: "led-under",
    label: "Under-cabinet LED",
    brand: "Ozone",
    rate: 4800,
    fits: ["storage"],
    tier: ["wall"],
    what: "Profile light under the wall cabinets.",
    verdict: "recommended",
    why: "Wall cabinets put your own shadow on the chopping board. This is the fix.",
  },
  {
    id: "led-internal",
    label: "Internal cabinet lighting",
    brand: "Ozone",
    rate: 6200,
    fits: ["pantry", "storage"],
    tier: ["tall", "wall"],
    what: "Sensor strip inside the tall units.",
    verdict: "aesthetic",
    why: "Looks expensive in a showroom. You will not miss it if you cut it.",
  },
];

export function accessoriesFor(role: CabinetRole, tier: Tier): KitchenAccessory[] {
  return KITCHEN_ACCESSORIES.filter((a) => a.tier.includes(tier) && a.fits.includes(role));
}
