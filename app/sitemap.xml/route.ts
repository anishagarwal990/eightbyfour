import { SITE_URL } from "@/lib/seo";
import { SITEMAP_IDS } from "@/lib/sitemapData";
import { sitemapIndexXml } from "@/lib/sitemapXml";

// The four child sitemaps (content/products/categories/brands) are served
// from app/sitemap/[id]/route.ts. This is the index Google Search Console
// gets pointed at, referencing all four.
export async function GET() {
  const now = new Date();
  const entries = SITEMAP_IDS.map((id) => ({ url: `${SITE_URL}/sitemap/${id}.xml`, lastModified: now }));
  return new Response(sitemapIndexXml(entries), {
    headers: { "Content-Type": "application/xml" },
  });
}
