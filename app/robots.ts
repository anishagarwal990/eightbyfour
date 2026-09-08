import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin and /studio are behind auth and would only ever return a login
    // redirect to a crawler, but keeping them out of the crawl budget (and out
    // of any accidental sitemap) is free. /studio comes off this list the day
    // Studio EightxFour opens to the public.
    rules: { userAgent: "*", allow: "/", disallow: ["/search", "/admin", "/studio"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
