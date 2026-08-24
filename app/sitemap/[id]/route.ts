import { getSitemapEntries, isSitemapId } from "@/lib/sitemapData";
import { urlsetXml } from "@/lib/sitemapXml";

// Was implicitly static (generateStaticParams + no dynamic/revalidate export
// = prerendered once at build, frozen until the next deploy). New products
// added straight to Supabase — the normal path for every seed script in
// scripts/ — never appeared here without a redeploy, even though the
// product pages themselves render live. force-dynamic makes this always
// reflect the current DB; sitemap.xml gets hit rarely enough (crawlers, not
// users) that per-request DB reads are a non-issue.
export const dynamic = "force-dynamic";

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
