/**
 * Canonical / pagination URL helper tests.
 *
 * Run: `node --test lib/categoryPagination.test.ts lib/seo.test.ts`
 */

import test from "node:test";
import assert from "node:assert/strict";
import { categoryPagePath, categoryPageUrl, parsePageParam } from "./categoryPagination.ts";

test("page 1 category URL has no /page/ segment", () => {
  assert.equal(categoryPagePath("plywood", 1), "/products/plywood");
  assert.equal(categoryPagePath("plywood", 0), "/products/plywood");
});

test("page N>1 category URL adds /page/N", () => {
  assert.equal(categoryPagePath("laminates", 3), "/products/laminates/page/3");
});

test("collection filter is appended as ?collection= and encoded stably", () => {
  assert.equal(categoryPageUrl("veneers", 1, "Natural Veneer"), "/products/veneers?collection=Natural%20Veneer");
  // apostrophes are escaped (not left literal) so canonical and hrefs match byte-for-byte
  assert.equal(
    categoryPageUrl("laminates", 2, "The Master's Wood Grains"),
    "/products/laminates/page/2?collection=The%20Master%27s%20Wood%20Grains"
  );
});

test("no collection means no query string", () => {
  assert.equal(categoryPageUrl("plywood", 2, null), "/products/plywood/page/2");
});

test("parsePageParam: undefined is page 1, digits parse, junk is null", () => {
  assert.equal(parsePageParam(undefined), 1);
  assert.equal(parsePageParam("4"), 4);
  assert.equal(parsePageParam("0"), null);
  assert.equal(parsePageParam("-2"), null);
  assert.equal(parsePageParam("2a"), null);
  assert.equal(parsePageParam("abc"), null);
});
