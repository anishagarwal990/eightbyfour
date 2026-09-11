/**
 * Search-performance safety tier tests.
 *
 * Run: node --test lib/seoProtection.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import { SEO_OPPORTUNITY_SNAPSHOT, classifyProductTiers, seoTierForSlug, tierFromBucket } from "./seoProtection.ts";
import { rankOpportunities } from "./seoOpportunity.ts";

test("bucket -> tier mapping matches the documented safeguard", () => {
  assert.equal(tierFromBucket("protect"), "protect");
  assert.equal(tierFromBucket("fix-snippet"), "optimise");
  assert.equal(tierFromBucket("striking-distance"), "optimise");
  assert.equal(tierFromBucket("page-two"), "discover");
  assert.equal(tierFromBucket("long-tail"), "discover");
});

test("classifyProductTiers strips the /products/ prefix and ignores non-product rows", () => {
  const map = classifyProductTiers([
    { path: "/products/a", kind: "product", bucket: "protect" },
    { path: "/products/b", kind: "product", bucket: "striking-distance" },
    { path: "/brands/century", kind: "brand", bucket: "protect" },
  ]);
  assert.equal(map.get("a"), "protect");
  assert.equal(map.get("b"), "optimise");
  assert.equal(map.get("century"), undefined);
});

test("a slug absent from the snapshot defaults to discover", () => {
  const map = classifyProductTiers([{ path: "/products/a", kind: "product", bucket: "protect" }]);
  assert.equal(map.get("nonexistent-slug"), undefined);
});

test("seoTierForSlug on the live snapshot: unknown slugs are discover, every known slug's tier matches its bucket", () => {
  assert.equal(seoTierForSlug("definitely-not-a-real-product-slug-xyz"), "discover");
  for (const row of SEO_OPPORTUNITY_SNAPSHOT.rows) {
    if (row.kind !== "product") continue;
    const slug = row.path.replace(/^\/products\//, "");
    assert.equal(seoTierForSlug(slug), tierFromBucket(row.bucket), slug);
  }
});

test("rankOpportunities' own buckets are exactly the ones classifyProductTiers understands", () => {
  const ranked = rankOpportunities([
    { page: "/products/x", clicks: 9, impressions: 51, ctr: 0.176, position: 2.5 }, // protect
    { page: "/products/y", clicks: 0, impressions: 20, position: 2.5, ctr: 0 }, // fix-snippet
    { page: "/products/z", clicks: 0, impressions: 100, position: 8, ctr: 0 }, // striking-distance
    { page: "/products/w", clicks: 0, impressions: 20, position: 15, ctr: 0 }, // page-two
    { page: "/products/v", clicks: 0, impressions: 20, position: 40, ctr: 0 }, // long-tail
  ]);
  const map = classifyProductTiers(ranked.map((r) => ({ path: r.path, kind: "product", bucket: r.bucket })));
  assert.equal(map.get("x"), "protect");
  assert.equal(map.get("y"), "optimise");
  assert.equal(map.get("z"), "optimise");
  assert.equal(map.get("w"), "discover");
  assert.equal(map.get("v"), "discover");
});
