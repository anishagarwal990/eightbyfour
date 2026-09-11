/**
 * Internal-linking engine tests — which products a product page links to.
 *
 * Run: node --test lib/productRelations.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import { buildProductRelations, distinguishingFinish, RELATION_LIMITS, shadeFamilyOf, type ProductSummary } from "./productRelations.ts";

function p(id: number, over: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id,
    slug: `sku-${id}`,
    category: "Laminates",
    brand: "Century Laminates",
    name: `Shade ${id}`,
    collection: null,
    sd_code: null,
    finish: null,
    finishes: null,
    size: "8×4 ft",
    thicknesses: ["1mm"],
    main_img_url: null,
    price_table: null,
    warranty: null,
    ...over,
  };
}

const cambricLN = p(1, { name: "French Cambric", sd_code: "3903", finish: "LN", collection: "Linen" });
const centuryPool = [
  cambricLN,
  p(2, { name: "French Cambric", sd_code: "3903", finish: "SU", collection: "Linen" }),
  p(3, { name: "Sanaza", sd_code: "3904", finish: "LN", collection: "Linen" }),
  p(4, { name: "Sanaza", sd_code: "3904", finish: "SU", collection: "Linen" }),
  p(5, { name: "Soraya", sd_code: "3950", finish: "LN", collection: "Linen" }),
  p(6, { name: "Arctic Blue", sd_code: "3200", finish: "LU", collection: "Solids" }),
  p(7, { name: "Brushed Lint", sd_code: "3902", finish: "LN", collection: "Linen" }),
];

test("other finishes: same brand + code, never the page itself", () => {
  const r = buildProductRelations(cambricLN, centuryPool, []);
  assert.deepEqual(r.otherFinishes.map((x) => x.id), [2]);
});

test("similar shades: nearest codes in the same range first, one row per design, in the visitor's finish", () => {
  const r = buildProductRelations(cambricLN, centuryPool, []);
  const ids = r.similar.map((x) => x.id);
  assert.deepEqual(new Set(ids.slice(0, 2)), new Set([3, 7]), "3902 and 3904 are one code away");
  assert.equal(ids[2], 5, "3950 is further but still in Linen");
  assert.equal(ids[3], 6, "other ranges come after the product's own");
  assert.ok(!ids.includes(4), "3904 appears once, as its LN variant");
  assert.ok(!ids.includes(1) && !ids.includes(2));
});

test("same finish: only designs sharing the distinguishing finish, not already linked", () => {
  const r = buildProductRelations(cambricLN, centuryPool, [], { otherFinishes: 8, similar: 2, sameFinish: 6, alternatives: 4 });
  assert.equal(r.sameFinish?.label, "LN");
  assert.deepEqual(r.sameFinish?.products.map((x) => x.id), [5]);
});

test("default caps stay in the 4-6 relevance range per group — a SKU page is not a catalogue directory", () => {
  for (const limit of Object.values(RELATION_LIMITS)) {
    assert.ok(limit >= 4 && limit <= 6, `limit ${limit} outside 4-6`);
  }
  const total = Object.values(RELATION_LIMITS).reduce((a, b) => a + b, 0);
  assert.ok(total <= 24, `worst-case total ${total} product links from the relation engine`);
});

test("no product is linked twice across groups", () => {
  const r = buildProductRelations(cambricLN, centuryPool, []);
  const all = [...r.otherFinishes, ...r.similar, ...(r.sameFinish?.products ?? []), ...r.alternatives.products].map((x) => x.id);
  assert.equal(all.length, new Set(all).size);
});

test("other brands: same shade family, other brands only, spread across brands", () => {
  const sagaGreen = p(10, { brand: "Merino", name: "Saga Green", sd_code: "22153", finishes: ["Standard", "FT"] });
  const alt = [
    p(20, { brand: "Virgo", name: "Moss Green", sd_code: "1400" }),
    p(21, { brand: "Greenlam", name: "Olive Leaf", sd_code: "501" }),
    p(22, { brand: "Century Laminates", name: "Forest Green", sd_code: "3300" }),
    p(23, { brand: "Greenlam", name: "Sage Mist", sd_code: "502" }),
    p(24, { brand: "Virgo", name: "Snow White", sd_code: "1401" }),
    p(25, { brand: "Merino", name: "Jade", sd_code: "22160" }),
  ];
  const r = buildProductRelations(sagaGreen, [], alt);
  assert.equal(r.alternatives.family?.key, "green");
  const ids = r.alternatives.products.map((x) => x.id);
  assert.ok(!ids.includes(24), "white is not green");
  assert.ok(!ids.includes(25), "same brand is not an alternative");
  assert.equal(new Set(r.alternatives.products.slice(0, 3).map((x) => x.brand)).size, 3, "first three are three different brands");
});

test("a shade name with no family word gets no cross-brand block rather than an arbitrary one", () => {
  const alankrit = p(30, { brand: "Merino", name: "Alankrit", sd_code: "85112" });
  const r = buildProductRelations(alankrit, [], [p(31, { brand: "Virgo", name: "Coined", sd_code: "1987" })]);
  assert.equal(r.alternatives.family, null);
  assert.deepEqual(r.alternatives.products, []);
});

test("code-less boards compare against other brands in the same category", () => {
  const sainik = p(40, { brand: "Century", name: "Sainik 710", category: "Plywood" });
  const r = buildProductRelations(
    sainik,
    [sainik, p(41, { brand: "Century", name: "Club Prime", category: "Plywood" })],
    [p(42, { brand: "Greenply", name: "Green Club", category: "Plywood" }), p(43, { brand: "Austin", name: "Gold", category: "Plywood" }), p(44, { brand: "Greenply", name: "Laminate", category: "Laminates" })]
  );
  assert.deepEqual(r.similar.map((x) => x.id), [41]);
  assert.deepEqual(new Set(r.alternatives.products.map((x) => x.id)), new Set([42, 43]));
  assert.equal(r.sameFinish, null);
});

test("orderings are deterministic for a page but differ between pages", () => {
  const pool = Array.from({ length: 40 }, (_, i) => p(100 + i, { brand: "EightByFour", category: "Veneers", collection: "Natural Veneer" }));
  const a = buildProductRelations(pool[0], pool, []).similar.map((x) => x.id);
  const again = buildProductRelations(pool[0], pool, []).similar.map((x) => x.id);
  const b = buildProductRelations(pool[1], pool, []).similar.map((x) => x.id);
  assert.deepEqual(a, again);
  assert.notDeepEqual(a, b);
});

test("shade families come from words in the name", () => {
  assert.equal(shadeFamilyOf("Saga Green")?.key, "green");
  assert.equal(shadeFamilyOf("Gigan Lowa Walnut")?.key, "walnut");
  assert.equal(shadeFamilyOf("Shinfa Samari Oak")?.key, "oak");
  assert.equal(shadeFamilyOf("Rose Chalk")?.key, "pink");
  assert.equal(shadeFamilyOf("Toned Blue")?.key, "blue");
  assert.equal(shadeFamilyOf("British Buff"), null);
  assert.equal(shadeFamilyOf("Greenwich"), null, "whole words only");
});

test("distinguishing finish: own finish on per-SKU catalogues, first non-Standard on multi-finish designs", () => {
  assert.equal(distinguishingFinish({ finish: "SHG", finishes: null }), "SHG");
  assert.equal(distinguishingFinish({ finish: "Standard", finishes: ["Standard", "FT", "MR+"] }), "FT");
  assert.equal(distinguishingFinish({ finish: "Standard", finishes: ["Standard"] }), null);
});
