import { SURFACE_OPTIONS } from "./catalogue.ts";
import type { Quote, QuoteGroup, QuoteLine } from "./types.ts";

/**
 * Acrylic solid surface pricing.
 *
 * Solid surface is sold by the sheet but priced by the joint: the material is
 * a minority of most counter quotes and thermoforming, seaming and cut-outs
 * are the majority. This engine keeps those apart so a customer can see that
 * a second sink cut-out costs more than a slightly better shade.
 */

export interface SurfaceApplication {
  id: string;
  label: string;
  blurb: string;
  /** Counter depth in inches — drives how much of a 30" sheet is used. */
  depthIn: number;
  defaults: { runFt: number };
  /** Cut-outs that make sense here, pre-ticked where they are near-universal. */
  suggestedCutouts: string[];
  /** Fabrication complexity multiplier over a plain straight run. */
  complexity: number;
}

export const SURFACE_APPLICATIONS: SurfaceApplication[] = [
  { id: "kitchen", label: "Kitchen Countertop", blurb: "Straight run, L or U, with sink and hob.", depthIn: 25, defaults: { runFt: 10 }, suggestedCutouts: ["sink", "hob", "tap"], complexity: 1 },
  { id: "vanity", label: "Vanity Counter", blurb: "Bathroom counter, often with an integrated basin.", depthIn: 21, defaults: { runFt: 4 }, suggestedCutouts: ["basin", "tap"], complexity: 1.05 },
  { id: "reception", label: "Reception Desk", blurb: "Two-level counter with a transaction top.", depthIn: 30, defaults: { runFt: 8 }, suggestedCutouts: ["grommet"], complexity: 1.35 },
  { id: "commercial", label: "Commercial Counter", blurb: "Retail, F&B or billing counters, often curved.", depthIn: 28, defaults: { runFt: 12 }, suggestedCutouts: [], complexity: 1.3 },
  { id: "cladding", label: "Wall Cladding", blurb: "Seamless wall panels, back-fixed.", depthIn: 30, defaults: { runFt: 12 }, suggestedCutouts: [], complexity: 0.85 },
  { id: "healthcare", label: "Healthcare Counter", blurb: "Coved, non-porous, joint-free for hygiene compliance.", depthIn: 26, defaults: { runFt: 10 }, suggestedCutouts: ["basin", "tap"], complexity: 1.45 },
];

export interface EdgeProfile {
  id: string;
  label: string;
  detail: string;
  /** ₹ per running ft of finished edge. */
  rate: number;
}

export const EDGE_PROFILES: EdgeProfile[] = [
  { id: "square", label: "Square (12 mm)", detail: "Sheet thickness, eased corners. Cleanest and cheapest.", rate: 180 },
  { id: "buildup-25", label: "Build-up 25 mm", detail: "Doubled edge — reads as a thicker slab.", rate: 420 },
  { id: "buildup-40", label: "Build-up 40 mm", detail: "Chunky architectural edge, fully seamless.", rate: 680 },
  { id: "bullnose", label: "Bullnose", detail: "Fully rounded, machined and polished.", rate: 520 },
  { id: "waterfall", label: "Waterfall", detail: "Edge returns to the floor at one or both ends.", rate: 1450 },
];

export interface Cutout {
  id: string;
  label: string;
  detail: string;
  rate: number;
}

export const CUTOUTS: Cutout[] = [
  { id: "sink", label: "Sink cut-out (undermount)", detail: "Cut, polished and reinforced on the underside.", rate: 3800 },
  { id: "basin", label: "Basin cut-out", detail: "Undermount or integrated seamless basin seat.", rate: 3200 },
  { id: "hob", label: "Hob cut-out", detail: "Heat-relieved corners to prevent stress cracks.", rate: 2600 },
  { id: "tap", label: "Tap hole", detail: "Per hole, cored and polished.", rate: 750 },
  { id: "grommet", label: "Cable grommet", detail: "Per hole, with a finished collar.", rate: 900 },
  { id: "drainer", label: "Drainer grooves", detail: "Machined draining channels beside the sink.", rate: 5400 },
];

export const THICKNESSES = [
  { id: "6", label: "6 mm", detail: "Cladding and vertical work only.", factor: 0.62 },
  { id: "12", label: "12 mm", detail: "The standard for counters and vanities.", factor: 1 },
  { id: "20", label: "20 mm", detail: "Heavy commercial use and unsupported spans.", factor: 1.72 },
];

export const BACKSPLASH = [
  { id: "none", label: "None", detail: "Tiled or painted wall behind.", rateFt: 0 },
  { id: "upstand", label: "4 inch upstand", detail: "Coved into the counter — no silicone joint.", rateFt: 620 },
  { id: "full", label: "Full-height splashback", detail: "Counter to underside of wall units.", rateFt: 2350 },
];

/** Where the solid surface sheet comes from — us, or the customer. */
export type SurfaceMaterialSource = "eightbyfour" | "own";

export interface SurfaceConfig {
  applicationId: string;
  surfaceId: string;
  thicknessId: string;
  runFt: number;
  edgeId: string;
  cutoutIds: string[];
  backsplashId: string;
  /** Site seaming and fitting, vs supply of a fabricated top only. */
  installation: boolean;
  materialSource: SurfaceMaterialSource;
}

export const DEFAULT_SURFACE_CONFIG: SurfaceConfig = {
  applicationId: "kitchen",
  surfaceId: "himacs-white",
  thicknessId: "12",
  runFt: 10,
  edgeId: "buildup-25",
  cutoutIds: ["sink", "hob", "tap"],
  backsplashId: "upstand",
  installation: true,
  materialSource: "eightbyfour",
};

/** A standard solid surface sheet: 12 ft × 30 in. */
const SHEET_RUN_FT = 12;
const SHEET_DEPTH_IN = 30;

/**
 * Fabrication is one number, not a stack of per-item charges.
 *
 * Everything the workshop does to turn sheets into a finished top — cutting,
 * routing, every seam, every cut-out, the edge build-up, the coved upstand,
 * polishing — is billed at ₹130 per sq ft of finished surface, or ₹2,600 per
 * sheet consumed, whichever is higher. The per-sheet floor covers the small
 * job where a nearly-whole sheet is used for a short run.
 *
 * The edge profile, cut-outs and backsplash are still chosen — they define the
 * job and the drawing — they just do not each carry their own line.
 */
const FAB_RATE_PER_SQFT = 130;
const FAB_FLOOR_PER_SHEET = 2600;

const INSTALL_RATE_PER_RUN_FT = 340;
const SITE_MINIMUM = 6500;
const DELIVERY = 2400;

export function priceSurface(config: SurfaceConfig): Quote {
  const app = SURFACE_APPLICATIONS.find((a) => a.id === config.applicationId) ?? SURFACE_APPLICATIONS[0];
  const surface = SURFACE_OPTIONS.find((s) => s.id === config.surfaceId) ?? SURFACE_OPTIONS[0];
  const thickness = THICKNESSES.find((t) => t.id === config.thicknessId) ?? THICKNESSES[1];
  const edge = EDGE_PROFILES.find((e) => e.id === config.edgeId) ?? EDGE_PROFILES[0];
  const splash = BACKSPLASH.find((b) => b.id === config.backsplashId) ?? BACKSPLASH[0];

  // How many counter lengths come out of one sheet's width, and therefore how
  // much of a sheet each running foot of counter consumes.
  const stripsPerSheet = Math.max(1, Math.floor(SHEET_DEPTH_IN / app.depthIn));
  const runFtPerSheet = SHEET_RUN_FT * stripsPerSheet;

  const own = config.materialSource === "own";

  // Finished surface area: the counter itself, plus a full-height splashback
  // (a real second surface) or the small return of a coved upstand.
  const counterAreaSqFt = config.runFt * (app.depthIn / 12);
  const splashAreaSqFt =
    splash.id === "full" ? config.runFt * 2 : splash.id === "upstand" ? config.runFt * (4 / 12) : 0;
  const finishedAreaSqFt = counterAreaSqFt + splashAreaSqFt;

  const splashRunFt = splash.rateFt > 0 ? config.runFt : 0;
  const effectiveRunFt = config.runFt + splashRunFt * (splash.id === "full" ? 0.9 : 0.18);

  const sheetCount = Math.max(1, Math.ceil(effectiveRunFt / runFtPerSheet));
  const sheetRate = Math.round(surface.rate * thickness.factor);

  const chosenCutouts = CUTOUTS.filter((c) => config.cutoutIds.includes(c.id));

  const materialLines: QuoteLine[] = [];

  if (!own) {
    materialLines.push({
      label: `${surface.brand} ${surface.label}`,
      detail: `${thickness.label} · ${surface.shade} · ${sheetCount} sheet${sheetCount > 1 ? "s" : ""} × ₹${sheetRate.toLocaleString("en-IN")}`,
      amount: sheetCount * sheetRate,
      catalogueHref: "/products/corian-acrylic-solid-surface",
    });
  }

  materialLines.push(
    {
      label: "Two-part adhesive & colour-matched filler",
      detail: `${sheetCount} sheet${sheetCount > 1 ? "s" : ""} · colour matched to ${surface.shade}`,
      amount: sheetCount * 1450,
      catalogueHref: "/products/adhesive",
    },
    {
      label: "Substrate & support framework",
      detail: `${Math.round(config.runFt)} running ft × ₹280 — ply sub-top and brackets`,
      amount: Math.round(config.runFt * 280),
      catalogueHref: "/products/plywood",
    }
  );

  // One fabrication line: ₹130 per finished sq ft, or ₹2,600 per sheet,
  // whichever is higher. Edge, cut-outs, seams and splashback are all in it.
  const fabByArea = Math.round(finishedAreaSqFt * FAB_RATE_PER_SQFT);
  const fabBySheet = sheetCount * FAB_FLOOR_PER_SHEET;
  const fabAmount = Math.max(fabByArea, fabBySheet);
  const fabByFloor = fabBySheet > fabByArea;

  const scopeParts = [
    "cutting, routing & polishing",
    `${edge.label.toLowerCase()} edge`,
    ...chosenCutouts.map((c) => c.label.toLowerCase()),
    ...(splash.rateFt > 0 ? [splash.label.toLowerCase()] : []),
  ];

  const fabricationLines: QuoteLine[] = [
    {
      label: "Fabrication",
      detail: fabByFloor
        ? `${sheetCount} sheet${sheetCount > 1 ? "s" : ""} × ₹${FAB_FLOOR_PER_SHEET.toLocaleString("en-IN")} (per-sheet minimum) — ${scopeParts.join(", ")}`
        : `${finishedAreaSqFt.toFixed(1)} sq ft × ₹${FAB_RATE_PER_SQFT} — ${scopeParts.join(", ")}`,
      amount: fabAmount,
    },
  ];

  const installationLines: QuoteLine[] = config.installation
    ? [
        {
          label: "Site fitting & levelling",
          detail: `${Math.round(config.runFt)} running ft × ₹${INSTALL_RATE_PER_RUN_FT}`,
          amount: Math.max(SITE_MINIMUM, Math.round(config.runFt * INSTALL_RATE_PER_RUN_FT)),
        },
        { label: "Site seaming & final polish", detail: "Joints finished in place, not in the workshop.", amount: sheetCount > 1 ? 3200 : 1800 },
      ]
    : [{ label: "Supply only", detail: "Fabricated top collected or delivered — fitting by others.", amount: 0 }];

  const deliveryLines: QuoteLine[] = [
    { label: "Delivery within Hyderabad", detail: `${sheetCount} sheet${sheetCount > 1 ? "s" : ""}, protected transit`, amount: DELIVERY + sheetCount * 400 },
  ];

  const groups: QuoteGroup[] = ([
    { key: "materials", label: "Materials", lines: materialLines, subtotal: 0 },
    { key: "fabrication", label: "Fabrication", lines: fabricationLines, subtotal: 0 },
    { key: "installation", label: "Installation", lines: installationLines, subtotal: 0 },
    { key: "delivery", label: "Delivery", lines: deliveryLines, subtotal: 0 },
  ] satisfies QuoteGroup[]).map((g) => ({ ...g, subtotal: g.lines.reduce((s, l) => s + l.amount, 0) }));

  const total = groups.reduce((s, g) => s + g.subtotal, 0);

  return {
    title: `${app.label} — ${config.runFt} running ft`,
    spec: [
      `${config.runFt} ft run · ${app.depthIn}″ deep · ${finishedAreaSqFt.toFixed(1)} sq ft`,
      own ? `${surface.brand} ${surface.label} — supplied by you` : `${surface.brand} ${surface.label}`,
      thickness.label,
      edge.label,
      ...chosenCutouts.map((c) => c.label),
      splash.id === "none" ? "No splashback" : splash.label,
      config.installation ? "Installed" : "Supply only",
    ],
    groups,
    total,
    rate: { amount: Math.round(total / config.runFt), unit: "per running ft" },
  };
}
