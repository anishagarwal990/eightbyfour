import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { getPricePage, PRICE_PAGE_SLUGS } from "@/lib/pricePages";
import { getPricePageData } from "@/lib/data/pricePageData";
import { ContentDetailView } from "@/components/ContentDetailView";
import { PricePageView } from "@/components/PricePageView";

// Two page families share this segment: MDX-authored Hyderabad pages
// (supplier, procurement) and data-driven price pages built from the live
// catalogue. Price pages win the lookup, and lib/pricePages.ts is the single
// place their slugs are declared — so there is no way to add a price page
// whose URL silently collides with an MDX file of the same name.
export function generateStaticParams() {
  return [...PRICE_PAGE_SLUGS, ...getAllSlugs("hyderabad")].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const pricePage = getPricePage(slug);
  if (pricePage) {
    return buildMetadata({
      title: pricePage.metaTitle,
      description: pricePage.metaDescription,
      path: `/hyderabad/${slug}`,
    });
  }

  const entry = getContent("hyderabad", slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    path: `/hyderabad/${slug}`,
  });
}

export default async function HyderabadDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const pricePage = getPricePage(slug);
  if (pricePage) {
    const { rows, groups } = await getPricePageData(pricePage);
    return <PricePageView config={pricePage} rows={rows} groups={groups} />;
  }

  const entry = getContent("hyderabad", slug);
  if (!entry) notFound();
  return <ContentDetailView type="hyderabad" entry={entry} />;
}
