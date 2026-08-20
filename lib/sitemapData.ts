import { statSync } from "fs";
import { join } from "path";
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";
import { categoryPagePath, categoryPageUrl } from "@/lib/categoryPagination";
import { brandPagePath } from "@/lib/brandPagination";
import { CATEGORY_PAGE_SIZE, getAllProductSlugsWithDates, getCategoryFilterCounts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllSlugs, getContentMtime } from "@/lib/mdx";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import type { SitemapUrlEntry } from "@/lib/sitemapXml";

// Split by content type instead of one flat file — lets Search Console
// report indexation coverage per type (products vs. brands vs. category
// listings vs. editorial content) instead of one undifferentiated number
// across ~2,200+ URLs.
export const SITEMAP_IDS = ["content", "products", "categories", "brands"] as const;
export type SitemapId = (typeof SITEMAP_IDS)[number];

export function isSitemapId(value: string): value is SitemapId {
  return (SITEMAP_IDS as readonly string[]).includes(value);
}

export async function getSitemapEntries(id: SitemapId): Promise<SitemapUrlEntry[]> {
  switch (id) {
    case "content":
      return contentSitemap();
    case "products":
      return productsSitemap();
    case "categories":
      return categoriesSitemap();
    case "brands":
      return brandsSitemap();
  }
}

function contentSitemap(): SitemapUrlEntry[] {
  const staticRoutes = ["", "/products", "/brands", "/applications", "/guides", "/comparisons", "/hyderabad", "/contact"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })
  );

  const contentRoutes = (["applications", "guides", "comparisons", "hyderabad"] as const).flatMap((type) =>
    getAllSlugs(type).map((slug) => ({
      url: `${SITE_URL}/${type}/${slug}`,
      lastModified: getContentMtime(type, slug),
    }))
  );

  // Bespoke persona pages under /hyderabad that use a page.tsx template
  // instead of MDX — use the source file's own mtime as the real signal.
  const personaRoutes = ["contractor-procurement", "architect-material-sourcing", "homeowner-materials"].map((slug) => ({
    url: `${SITE_URL}/hyderabad/${slug}`,
    lastModified: statSync(join(process.cwd(), "app", "hyderabad", slug, "page.tsx")).mtime,
  }));

  return [...staticRoutes, ...contentRoutes, ...personaRoutes];
}

async function productsSitemap(): Promise<SitemapUrlEntry[]> {
  const productRows = await getAllProductSlugsWithDates();
  return productRows.map((row) => ({
    url: `${SITE_URL}/products/${row.slug}`,
    lastModified: new Date(row.updated_at || row.created_at),
  }));
}

async function categoriesSitemap(): Promise<SitemapUrlEntry[]> {
  const categoryFilterCounts = await Promise.all(CATEGORIES.map((c) => getCategoryFilterCounts(c.dbCategory)));

  // Every paginated page of every category, not just page 1 — that's what
  // makes the full catalogue crawlable/indexable beyond the first 60 products.
  // Categories with zero live products are noindexed by app/products/[slug]/page.tsx
  // (buildMetadata's `noindex: total === 0`) — skip them here too, or page 1
  // of an empty category leaks into the sitemap as a noindexed URL.
  const categoryRoutes = CATEGORIES.flatMap((c, i) => {
    const total = categoryFilterCounts[i].total;
    if (total === 0) return [];
    const totalPages = Math.ceil(total / CATEGORY_PAGE_SIZE);
    return Array.from({ length: totalPages }, (_, idx) => ({
      url: `${SITE_URL}${categoryPagePath(c.slug, idx + 1)}`,
      lastModified: new Date(),
    }));
  });

  // Collection-filtered variant of every category page (e.g.
  // /products/laminates?collection=HPL) — these are real, indexable,
  // linked-from pages (CategoryFilterBar chips) that were previously left
  // out of the sitemap entirely.
  const categoryCollectionRoutes = CATEGORIES.flatMap((c, i) => {
    const filterCounts = categoryFilterCounts[i];
    const collectionNames = [...filterCounts.collections.map((coll) => coll.name), ...(filterCounts.otherCount > 0 ? ["other"] : [])];
    return collectionNames.flatMap((name) => {
      const count = name === "other" ? filterCounts.otherCount : filterCounts.collections.find((coll) => coll.name === name)!.count;
      const totalPages = Math.max(1, Math.ceil(count / CATEGORY_PAGE_SIZE));
      return Array.from({ length: totalPages }, (_, idx) => ({
        url: `${SITE_URL}${categoryPageUrl(c.slug, idx + 1, name)}`,
        lastModified: new Date(),
      }));
    });
  });

  return [...categoryRoutes, ...categoryCollectionRoutes];
}

async function brandsSitemap(): Promise<SitemapUrlEntry[]> {
  const brands = await getAllBrandsWithCounts();

  // Every paginated page of every brand, same rationale as categoryRoutes.
  // Paginated pages (page 2+) are a slice of the same brand catalogue, so
  // they share the brand row's created_at rather than getting their own.
  const brandRoutes = brands.flatMap((b) => {
    const totalPages = Math.max(1, Math.ceil(b.productCount / CATEGORY_PAGE_SIZE));
    return Array.from({ length: totalPages }, (_, idx) => ({
      url: `${SITE_URL}${brandPagePath(b.slug, idx + 1)}`,
      lastModified: new Date(b.created_at),
    }));
  });

  // Source-only brands (sourced on request, not stocked as SKUs) get a real,
  // indexable /brands/[slug] page — app/brands/[slug]/page.tsx — but have no
  // row in `products`, so they never appeared in `brands` above. Skip any
  // that also exist as a real stocked brand (e.g. Greenlam) to avoid a
  // duplicate URL already covered by brandRoutes.
  const stockedSlugs = new Set(brands.map((b) => b.slug));
  const sourceOnlyBrandRoutes = SOURCE_ONLY_BRANDS.filter((b) => !stockedSlugs.has(b.slug)).map((b) => ({
    url: `${SITE_URL}/brands/${b.slug}`,
    lastModified: new Date(),
  }));

  return [...brandRoutes, ...sourceOnlyBrandRoutes];
}
