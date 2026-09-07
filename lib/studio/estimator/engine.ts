/**
 * Wardrobe estimator — the calculation engine.
 *
 * Pure and deterministic: same input, same output, no side effects. Every
 * rupee is composed from lib/studio/estimator/config.ts. There is no lookup
 * table of finished-wardrobe prices anywhere — each selection moves exactly
 * one bucket.
 *
 * The seven buckets (brief §"CORE BUSINESS LOGIC"):
 *   1. Carcass core       — board, from a consumption multiplier
 *   2. Carcass finish      — laminate, per carcass sheet; ₹0 if prelam
 *   3. Shutters            — a separate assembly, its own composed ₹/sq ft
 *   4. Hardware            — a package rate × elevation
 *   5. Labour / fabrication — a build-method rate × elevation
 *   6. Miscellaneous       — flat ₹/sq ft × elevation
 *   7. Margin              — flat ₹/sq ft × elevation
 *
 * finalTotal          = sum of the seven bucket totals
 * finalRatePerSqft    = finalTotal / elevationArea
 */

import {
  ALU_GLASS_FABRICATION_RATE_PER_SQFT,
  ALU_PROFILES,
  BUILD_METHODS,
  CARCASS_FINISH,
  CARCASS_MATERIALS,
  GEOMETRY,
  GLASS_TYPES,
  HARDWARE_PACKAGES,
  OVERHEADS,
  SHUTTER_CORES,
  SHUTTER_FABRICATION_RATE_PER_SQFT,
  SHUTTER_FINISHES,
} from "./config.ts";
import type { EstimateBucket, QuoteGroupPublic, WardrobeEstimate, WardrobeEstimateInput } from "./types.ts";

const find = <T extends { id: string }>(list: T[], id: string, label: string): T => {
  const hit = list.find((x) => x.id === id);
  if (!hit) throw new Error(`estimator: unknown ${label} "${id}"`);
  return hit;
};

/** Round money to whole rupees. Rates are kept unrounded until the total. */
const rupees = (n: number): number => Math.round(n);

/** Fit-out the visual designer adds on top of the base specification. */
export interface EstimateAddition {
  key: string;
  label: string;
  detail: string;
  total: number;
}

export function estimateWardrobe(
  input: WardrobeEstimateInput,
  additions: EstimateAddition[] = []
): WardrobeEstimate {
  const elevationAreaSqft = input.widthFt * input.heightFt;
  const area = elevationAreaSqft; // shorthand — every bucket is priced against elevation

  // ---------------------------------------------------- 1. carcass core ---
  const carcass = find(CARCASS_MATERIALS, input.carcassMaterialId, "carcass material");
  const carcassMaterialAreaSqft = area * GEOMETRY.carcassConsumptionMultiplier;
  const carcassSheets = Math.ceil(carcassMaterialAreaSqft / GEOMETRY.sheetAreaSqft);
  // Priced on the board actually purchased (whole sheets), not the raw area.
  const purchasedBoardAreaSqft = carcassSheets * GEOMETRY.sheetAreaSqft;
  const carcassTotal = rupees(purchasedBoardAreaSqft * carcass.ratePerSqft);
  const carcassRatePerSqft = carcassTotal / area;

  // -------------------------------------------------- 2. carcass finish ---
  // Prelaminated board already carries its finish — this bucket is skipped,
  // visibly, never charged as a silent zero.
  const carcassFinishIncluded = carcass.prelaminated;
  let carcassFinishTotal = 0;
  if (!carcassFinishIncluded) {
    const laminateSets = carcassSheets * GEOMETRY.laminateConsumptionMultiplier;
    const perSet =
      CARCASS_FINISH.internalLaminateRatePerSheet + CARCASS_FINISH.externalLaminateRatePerSheet;
    carcassFinishTotal = rupees(laminateSets * perSet);
  }
  const carcassFinishRatePerSqft = carcassFinishTotal / area;

  // --------------------------------------------------------- 3. shutters ---
  const shutterAreaSqft = area * GEOMETRY.shutterAreaMultiplier;
  let shutterRatePerSqft = 0;
  const shutterComponents: { label: string; ratePerSqft: number }[] = [];

  if (input.shutterSystem === "board") {
    const core = find(SHUTTER_CORES, input.shutterCoreId, "shutter core");
    // A prelam core forces the finish to the "prelam / none" row unless the
    // caller explicitly picked another — future business rule, allowed here.
    const finish = find(SHUTTER_FINISHES, input.shutterFinishId, "shutter finish");
    const effectiveFinish =
      core.prelaminated && !SHUTTER_FINISHES.some((f) => f.id === input.shutterFinishId && !f.isPrelam)
        ? SHUTTER_FINISHES.find((f) => f.isPrelam)!
        : finish;

    shutterComponents.push(
      { label: `${core.label} core`, ratePerSqft: core.ratePerSqft },
      { label: effectiveFinish.label, ratePerSqft: effectiveFinish.ratePerSqft },
      { label: "Edge & fabrication", ratePerSqft: SHUTTER_FABRICATION_RATE_PER_SQFT }
    );
  } else {
    const profile = find(ALU_PROFILES, input.aluProfileId, "aluminium profile");
    const glass = find(GLASS_TYPES, input.glassTypeId, "glass type");
    shutterComponents.push(
      { label: `${profile.label} profile`, ratePerSqft: profile.ratePerSqft },
      { label: `${glass.label} glass`, ratePerSqft: glass.ratePerSqft },
      { label: "Cutting & assembly", ratePerSqft: ALU_GLASS_FABRICATION_RATE_PER_SQFT }
    );
  }
  shutterRatePerSqft = shutterComponents.reduce((s, c) => s + c.ratePerSqft, 0);
  const shutterTotal = rupees(shutterAreaSqft * shutterRatePerSqft);

  // --------------------------------------------------------- 4. hardware ---
  const hardware = find(HARDWARE_PACKAGES, input.hardwarePackageId, "hardware package");
  const hardwareTotal = rupees(area * hardware.ratePerSqft);

  // ----------------------------------------------- 5. labour / fabrication ---
  const method = find(BUILD_METHODS, input.buildMethod, "build method");
  const labourTotal = rupees(area * method.labourRatePerSqft);

  // ---------------------------------------------------- 6 + 7. overheads ---
  const miscTotal = rupees(area * OVERHEADS.miscellaneousRatePerSqft);
  const marginTotal = rupees(area * OVERHEADS.marginRatePerSqft);

  // ----------------------------------------------------------- assemble ---
  const carcassLabel = `${carcass.label} carcass`;
  const shutterLabel =
    input.shutterSystem === "board"
      ? `${find(SHUTTER_CORES, input.shutterCoreId, "shutter core").label} board shutter`
      : "Aluminium + glass shutter";

  const buckets: EstimateBucket[] = [
    {
      key: "carcassCore",
      label: carcassLabel,
      ratePerSqft: carcassRatePerSqft,
      total: carcassTotal,
      detail: `${carcassSheets} sheets × ${GEOMETRY.sheetAreaSqft} sq ft × ₹${carcass.ratePerSqft}/sq ft`,
    },
    {
      key: "carcassFinish",
      label: carcassFinishIncluded ? "Carcass finish — included" : "Carcass finish (laminate)",
      ratePerSqft: carcassFinishRatePerSqft,
      total: carcassFinishTotal,
      detail: carcassFinishIncluded
        ? "Pre-finished board — no additional carcass laminate"
        : `${carcassSheets} sheets × (₹${CARCASS_FINISH.internalLaminateRatePerSheet} + ₹${CARCASS_FINISH.externalLaminateRatePerSheet})`,
    },
    {
      key: "shutters",
      label: shutterLabel,
      ratePerSqft: shutterRatePerSqft,
      total: shutterTotal,
      detail: shutterComponents.map((c) => `${c.label} ₹${c.ratePerSqft}`).join(" + "),
    },
    { key: "hardware", label: `${hardware.label} hardware`, ratePerSqft: hardware.ratePerSqft, total: hardwareTotal },
    {
      key: "labour",
      label: `${method.label} fabrication`,
      ratePerSqft: method.labourRatePerSqft,
      total: labourTotal,
    },
    { key: "miscellaneous", label: "Miscellaneous", ratePerSqft: OVERHEADS.miscellaneousRatePerSqft, total: miscTotal },
    { key: "margin", label: "Margin", ratePerSqft: OVERHEADS.marginRatePerSqft, total: marginTotal },
  ];

  for (const add of additions) {
    buckets.push({
      key: add.key,
      label: add.label,
      ratePerSqft: add.total / area,
      total: add.total,
      detail: add.detail,
    });
  }

  const finalTotal = buckets.reduce((s, b) => s + b.total, 0);
  const finalRatePerSqft = finalTotal / area;

  // --- customer-facing grouping ------------------------------------------
  // Same money, read the way a quotation reads. Miscellaneous and margin are
  // real internal buckets but they are our cost structure, not the customer's
  // line items — they belong inside the service the customer is buying.
  const bucket = (k: string) => buckets.find((b) => b.key === k)?.total ?? 0;
  const groupTotal = (keys: string[]) => keys.reduce((s, k) => s + bucket(k), 0);

  const additionTotal = additions.reduce((s, a) => s + a.total, 0);

  const publicGroups: QuoteGroupPublic[] = [
    {
      key: "materials",
      label: "Carcass & finish",
      total: groupTotal(["carcassCore", "carcassFinish"]),
      from: ["carcassCore", "carcassFinish"],
      lines: [
        { label: carcassLabel, detail: `${carcassSheets} sheets of ${GEOMETRY.sheetAreaSqft} sq ft`, total: carcassTotal },
        ...(carcassFinishTotal > 0
          ? [{ label: "Carcass laminate", detail: "Internal and external faces", total: carcassFinishTotal }]
          : []),
      ],
    },
    {
      key: "shutters",
      label: "Shutters",
      total: bucket("shutters"),
      from: ["shutters"],
      lines: shutterComponents.map((c) => ({
        label: c.label,
        detail: `₹${c.ratePerSqft} per sq ft`,
        total: Math.round(shutterAreaSqft * c.ratePerSqft),
      })),
    },
    { key: "hardware", label: "Hardware", total: bucket("hardware"), from: ["hardware"] },
    {
      key: "service",
      label: "Fabrication & installation",
      total: groupTotal(["labour", "miscellaneous", "margin"]),
      from: ["labour", "miscellaneous", "margin"],
    },
    ...(additionTotal > 0
      ? [
          {
            key: "fitout",
            label: "Fit-out & accessories",
            total: additionTotal,
            from: additions.map((a) => a.key),
            lines: additions.map((a) => ({ label: a.label, detail: a.detail, total: a.total })),
          },
        ]
      : []),
  ].filter((g) => g.total > 0);

  // Any assumed rate anywhere means the whole estimate is indicative.
  const hasAssumedRates =
    carcass.source === "assumption" ||
    (input.shutterSystem === "board" &&
      SHUTTER_CORES.find((c) => c.id === input.shutterCoreId)?.source === "assumption") ||
    true; // labour, overheads and finishes are all assumptions today

  return {
    elevationAreaSqft,
    depthFt: input.depthFt,
    carcass: {
      materialAreaSqft: carcassMaterialAreaSqft,
      sheets: carcassSheets,
      boardRatePerSqft: carcass.ratePerSqft,
      ratePerSqft: carcassRatePerSqft,
      total: carcassTotal,
    },
    carcassFinish: {
      ratePerSqft: carcassFinishRatePerSqft,
      total: carcassFinishTotal,
      includedBecausePrelaminated: carcassFinishIncluded,
    },
    shutters: {
      system: input.shutterSystem,
      areaSqft: shutterAreaSqft,
      ratePerSqft: shutterRatePerSqft,
      components: shutterComponents,
      total: shutterTotal,
    },
    hardware: { ratePerSqft: hardware.ratePerSqft, total: hardwareTotal },
    labour: { ratePerSqft: method.labourRatePerSqft, total: labourTotal },
    miscellaneous: { ratePerSqft: OVERHEADS.miscellaneousRatePerSqft, total: miscTotal },
    margin: { ratePerSqft: OVERHEADS.marginRatePerSqft, total: marginTotal },
    buckets,
    publicGroups,
    additions,
    hasAssumedRates,
    finalRatePerSqft,
    finalTotal,
  };
}
