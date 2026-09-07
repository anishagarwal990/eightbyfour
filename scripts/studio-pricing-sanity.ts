/**
 * Studio pricing sanity matrix.
 *
 * Run: `npx tsx scripts/studio-pricing-sanity.ts` — or, with no tsx in the
 * project, `node scripts/studio-pricing-sanity.ts` (Node strips the types).
 *
 * Prints representative wardrobe estimates so we can look at real numbers and
 * ask the only question that matters: would we actually execute at this price?
 *
 * Nothing here is tuned to make the output look reasonable. If a number is
 * wrong, the assumption behind it is wrong, and that is the point.
 */

import { CARCASS_MATERIALS, HARDWARE_PACKAGES, SHUTTER_CORES } from "../lib/studio/estimator/config.ts";
import { estimateWardrobe } from "../lib/studio/estimator/engine.ts";
import type { WardrobeEstimateInput } from "../lib/studio/estimator/types.ts";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const pad = (s: string, n: number) => s.padEnd(n);
const padL = (s: string, n: number) => s.padStart(n);

const BASE: WardrobeEstimateInput = {
  widthFt: 8,
  heightFt: 8,
  depthFt: 2,
  buildMethod: "factory",
  carcassMaterialId: "bwr-ply",
  carcassFinishId: "laminate",
  shutterSystem: "board",
  shutterCoreId: "hdhmr",
  shutterFinishId: "laminate",
  aluProfileId: "natural",
  glassTypeId: "clear",
  hardwarePackageId: "standard",
};

/** A shutter that makes sense for each carcass, rather than one for all. */
const SENSIBLE_SHUTTER: Record<string, { core: string; finish: string }> = {
  "prelam-pb": { core: "prelam-pb", finish: "prelam" },
  "prelam-mdf": { core: "prelam-mdf", finish: "prelam" },
  mdf: { core: "mdf", finish: "laminate" },
  hdhmr: { core: "hdhmr", finish: "laminate" },
  "mr-ply": { core: "mdf", finish: "laminate" },
  "bwr-ply": { core: "hdhmr", finish: "laminate" },
  "bwp-ply": { core: "hdhmr", finish: "laminate" },
  "fr-ply": { core: "hdhmr", finish: "laminate" },
};

function row(input: WardrobeEstimateInput) {
  const e = estimateWardrobe(input);
  return {
    total: e.finalTotal,
    rate: e.finalRatePerSqft,
    carcass: e.carcass.total,
    finish: e.carcassFinish.total,
    shutters: e.shutters.total,
    hardware: e.hardware.total,
    service: e.labour.total + e.miscellaneous.total + e.margin.total,
  };
}

console.log("\n" + "=".repeat(96));
console.log("STUDIO WARDROBE PRICING SANITY MATRIX");
console.log("All figures indicative. Rates are a mix of catalogue products and unvalidated assumptions.");
console.log("=".repeat(96));

// --- 1. board ladder at a fixed 8 x 8 --------------------------------------
console.log("\n8′ × 8′ × 2′ · factory · standard hardware · sensible shutter per board\n");
console.log(
  pad("CARCASS", 30) + padL("BOARD ₹/sqft", 13) + padL("CARCASS", 11) + padL("FINISH", 10) +
  padL("SHUTTERS", 11) + padL("H/WARE", 9) + padL("SERVICE", 11) + padL("TOTAL", 12) + padL("₹/SQFT", 9)
);
console.log("-".repeat(96));

for (const m of [...CARCASS_MATERIALS].sort((a, b) => a.ratePerSqft - b.ratePerSqft)) {
  const s = SENSIBLE_SHUTTER[m.id] ?? { core: "hdhmr", finish: "laminate" };
  const r = row({ ...BASE, carcassMaterialId: m.id, shutterCoreId: s.core, shutterFinishId: s.finish });
  console.log(
    pad(`${m.label}${m.source === "assumption" ? " *" : ""}`, 30) +
    padL(String(m.ratePerSqft), 13) +
    padL(inr(r.carcass), 11) + padL(inr(r.finish), 10) + padL(inr(r.shutters), 11) +
    padL(inr(r.hardware), 9) + padL(inr(r.service), 11) +
    padL(inr(r.total), 12) + padL(inr(r.rate), 9)
  );
}
console.log("\n  * rate is an unvalidated assumption, not a catalogue product");

// --- 2. size scaling --------------------------------------------------------
console.log("\n\nSIZE SCALING · BWR ply carcass · HDHMR + laminate shutters · standard hardware · factory\n");
console.log(pad("SIZE", 16) + padL("ELEVATION", 12) + padL("SHEETS", 9) + padL("TOTAL", 14) + padL("₹/SQFT", 10));
console.log("-".repeat(61));
for (const [w, h] of [[6, 8], [8, 8], [10, 8], [12, 8]] as [number, number][]) {
  const input = { ...BASE, widthFt: w, heightFt: h };
  const e = estimateWardrobe(input);
  console.log(
    pad(`${w}′ × ${h}′`, 16) + padL(`${e.elevationAreaSqft} sq ft`, 12) +
    padL(String(e.carcass.sheets), 9) + padL(inr(e.finalTotal), 14) + padL(inr(e.finalRatePerSqft), 10)
  );
}

// --- 3. hardware and build method ------------------------------------------
console.log("\n\nHARDWARE & BUILD METHOD · 8′ × 8′ · BWR ply · HDHMR + laminate\n");
console.log(pad("HARDWARE", 14) + pad("METHOD", 12) + padL("TOTAL", 14) + padL("₹/SQFT", 10));
console.log("-".repeat(50));
for (const hw of HARDWARE_PACKAGES) {
  for (const method of ["carpenter", "factory"] as const) {
    const e = estimateWardrobe({ ...BASE, hardwarePackageId: hw.id, buildMethod: method });
    console.log(pad(hw.label, 14) + pad(method, 12) + padL(inr(e.finalTotal), 14) + padL(inr(e.finalRatePerSqft), 10));
  }
}

// --- 4. shutter systems ------------------------------------------------------
console.log("\n\nSHUTTER SYSTEMS · 8′ × 8′ · BWR ply carcass · standard hardware · factory\n");
console.log(pad("SHUTTER", 40) + padL("SHUTTER COST", 15) + padL("TOTAL", 14) + padL("₹/SQFT", 10));
console.log("-".repeat(79));
for (const core of SHUTTER_CORES) {
  const finish = core.prelaminated ? "prelam" : "laminate";
  const e = estimateWardrobe({ ...BASE, shutterCoreId: core.id, shutterFinishId: finish });
  console.log(
    pad(`${core.label} + ${core.prelaminated ? "none" : "laminate"}`, 40) +
    padL(inr(e.shutters.total), 15) + padL(inr(e.finalTotal), 14) + padL(inr(e.finalRatePerSqft), 10)
  );
}
const alu = estimateWardrobe({ ...BASE, shutterSystem: "aluminium-glass" });
console.log(
  pad("Aluminium (natural) + clear glass", 40) +
  padL(inr(alu.shutters.total), 15) + padL(inr(alu.finalTotal), 14) + padL(inr(alu.finalRatePerSqft), 10)
);

console.log("\n" + "=".repeat(96));
console.log("Ask of every row above: would we actually execute at this price?");
console.log("See docs/STUDIO-PRICING-VALIDATION.md for what each input is and what still needs proving.");
console.log("=".repeat(96) + "\n");
