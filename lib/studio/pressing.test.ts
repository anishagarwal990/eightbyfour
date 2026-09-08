import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRESS_CONFIG, boardOnlyTotal, pricePressing } from "./pressing.ts";
import type { MaterialSelection } from "./materialSelection.ts";

const pricedBoard: MaterialSelection = {
  kind: "catalogue", slug: "b1", name: "BWP Ply", brand: "Test", label: "Test · BWP Ply · 19mm",
  thickness: "19mm", sheetPrice: { amount: 3200, from: true }, href: "/products/b1",
};
const unpricedLaminate: MaterialSelection = {
  kind: "catalogue", slug: "l1", name: "Some Shade", brand: "Test", label: "Test · Some Shade",
  thickness: "1 mm", sheetPrice: null, href: "/products/l1",
};
const manualLaminate: MaterialSelection = { kind: "manual", brand: "Local", code: "X-9", finish: "MT" };

test("bring-your-own drops board and laminate lines, keeps the press work", () => {
  const bought = pricePressing({ ...DEFAULT_PRESS_CONFIG, materialSource: "eightbyfour" });
  const own = pricePressing({ ...DEFAULT_PRESS_CONFIG, materialSource: "own" });

  const ownMaterials = own.groups.find((g) => g.key === "materials")!;
  assert.equal(ownMaterials.lines.length, 1);
  assert.match(ownMaterials.lines[0].label, /adhesive/i);

  for (const key of ["fabrication", "delivery"] as const) {
    assert.equal(own.groups.find((g) => g.key === key)!.subtotal, bought.groups.find((g) => g.key === key)!.subtotal);
  }
  assert.ok(own.total < bought.total);
});

test("an unpriced or manual material becomes a ₹0 line with a pending note", () => {
  const q = pricePressing({
    ...DEFAULT_PRESS_CONFIG,
    board: pricedBoard,
    frontLaminate: unpricedLaminate,
    backLaminate: manualLaminate,
    sides: "double",
  });
  const mats = q.groups.find((g) => g.key === "materials")!;
  const front = mats.lines.find((l) => /Some Shade/.test(l.label))!;
  const back = mats.lines.find((l) => /Local/.test(l.label))!;
  assert.equal(front.amount, 0);
  assert.equal(back.amount, 0);
  assert.ok(q.pendingNote);
  // Board (priced) still contributes.
  assert.ok(mats.lines.find((l) => /BWP Ply/.test(l.label))!.amount > 0);
});

test("same-as-front back laminate is priced as the front laminate", () => {
  const single = pricePressing({
    ...DEFAULT_PRESS_CONFIG, board: pricedBoard, frontLaminate: { ...pricedBoard, kind: "catalogue" },
    backLaminate: { kind: "same-as-front" }, sides: "single",
  });
  const double = pricePressing({
    ...DEFAULT_PRESS_CONFIG, board: pricedBoard, frontLaminate: { ...pricedBoard, kind: "catalogue" },
    backLaminate: { kind: "same-as-front" }, sides: "double",
  });
  assert.ok(double.total > single.total);
  assert.ok(!double.pendingNote); // both faces priced
});

test("boardOnlyTotal is 0 when the board has no rate or is customer-supplied", () => {
  assert.equal(boardOnlyTotal({ ...DEFAULT_PRESS_CONFIG, materialSource: "own" }), 0);
  assert.equal(boardOnlyTotal({ ...DEFAULT_PRESS_CONFIG, board: unpricedLaminate }), 0);
  assert.ok(boardOnlyTotal({ ...DEFAULT_PRESS_CONFIG, board: pricedBoard }) > 0);
});

test("single vs double side changes the press for bring-your-own too", () => {
  const single = pricePressing({ ...DEFAULT_PRESS_CONFIG, materialSource: "own", sides: "single" });
  const double = pricePressing({ ...DEFAULT_PRESS_CONFIG, materialSource: "own", sides: "double" });
  assert.ok(double.total > single.total);
});
