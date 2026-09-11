import { statSync } from "fs";
import { join } from "path";
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";
import { categoryPagePath } from "@/lib/categoryPagination";
import { COLLECTION_LANDINGS, collectionLandingPath, isLandingIndexable, MIN_LANDING_SKUS } from "@/lib/collectionLandings";
import { brandPagePath } from "@/lib/brandPagination";
import { CATEGORY_PAGE_SIZE, getAllProductSlugsWithDates, getCatalogueFreshness, getCategoryFilterCounts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllSlugs, getContentMtime } from "@/lib/mdx";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import { PRICE_PAGE_SLUGS } from "@/lib/pricePages";
import { BESPOKE_HYDERABAD_PAGES } from "@/lib/hyderabadLinks";
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

/**
 * A source file's mtime as a lastmod — or no lastmod at all when the file
 * isn't on disk. This sitemap renders at request time, and a missing source
 * file must never take the whole sitemap down: the old hard-coded
 * `app/hyderabad/...` path stopped existing when the public site moved into
 * the app/(site) route group, and /sitemap/content.xml has returned HTTP 500
 * in production ever since — every guide, price page and Hyderabad page
 * missing from the sitemap Search Console reads.
 */
function fileMtime(...segments: string[]): Date | undefined {
  try {
    return statSync(join(process.cwd(), ...segments)).mtime;
  } catch {
    return undefined;
  }
}

function contentSlugs(type: "applications" | "guides" | "comparisons" | "hyderabad"): string[] {
  try {
    return getAllSlugs(type);
  } catch (error) {
    // content/ is traced into the sitemap's server bundle (next.config.ts
    // outputFileTracingIncludes); if it ever isn't, say so rather than 500.
    console.error(`sitemap: could not read content/${type}`, error);
    return [];
  }
}

function contentSitemap(): SitemapUrlEntry[] {
  const staticRoutes = ["", "/products", "/brands", "/applications", "/guides", "/comparisons", "/hyderabad", "/contact", "/about"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })
  );

  const contentRoutes = (["applications", "guides", "comparisons", "hyderabad"] as const).flatMap((type) =>
    contentSlugs(type).map((slug) => {
      let lastModified: Date | undefined;
      try {
        lastModified = getContentMtime(type, slug);
      } catch {
        lastModified = undefined;
      }
      return { url: `${SITE_URL}/${type}/${slug}`, lastModified };
    })
  );

  // Bespoke /hyderabad pages that use a page.tsx template instead of MDX —
  // the source file's own mtime is the real per-page signal. Driven off the
  // shared registry so a new bespoke page can't be added to the site and
  // forgotten here.
  const personaRoutes = BESPOKE_HYDERABAD_PAGES.map(({ slug }) => ({
    url: `${SITE_URL}/hyderabad/${slug}`,
    lastModified: fileMtime("app", "(site)", "hyderabad", slug, "page.tsx"),
  }));

  // Data-driven Hyderabad price pages — served by app/(site)/hyderabad/[slug]/page.tsx
  // from lib/pricePages.ts rather than from an MDX file, so their real
  // per-page signal is that config file's own mtime.
  const pricePagesMtime = fileMtime("lib", "pricePages.ts");
  const pricePageRoutes = PRICE_PAGE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/hyderabad/${slug}`,
    lastModified: pricePagesMtime,
  }));

  return [...staticRoutes, ...contentRoutes, ...personaRoutes, ...pricePageRoutes];
}

async function productsSitemap(): Promise<SitemapUrlEntry[]> {
  const productRows = await getAllProductSlugsWithDates();
  return productRows.map((row) => ({
    url: `${SITE_URL}/products/${row.slug}`,
    lastModified: new Date(row.updated_at || row.created_at),
  }));
}

async function categoriesSitemap(): Promise<SitemapUrlEntry[]> {
  const [categoryFilterCounts, freshness] = await Promise.all([
    Promise.all(CATEGORIES.map((c) => getCategoryFilterCounts(c.dbCategory))),
    getCatalogueFreshness(),
  ]);

  // Every paginated page of every category, not just page 1 — that's what
  // makes the full catalogue crawlable/indexable beyond the first 60 products.
  // Categories with zero live products are noindexed by app/products/[slug]/page.tsx
  // (buildMetadata's `noindex: total === 0`) — skip them here too, or page 1
  // of an empty category leaks into the sitemap as a noindexed URL.
  // lastModified is the category's latest product edit — a real signal,
  // unlike a timestamp that moves on every crawl.
  const categoryRoutes = CATEGORIES.flatMap((c, i) => {
    const total = categoryFilterCounts[i].total;
    if (total === 0) return [];
    const totalPages = Math.ceil(total / CATEGORY_PAGE_SIZE);
    const lastModified = freshness.byCategory.get(c.dbCategory);
    return Array.from({ length: totalPages }, (_, idx) => ({
      url: `${SITE_URL}${categoryPagePath(c.slug, idx + 1)}`,
      lastModified,
    }));
  });

  // Collection landing pages only (/products/{category}/collections/{range}).
  // Every other ?collection= filter canonicalises to its category — see
  // lib/collectionLandings.ts — and a sitemap lists canonical URLs only.
  // Ranges that have dropped below the landing threshold, or are marked
  // `indexable: false` (the quality gate — see lib/collectionLandings.ts),
  // are noindexed by their route, so they're left out here too.
  const landingRoutes = COLLECTION_LANDINGS.flatMap((landing) => {
    if (!isLandingIndexable(landing)) return [];
    const index = CATEGORIES.findIndex((c) => c.slug === landing.categorySlug);
    if (index === -1) return [];
    const count = categoryFilterCounts[index].collections.find((c) => c.name === landing.collection)?.count ?? 0;
    if (count < MIN_LANDING_SKUS) return [];
    const lastModified = freshness.byCollection.get(`${CATEGORIES[index].dbCategory}|${landing.collection}`);
    return Array.from({ length: Math.ceil(count / CATEGORY_PAGE_SIZE) }, (_, idx) => ({
      url: `${SITE_URL}${collectionLandingPath(landing, idx + 1)}`,
      lastModified,
    }));
  });

  return [...categoryRoutes, ...landingRoutes];
}

async function brandsSitemap(): Promise<SitemapUrlEntry[]> {
  const [brands, freshness] = await Promise.all([getAllBrandsWithCounts(), getCatalogueFreshness()]);

  // Every paginated page of every brand, same rationale as categoryRoutes.
  // lastModified is the brand's latest product edit, falling back to the
  // brand row's own created_at.
  const brandRoutes = brands.flatMap((b) => {
    const totalPages = Math.max(1, Math.ceil(b.productCount / CATEGORY_PAGE_SIZE));
    const lastModified = freshness.byBrand.get(b.name) ?? new Date(b.created_at);
    return Array.from({ length: totalPages }, (_, idx) => ({
      url: `${SITE_URL}${brandPagePath(b.slug, idx + 1)}`,
      lastModified,
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
