import { getCategoryBySlug } from "@/lib/categories";
import { getCollectionLandingBySlug } from "@/lib/collectionLandings";
import { getCollectionPool, getProductsByCategoryPage } from "@/lib/data/products";
import { opportunityProductSlugs } from "@/lib/data/searchOpportunities";
import { summarizeRange } from "@/lib/rangeSummary";

/**
 * Everything a collection landing page renders: the range's facts (counted
 * from all its SKUs), the current page of products, and the range's own
 * high-opportunity SKUs from the Search Console snapshot. Null when the
 * category/range pair isn't a registered landing.
 */
export async function getCollectionLandingData(categorySlug: string, landingSlug: string, page: number) {
  const category = getCategoryBySlug(categorySlug);
  const landing = category ? getCollectionLandingBySlug(category.slug, landingSlug) : undefined;
  if (!category || !landing) return null;

  const [pool, pageData] = await Promise.all([
    getCollectionPool(category.dbCategory, landing.collection),
    getProductsByCategoryPage(category.dbCategory, { page, collection: landing.collection }),
  ]);

  const rank = new Map(opportunityProductSlugs().map((slug, i) => [slug, i]));
  const popular = pool
    .filter((p) => rank.has(p.slug))
    .sort((a, b) => (rank.get(a.slug) ?? 0) - (rank.get(b.slug) ?? 0))
    .slice(0, 10);

  return {
    category,
    landing,
    summary: summarizeRange(pool),
    products: pageData.products,
    totalPages: pageData.totalPages,
    popular,
  };
}
