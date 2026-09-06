/**
 * Kitchen pricing and BOQ.
 *
 * All money lives here. No React component computes a rupee, and every figure
 * is derived from the geometry rather than looked up from a slab rate — the
 * point of Studio is that a customer can see WHY a number moved, and a number
 * out of a lookup table cannot be explained.
 *
 * RATES ARE INDICATIVE DEMO VALUES for Hyderabad, mid-2026, except where they
 * come from the EightByFour catalogue (board, laminate and hardware rates do).
 * Replacing them with live supplier pricing changes no function signature here.
 */

import {
  CARCASS_OPTIONS,
  FINISH_OPTIONS,
  HARDWARE_TIERS,
  INTERNAL_FINISH_OPTIONS,
  SHEET_SQFT,
  SHUTTER_OPTIONS,
} from "../catalogue";
import type { Quote, QuoteGroup, QuoteLine } from "../types";
import { KITCHEN_ACCESSORIES, getCabinetType } from "./cabinets";
import { placements } from "./geometry";
import { runLength } from "./layout";
import type { KitchenProject } from "./types";

const MM2_PER_SQFT = 92903;
const sqft = (mm2: number) => mm2 / MM2_PER_SQFT;

/** Whole sheets only — you cannot buy 0.4 of a board. */
const sheets = (areaSqft: number) => Math.max(0, Math.ceil(areaSqft / SHEET_SQFT));

/**
 * Construction method is not a label swap. Factory work costs more in machining
 * and four-side banding and less in site labour; carpenter work is the reverse
 * and wastes more board.
 */
const METHOD = {
  carpenter: {
    label: "Carpenter made",
    wastage: 1.12,
    bandingRate: 18,
    bandingFactor: 1.1,
    fabPerSqft: 96,
    installPerRunFt: 340,
    lead: "20–28 days on site",
  },
  factory: {
    label: "Factory modular",
    wastage: 1.06,
    bandingRate: 46,
    bandingFactor: 2.6,
    fabPerSqft: 124,
    installPerRunFt: 470,
    lead: "14–20 days, of which 3–4 on site",
  },
} as const;

/** Countertop materials. Rates are per running foot at 600 mm depth. */
export interface CounterMaterial {
  id: string;
  label: string;
  brand: string;
  ratePerRunFt: number;
  note: string;
  swatch: string;
  swatchTo?: string;
  catalogue?: string;
}

export const COUNTER_MATERIALS: CounterMaterial[] = [
  { id: "granite", label: "Granite", brand: "Local quarry", ratePerRunFt: 1450, note: "Hardest wearing and the cheapest per foot. Joints are visible.", swatch: "#4a4a4e", swatchTo: "#2c2c30" },
  { id: "quartz", label: "Engineered Quartz", brand: "Caesarstone-grade", ratePerRunFt: 2650, note: "Non-porous, consistent colour, no sealing. The usual upgrade.", swatch: "#e8e4dc", swatchTo: "#cbc5ba" },
  { id: "solid-surface", label: "Acrylic Solid Surface", brand: "Corian / Himacs", ratePerRunFt: 3200, note: "Seamless joints and an integrated bowl. Softer — it scratches.", swatch: "#f2efe9", swatchTo: "#ddd8ce", catalogue: "/products/corian-acrylic-solid-surface" },
  { id: "sintered", label: "Sintered stone", brand: "Neolith-grade", ratePerRunFt: 4100, note: "Heat and stain proof to a degree nothing else matches. Expensive to fabricate.", swatch: "#d8d3c9", swatchTo: "#b3ada2" },
  { id: "supplied", label: "Customer supplied", brand: "—", ratePerRunFt: 0, note: "You buy the slab. Studio still fabricates and installs it.", swatch: "#efeae1", swatchTo: "#d5cfc4" },
];

export const BACKSPLASH_MATERIALS: CounterMaterial[] = [
  { id: "tile", label: "Tiles", brand: "Various", ratePerRunFt: 380, note: "Cheapest, and the grout is what ages.", swatch: "#e6e2d8", swatchTo: "#cfc9bd" },
  { id: "counter-match", label: "Same as countertop", brand: "Matched", ratePerRunFt: 1250, note: "Continuous surface, no grout line behind the hob.", swatch: "#ddd8ce", swatchTo: "#c2bcb0" },
  { id: "glass", label: "Back-painted glass", brand: "Various", ratePerRunFt: 950, note: "One wipeable sheet. Shows every fingerprint.", swatch: "#cfd8d6", swatchTo: "#aab5b3" },
];

export const HANDLE_OPTIONS = [
  { id: "handle", label: "External handle", rate: 340, note: "Screw-on bar or knob. Cheapest and easiest to replace." },
  { id: "profile", label: "Edge profile", rate: 520, note: "Aluminium profile along the shutter edge. No protrusion." },
  { id: "gola", label: "Gola / J-profile", rate: 780, note: "Continuous recessed channel. The handleless look, done properly." },
  { id: "push", label: "Push to open", rate: 620, note: "No handle at all. Needs the hardware to stay adjusted." },
];

const pick = <T extends { id: string }>(list: T[], id: string) => list.find((o) => o.id === id) ?? list[0];

// ------------------------------------------------------------------- BOQ ---

export interface BoqRow {
  label: string;
  detail: string;
  qty: number;
  unit: string;
}

export interface KitchenBoq {
  cabinets: BoqRow[];
  sheets: BoqRow[];
  hardware: BoqRow[];
  surfaces: BoqRow[];
}

export interface KitchenCosting {
  quote: Quote;
  boq: KitchenBoq;
  /** Base + wall + tall run length in running feet. */
  runFt: number;
  methodLead: string;
}

export function priceKitchen(project: KitchenProject): KitchenCosting {
  const carcass = pick(CARCASS_OPTIONS, project.carcassId);
  const shutter = pick(SHUTTER_OPTIONS, project.shutterId);
  const finish = pick(FINISH_OPTIONS, project.finishId);
  const internal = pick(INTERNAL_FINISH_OPTIONS, project.internalId);
  const hardware = pick(HARDWARE_TIERS, project.hardwareId);
  const handle = pick(HANDLE_OPTIONS, project.handleId);
  const counter = pick(COUNTER_MATERIALS, project.countertop.materialId);
  const splash = pick(BACKSPLASH_MATERIALS, project.backsplash.materialId);
  const m = METHOD[project.method];

  const places = placements(project);
  const real = places.filter((p) => getCabinetType(p.cabinet.typeId).role !== "filler");

  // --- board areas, counted per cabinet -----------------------------------
  let carcassSqft = 0;
  let shutterSqft = 0;
  let backSqft = 0;
  let drawerCount = 0;
  let hingeCount = 0;
  let handleCount = 0;
  let bandingFt = 0;

  for (const p of real) {
    const type = getCabinetType(p.cabinet.typeId);
    const w = p.cabinet.widthMm;
    const h = type.heightMm;
    const d = type.depthMm;

    // Two sides, a top and a bottom.
    carcassSqft += sqft(h * d * 2 + w * d * 2);
    backSqft += sqft(w * h);

    const shelves = p.cabinet.internals.filter((i) => i.kind === "shelf").length;
    const drawers = p.cabinet.internals.filter((i) => i.kind === "drawer").length;
    drawerCount += drawers;
    carcassSqft += sqft(shelves * w * d);
    // A drawer box is a base and four sides.
    carcassSqft += sqft(drawers * (w * d + (w + d) * 2 * 150));

    if (drawers > 0) {
      shutterSqft += sqft(w * h);
      handleCount += drawers;
    } else if (type.shutters > 0) {
      shutterSqft += sqft(w * h);
      hingeCount += type.shutters * (h > 900 ? 4 : 2);
      handleCount += type.shutters;
    }
    bandingFt += ((w + h) * 2) / 304.8 * (m.bandingFactor / 2.6) * 2.6;
  }

  const waste = m.wastage;
  const carcassSheets = sheets(carcassSqft * waste);
  const shutterSheets = sheets(shutterSqft * waste);
  const backSheets = sheets(backSqft * waste);
  const finishSheets = finish.rate > 0 ? sheets(shutterSqft * waste) : 0;
  const balancingSheets = finish.sprayed ? 0 : finishSheets;
  const internalSheets = internal.rate > 0 ? sheets(carcassSqft * 0.45) : 0;

  // --- countertop ----------------------------------------------------------
  const baseRunMm = runLength(project.runs, "base");
  const runFt = baseRunMm / 304.8;
  const counterCost = runFt * counter.ratePerRunFt * (project.countertop.thicknessMm > 20 ? 1.18 : 1);
  const waterfallCost = project.countertop.waterfall ? counter.ratePerRunFt * 6 : 0;
  const splashCost = runFt * splash.ratePerRunFt * (project.backsplash.heightMm / 600);
  const cutouts = real.filter((p) => ["sink", "hob"].includes(getCabinetType(p.cabinet.typeId).role)).length;
  const cutoutCost = cutouts * 2400;

  // --- accessories ---------------------------------------------------------
  const accessoryLines: QuoteLine[] = [];
  const accessoryRows: BoqRow[] = [];
  const accCount = new Map<string, number>();
  for (const p of places) {
    for (const i of p.cabinet.internals) {
      if (!i.accessoryId) continue;
      accCount.set(i.accessoryId, (accCount.get(i.accessoryId) ?? 0) + 1);
    }
  }
  for (const [id, n] of accCount) {
    const acc = KITCHEN_ACCESSORIES.find((a) => a.id === id);
    if (!acc) continue;
    accessoryLines.push({
      label: acc.label,
      detail: `${acc.brand} · ${n} × ₹${acc.rate.toLocaleString("en-IN")}`,
      amount: Math.round(acc.rate * n),
      catalogueHref: "/products/hardware",
    });
    accessoryRows.push({ label: acc.label, detail: acc.brand, qty: n, unit: "nos" });
  }

  // --- lighting ------------------------------------------------------------
  const lightingCost = project.lighting.length * 4800;

  const round = Math.round;

  const materialLines: QuoteLine[] = [
    {
      label: `${carcass.brand} ${carcass.label} — carcass & internals`,
      detail: `${carcass.spec} · ${carcassSheets} sheets × ₹${carcass.rate.toLocaleString("en-IN")}`,
      amount: round(carcassSheets * carcass.rate),
      catalogueHref: carcass.catalogue,
    },
    {
      label: `${shutter.brand} ${shutter.label} — shutters & drawer fronts`,
      detail: `${shutter.spec} · ${shutterSheets} sheets × ₹${shutter.rate.toLocaleString("en-IN")}`,
      amount: round(shutterSheets * shutter.rate),
      catalogueHref: shutter.catalogue,
    },
    {
      label: "Back panels",
      detail: `6 mm · ${backSheets} sheets × ₹1,180`,
      amount: round(backSheets * 1180),
      catalogueHref: "/products/plywood",
    },
  ];

  if (finishSheets > 0) {
    materialLines.push({
      label: `${finish.brand} ${finish.label}`,
      detail: `${finish.spec} · ${finishSheets} sheets × ₹${finish.rate.toLocaleString("en-IN")}`,
      amount: round(finishSheets * finish.rate),
      catalogueHref: finish.catalogue,
    });
  }
  if (balancingSheets > 0) {
    materialLines.push({
      label: "Balancing laminate",
      detail: `0.8 mm · ${balancingSheets} sheets × ₹780`,
      amount: round(balancingSheets * 780),
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
  materialLines.push({
    label: "Edge banding",
    detail: `${m.label} · ${Math.round(bandingFt)} running ft × ₹${m.bandingRate}`,
    amount: round(bandingFt * m.bandingRate),
    catalogueHref: "/products",
  });

  const hardwareLines: QuoteLine[] = [];
  if (hingeCount > 0) {
    hardwareLines.push({
      label: `${hardware.brand} hinges`,
      detail: `${hingeCount} × ₹${hardware.hingeRate.toLocaleString("en-IN")}`,
      amount: round(hingeCount * hardware.hingeRate),
      catalogueHref: "/products/hardware",
    });
  }
  if (drawerCount > 0) {
    hardwareLines.push({
      label: `${hardware.brand} drawer runners`,
      detail: `${drawerCount} sets × ₹${hardware.channelRate.toLocaleString("en-IN")}`,
      amount: round(drawerCount * hardware.channelRate),
      catalogueHref: "/products/hardware",
    });
  }
  hardwareLines.push({
    label: handle.label,
    detail: `${handleCount} × ₹${handle.rate.toLocaleString("en-IN")}`,
    amount: round(handleCount * handle.rate),
    catalogueHref: "/products/hardware",
  });
  hardwareLines.push({
    label: "Legs, skirting & fixings",
    detail: `${real.filter((p) => p.tier !== "wall").length} units`,
    amount: round(real.filter((p) => p.tier !== "wall").length * 640),
    catalogueHref: "/products/hardware",
  });
  if (lightingCost > 0) {
    hardwareLines.push({
      label: "Cabinet lighting",
      detail: `${project.lighting.length} run(s) × ₹4,800`,
      amount: lightingCost,
      catalogueHref: "/products/hardware",
    });
  }
  hardwareLines.push(...accessoryLines);

  const surfaceLines: QuoteLine[] = [];
  if (counter.ratePerRunFt > 0) {
    surfaceLines.push({
      label: `${counter.label} countertop`,
      detail: `${counter.brand} · ${runFt.toFixed(1)} running ft × ₹${counter.ratePerRunFt.toLocaleString("en-IN")}`,
      amount: round(counterCost),
      catalogueHref: counter.catalogue,
    });
  }
  if (waterfallCost > 0) {
    surfaceLines.push({ label: "Waterfall end panel", detail: "One full-height return", amount: round(waterfallCost) });
  }
  if (cutoutCost > 0) {
    surfaceLines.push({ label: "Cut-outs", detail: `${cutouts} × ₹2,400 — sink and hob`, amount: cutoutCost });
  }
  if (splashCost > 0) {
    surfaceLines.push({
      label: `${splash.label} backsplash`,
      detail: `${runFt.toFixed(1)} running ft × ${project.backsplash.heightMm} mm high`,
      amount: round(splashCost),
    });
  }

  const carcassAreaSqft = carcassSqft + shutterSqft;
  const fabricationLines: QuoteLine[] = [
    {
      label: project.method === "carpenter" ? "Site carpentry" : "Factory machining & assembly",
      detail: `${Math.round(carcassAreaSqft)} sq ft of panel × ₹${m.fabPerSqft} — ${project.method === "carpenter" ? "cutting, carcass build, shutter making" : "CNC sizing, banding, line drilling, pre-assembly"}`,
      amount: round(carcassAreaSqft * m.fabPerSqft),
    },
    {
      label: `${finish.label} application`,
      detail: `${Math.round(shutterSqft)} sq ft × ₹${finish.applicationRate}`,
      amount: round(shutterSqft * finish.applicationRate),
    },
  ];

  const installationLines: QuoteLine[] = [
    {
      label: project.method === "carpenter" ? "Fitting & finishing" : "Site assembly & alignment",
      detail: `${runFt.toFixed(1)} running ft × ₹${m.installPerRunFt}`,
      amount: round(runFt * m.installPerRunFt),
    },
    {
      label: "Countertop fabrication & fitting",
      detail: `${runFt.toFixed(1)} running ft, ${cutouts} cut-out(s)`,
      amount: round(runFt * 420 + cutouts * 900),
    },
    {
      label: "Hardware fitting & adjustment",
      detail: `${hingeCount} hinges, ${drawerCount} drawers, ${handleCount} handles`,
      amount: round(hingeCount * 55 + drawerCount * 240 + handleCount * 45),
    },
  ];

  const totalSheets = carcassSheets + shutterSheets + backSheets + finishSheets + balancingSheets + internalSheets;
  const deliveryLines: QuoteLine[] = [
    {
      label: project.method === "carpenter" ? "Material delivery to site" : "Finished module delivery",
      detail: `${totalSheets} sheets' worth · Hyderabad`,
      amount: round(3200 + totalSheets * 220 * (project.method === "factory" ? 1.3 : 1)),
    },
  ];

  const groups: QuoteGroup[] = (
    [
      { key: "materials", label: "Materials", lines: [...materialLines, ...hardwareLines, ...surfaceLines], subtotal: 0 },
      { key: "fabrication", label: "Fabrication", lines: fabricationLines, subtotal: 0 },
      { key: "installation", label: "Installation", lines: installationLines, subtotal: 0 },
      { key: "delivery", label: "Delivery", lines: deliveryLines, subtotal: 0 },
    ] satisfies QuoteGroup[]
  ).map((g) => ({ ...g, subtotal: g.lines.reduce((s, l) => s + l.amount, 0) }));

  const total = groups.reduce((s, g) => s + g.subtotal, 0);

  // --- BOQ -----------------------------------------------------------------
  const cabinetTally = new Map<string, number>();
  for (const p of real) {
    const t = getCabinetType(p.cabinet.typeId);
    const key = `${p.cabinet.widthMm} mm ${t.label}`;
    cabinetTally.set(key, (cabinetTally.get(key) ?? 0) + 1);
  }

  const boq: KitchenBoq = {
    cabinets: [...cabinetTally.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, qty]) => ({ label, detail: "", qty, unit: "nos" })),
    sheets: [
      { label: `${carcass.brand} ${carcass.label}`, detail: `${carcass.spec} · 8×4 sheet`, qty: carcassSheets, unit: "sheets" },
      { label: `${shutter.brand} ${shutter.label}`, detail: `${shutter.spec} · 8×4 sheet`, qty: shutterSheets, unit: "sheets" },
      { label: "Back panel ply", detail: "6 mm · 8×4 sheet", qty: backSheets, unit: "sheets" },
      ...(finishSheets ? [{ label: `${finish.brand} ${finish.label}`, detail: finish.spec, qty: finishSheets, unit: "sheets" }] : []),
      ...(balancingSheets ? [{ label: "Balancing laminate", detail: "0.8 mm", qty: balancingSheets, unit: "sheets" }] : []),
      { label: "Edge banding", detail: `${m.label} · ${m.bandingRate}/ft`, qty: Math.round(bandingFt), unit: "running ft" },
    ].filter((r) => r.qty > 0),
    hardware: [
      ...(hingeCount ? [{ label: `${hardware.brand} hinges`, detail: hardware.label, qty: hingeCount, unit: "nos" }] : []),
      ...(drawerCount ? [{ label: `${hardware.brand} drawer runners`, detail: hardware.label, qty: drawerCount, unit: "sets" }] : []),
      { label: handle.label, detail: handle.note, qty: handleCount, unit: "nos" },
      { label: "Adjustable legs", detail: "Per base/tall unit, 4 each", qty: real.filter((p) => p.tier !== "wall").length * 4, unit: "nos" },
      ...accessoryRows,
    ],
    surfaces: [
      { label: `${counter.label} countertop`, detail: `${project.countertop.thicknessMm} mm`, qty: Number(runFt.toFixed(1)), unit: "running ft" },
      { label: `${splash.label} backsplash`, detail: `${project.backsplash.heightMm} mm high`, qty: Number(runFt.toFixed(1)), unit: "running ft" },
      { label: "Cut-outs", detail: "Sink and hob", qty: cutouts, unit: "nos" },
    ],
  };

  const quote: Quote = {
    title: `Kitchen — ${(project.room.widthMm / 1000).toFixed(1)} × ${(project.room.depthMm / 1000).toFixed(1)} m`,
    spec: [
      `${project.runs.filter((r) => r.tier === "base").length}-run ${project.layout} layout`,
      m.label,
      `${carcass.label} carcass`,
      `${shutter.label} + ${finish.label}`,
      `${hardware.label} hardware`,
      `${counter.label} counter`,
    ],
    groups,
    total,
    rate: { amount: Math.round(total / Math.max(1, runFt)), unit: "per running ft" },
  };

  return { quote, boq, runFt, methodLead: m.lead };
}
