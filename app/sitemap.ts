import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";
import { categoryPagePath } from "@/lib/categoryPagination";
import { brandPagePath } from "@/lib/brandPagination";
import { CATEGORY_PAGE_SIZE, getAllProductSlugs, getCategoryFilterCounts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllSlugs } from "@/lib/mdx";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, brands, categoryTotals] = await Promise.all([
    getAllProductSlugs(),
    getAllBrandsWithCounts(),
    Promise.all(CATEGORIES.map((c) => getCategoryFilterCounts(c.dbCategory).then((f) => f.total))),
  ]);

  const staticRoutes = ["", "/products", "/brands", "/applications", "/guides", "/comparisons", "/hyderabad"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })
  );

  // Every paginated page of every category, not just page 1 — that's what
  // makes the full catalogue crawlable/indexable beyond the first 60 products.
  const categoryRoutes = CATEGORIES.flatMap((c, i) => {
    const totalPages = Math.max(1, Math.ceil(categoryTotals[i] / CATEGORY_PAGE_SIZE));
    return Array.from({ length: totalPages }, (_, idx) => ({
      url: `${SITE_URL}${categoryPagePath(c.slug, idx + 1)}`,
      lastModified: new Date(),
    }));
  });

  const productRoutes = productSlugs.map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: new Date(),
  }));

  // Every paginated page of every brand, same rationale as categoryRoutes.
  const brandRoutes = brands.flatMap((b) => {
    const totalPages = Math.max(1, Math.ceil(b.productCount / CATEGORY_PAGE_SIZE));
    return Array.from({ length: totalPages }, (_, idx) => ({
      url: `${SITE_URL}${brandPagePath(b.slug, idx + 1)}`,
      lastModified: new Date(),
    }));
  });

  const contentRoutes = (["applications", "guides", "comparisons", "hyderabad"] as const).flatMap((type) =>
    getAllSlugs(type).map((slug) => ({
      url: `${SITE_URL}/${type}/${slug}`,
      lastModified: new Date(),
    }))
  );

  // Bespoke persona pages under /hyderabad that use a page.tsx template instead of MDX.
  const personaRoutes = ["contractor-procurement", "architect-material-sourcing", "homeowner-materials"].map((slug) => ({
    url: `${SITE_URL}/hyderabad/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...brandRoutes, ...contentRoutes, ...personaRoutes];
}
