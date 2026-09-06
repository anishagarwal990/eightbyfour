/**
 * What each kind of furniture is allowed to be.
 *
 * The visual configurator is deliberately not built around wardrobes. A
 * wardrobe is one record in here; a vanity, a kitchen and a retail fixture are
 * siblings that differ in which fittings make sense, whether a loft is a real
 * thing, how many compartments are typical and how thick the boards are.
 * `DEFAULT_ARCHETYPE` means a furniture type added to FURNITURE_TYPES gets a
 * working visual configurator without touching this file at all.
 */

export type FittingKind = "shelf" | "drawer" | "rail" | "accessory";
export type DoorType = "hinged" | "sliding" | "open";

export interface LayoutPresetSpec {
  id: string;
  label: string;
  blurb: string;
  /**
   * Fittings per compartment, as a repeating pattern. Index i of a layout with
   * n compartments takes pattern[i % pattern.length] — so one preset covers
   * two, three and four compartments without a branch per case.
   */
  pattern: { shelves: number; drawers: number; rails: number }[];
}

export interface FurnitureArchetype {
  /** Board thickness for carcass panels, mm. */
  panelMm: number;
  /** Back panel, mm — always thinner; it carries no load. */
  backMm: number;
  /** Skirting/plinth height under the carcass, mm. 0 = sits on the floor. */
  plinthMm: number;
  /** Shutter thickness, mm. */
  shutterMm: number;
  supportsLoft: boolean;
  /** Typical loft height, mm — only read when supportsLoft. */
  defaultLoftMm: number;
  doorTypes: DoorType[];
  defaultDoorType: DoorType;
  defaultSections: number;
  sectionRange: [number, number];
  fittings: FittingKind[];
  presets: LayoutPresetSpec[];
  /** Height of one drawer front, mm. */
  drawerMm: number;
  /** Copy for the compartment noun — "compartment", "bay", "cabinet". */
  sectionNoun: string;
}

const WARDROBE_PRESETS: LayoutPresetSpec[] = [
  {
    id: "essential",
    label: "Essential",
    blurb: "Full hanging with a shelf over each bay.",
    pattern: [{ shelves: 1, drawers: 0, rails: 1 }],
  },
  {
    id: "balanced",
    label: "Balanced",
    blurb: "Hanging, shelves and a drawer bank.",
    pattern: [
      { shelves: 1, drawers: 0, rails: 1 },
      { shelves: 4, drawers: 0, rails: 0 },
      { shelves: 1, drawers: 3, rails: 1 },
    ],
  },
  {
    id: "max-storage",
    label: "Max storage",
    blurb: "Shelves throughout, drawers low down.",
    pattern: [
      { shelves: 5, drawers: 2, rails: 0 },
      { shelves: 6, drawers: 0, rails: 0 },
      { shelves: 4, drawers: 3, rails: 0 },
    ],
  },
  {
    id: "hanging",
    label: "Hanging focused",
    blurb: "Long hanging in most bays, minimal shelving.",
    pattern: [
      { shelves: 1, drawers: 0, rails: 1 },
      { shelves: 1, drawers: 0, rails: 1 },
      { shelves: 2, drawers: 2, rails: 0 },
    ],
  },
  { id: "empty", label: "Start empty", blurb: "Bare compartments — you fit them out.", pattern: [{ shelves: 0, drawers: 0, rails: 0 }] },
];

const SHELF_PRESETS: LayoutPresetSpec[] = [
  { id: "essential", label: "Essential", blurb: "Even shelving throughout.", pattern: [{ shelves: 3, drawers: 0, rails: 0 }] },
  {
    id: "balanced",
    label: "Balanced",
    blurb: "Shelving with a drawer bank.",
    pattern: [
      { shelves: 4, drawers: 0, rails: 0 },
      { shelves: 2, drawers: 3, rails: 0 },
    ],
  },
  { id: "max-storage", label: "Max storage", blurb: "Tight shelf spacing everywhere.", pattern: [{ shelves: 6, drawers: 0, rails: 0 }] },
  { id: "empty", label: "Start empty", blurb: "Bare compartments — you fit them out.", pattern: [{ shelves: 0, drawers: 0, rails: 0 }] },
];

const DRAWER_PRESETS: LayoutPresetSpec[] = [
  {
    id: "essential",
    label: "Essential",
    blurb: "A shelf per bay, one drawer run.",
    pattern: [
      { shelves: 1, drawers: 0, rails: 0 },
      { shelves: 1, drawers: 2, rails: 0 },
    ],
  },
  { id: "balanced", label: "Balanced", blurb: "Drawers under, shelf over.", pattern: [{ shelves: 1, drawers: 2, rails: 0 }] },
  { id: "max-storage", label: "Max storage", blurb: "Drawers throughout.", pattern: [{ shelves: 0, drawers: 3, rails: 0 }] },
  { id: "empty", label: "Start empty", blurb: "Bare compartments — you fit them out.", pattern: [{ shelves: 0, drawers: 0, rails: 0 }] },
];

export const DEFAULT_ARCHETYPE: FurnitureArchetype = {
  panelMm: 18,
  backMm: 6,
  plinthMm: 75,
  shutterMm: 18,
  supportsLoft: false,
  defaultLoftMm: 610,
  doorTypes: ["hinged", "open"],
  defaultDoorType: "hinged",
  defaultSections: 3,
  sectionRange: [1, 6],
  fittings: ["shelf", "drawer", "accessory"],
  presets: SHELF_PRESETS,
  drawerMm: 190,
  sectionNoun: "compartment",
};

export const ARCHETYPES: Record<string, FurnitureArchetype> = {
  wardrobe: {
    ...DEFAULT_ARCHETYPE,
    panelMm: 19,
    plinthMm: 100,
    supportsLoft: true,
    doorTypes: ["hinged", "sliding", "open"],
    defaultSections: 3,
    sectionRange: [1, 5],
    fittings: ["shelf", "drawer", "rail", "accessory"],
    presets: WARDROBE_PRESETS,
    drawerMm: 200,
  },
  kitchen: {
    ...DEFAULT_ARCHETYPE,
    panelMm: 18,
    plinthMm: 100,
    defaultSections: 4,
    sectionRange: [2, 8],
    fittings: ["shelf", "drawer", "accessory"],
    presets: DRAWER_PRESETS,
    drawerMm: 180,
    sectionNoun: "cabinet",
  },
  "tv-unit": {
    ...DEFAULT_ARCHETYPE,
    plinthMm: 50,
    defaultSections: 3,
    sectionRange: [1, 5],
    doorTypes: ["hinged", "open"],
    defaultDoorType: "open",
    presets: SHELF_PRESETS,
    sectionNoun: "bay",
  },
  vanity: {
    ...DEFAULT_ARCHETYPE,
    plinthMm: 90,
    defaultSections: 2,
    sectionRange: [1, 4],
    presets: DRAWER_PRESETS,
    drawerMm: 170,
  },
  crockery: { ...DEFAULT_ARCHETYPE, defaultSections: 2, sectionRange: [1, 4], presets: SHELF_PRESETS },
  study: {
    ...DEFAULT_ARCHETYPE,
    plinthMm: 60,
    defaultSections: 3,
    sectionRange: [1, 5],
    doorTypes: ["hinged", "open"],
    defaultDoorType: "open",
    presets: SHELF_PRESETS,
    sectionNoun: "bay",
  },
  storage: { ...DEFAULT_ARCHETYPE, supportsLoft: true, defaultSections: 3, sectionRange: [1, 6], presets: SHELF_PRESETS },
  office: { ...DEFAULT_ARCHETYPE, defaultSections: 4, sectionRange: [2, 8], presets: DRAWER_PRESETS, sectionNoun: "bay" },
  retail: {
    ...DEFAULT_ARCHETYPE,
    plinthMm: 60,
    defaultSections: 4,
    sectionRange: [2, 8],
    doorTypes: ["open", "hinged"],
    defaultDoorType: "open",
    presets: SHELF_PRESETS,
    sectionNoun: "bay",
  },
};

export function getArchetype(typeId: string): FurnitureArchetype {
  return ARCHETYPES[typeId] ?? DEFAULT_ARCHETYPE;
}
