import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// sitemap.ts splits into four id'd files (content/products/categories/brands)
// via generateSitemaps() instead of one flat sitemap.xml — list all four here
// since there's no single index file to point crawlers at otherwise.
const SITEMAP_IDS = ["content", "products", "categories", "brands"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/search" },
    sitemap: SITEMAP_IDS.map((id) => `${SITE_URL}/sitemap/${id}.xml`),
  };
}
