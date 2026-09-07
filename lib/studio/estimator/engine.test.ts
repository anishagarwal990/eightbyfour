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
import { estimateWardrobe } from "./engine.ts";
import type { WardrobeEstimateInput } from "./types.ts";
import { CARCASS_FINISH, GEOMETRY, OVERHEADS } from "./config.ts";

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

// --- customer-facing grouping ------------------------------------------------

test("public groups sum to exactly the same total as the internal buckets", () => {
  for (const patch of [
    {},
    { carcassMaterialId: "prelam-pb" },
    { shutterSystem: "aluminium-glass" as const },
    { widthFt: 10, heightFt: 9, hardwarePackageId: "premium" },
  ]) {
    const e = estimateWardrobe({ ...base, ...patch });
    const pub = e.publicGroups.reduce((s, g) => s + g.total, 0);
    assert.equal(pub, e.finalTotal);
  }
});

test("margin and miscellaneous are never their own customer-facing group", () => {
  const e = estimateWardrobe(base);
  const labels = e.publicGroups.map((g) => g.label.toLowerCase());
  assert.ok(!labels.some((l) => l.includes("margin")));
  assert.ok(!labels.some((l) => l.includes("miscellaneous")));
  // but they are still traceable internally
  assert.ok(e.buckets.some((b) => b.key === "margin"));
  assert.ok(e.publicGroups.find((g) => g.key === "service")!.from.includes("margin"));
});

test("fit-out additions add to the total and appear as their own group", () => {
  const bare = estimateWardrobe(base);
  const withFitOut = estimateWardrobe(base, [
    { key: "shelves", label: "Shelves", detail: "6 shelves", total: 990 },
    { key: "drawers", label: "Drawers", detail: "3 drawers", total: 7200 },
  ]);
  assert.equal(withFitOut.finalTotal, bare.finalTotal + 990 + 7200);
  const g = withFitOut.publicGroups.find((x) => x.key === "fitout");
  assert.ok(g);
  assert.equal(g.total, 8190);
  // and the base spec is untouched by the fit-out
  assert.equal(withFitOut.carcass.total, bare.carcass.total);
  assert.equal(withFitOut.shutters.total, bare.shutters.total);
});

test("carcass rates that come from the catalogue are marked as such", async () => {
  const { CARCASS_MATERIALS } = await import("./config.ts");
  const bwp = CARCASS_MATERIALS.find((m) => m.id === "bwp-ply")!;
  assert.equal(bwp.source, "catalogue");
  assert.equal(bwp.catalogueId, "bwp-ply");
  // 3480 per 8x4 sheet / 32 sq ft
  assert.equal(bwp.ratePerSqft, 108.8);
});

// --- the reconciliation that this whole rework exists for --------------------

test("quick estimator and visual designer agree on an identical specification", async () => {
  const { toEstimateInput, layoutAdditions } = await import("./adapter.ts");

  // The designer holds catalogue ids; the estimator holds its own. Same
  // wardrobe, same materials, expressed in each surface's vocabulary.
  const designerState = {
    widthFt: 8,
    heightFt: 8,
    depthFt: 2,
    method: "factory" as const,
    carcassId: "bwp-ply", // catalogue id
    shutterId: "hdhmr",
    finishId: "lam-1",
    hardwareId: "luxury", // catalogue top tier == estimator "premium"
    accessoryIds: [] as string[],
    counts: {
      sections: 3, partitions: 2, shelves: 0, drawers: 0, rails: 0, accessories: 0,
      shutters: 3, doorType: "hinged" as const, loft: false,
      shelfAreaSqft: 0, partitionAreaSqft: 0, loftCarcassSqft: 0, loftShutterSqft: 0, shutterFaceSqft: 64,
    },
  };

  const fromDesigner = toEstimateInput(designerState);
  const designerBase = estimateWardrobe(fromDesigner, []);

  // The same wardrobe typed straight into the quick estimator.
  const fromEstimator = estimateWardrobe({
    ...base,
    carcassMaterialId: "bwp-ply",
    shutterCoreId: "hdhmr",
    shutterFinishId: "laminate",
    hardwarePackageId: "premium",
    buildMethod: "factory",
  });

  assert.equal(designerBase.finalTotal, fromEstimator.finalTotal);
  assert.equal(designerBase.carcass.total, fromEstimator.carcass.total);
  assert.equal(designerBase.shutters.total, fromEstimator.shutters.total);
  assert.equal(designerBase.hardware.total, fromEstimator.hardware.total);

  // Fit-out is the ONLY thing the designer may add on top.
  const withFitOut = estimateWardrobe(
    fromDesigner,
    layoutAdditions({ ...designerState, counts: { ...designerState.counts, shelves: 6, drawers: 3 } }, 64)
  );
  assert.ok(withFitOut.finalTotal > designerBase.finalTotal);
  assert.equal(withFitOut.carcass.total, designerBase.carcass.total);
});

test("catalogue material ids map onto real estimator materials", async () => {
  const { toEstimateInput } = await import("./adapter.ts");
  const { CARCASS_MATERIALS, SHUTTER_CORES } = await import("./config.ts");
  const counts = {
    sections: 2, partitions: 1, shelves: 0, drawers: 0, rails: 0, accessories: 0,
    shutters: 2, doorType: "hinged" as const, loft: false,
    shelfAreaSqft: 0, partitionAreaSqft: 0, loftCarcassSqft: 0, loftShutterSqft: 0, shutterFaceSqft: 64,
  };
  for (const carcassId of ["particle", "mdf", "hdhmr", "commercial-ply", "bwp-ply", "nonsense"]) {
    const input = toEstimateInput({
      widthFt: 8, heightFt: 8, depthFt: 2, method: "factory",
      carcassId, shutterId: "mdf", finishId: "lam-1", hardwareId: "premium",
      accessoryIds: [], counts,
    });
    assert.ok(CARCASS_MATERIALS.some((m) => m.id === input.carcassMaterialId), carcassId);
    assert.ok(SHUTTER_CORES.some((c) => c.id === input.shutterCoreId));
    // never throws, always lands on a real board
    assert.doesNotThrow(() => estimateWardrobe(input));
  }
});

test("prelaminated shutter core carries no separate finish charge", () => {
  const plain = estimateWardrobe({ ...base, shutterCoreId: "hdhmr", shutterFinishId: "laminate" });
  const prelam = estimateWardrobe({ ...base, shutterCoreId: "prelam-pb", shutterFinishId: "prelam" });
  // The finish is the second component; matching on "prelam" would also catch
  // the core, whose label starts with "Prelaminated".
  const finishLine = prelam.shutters.components[1];
  assert.equal(finishLine.label, "Prelaminated / none");
  assert.equal(finishLine.ratePerSqft, 0);
  assert.ok(prelam.shutters.total < plain.shutters.total);
  // A prelam core CAN still take a real finish if someone explicitly asks for
  // one — the business may allow it. What protects the customer from paying
  // twice is that every UI path defaults a prelam core to "none"; the engine
  // does not silently override a deliberate choice.
  const forced = estimateWardrobe({ ...base, shutterCoreId: "prelam-pb", shutterFinishId: "pu" });
  assert.ok(forced.shutters.total > prelam.shutters.total);
});

test("every UI path defaults a prelaminated shutter core to no extra finish", async () => {
  const { toEstimateInput } = await import("./adapter.ts");
  const counts = {
    sections: 2, partitions: 1, shelves: 0, drawers: 0, rails: 0, accessories: 0,
    shutters: 2, doorType: "hinged" as const, loft: false,
    shelfAreaSqft: 0, partitionAreaSqft: 0, loftCarcassSqft: 0, loftShutterSqft: 0, shutterFaceSqft: 64,
  };
  // The designer holds a laminate finish, but the core it maps to is prelam.
  const input = toEstimateInput({
    widthFt: 8, heightFt: 8, depthFt: 2, method: "factory",
    carcassId: "bwp-ply", shutterId: "particle", finishId: "lam-1",
    hardwareId: "luxury", accessoryIds: [], counts,
  });
  assert.equal(input.shutterCoreId, "prelam-pb");
  assert.equal(input.shutterFinishId, "prelam");
});

test("carpenter to factory moves labour only", () => {
  const carp = estimateWardrobe({ ...base, buildMethod: "carpenter" });
  const fact = estimateWardrobe({ ...base, buildMethod: "factory" });
  assert.equal(carp.carcass.total, fact.carcass.total);
  assert.equal(carp.carcassFinish.total, fact.carcassFinish.total);
  assert.equal(carp.shutters.total, fact.shutters.total);
  assert.equal(carp.hardware.total, fact.hardware.total);
  assert.equal(carp.margin.total, fact.margin.total);
  assert.equal(carp.miscellaneous.total, fact.miscellaneous.total);
});

test("repeated identical calls are stable — no accumulating state", () => {
  const totals = new Set<number>();
  for (let i = 0; i < 25; i += 1) totals.add(estimateWardrobe(base).finalTotal);
  assert.equal(totals.size, 1);
});

test("no NaN or negative money reaches a quote", () => {
  for (const patch of [
    {},
    { widthFt: 3, heightFt: 6 },
    { widthFt: 20, heightFt: 10 },
    { carcassMaterialId: "prelam-pb", shutterCoreId: "prelam-pb", shutterFinishId: "prelam" },
    { shutterSystem: "aluminium-glass" as const },
  ]) {
    const e = estimateWardrobe({ ...base, ...patch });
    assert.ok(Number.isFinite(e.finalTotal) && e.finalTotal > 0);
    assert.ok(Number.isFinite(e.finalRatePerSqft) && e.finalRatePerSqft > 0);
    for (const g of e.publicGroups) assert.ok(Number.isFinite(g.total) && g.total > 0, g.label);
    for (const b of e.buckets) assert.ok(Number.isFinite(b.total) && b.total >= 0, b.label);
  }
});
