import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SURFACE_CONFIG, priceSurface } from "./solidSurface.ts";

test("fabrication is one line, area-based, with a per-sheet floor", () => {
  const big = priceSurface({ ...DEFAULT_SURFACE_CONFIG, runFt: 12 });
  const fab = big.groups.find((g) => g.key === "fabrication")!;
  assert.equal(fab.lines.length, 1);
  assert.equal(fab.lines[0].label, "Fabrication");

  // Tiny job: per-sheet floor must win.
  const tiny = priceSurface({ ...DEFAULT_SURFACE_CONFIG, applicationId: "vanity", runFt: 3, cutoutIds: [] });
  const tinyFab = tiny.groups.find((g) => g.key === "fabrication")!.lines[0];
  assert.match(tinyFab.detail, /per-sheet minimum/);
});

test("adding cut-outs or changing the edge does not change the price", () => {
  const base = priceSurface({ ...DEFAULT_SURFACE_CONFIG, cutoutIds: [], edgeId: "square" });
  const loaded = priceSurface({ ...DEFAULT_SURFACE_CONFIG, cutoutIds: ["sink", "hob", "tap", "drainer"], edgeId: "waterfall" });
  assert.equal(base.groups.find((g) => g.key === "fabrication")!.subtotal, loaded.groups.find((g) => g.key === "fabrication")!.subtotal);
});

test("a full-height splashback adds finished area, so it does move fabrication", () => {
  const none = priceSurface({ ...DEFAULT_SURFACE_CONFIG, backsplashId: "none" });
  const full = priceSurface({ ...DEFAULT_SURFACE_CONFIG, backsplashId: "full" });
  assert.ok(full.groups.find((g) => g.key === "fabrication")!.subtotal > none.groups.find((g) => g.key === "fabrication")!.subtotal);
});

test("bring-your-own drops the sheet line, keeps fabrication and fitting", () => {
  const bought = priceSurface({ ...DEFAULT_SURFACE_CONFIG, materialSource: "eightbyfour" });
  const own = priceSurface({ ...DEFAULT_SURFACE_CONFIG, materialSource: "own" });

  const ownMaterials = own.groups.find((g) => g.key === "materials")!;
  assert.ok(!ownMaterials.lines.some((l) => /HIMACS|Corian|Staron/i.test(l.label)));
  assert.ok(ownMaterials.lines.some((l) => /adhesive/i.test(l.label)));

  for (const key of ["fabrication", "installation", "delivery"] as const) {
    assert.equal(own.groups.find((g) => g.key === key)!.subtotal, bought.groups.find((g) => g.key === key)!.subtotal);
  }
  assert.ok(own.total < bought.total);
});
