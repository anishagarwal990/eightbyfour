/** Appliance variants, sized the way they are actually sold in India. */

import type { ApplianceKind } from "./types";

export interface ApplianceVariant {
  id: string;
  label: string;
  widthMm: number;
  /** Depth matters for the fridge, which usually stands proud of the run. */
  depthMm: number;
  heightMm: number;
  note?: string;
}

export interface ApplianceSpec {
  kind: ApplianceKind;
  label: string;
  variants: ApplianceVariant[];
  /** Whether the kitchen can be configured without it. */
  optional: boolean;
}

export const APPLIANCES: ApplianceSpec[] = [
  {
    kind: "fridge",
    label: "Refrigerator",
    optional: false,
    variants: [
      { id: "single", label: "Single door", widthMm: 550, depthMm: 620, heightMm: 1500 },
      { id: "double", label: "Double door", widthMm: 700, depthMm: 700, heightMm: 1750 },
      { id: "side-by-side", label: "Side by side", widthMm: 900, depthMm: 740, heightMm: 1780, note: "Needs door swing clearance on both sides." },
      { id: "french", label: "French door", widthMm: 910, depthMm: 750, heightMm: 1800 },
    ],
  },
  {
    kind: "hob",
    label: "Hob",
    optional: false,
    variants: [
      { id: "2b", label: "2 burner", widthMm: 300, depthMm: 510, heightMm: 45 },
      { id: "3b", label: "3 burner", widthMm: 600, depthMm: 510, heightMm: 45 },
      { id: "4b", label: "4 burner", widthMm: 600, depthMm: 510, heightMm: 45 },
      { id: "5b", label: "5 burner", widthMm: 750, depthMm: 510, heightMm: 45 },
    ],
  },
  {
    kind: "chimney",
    label: "Chimney",
    optional: true,
    variants: [
      { id: "none", label: "None", widthMm: 0, depthMm: 0, heightMm: 0 },
      { id: "60", label: "60 cm", widthMm: 600, depthMm: 500, heightMm: 600 },
      { id: "75", label: "75 cm", widthMm: 750, depthMm: 500, heightMm: 600 },
      { id: "90", label: "90 cm", widthMm: 900, depthMm: 500, heightMm: 600 },
    ],
  },
  {
    kind: "sink",
    label: "Sink",
    optional: false,
    variants: [
      { id: "single", label: "Single bowl", widthMm: 450, depthMm: 500, heightMm: 200 },
      { id: "single-drain", label: "Single bowl + drainboard", widthMm: 900, depthMm: 500, heightMm: 200 },
      { id: "double", label: "Double bowl", widthMm: 800, depthMm: 500, heightMm: 200 },
    ],
  },
  {
    kind: "dishwasher",
    label: "Dishwasher",
    optional: true,
    variants: [
      { id: "none", label: "None", widthMm: 0, depthMm: 0, heightMm: 0 },
      { id: "12", label: "12 place", widthMm: 600, depthMm: 600, heightMm: 850 },
      { id: "14", label: "14 place", widthMm: 600, depthMm: 600, heightMm: 850 },
    ],
  },
  {
    kind: "oven",
    label: "Built-in oven",
    optional: true,
    variants: [
      { id: "none", label: "None", widthMm: 0, depthMm: 0, heightMm: 0 },
      { id: "60", label: "60 cm built-in", widthMm: 595, depthMm: 550, heightMm: 595 },
    ],
  },
  {
    kind: "microwave",
    label: "Microwave",
    optional: true,
    variants: [
      { id: "none", label: "None", widthMm: 0, depthMm: 0, heightMm: 0 },
      { id: "counter", label: "Countertop", widthMm: 520, depthMm: 420, heightMm: 300 },
      { id: "built-in", label: "Built-in", widthMm: 595, depthMm: 550, heightMm: 390 },
    ],
  },
  {
    kind: "ro",
    label: "Water purifier",
    optional: true,
    variants: [
      { id: "none", label: "None", widthMm: 0, depthMm: 0, heightMm: 0 },
      { id: "under", label: "Under sink", widthMm: 250, depthMm: 400, heightMm: 400 },
      { id: "wall", label: "Wall mounted", widthMm: 350, depthMm: 250, heightMm: 500 },
    ],
  },
];

export function applianceSpec(kind: ApplianceKind): ApplianceSpec {
  return APPLIANCES.find((a) => a.kind === kind)!;
}

export function variantOf(kind: ApplianceKind, id: string): ApplianceVariant {
  const spec = applianceSpec(kind);
  return spec.variants.find((v) => v.id === id) ?? spec.variants[0];
}
