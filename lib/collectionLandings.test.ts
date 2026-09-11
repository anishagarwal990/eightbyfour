/**
 * Collection landing registry + URL routing tests.
 *
 * Run: node --test lib/collectionLandings.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  COLLECTION_LANDINGS,
  collectionLandingPath,
  getCollectionLanding,
  getCollectionLandingBySlug,
  isLandingIndexable,
} from "./collectionLandings.ts";
import { categoryPageUrl } from "./categoryPagination.ts";
import { CATEGORIES } from "./categories.ts";

test("every landing belongs to a real category and has a unique, URL-safe slug within it", () => {
  const seen = new Set<string>();
  for (const l of COLLECTION_LANDINGS) {
    const category = CATEGORIES.find((c) => c.slug === l.categorySlug);
    assert.ok(category, `unknown category ${l.categorySlug}`);
    assert.match(l.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, l.slug);
    const key = `${l.categorySlug}/${l.slug}`;
    assert.ok(!seen.has(key), `duplicate slug ${key}`);
    seen.add(key);
    assert.ok(l.name.trim() && l.brand.trim() && l.brandSlug.trim());
  }
});

test("no landing is a placeholder, a generic range or a bare internal code (decision rule 1)", () => {
  for (const l of COLLECTION_LANDINGS) {
    const category = CATEGORIES.find((c) => c.slug === l.categorySlug)!;
    assert.notEqual(l.collection.toLowerCase(), "other");
    assert.notEqual(l.collection.toLowerCase(), category.dbCategory.toLowerCase(), `${l.collection} is just the category`);
    assert.notEqual(l.collection.toUpperCase(), "HPL");
    assert.doesNotMatch(l.collection, /^[A-Z0-9-]{2,4}$/, `${l.collection} is a bare code`);
  }
});

test("a landing collection routes to its clean path, page 1 and page N", () => {
  assert.equal(categoryPageUrl("laminates", 1, "Luvih"), "/products/laminates/collections/merino-luvih");
  assert.equal(categoryPageUrl("laminates", 3, "Luvih"), "/products/laminates/collections/merino-luvih/page/3");
  assert.equal(categoryPageUrl("veneers", 1, "Designer Veneer"), "/products/veneers/collections/designer-veneer");
});

test("matching is case-insensitive and scoped to the category", () => {
  assert.equal(getCollectionLanding("laminates", "luvih")?.slug, "merino-luvih");
  assert.equal(getCollectionLanding("laminates", "  Luvih ")?.slug, "merino-luvih");
  assert.equal(getCollectionLanding("veneers", "Luvih"), undefined);
  assert.equal(getCollectionLanding("laminates", null), undefined);
});

test("filters without a landing stay ?collection= filters (their canonical is the category)", () => {
  assert.equal(categoryPageUrl("laminates", 1, "ZMT"), "/products/laminates?collection=ZMT");
  assert.equal(categoryPageUrl("laminates", 1, "Laminates"), "/products/laminates?collection=Laminates");
  assert.equal(categoryPageUrl("laminates", 2, "other"), "/products/laminates/page/2?collection=other");
});

test("slug lookups round-trip to the same landing and path", () => {
  for (const l of COLLECTION_LANDINGS) {
    assert.equal(getCollectionLandingBySlug(l.categorySlug, l.slug), l);
    assert.equal(categoryPageUrl(l.categorySlug, 1, l.collection), collectionLandingPath(l));
  }
});

// ---- quality gate: SKU count alone doesn't earn indexation ----

test("isLandingIndexable: omitted defaults true, explicit false is honoured", () => {
  assert.equal(isLandingIndexable({}), true);
  assert.equal(isLandingIndexable({ indexable: true }), true);
  assert.equal(isLandingIndexable({ indexable: false }), false);
});

test("the two house-brand merchandising ranges are gated off; a real manufacturer/category range is not", () => {
  const acrylic = getCollectionLandingBySlug("laminates", "eightbyfour-acrylic")!;
  const mastersWoodGrains = getCollectionLandingBySlug("laminates", "eightbyfour-masters-wood-grains")!;
  const luvih = getCollectionLandingBySlug("laminates", "merino-luvih")!;
  const designerVeneer = getCollectionLandingBySlug("veneers", "designer-veneer")!;
  assert.equal(isLandingIndexable(acrylic), false);
  assert.equal(isLandingIndexable(mastersWoodGrains), false);
  assert.equal(isLandingIndexable(luvih), true);
  assert.equal(isLandingIndexable(designerVeneer), true);
});

test("the URL and page still exist for a gated-off range — the gate gates indexing, not the architecture", () => {
  const acrylic = getCollectionLandingBySlug("laminates", "eightbyfour-acrylic")!;
  assert.equal(collectionLandingPath(acrylic), "/products/laminates/collections/eightbyfour-acrylic");
  assert.equal(categoryPageUrl("laminates", 1, "Acrylic Collection"), collectionLandingPath(acrylic));
});
