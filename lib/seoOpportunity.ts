// Which pages are closest to winning more clicks, from Search Console data.
//
//   Opportunity = Impressions × Position Opportunity × CTR Gap
//
// - Impressions: demand the page already has. No impressions, no opportunity.
// - Position opportunity: how winnable the next step is. A page at 6–10 is
//   one push from the top five; a page at 2 is already winning and should be
//   protected, not churned; a page at 40 needs authority before copy matters.
// - CTR gap: clicks the page is leaving on the table against what a top-3
//   result typically earns, so a page at position 8 with 0% CTR outranks one
//   at position 8 that already converts its impressions.
//
// The expected-CTR curve is a deliberately conservative blend of public
// organic CTR studies. It is only ever used to rank pages against each other —
// never shown to anyone as a forecast of clicks.
//
// Pure: no imports, so `node --test` can load it directly, and
// scripts/seo/opportunities.mjs can score a Search Console export offline.

export interface SearchPerformanceRow {
  /** Page URL or path, as exported from Search Console. */
  page: string;
  clicks: number;
  impressions: number;
  /** 0–1, not a percentage. */
  ctr: number;
  position: number;
}

export type OpportunityBucket =
  /** Top 3 and converting at or above the curve — leave titles alone. */
  | "protect"
  /** Top 3 but clicked well below the curve — the snippet is the problem, not the rank. */
  | "fix-snippet"
  /** Page 1, positions 4–10 — the band this whole system exists to push into the top five. */
  | "striking-distance"
  /** Positions 11–20 — needs internal links/relevance before the snippet matters. */
  | "page-two"
  | "long-tail";

export interface ScoredRow extends SearchPerformanceRow {
  path: string;
  score: number;
  bucket: OpportunityBucket;
}

/** Expected organic CTR by position (index = position). */
const EXPECTED_CTR_BY_POSITION = [0.28, 0.28, 0.16, 0.11, 0.08, 0.065, 0.05, 0.04, 0.032, 0.028, 0.025];

/** The rank this framework treats as "won" — CTR gap is measured against it. */
export const TARGET_POSITION = 3;

export function expectedCtr(position: number): number {
  if (!Number.isFinite(position) || position <= 1) return EXPECTED_CTR_BY_POSITION[1];
  if (position > 10) {
    // Past page one the curve keeps falling, but never to zero — a page-two
    // result still earns the odd click.
    return Math.max(0.004, EXPECTED_CTR_BY_POSITION[10] * Math.pow(0.8, position - 10));
  }
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return EXPECTED_CTR_BY_POSITION[lower];
  const t = position - lower;
  return EXPECTED_CTR_BY_POSITION[lower] * (1 - t) + EXPECTED_CTR_BY_POSITION[upper] * t;
}

export function positionOpportunity(position: number): number {
  if (position <= 3) return 0.25;
  if (position <= 10) return 1;
  if (position <= 15) return 0.7;
  if (position <= 20) return 0.4;
  return 0.1;
}

export function ctrGap(position: number, ctr: number): number {
  return Math.max(0, expectedCtr(Math.min(position, TARGET_POSITION)) - ctr);
}

export function opportunityScore(row: Pick<SearchPerformanceRow, "impressions" | "position" | "ctr">): number {
  return row.impressions * positionOpportunity(row.position) * ctrGap(row.position, row.ctr);
}

export function opportunityBucket(row: Pick<SearchPerformanceRow, "position" | "ctr">): OpportunityBucket {
  if (row.position <= 3.5) return row.ctr < expectedCtr(row.position) * 0.5 ? "fix-snippet" : "protect";
  if (row.position <= 10.5) return "striking-distance";
  if (row.position <= 20.5) return "page-two";
  return "long-tail";
}

/** "https://www.example.com/products/x?y=1" → "/products/x?y=1". Paths pass through untouched. */
export function toPath(page: string): string {
  const path = page.replace(/^https?:\/\/[^/]+/i, "");
  return path === "" ? "/" : path;
}

/**
 * Score and sort rows, highest opportunity first. Rows under `minImpressions`
 * are dropped — a single impression at position 3 is noise, not a signal.
 */
export function rankOpportunities(rows: SearchPerformanceRow[], opts: { minImpressions?: number } = {}): ScoredRow[] {
  const minImpressions = opts.minImpressions ?? 10;
  return rows
    .filter((r) => r.impressions >= minImpressions && Number.isFinite(r.position) && r.position > 0)
    .map((r) => ({ ...r, path: toPath(r.page), score: opportunityScore(r), bucket: opportunityBucket(r) }))
    .sort((a, b) => b.score - a.score || b.impressions - a.impressions || a.path.localeCompare(b.path));
}
