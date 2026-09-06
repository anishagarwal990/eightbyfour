/**
 * Wardrobe estimator — engine tests.
 *
 * Run: `node --test lib/studio/estimator/` (Node strips the types).
 * These pin the brief's §20 scenarios. If a config rate changes the exact
 * rupee expectations will move — that is fine, the STRUCTURAL assertions
 * (finish = 0 for prelam, one bucket moves per change, total = sum) are the
 * ones that must never break.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { estimateWardrobe } from "./engine";
import type { WardrobeEstimateInput } from "./types";
import { CARCASS_FINISH, GEOMETRY, OVERHEADS } from "./config";

const base: WardrobeEstimateInput = {
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

test("TEST 1 — 8×8 BWR carcass core: 256 sq ft, 8 sheets, ₹20,480, ₹320/sq ft", () => {
  const e = estimateWardrobe(base);
  assert.equal(e.elevationAreaSqft, 64);
  assert.equal(e.carcass.materialAreaSqft, 256);
  assert.equal(e.carcass.sheets, 8);
  // BWR is ₹80/sq ft in config → 8 × 32 × 80.
  assert.equal(e.carcass.total, 20480);
  assert.equal(e.carcass.ratePerSqft, 320);
});

test("TEST 2 — non-prelaminated board has a carcass finish cost > 0", () => {
  const e = estimateWardrobe({ ...base, carcassMaterialId: "bwr-ply" });
  assert.equal(e.carcassFinish.includedBecausePrelaminated, false);
  assert.ok(e.carcassFinish.total > 0);
  // 8 sheets × (500 + 1300) = 14,400.
  assert.equal(
    e.carcassFinish.total,
    8 * (CARCASS_FINISH.internalLaminateRatePerSheet + CARCASS_FINISH.externalLaminateRatePerSheet)
  );
});

test("TEST 3 — prelaminated MDF carcass finish cost = 0", () => {
  const e = estimateWardrobe({ ...base, carcassMaterialId: "prelam-mdf" });
  assert.equal(e.carcassFinish.total, 0);
  assert.equal(e.carcassFinish.includedBecausePrelaminated, true);
});

test("TEST 4 — prelaminated particle board carcass finish cost = 0", () => {
  const e = estimateWardrobe({ ...base, carcassMaterialId: "prelam-pb" });
  assert.equal(e.carcassFinish.total, 0);
  assert.equal(e.carcassFinish.includedBecausePrelaminated, true);
});

test("TEST 5 — changing board shutter core moves only the shutter bucket", () => {
  const a = estimateWardrobe({ ...base, shutterCoreId: "mdf" });
  const b = estimateWardrobe({ ...base, shutterCoreId: "plywood" });
  assert.notEqual(a.shutters.total, b.shutters.total);
  assert.equal(a.carcass.total, b.carcass.total);
  assert.equal(a.carcassFinish.total, b.carcassFinish.total);
  assert.equal(a.hardware.total, b.hardware.total);
  assert.equal(a.labour.total, b.labour.total);
});

test("TEST 6 — switching to aluminium + glass drops the board core/finish", () => {
  const board = estimateWardrobe({ ...base, shutterSystem: "board", shutterCoreId: "hdhmr", shutterFinishId: "pu" });
  const alu = estimateWardrobe({ ...base, shutterSystem: "aluminium-glass" });
  // The PU finish rate (320) cannot appear anywhere in the aluminium quote.
  assert.ok(!alu.shutters.components.some((c) => c.ratePerSqft === 320 && c.label.toLowerCase().includes("pu")));
  assert.equal(alu.shutters.system, "aluminium-glass");
  assert.notEqual(board.shutters.total, alu.shutters.total);
  // Everything else is untouched.
  assert.equal(board.carcass.total, alu.carcass.total);
  assert.equal(board.hardware.total, alu.hardware.total);
});

test("TEST 7 — hardware Basic → Premium moves only the hardware bucket", () => {
  const basic = estimateWardrobe({ ...base, hardwarePackageId: "basic" });
  const premium = estimateWardrobe({ ...base, hardwarePackageId: "premium" });
  assert.notEqual(basic.hardware.total, premium.hardware.total);
  assert.equal(basic.carcass.total, premium.carcass.total);
  assert.equal(basic.shutters.total, premium.shutters.total);
  assert.equal(basic.labour.total, premium.labour.total);
  assert.equal(basic.margin.total, premium.margin.total);
});

test("TEST 8 — headline total equals the sum of the breakdown buckets", () => {
  for (const patch of [
    {},
    { carcassMaterialId: "prelam-pb" },
    { shutterSystem: "aluminium-glass" as const },
    { hardwarePackageId: "premium", buildMethod: "carpenter" as const },
    { widthFt: 10, heightFt: 9 },
  ]) {
    const e = estimateWardrobe({ ...base, ...patch });
    const sum = e.buckets.reduce((s, b) => s + b.total, 0);
    assert.equal(e.finalTotal, sum);
  }
});

test("TEST 9 — ₹/sq ft × elevation area reconciles to the total", () => {
  const e = estimateWardrobe({ ...base, widthFt: 10, heightFt: 8 });
  // finalRatePerSqft is exact (finalTotal / area) so this is lossless.
  assert.equal(Math.round(e.finalRatePerSqft * e.elevationAreaSqft), e.finalTotal);
  // And each bucket's rate reconstitutes its own total.
  for (const b of e.buckets) {
    assert.ok(Math.abs(b.ratePerSqft * e.elevationAreaSqft - b.total) < 1);
  }
});

test("no double counting — carcass multiplier excludes shutter area", () => {
  // Carcass board area must be exactly elevation × the carcass multiplier,
  // with nothing added for the shutter face.
  const e = estimateWardrobe(base);
  assert.equal(e.carcass.materialAreaSqft, e.elevationAreaSqft * GEOMETRY.carcassConsumptionMultiplier);
});

test("depth does not change the ₹/sq ft in V1", () => {
  const a = estimateWardrobe({ ...base, depthFt: 1.5 });
  const b = estimateWardrobe({ ...base, depthFt: 3 });
  assert.equal(a.finalTotal, b.finalTotal);
});

test("overhead buckets are flat ₹/sq ft of elevation", () => {
  const e = estimateWardrobe({ ...base, widthFt: 9, heightFt: 7 });
  assert.equal(e.miscellaneous.total, 63 * OVERHEADS.miscellaneousRatePerSqft);
  assert.equal(e.margin.total, 63 * OVERHEADS.marginRatePerSqft);
});
