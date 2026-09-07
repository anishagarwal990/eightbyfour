/**
 * Quotation engine tests.
 *
 * Run: `node --test lib/quote-math.test.ts`
 * (tsconfig excludes test files, so the .ts import specifiers below stay
 * invisible to `next build` / `tsc`.)
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  computeLine,
  computeOption,
  normalizeRate,
  pricingQuantity,
  quoteValueRange,
  round2,
  type LineResult,
} from "./quote-math.ts";

const line = (over: Partial<Parameters<typeof computeLine>[0]> = {}): LineResult =>
  computeLine({
    basis: "PER_SQFT",
    quantity: 45,
    sheetAreaSqft: 32,
    gstRate: 18,
    inputMode: "EX_GST",
    enteredRate: 137.3,
    ...over,
  });

// ---- pricing basis ----

test("PER_SQFT pricing quantity = sheets × area", () => {
  assert.equal(pricingQuantity("PER_SQFT", 45, 32), 1440);
});

test("PER_SHEET / PER_UNIT / PER_PAIR pricing quantity = quantity", () => {
  assert.equal(pricingQuantity("PER_SHEET", 50, 32), 50);
  assert.equal(pricingQuantity("PER_UNIT", 12, null), 12);
  assert.equal(pricingQuantity("PER_PAIR", 8, null), 8);
});

test("PER_SQFT with no sheet area cannot be priced", () => {
  const r = computeLine({ basis: "PER_SQFT", quantity: 45, gstRate: 18, inputMode: "EX_GST", enteredRate: 137.3 });
  assert.equal(r.priced, false);
  assert.equal(r.taxableAmount, 0);
});

// ---- the Mikasa acceptance numbers ----

test("Austin Gold 19mm: 45 × 32 × 137.30 = 197712.00", () => {
  assert.equal(line().taxableAmount, 197712);
});

test("Austin Gold 12mm: 5 × 32 × 103 = 16480.00", () => {
  assert.equal(line({ quantity: 5, enteredRate: 103 }).taxableAmount, 16480);
});

test("Austin Gold 9mm: 10 × 32 × 84 = 26880.00", () => {
  assert.equal(line({ quantity: 10, enteredRate: 84 }).taxableAmount, 26880);
});

test("Austin Gold 25mm: 5 × 32 × 198 = 31680.00", () => {
  assert.equal(line({ quantity: 5, enteredRate: 198 }).taxableAmount, 31680);
});

test("Liner: 50 sheets × ₹450/sheet = 22500.00", () => {
  const r = computeLine({ basis: "PER_SHEET", quantity: 50, gstRate: 18, inputMode: "EX_GST", enteredRate: 450 });
  assert.equal(r.taxableAmount, 22500);
});

test("Austin Gold material taxable total = 295252.00", () => {
  const lines = [
    line(),
    line({ quantity: 5, enteredRate: 103 }),
    line({ quantity: 10, enteredRate: 84 }),
    line({ quantity: 5, enteredRate: 198 }),
    computeLine({ basis: "PER_SHEET", quantity: 50, gstRate: 18, inputMode: "EX_GST", enteredRate: 450 }),
  ];
  const opt = computeOption({ lines, chargesGstRate: 18 });
  assert.equal(opt.materialTaxable, 295252);
});

test("Marine Blue material taxable total = 320237.60", () => {
  const lines = [
    line({ enteredRate: 153.4 }),
    line({ quantity: 5, enteredRate: 106.2 }),
    line({ quantity: 10, enteredRate: 87.32 }),
    line({ quantity: 5, enteredRate: 199.42 }),
    computeLine({ basis: "PER_SHEET", quantity: 50, gstRate: 18, inputMode: "EX_GST", enteredRate: 450 }),
  ];
  const opt = computeOption({ lines, chargesGstRate: 18 });
  assert.equal(opt.materialTaxable, 320237.6);
});

// ---- GST ex <-> incl ----

test("EX_GST → incl: 100 @ 18% → 118", () => {
  assert.equal(normalizeRate(100, "EX_GST", 18).rateInclGst, 118);
});

test("INCL_GST → ex: 118 @ 18% → 100 (exact)", () => {
  assert.equal(normalizeRate(118, "INCL_GST", 18).baseRateExGst, 100);
});

test("switching a line's entry mode does not change the commercial result", () => {
  const ex = computeLine({ basis: "PER_SHEET", quantity: 10, gstRate: 18, inputMode: "EX_GST", enteredRate: 100 });
  const incl = computeLine({ basis: "PER_SHEET", quantity: 10, gstRate: 18, inputMode: "INCL_GST", enteredRate: 118 });
  assert.equal(ex.taxableAmount, incl.taxableAmount);
  assert.equal(ex.gstAmount, incl.gstAmount);
  assert.equal(ex.amountInclGst, incl.amountInclGst);
});

// ---- GST slabs ----

for (const g of [0, 5, 12, 18, 28]) {
  test(`GST ${g}%: taxable 10000 → gst ${10000 * (g / 100)}`, () => {
    const r = computeLine({ basis: "MANUAL", quantity: 1, gstRate: g, inputMode: "EX_GST", manualAmount: 10000 });
    assert.equal(r.gstAmount, round2(10000 * (g / 100)));
    assert.equal(r.amountInclGst, round2(10000 + 10000 * (g / 100)));
  });
}

// ---- rate override ----

test("overriding the rate changes only this line, from the entered number", () => {
  const book = line().taxableAmount; // 197712 @ 137.30
  const overridden = line({ enteredRate: 135 }).taxableAmount; // 45×32×135
  assert.equal(book, 197712);
  assert.equal(overridden, 194400);
  assert.notEqual(book, overridden);
});

// ---- line discount ----

test("line discount reduces taxable and GST", () => {
  const r = computeLine({
    basis: "PER_SHEET",
    quantity: 10,
    gstRate: 18,
    inputMode: "EX_GST",
    enteredRate: 1000,
    lineDiscount: 500,
  });
  assert.equal(r.grossTaxable, 10000);
  assert.equal(r.taxableAmount, 9500);
  assert.equal(r.gstAmount, 1710);
});

// ---- option: discount, charges, GST on charges, round-off ----

test("option discount scales material GST proportionally", () => {
  const lines = [computeLine({ basis: "PER_SHEET", quantity: 10, gstRate: 18, inputMode: "EX_GST", enteredRate: 1000 })];
  const opt = computeOption({ lines, optionDiscount: 1000, chargesGstRate: 18 });
  assert.equal(opt.materialTaxable, 10000);
  assert.equal(opt.materialTaxableNet, 9000);
  assert.equal(opt.materialGst, 1620); // 1800 × 0.9
});

test("taxable freight adds GST; non-taxable freight does not", () => {
  const lines = [computeLine({ basis: "PER_SHEET", quantity: 1, gstRate: 18, inputMode: "EX_GST", enteredRate: 10000 })];
  const taxed = computeOption({ lines, freight: { amount: 2000, taxable: true }, chargesGstRate: 18 });
  const free = computeOption({ lines, freight: { amount: 2000, taxable: false }, chargesGstRate: 18 });
  assert.equal(taxed.chargesGst, 360);
  assert.equal(free.chargesGst, 0);
  assert.equal(taxed.taxableSubtotal, 12000);
  assert.equal(free.taxableSubtotal, 10000);
});

test("auto round-off pulls the grand total to a whole rupee", () => {
  const lines = [computeLine({ basis: "PER_SHEET", quantity: 1, gstRate: 18, inputMode: "EX_GST", enteredRate: 1234.5 })];
  const opt = computeOption({ lines, chargesGstRate: 18 });
  assert.equal(Number.isInteger(opt.grandTotal), true);
  assert.ok(Math.abs(opt.roundOff) <= 0.5);
});

test("explicit round-off is used verbatim", () => {
  const lines = [computeLine({ basis: "PER_SHEET", quantity: 1, gstRate: 18, inputMode: "EX_GST", enteredRate: 10000 })];
  const opt = computeOption({ lines, roundOff: -18, chargesGstRate: 18 });
  assert.equal(opt.roundOff, -18);
  assert.equal(opt.grandTotal, 11782); // 10000 + 1800 - 18
});

// ---- multiple options are a range, never a sum ----

test("quoteValueRange returns min/max, never the sum", () => {
  const r = quoteValueRange([295252, 320237.6]);
  assert.deepEqual(r, { min: 295252, max: 320237.6 });
  assert.notEqual(r!.min + r!.max, r!.max);
});

test("a single option is a point, not doubled", () => {
  assert.deepEqual(quoteValueRange([100000]), { min: 100000, max: 100000 });
});

// ---- snapshot immutability ----

test("recomputing from a stored snapshot yields the identical amount", () => {
  const snapshot = { basis: "PER_SQFT" as const, quantity: 45, sheetAreaSqft: 32, gstRate: 18, inputMode: "EX_GST" as const, enteredRate: 137.3 };
  const first = computeLine(snapshot).taxableAmount;
  // "Rate Book changes to 140" — but the snapshot still holds 137.30
  const laterBookRate = 140;
  void laterBookRate;
  const reopened = computeLine(snapshot).taxableAmount;
  assert.equal(first, reopened);
  assert.equal(reopened, 197712);
});

// ---- decimal precision ----

test("float noise does not leak into a stored amount", () => {
  // 10 × 32 × 87.32 = 27942.4 exactly, but 320 * 87.32 is 27942.400000000001 in binary
  assert.equal(line({ quantity: 10, enteredRate: 87.32 }).taxableAmount, 27942.4);
  assert.equal(0.1 + 0.2 !== 0.3, true);
  assert.equal(round2(0.1 + 0.2), 0.3);
});
