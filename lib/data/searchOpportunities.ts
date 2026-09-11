import snapshot from "@/seo/opportunities/latest.json";
import { fetchProductSummariesBySlugs } from "@/lib/data/products";
import { cachedPool } from "@/lib/data/poolCache";
import type { ProductSummary } from "@/lib/productRelations";

// The Search Console opportunity snapshot (seo/opportunities/latest.json,
// written by scripts/seo/opportunities.mjs) turned into internal links.
// Product pages already on page 1–2 with real impressions get linked from the
// pages carrying the most internal authority — the category hubs (in the
// header on every page), the brand hubs and the guides. That is the lever for
// moving a position-8 SKU into the top five: the page already matches the
// query, it needs more of the site pointing at it. Regenerate the snapshot
// monthly and the links follow the data.

interface SnapshotRow {
  path: string;
  kind: string;
  bucket: string;
  score: number;
}

// "protect" pages are already winning and "long-tail" ones are too far down
// for a link block to matter — everything between is what gets pushed.
const LINKABLE_BUCKETS = new Set(["fix-snippet", "striking-distance", "page-two"]);

/** Product slugs worth pushing, highest opportunity first (the snapshot is pre-sorted). */
export function opportunityProductSlugs(): string[] {
  return (snapshot.rows as SnapshotRow[])
    .filter((r) => r.kind === "product" && LINKABLE_BUCKETS.has(r.bucket))
    .map((r) => r.path.replace(/^\/products\//, ""));
}

export const OPPORTUNITY_SNAPSHOT_WINDOW = snapshot.window;

function allOpportunityProducts(): Promise<ProductSummary[]> {
  return cachedPool(`opportunity-products:${snapshot.generatedAt}`, () => fetchProductSummariesBySlugs(opportunityProductSlugs()));
}

/**
 * Up to `limit` high-opportunity products, optionally narrowed to brands
 * and/or categories. Slugs that no longer exist simply drop out.
 */
export async function getOpportunityProducts(
  filter: { brands?: string[]; dbCategories?: string[]; excludeSlugs?: string[] },
  limit = 12
): Promise<ProductSummary[]> {
  const products = await allOpportunityProducts();
  const exclude = new Set(filter.excludeSlugs ?? []);
  return products
    .filter(
      (p) =>
        !exclude.has(p.slug) &&
        (!filter.brands?.length || filter.brands.includes(p.brand)) &&
        (!filter.dbCategories?.length || filter.dbCategories.includes(p.category))
    )
    .slice(0, limit);
}
