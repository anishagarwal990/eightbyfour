import {
  ACCESSORIES,
  CARCASS_OPTIONS,
  FINISH_OPTIONS,
  HARDWARE_TIERS,
  INTERNAL_FINISH_OPTIONS,
  SHEET_SQFT,
  SHUTTER_OPTIONS,
  type Accessory,
} from "./catalogue";
import type { LayoutCounts } from "./geometry";
import type { Quote, QuoteGroup, QuoteLine } from "./types";

/**
 * The Custom Furniture pricing engine.
 *
 * Everything here is derived from the elevation area and the depth rather than
 * looked up from a rate card, because the point of Studio EightxFour is that a
 * customer can see WHY a number moved. A sheet count that comes out of a
 * formula can be shown on the quote as "7 sheets × ₹3,480"; a number that came
 * out of a lookup table cannot.
 *
 * Rates are indicative demo values for Hyderabad, mid-2026. Swapping them for
 * live catalogue rates does not change the shape of any function below.
 */

export type BuildMethod = "carpenter" | "factory";

export interface FurnitureType {
  id: string;
  label: string;
  /** Route segment under /studio/custom-furniture. */
  slug: string;
  blurb: string;
  /** Default W × H × D in feet. */
  defaults: { width: number; height: number; depth: number };
  /** Bounds for the dimension steppers. */
  limits: { width: [number, number]; height: [number, number]; depth: [number, number] };
  /** Board area consumed per sq ft of elevation, at the reference depth. */
  carcassFactor: number;
  /** Reference depth the carcass factor was measured at. */
  refDepth: number;
  /** Fraction of the elevation that is shutter face. */
  shutterCoverage: number;
  /** Shutters per sq ft of elevation — drives hinge and handle counts. */
  shutterDensity: number;
  /** Drawer sets included in the base build. */
  baseDrawers: number;
  /** Carpenter fabrication, ₹ per sq ft of elevation. */
  carpenterRate: number;
  /** Factory machining + assembly, ₹ per sq ft of elevation. */
  factoryRate: number;
  /** Installation, ₹ per sq ft of elevation, by method. */
  installRate: { carpenter: number; factory: number };
  /** Which unit-scale phrase reads correctly for this type. */
  unitNoun: string;
}

export const FURNITURE_TYPES: FurnitureType[] = [
  {
    id: "wardrobe",
    label: "Wardrobe",
    slug: "wardrobe",
    blurb: "Hinged or sliding, with or without a loft.",
    defaults: { width: 8, height: 8, depth: 2 },
    limits: { width: [3, 20], height: [6, 10], depth: [1.5, 3] },
    carcassFactor: 3.0,
    refDepth: 2,
    shutterCoverage: 0.95,
    shutterDensity: 0.07,
    baseDrawers: 0,
    carpenterRate: 520,
    factoryRate: 660,
    installRate: { carpenter: 150, factory: 210 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "kitchen",
    label: "Modular Kitchen",
    slug: "kitchen",
    blurb: "Base and wall units, priced across the full run.",
    defaults: { width: 12, height: 8, depth: 2 },
    limits: { width: [4, 30], height: [7, 10], depth: [1.5, 2.5] },
    carcassFactor: 4.1,
    refDepth: 2,
    shutterCoverage: 0.82,
    shutterDensity: 0.16,
    baseDrawers: 2,
    carpenterRate: 650,
    factoryRate: 790,
    installRate: { carpenter: 190, factory: 260 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "tv-unit",
    label: "TV Unit",
    slug: "tv-unit",
    blurb: "Console, panelling and open display in one elevation.",
    defaults: { width: 8, height: 7, depth: 1.5 },
    limits: { width: [4, 16], height: [3, 10], depth: [1, 2] },
    carcassFactor: 2.4,
    refDepth: 1.5,
    shutterCoverage: 0.55,
    shutterDensity: 0.07,
    baseDrawers: 1,
    carpenterRate: 570,
    factoryRate: 700,
    installRate: { carpenter: 160, factory: 220 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "vanity",
    label: "Vanity Unit",
    slug: "vanity",
    blurb: "Bathroom storage — the case for boil-proof board.",
    defaults: { width: 4, height: 3, depth: 1.5 },
    limits: { width: [2, 10], height: [2, 5], depth: [1, 2] },
    carcassFactor: 3.1,
    refDepth: 1.5,
    shutterCoverage: 0.88,
    shutterDensity: 0.2,
    baseDrawers: 1,
    carpenterRate: 600,
    factoryRate: 740,
    installRate: { carpenter: 180, factory: 240 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "crockery",
    label: "Crockery Unit",
    slug: "crockery",
    blurb: "Glass-fronted display over closed storage.",
    defaults: { width: 5, height: 7, depth: 1.5 },
    limits: { width: [3, 12], height: [5, 10], depth: [1, 2] },
    carcassFactor: 3.0,
    refDepth: 1.5,
    shutterCoverage: 0.78,
    shutterDensity: 0.15,
    baseDrawers: 1,
    carpenterRate: 580,
    factoryRate: 715,
    installRate: { carpenter: 165, factory: 225 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "study",
    label: "Study Unit",
    slug: "study",
    blurb: "Desk, overhead storage and cable management.",
    defaults: { width: 6, height: 7, depth: 2 },
    limits: { width: [3, 14], height: [4, 10], depth: [1.5, 3] },
    carcassFactor: 2.8,
    refDepth: 2,
    shutterCoverage: 0.6,
    shutterDensity: 0.11,
    baseDrawers: 1,
    carpenterRate: 545,
    factoryRate: 670,
    installRate: { carpenter: 155, factory: 210 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "storage",
    label: "Storage Unit",
    slug: "storage",
    blurb: "Utility and general storage, shutters throughout.",
    defaults: { width: 6, height: 8, depth: 2 },
    limits: { width: [3, 20], height: [4, 10], depth: [1, 3] },
    carcassFactor: 3.3,
    refDepth: 2,
    shutterCoverage: 0.92,
    shutterDensity: 0.13,
    baseDrawers: 0,
    carpenterRate: 490,
    factoryRate: 610,
    installRate: { carpenter: 140, factory: 195 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "office",
    label: "Office Cabinetry",
    slug: "office",
    blurb: "Workstations, storage walls and pedestal units.",
    defaults: { width: 10, height: 7, depth: 2 },
    limits: { width: [4, 40], height: [3, 10], depth: [1.5, 3] },
    carcassFactor: 3.2,
    refDepth: 2,
    shutterCoverage: 0.7,
    shutterDensity: 0.12,
    baseDrawers: 2,
    carpenterRate: 515,
    factoryRate: 635,
    installRate: { carpenter: 150, factory: 200 },
    unitNoun: "sq ft of elevation",
  },
  {
    id: "retail",
    label: "Retail Fixtures",
    slug: "retail",
    blurb: "Display, counters and back-wall systems for rollouts.",
    defaults: { width: 12, height: 8, depth: 1.5 },
    limits: { width: [4, 60], height: [3, 12], depth: [1, 3] },
    carcassFactor: 2.9,
    refDepth: 1.5,
    shutterCoverage: 0.5,
    shutterDensity: 0.09,
    baseDrawers: 0,
    carpenterRate: 590,
    factoryRate: 690,
    installRate: { carpenter: 170, factory: 215 },
    unitNoun: "sq ft of elevation",
  },
];

export function getFurnitureType(id: string): FurnitureType {
  return FURNITURE_TYPES.find((t) => t.id === id) ?? FURNITURE_TYPES[0];
}

export interface FurnitureConfig {
  typeId: string;
  method: BuildMethod;
  width: number;
  height: number;
  depth: number;
  carcassId: string;
  shutterId: string;
  finishId: string;
  internalId: string;
  hardwareId: string;
  accessoryIds: string[];
  /**
   * Set by the visual configurator only. When present, the internal fit-out is
   * counted from the geometry — every shelf, drawer, partition and rail on the
   * quote is one the customer can see in the model — instead of being folded
   * into the type's average carcass factor. The form configurator leaves it
   * undefined and keeps the averaged behaviour.
   */
  layout?: LayoutCounts;
}

export const DEFAULT_CONFIG: FurnitureConfig = {
  typeId: "wardrobe",
  method: "carpenter",
  width: 8,
  height: 8,
  depth: 2,
  carcassId: "bwp-ply",
  shutterId: "mdf",
  finishId: "lam-1",
  internalId: "white-lam",
  hardwareId: "premium",
  accessoryIds: [],
};

/** Accessories offered for a given furniture type. */
export function accessoriesFor(typeId: string): Accessory[] {
  return ACCESSORIES.filter((a) => !a.onlyFor || a.onlyFor.includes(typeId));
}

/**
 * Factory modular carries a machining premium on the panel itself (CNC time,
 * four-sided edge banding, line drilling) and a shorter site install. Carpenter
 * work carries more site labour and more wastage. Both are real; neither is
 * universally cheaper, which is the point of showing them side by side.
 */
const FACTORY_EDGE_BAND_RATE = 46; // ₹ per running ft, 4-side factory banding
const CARPENTER_EDGE_BAND_RATE = 18; // hand-applied banding, front edges only
const WASTAGE = { carpenter: 1.12, factory: 1.06 };
const CONSUMABLES_RATE = { carpenter: 58, factory: 44 }; // ₹/sq ft — adhesive, screws, ply strips
/**
 * Per-piece fit-out work. Whole sheets are bought whole, so two extra shelves
 * often come out of board already being paid for — but they still have to be
 * cut, banded and hung, and that is per shelf. Without these rates the price
 * does not move when the layout does, which is the one thing this tool has to
 * get right.
 */
const FIT_OUT_RATES = {
  carpenter: { shelf: 165, drawerBox: 880, partition: 340 },
  factory: { shelf: 210, drawerBox: 1050, partition: 420 },
};
/** Pins/supports per shelf — four per shelf at a shade under ₹20 each. */
const SHELF_SUPPORT_RATE = 75;
const DELIVERY_BASE = 2800;
const DELIVERY_PER_SHEET = 210;

function round(n: number): number {
  return Math.round(n);
}

/** Sheets needed for an area, always whole sheets — you cannot buy 0.4 of one. */
function sheets(areaSqft: number): number {
  return Math.max(1, Math.ceil(areaSqft / SHEET_SQFT));
}

export function priceFurniture(config: FurnitureConfig): Quote {
  const type = getFurnitureType(config.typeId);
  const carcass = CARCASS_OPTIONS.find((o) => o.id === config.carcassId) ?? CARCASS_OPTIONS[0];
  const shutter = SHUTTER_OPTIONS.find((o) => o.id === config.shutterId) ?? SHUTTER_OPTIONS[0];
  const finish = FINISH_OPTIONS.find((o) => o.id === config.finishId) ?? FINISH_OPTIONS[0];
  const internal = INTERNAL_FINISH_OPTIONS.find((o) => o.id === config.internalId) ?? INTERNAL_FINISH_OPTIONS[0];
  const hardware = HARDWARE_TIERS.find((o) => o.id === config.hardwareId) ?? HARDWARE_TIERS[0];
  const counts = config.layout;

  const elevation = config.width * config.height;
  const depthScale = config.depth / type.refDepth;
  const waste = WASTAGE[config.method];

  // --- boards -------------------------------------------------------------
  // `carcassFactor` bakes in an average internal fit-out. Once we know the
  // actual fit-out from the geometry, that average is the wrong number: the
  // shell is counted here and every shelf, drawer box and partition is counted
  // and shown separately below. SHELL_SHARE is the fraction of the averaged
  // factor that is genuinely shell — sides, top, bottom, back and plinth.
  const SHELL_SHARE = 0.55;
  const factor = counts ? type.carcassFactor * SHELL_SHARE : type.carcassFactor;
  const carcassArea = elevation * factor * depthScale * waste;
  const fitOutArea = counts ? (counts.shelfAreaSqft + counts.partitionAreaSqft + counts.loftCarcassSqft) * waste : 0;
  const shellSheets = sheets(carcassArea);
  const fitOutSheets = fitOutArea > 0 ? sheets(fitOutArea) : 0;
  const carcassSheets = shellSheets + fitOutSheets;

  const shutterFaceArea = counts
    ? counts.shutterFaceSqft + counts.loftShutterSqft
    : elevation * type.shutterCoverage;
  const shutterSheets = sheets(shutterFaceArea * waste);

  // --- finish -------------------------------------------------------------
  // Pressed finishes are bought as sheets; sprayed finishes (PU, polished
  // veneer) are priced by application area instead.
  const finishArea = shutterFaceArea + elevation * 0.25 * depthScale; // + exposed carcass faces
  const finishSheets = sheets(finishArea * waste);
  const finishMaterial = finish.rate > 0 ? finishSheets * finish.rate : 0;

  // Balancing laminate on the reverse of every pressed shutter — skipping it
  // is the single most common cause of a bowed shutter, so it is not optional.
  const balancingSheets = finish.sprayed ? 0 : shutterSheets;
  const balancingRate = 780;

  const internalArea = carcassArea * 0.55;
  const internalSheets = internal.rate > 0 ? sheets(internalArea) : 0;

  // --- hardware -----------------------------------------------------------
  const shutterCount = counts ? counts.shutters : Math.max(2, Math.round(elevation * type.shutterDensity));
  // Sliding shutters run on a track, not on hinges.
  const hingeCount =
    counts && counts.doorType !== "hinged" ? 0 : shutterCount * (config.height > 7 ? 4 : 3);
  const handleCount = shutterCount;
  const drawerSets = counts
    ? counts.drawers
    : type.baseDrawers + (config.accessoryIds.includes("drawers") ? 3 : 0);

  const hingeCost = hingeCount * hardware.hingeRate;
  const handleCost = handleCount * hardware.handleRate;
  const channelCost = drawerSets * hardware.channelRate;

  // --- edge banding -------------------------------------------------------
  const bandingRate = config.method === "factory" ? FACTORY_EDGE_BAND_RATE : CARPENTER_EDGE_BAND_RATE;
  // Every shelf and drawer front gets a banded edge; on a layout we know how
  // many there are instead of assuming an average.
  const fitOutBandingFt = counts
    ? (counts.shelves + counts.drawers) * averageSectionWidthFt(counts, config.width)
    : 0;
  const bandingRunningFt =
    (config.method === "factory" ? elevation * 2.6 : elevation * 1.1) + fitOutBandingFt;
  const bandingCost = bandingRunningFt * bandingRate;

  const materialLines: QuoteLine[] = [
    {
      label: `${carcass.brand} ${carcass.label} — ${counts ? "carcass shell" : "carcass"}`,
      detail: `${carcass.spec} · ${shellSheets} sheets × ₹${carcass.rate.toLocaleString("en-IN")}`,
      amount: round(shellSheets * carcass.rate),
      catalogueHref: carcass.catalogue,
    },
    ...(fitOutSheets > 0
      ? [
          {
            label: `${carcass.brand} ${carcass.label} — internal fit-out`,
            detail: `${describeFitOut(counts!)} · ${fitOutSheets} sheets × ₹${carcass.rate.toLocaleString("en-IN")}`,
            amount: round(fitOutSheets * carcass.rate),
            catalogueHref: carcass.catalogue,
          },
        ]
      : []),
    {
      label: `${shutter.brand} ${shutter.label} — shutters`,
      detail: `${shutter.spec} · ${shutterSheets} sheets × ₹${shutter.rate.toLocaleString("en-IN")}`,
      amount: round(shutterSheets * shutter.rate),
      catalogueHref: shutter.catalogue,
    },
  ];

  if (finishMaterial > 0) {
    materialLines.push({
      label: `${finish.brand} ${finish.label}`,
      detail: `${finish.spec} · ${finishSheets} sheets × ₹${finish.rate.toLocaleString("en-IN")}`,
      amount: round(finishMaterial),
      catalogueHref: finish.catalogue,
    });
  }

  if (balancingSheets > 0) {
    materialLines.push({
      label: "Balancing laminate",
      detail: `0.8 mm · ${balancingSheets} sheets × ₹${balancingRate.toLocaleString("en-IN")}`,
      amount: round(balancingSheets * balancingRate),
      catalogueHref: "/products/laminates",
    });
  }

  if (internalSheets > 0) {
    materialLines.push({
      label: `${internal.label} — interiors`,
      detail: `${internal.spec} · ${internalSheets} sheets × ₹${internal.rate.toLocaleString("en-IN")}`,
      amount: round(internalSheets * internal.rate),
      catalogueHref: internal.catalogue,
    });
  }

  materialLines.push(
    {
      label: `${hardware.brand} hinges`,
      detail: `${hingeCount} × ₹${hardware.hingeRate.toLocaleString("en-IN")}`,
      amount: round(hingeCost),
      catalogueHref: "/products",
    },
    {
      label: `${hardware.brand} handles`,
      detail: `${handleCount} × ₹${hardware.handleRate.toLocaleString("en-IN")}`,
      amount: round(handleCost),
      catalogueHref: "/products",
    }
  );

  if (counts && counts.shelves > 0) {
    materialLines.push({
      label: "Shelf supports & pins",
      detail: `${counts.shelves} shelves × ₹${SHELF_SUPPORT_RATE} — four supports per shelf`,
      amount: round(counts.shelves * SHELF_SUPPORT_RATE),
      catalogueHref: "/products",
    });
  }

  if (counts && counts.rails > 0) {
    materialLines.push({
      label: "Hanging rails & supports",
      detail: `${counts.rails} × ₹${(1450).toLocaleString("en-IN")} — oval rail, end caps, centre bracket`,
      amount: round(counts.rails * 1450),
      catalogueHref: "/products",
    });
  }

  if (counts && counts.doorType === "sliding" && counts.shutters > 0) {
    materialLines.push({
      label: `${hardware.brand} sliding track set`,
      detail: `${Math.round(config.width)} running ft of top and bottom track, rollers and guides`,
      amount: round(config.width * 1180 + 4200),
      catalogueHref: "/products",
    });
  }

  if (drawerSets > 0) {
    materialLines.push({
      label: `${hardware.brand} drawer runners`,
      detail: `${drawerSets} sets × ₹${hardware.channelRate.toLocaleString("en-IN")}`,
      amount: round(channelCost),
      catalogueHref: "/products",
    });
  }

  materialLines.push({
    label: "Edge banding",
    detail:
      config.method === "factory"
        ? `4-side factory banding · ${Math.round(bandingRunningFt)} running ft × ₹${bandingRate}`
        : `Front-edge banding · ${Math.round(bandingRunningFt)} running ft × ₹${bandingRate}`,
    amount: round(bandingCost),
    catalogueHref: "/products",
  });

  materialLines.push({
    label: "Adhesive & consumables",
    detail: `Fevicol, screws, ply strips · ${Math.round(elevation)} sq ft × ₹${CONSUMABLES_RATE[config.method]}`,
    amount: round(elevation * CONSUMABLES_RATE[config.method]),
    catalogueHref: "/products/adhesive",
  });

  // Accessories are bought-in units, so they sit with materials, not labour.
  const chosenAccessories = accessoriesFor(config.typeId).filter((a) => config.accessoryIds.includes(a.id));
  for (const acc of chosenAccessories) {
    // The drawer bank's runners are already priced above as a hardware line.
    const amount = acc.id === "drawers" ? acc.rate - hardware.channelRate * 3 : acc.rate;
    materialLines.push({
      label: acc.label,
      detail: `${acc.brand} · 1 ${acc.unit}`,
      amount: round(Math.max(0, amount)),
      catalogueHref: "/products",
    });
  }

  // --- fabrication --------------------------------------------------------
  const baseFabRate = config.method === "carpenter" ? type.carpenterRate : type.factoryRate;
  const fabricationLines: QuoteLine[] = [
    {
      label: config.method === "carpenter" ? "Site carpentry" : "Factory machining & assembly",
      detail:
        config.method === "carpenter"
          ? `${Math.round(elevation)} sq ft × ₹${baseFabRate} — cutting, carcass build, shutter making`
          : `${Math.round(elevation)} sq ft × ₹${baseFabRate} — CNC sizing, boring, pre-assembly`,
      amount: round(elevation * baseFabRate),
    },
    {
      label: `${finish.label} application`,
      detail: finish.sprayed
        ? `${Math.round(finishArea)} sq ft × ₹${finish.applicationRate} — booth spray & cure`
        : `${Math.round(finishArea)} sq ft × ₹${finish.applicationRate} — pressing & trimming`,
      amount: round(finishArea * finish.applicationRate),
    },
  ];

  if (counts) {
    const r = FIT_OUT_RATES[config.method];
    const fitOutLabour =
      counts.shelves * r.shelf + counts.drawers * r.drawerBox + counts.partitions * r.partition;
    if (fitOutLabour > 0) {
      fabricationLines.push({
        label: "Internal fit-out",
        detail: [
          counts.shelves > 0 ? `${counts.shelves} shelves × ₹${r.shelf}` : null,
          counts.drawers > 0 ? `${counts.drawers} drawer boxes × ₹${r.drawerBox.toLocaleString("en-IN")}` : null,
          counts.partitions > 0 ? `${counts.partitions} partitions × ₹${r.partition}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        amount: round(fitOutLabour),
      });
    }
  }

  // --- installation -------------------------------------------------------
  const installRate = type.installRate[config.method];
  const installationLines: QuoteLine[] = [
    {
      label: config.method === "carpenter" ? "Fitting & finishing" : "Site assembly & alignment",
      detail: `${Math.round(elevation)} sq ft × ₹${installRate}`,
      amount: round(elevation * installRate),
    },
    {
      label: "Hardware fitting & adjustment",
      detail: `${hingeCount} hinges, ${handleCount} handles${drawerSets ? `, ${drawerSets} drawers` : ""}`,
      amount: round(hingeCount * 55 + handleCount * 40 + drawerSets * 220),
    },
  ];

  // --- delivery -----------------------------------------------------------
  const totalSheets = carcassSheets + shutterSheets + finishSheets + balancingSheets + internalSheets;
  const deliveryLines: QuoteLine[] = [
    {
      label: config.method === "carpenter" ? "Material delivery to site" : "Finished module delivery",
      detail:
        config.method === "carpenter"
          ? `${totalSheets} sheets · Hyderabad`
          : `${totalSheets} sheets' worth of finished modules · Hyderabad`,
      amount: round(DELIVERY_BASE + totalSheets * DELIVERY_PER_SHEET * (config.method === "factory" ? 1.3 : 1)),
    },
  ];

  const groups: QuoteGroup[] = ([
    { key: "materials", label: "Materials", lines: materialLines, subtotal: 0 },
    { key: "fabrication", label: "Fabrication", lines: fabricationLines, subtotal: 0 },
    { key: "installation", label: "Installation", lines: installationLines, subtotal: 0 },
    { key: "delivery", label: "Delivery", lines: deliveryLines, subtotal: 0 },
  ] satisfies QuoteGroup[]).map((g) => ({ ...g, subtotal: g.lines.reduce((sum, l) => sum + l.amount, 0) }));

  const total = groups.reduce((sum, g) => sum + g.subtotal, 0);

  const spec = [
    `${config.width}′ W × ${config.height}′ H × ${config.depth}′ D`,
    config.method === "carpenter" ? "Carpenter made" : "Factory modular",
    `${carcass.label} carcass`,
    `${shutter.label} shutters`,
    finish.label,
    `${hardware.label} hardware`,
    ...chosenAccessories.map((a) => a.label),
  ];

  return {
    title: `${type.label} — ${config.width}′ × ${config.height}′ × ${config.depth}′`,
    spec,
    groups,
    total,
    rate: { amount: Math.round(total / elevation), unit: `per ${type.unitNoun}` },
  };
}

/** Price the same specification the other way round, for the compare view. */
export function priceBothMethods(config: FurnitureConfig): { carpenter: Quote; factory: Quote } {
  return {
    carpenter: priceFurniture({ ...config, method: "carpenter" }),
    factory: priceFurniture({ ...config, method: "factory" }),
  };
}

export const BUILD_METHODS: Record<
  BuildMethod,
  { label: string; where: string; benefits: string[]; tradeoffs: string[]; lead: string }
> = {
  carpenter: {
    label: "Carpenter Made",
    where: "Built at your site.",
    benefits: [
      "Changes can be made while the work is happening",
      "Handles walls that are out of square or out of plumb",
      "Every individual material is yours to choose",
      "Traditional plywood construction, familiar to any future carpenter",
      "No module size limits — one continuous run is possible",
    ],
    tradeoffs: [
      "Dust and noise on site for the duration",
      "Edge banding applied by hand, usually on visible edges only",
      "Finish quality tracks the individual carpenter",
    ],
    lead: "18–25 days on site",
  },
  factory: {
    label: "Factory Modular",
    where: "Machined in a factory. Assembled at your site.",
    benefits: [
      "Panel sizes cut to ±0.2 mm on a beam saw",
      "Edge banding on all four sides of every panel",
      "Line drilling to a 32 mm system — shelves are repositionable later",
      "Two to three days of site work instead of three weeks",
      "Repeatable across units, which matters on rollouts",
    ],
    tradeoffs: [
      "Dimensions are frozen once panels are cut",
      "Needs accurate site measurement before production starts",
      "Modules must fit through the door and the lift",
    ],
    lead: "12–18 days, of which 2–3 on site",
  },
};

/**
 * The internal fit-out, written the way it reads on a quote: not "42 sq ft of
 * board" but the actual pieces the customer put in the model.
 */
function describeFitOut(counts: LayoutCounts): string {
  const parts: string[] = [];
  if (counts.shelves > 0) parts.push(`${counts.shelves} shelves`);
  if (counts.partitions > 0) parts.push(`${counts.partitions} partitions`);
  if (counts.drawers > 0) parts.push(`${counts.drawers} drawer boxes`);
  if (counts.loft) parts.push("loft carcass");
  return parts.length > 0 ? parts.join(", ") : "internal panels";
}

/** Mean compartment width in feet — the length of one shelf's banded front. */
function averageSectionWidthFt(counts: LayoutCounts, widthFt: number): number {
  return counts.sections > 0 ? widthFt / counts.sections : widthFt;
}
