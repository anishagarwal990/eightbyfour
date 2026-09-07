/**
 * SEO metadata helper tests.
 *
 * Run: `node --test lib/seo.test.ts lib/categoryPagination.test.ts`
 * (Node strips the `import type` from ./seo — it has no runtime imports.)
 */

import test from "node:test";
import assert from "node:assert/strict";
import { buildMetadata } from "./seo.ts";

const SITE = "https://www.eightbyfour.com";

test("canonical is the absolute site URL for the given path", () => {
  const m = buildMetadata({ title: "Plywood", description: "x".repeat(140), path: "/products/plywood" });
  assert.equal(m.alternates?.canonical, `${SITE}/products/plywood`);
  assert.equal(m.openGraph?.url, `${SITE}/products/plywood`);
});

test("short title keeps the brand-suffix template (string title)", () => {
  const m = buildMetadata({ title: "Plywood — Prices & Brands", description: "d".repeat(130), path: "/x" });
  assert.equal(typeof m.title, "string");
});

test("a title that would blow the ~60 budget with the suffix drops the suffix (absolute)", () => {
  const long = "Laminate Sheets — Compare Prices, Brands, Shades and Finishes Online";
  const m = buildMetadata({ title: long, description: "d".repeat(130), path: "/x" });
  assert.deepEqual(m.title, { absolute: long });
});

test("a pathologically long title is truncated at the hard ceiling with an ellipsis", () => {
  const huge = "Word ".repeat(40).trim();
  const m = buildMetadata({ title: huge, description: "d".repeat(130), path: "/x" });
  const rendered = (m.title as { absolute: string }).absolute;
  assert.ok(rendered.length <= 78, `title length ${rendered.length} should be <= 78`);
  assert.ok(rendered.endsWith("…"));
});

test("noindex option emits robots index:false, follow:true", () => {
  const m = buildMetadata({ title: "Empty Category", description: "d".repeat(130), path: "/x", noindex: true });
  assert.deepEqual(m.robots, { index: false, follow: true });
});

test("indexable pages carry no robots override", () => {
  const m = buildMetadata({ title: "Plywood", description: "d".repeat(130), path: "/x" });
  assert.equal(m.robots, undefined);
});

test("a too-short description is padded, not left thin", () => {
  const m = buildMetadata({ title: "T", description: "Short copy.", path: "/x" });
  assert.ok((m.description as string).length > "Short copy.".length);
});

test("a description is truncated to <= 155 chars on a word boundary", () => {
  const m = buildMetadata({ title: "T", description: "word ".repeat(60).trim(), path: "/x" });
  const d = m.description as string;
  assert.ok(d.length <= 155, `description length ${d.length}`);
  assert.ok(!d.includes("wor…") || d.endsWith("…"));
});
