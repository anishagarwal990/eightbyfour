import { getSitemapEntries, isSitemapId, SITEMAP_IDS } from "@/lib/sitemapData";
import { urlsetXml } from "@/lib/sitemapXml";

export async function generateStaticParams() {
  return SITEMAP_IDS.map((id) => ({ id: `${id}.xml` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = rawId.replace(/\.xml$/, "");

  if (!isSitemapId(id)) {
    return new Response("Not found", { status: 404 });
  }

  const entries = await getSitemapEntries(id);
  return new Response(urlsetXml(entries), {
    headers: { "Content-Type": "application/xml" },
  });
}
