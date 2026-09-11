import snapshot from "../seo/opportunities/latest.json" with { type: "json" };
import type { OpportunityBucket } from "./seoOpportunity.ts";

// Search-performance safety tiers for product titles — built from the
// Search Console opportunity snapshot (seo/opportunities/latest.json,
// written by scripts/seo/opportunities.mjs), not hard-coded per URL, so it
// updates whenever the snapshot is refreshed.
//
//   protect  — position <= 3.5 and CTR already at/above half the position-3
//              expected-CTR curve (the "protect" bucket in lib/seoOpportunity.ts).
//              The title stays exactly what it was before this pass — see
//              legacyProductTitle() in lib/productSeo.ts — unless it has a
//              genuine defect (a duplicated word, or a raw category label
//              leaking through, e.g. "Corian - Acrylic Solid Surface").
//   optimise — position 4-10 ("striking-distance", the highest-priority
//              group), or top-3 but converting below half the curve
//              ("fix-snippet" — the rank is fine, the snippet is the
//              problem). Gets the full new title system.
//   discover — "page-two", "long-tail", or no impression history in the
//              snapshot at all. Also gets the full new system — there is no
//              existing snippet to protect.
export type SeoTier = "protect" | "optimise" | "discover";

const BUCKET_TIER: Record<OpportunityBucket, SeoTier> = {
  protect: "protect",
  "fix-snippet": "optimise",
  "striking-distance": "optimise",
  "page-two": "discover",
  "long-tail": "discover",
};

export function tierFromBucket(bucket: OpportunityBucket): SeoTier {
  return BUCKET_TIER[bucket];
}

export interface OpportunitySnapshotRow {
  path: string;
  kind: string;
  bucket: OpportunityBucket;
}

export interface OpportunitySnapshot {
  generatedAt: string;
  window: { start: string | null; end: string | null };
  rows: OpportunitySnapshotRow[];
}

/** Pure — slug (no `/products/` prefix) → tier, from a snapshot's `rows`. Exported so tests don't depend on the live snapshot's contents. */
export function classifyProductTiers(rows: OpportunitySnapshotRow[]): Map<string, SeoTier> {
  const map = new Map<string, SeoTier>();
  for (const row of rows) {
    if (row.kind !== "product") continue;
    map.set(row.path.replace(/^\/products\//, ""), tierFromBucket(row.bucket));
  }
  return map;
}

// A static JSON import, NOT fs.readFileSync. The bundler inlines the snapshot
// into every server chunk that needs it, so there is no file to find at
// request time.
//
// The earlier readFileSync version worked in dev and in build-time prerenders
// (the repo is on disk for both) and threw ENOENT on Vercel for every page
// rendered per request, because the JSON was never in the function's traced
// files. productSeo imports this module, so every category, brand, collection
// and paginated listing page returned HTTP 500 while product pages — all
// prerendered — looked fine.
//
// `with { type: "json" }` is what lets `node --test` load it as well, which was
// the only reason fs was used. Do not reintroduce a runtime file read here
// without also listing the file in next.config.ts outputFileTracingIncludes.
export const SEO_OPPORTUNITY_SNAPSHOT: OpportunitySnapshot = snapshot as OpportunitySnapshot;

const SLUG_TIERS = classifyProductTiers(SEO_OPPORTUNITY_SNAPSHOT.rows);

/** A product's safety tier, from its slug. Not in the snapshot (no recent impressions) => "discover". */
export function seoTierForSlug(slug: string): SeoTier {
  return SLUG_TIERS.get(slug) ?? "discover";
}

export const SEO_TIER_SNAPSHOT_WINDOW = SEO_OPPORTUNITY_SNAPSHOT.window;
export const SEO_TIER_SNAPSHOT_DATE = SEO_OPPORTUNITY_SNAPSHOT.generatedAt;
