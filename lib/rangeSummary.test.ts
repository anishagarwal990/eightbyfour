/**
 * Range (collection landing) summary tests.
 *
 * Run: node --test lib/rangeSummary.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import { collectionLandingDescription, collectionLandingTitle, summarizeRange } from "./rangeSummary.ts";

const row = (code: string, over: Record<string, unknown> = {}) => ({
  brand: "Virgo",
  sd_code: code,
  finish: "SHG",
  finishes: null,
  price_table: { unit: "sheet", starting_price: 1145 },
  thicknesses: ["1.00 mm"],
  ...over,
});

test("counts, code span, finishes and the lowest listed rate come from the range's own rows", () => {
  const s = summarizeRange([row("1987"), row("1832", { price_table: { unit: "sheet", starting_price: 1100 } }), row("6536", { finish: "SF" }), row("1990", { price_table: null })]);
  assert.equal(s.count, 4);
  assert.equal(s.pricedCount, 3);
  assert.equal(s.priceFrom, "₹1100/sheet");
  assert.deepEqual(s.codeRange, { from: "1832", to: "6536" });
  assert.deepEqual(s.finishes, ["Superlative High Gloss (SHG)", "Suede Finish (SF)"]);
  assert.deepEqual(s.thicknesses, ["1.00 mm"]);
});

test("the code span uses plain numeric codes when the range has them", () => {
  const s = summarizeRange([row("21301"), row("27K21"), row("37383")]);
  assert.deepEqual(s.codeRange, { from: "21301", to: "37383" });
  const prefixed = summarizeRange([row("DM1003"), row("DM6006")]);
  assert.deepEqual(prefixed.codeRange, { from: "DM1003", to: "DM6006" });
});

test("an unpriced range says so instead of quoting a number", () => {
  const s = summarizeRange([row("3903", { brand: "Century Laminates", price_table: null, finish: "LN" }), row("3904", { brand: "Century Laminates", price_table: null, finish: "LN" })]);
  assert.equal(s.priceFrom, null);
  assert.equal(collectionLandingTitle({ name: "Century Laminates Linen" }, s), "Century Laminates Linen — 2 Designs & Shade Codes");
  assert.ok(!collectionLandingDescription({ name: "Century Laminates Linen" }, s).includes("₹"));
});

test("titles and descriptions stay within their budgets", () => {
  const s = summarizeRange(Array.from({ length: 224 }, (_, i) => row(String(1000 + i), { finish: i % 2 ? "SHG" : "SF" })));
  const title = collectionLandingTitle({ name: "Greenlam Digital Custom Laminates" }, s);
  assert.equal(title, "Greenlam Digital Custom Laminates — 224 Designs & Prices");
  const d = collectionLandingDescription({ name: "Greenlam Digital Custom Laminates" }, s);
  assert.ok(d.length <= 155, `${d.length}: ${d}`);
  assert.ok(d.includes("224 designs"), d);
});
