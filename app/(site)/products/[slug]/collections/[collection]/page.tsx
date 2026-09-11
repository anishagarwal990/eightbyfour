import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COLLECTION_LANDINGS, collectionLandingPath, isLandingIndexable, MIN_LANDING_SKUS } from "@/lib/collectionLandings";
import { getCollectionLandingData } from "@/lib/data/collectionLandingData";
import { collectionLandingDescription, collectionLandingTitle } from "@/lib/rangeSummary";
import { buildMetadata } from "@/lib/seo";
import { CollectionLandingView } from "@/components/CollectionLandingView";

type RouteParams = { slug: string; collection: string };

export function generateStaticParams(): RouteParams[] {
  return COLLECTION_LANDINGS.map((l) => ({ slug: l.categorySlug, collection: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug, collection } = await params;
  const data = await getCollectionLandingData(slug, collection, 1);
  if (!data) return {};
  return buildMetadata({
    title: data.landing.seoTitle ?? collectionLandingTitle(data.landing, data.summary),
    description: data.landing.seoDescription ?? collectionLandingDescription(data.landing, data.summary),
    path: collectionLandingPath(data.landing),
    // Noindexed when the range has shrunk below the landing threshold (it
    // keeps working for shoppers, just drops out of the index and the
    // sitemap until it recovers) — or when the entry itself is marked
    // `indexable: false` (a quality gate: SKU count alone doesn't establish
    // this is a real customer/search concept — see lib/collectionLandings.ts).
    noindex: data.summary.count < MIN_LANDING_SKUS || !isLandingIndexable(data.landing),
  });
}

export default async function CollectionLandingPage({ params }: { params: Promise<RouteParams> }) {
  const { slug, collection } = await params;
  const data = await getCollectionLandingData(slug, collection, 1);
  if (!data || data.summary.count === 0) notFound();
  return (
    <CollectionLandingView
      landing={data.landing}
      category={data.category}
      summary={data.summary}
      products={data.products}
      page={1}
      totalPages={data.totalPages}
      popular={data.popular}
    />
  );
}
