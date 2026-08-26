import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin is behind auth and would only ever return a login redirect to a
    // crawler, but keeping it out of the crawl budget (and out of any
    // accidental sitemap) is free.
    rules: { userAgent: "*", allow: "/", disallow: ["/search", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
