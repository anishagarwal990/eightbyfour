import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";
import { getAllProductSlugs } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllSlugs } from "@/lib/mdx";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, brands] = await Promise.all([getAllProductSlugs(), getAllBrandsWithCounts()]);

  const staticRoutes = ["", "/products", "/brands", "/applications", "/guides", "/comparisons", "/hyderabad"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })
  );

  const categoryRoutes = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/products/${c.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = productSlugs.map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: new Date(),
  }));

  const brandRoutes = brands.map((b) => ({
    url: `${SITE_URL}/brands/${b.slug}`,
    lastModified: new Date(),
  }));

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
