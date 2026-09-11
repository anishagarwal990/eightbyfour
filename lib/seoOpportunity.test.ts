/**
 * Search opportunity scoring tests.
 *
 * Run: node --test lib/seoOpportunity.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import { ctrGap, expectedCtr, opportunityBucket, opportunityScore, rankOpportunities, toPath } from "./seoOpportunity.ts";

test("expected CTR never rises as position worsens", () => {
  let previous = Infinity;
  for (let pos = 1; pos <= 30; pos += 0.5) {
    const ctr = expectedCtr(pos);
    assert.ok(ctr <= previous, `position ${pos}`);
    assert.ok(ctr > 0);
    previous = ctr;
  }
});

test("a page-1 page with no clicks outranks a top-3 page with the same impressions", () => {
  const striking = opportunityScore({ impressions: 100, position: 8, ctr: 0 });
  const winning = opportunityScore({ impressions: 100, position: 2, ctr: 0.2 });
  assert.ok(striking > winning);
});

test("the CTR gap closes as a page converts", () => {
  assert.ok(ctrGap(8, 0) > ctrGap(8, 0.05));
  assert.equal(ctrGap(8, 0.5), 0);
});

test("buckets", () => {
  assert.equal(opportunityBucket({ position: 2, ctr: 0.2 }), "protect");
  assert.equal(opportunityBucket({ position: 2, ctr: 0.01 }), "fix-snippet");
  assert.equal(opportunityBucket({ position: 8, ctr: 0 }), "striking-distance");
  assert.equal(opportunityBucket({ position: 14, ctr: 0 }), "page-two");
  assert.equal(opportunityBucket({ position: 40, ctr: 0 }), "long-tail");
});

test("ranking drops thin rows, strips the origin and sorts by score", () => {
  const ranked = rankOpportunities([
    { page: "https://www.eightbyfour.com/products/a", clicks: 0, impressions: 120, ctr: 0, position: 8.4 },
    { page: "https://www.eightbyfour.com/products/b", clicks: 9, impressions: 51, ctr: 0.176, position: 2.5 },
    { page: "https://www.eightbyfour.com/products/c", clicks: 0, impressions: 3, ctr: 0, position: 7 },
  ]);
  assert.deepEqual(ranked.map((r) => r.path), ["/products/a", "/products/b"]);
  assert.equal(ranked[0].bucket, "striking-distance");
});

test("toPath", () => {
  assert.equal(toPath("https://www.eightbyfour.com/products/x?collection=Y"), "/products/x?collection=Y");
  assert.equal(toPath("http://www.eightbyfour.com/"), "/");
  assert.equal(toPath("/guides/a"), "/guides/a");
});
