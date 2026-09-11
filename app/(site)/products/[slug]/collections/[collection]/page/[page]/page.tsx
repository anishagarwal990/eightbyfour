import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { parsePageParam } from "@/lib/categoryPagination";
import { COLLECTION_LANDINGS, collectionLandingPath, isLandingIndexable, MIN_LANDING_SKUS } from "@/lib/collectionLandings";
import { CATEGORY_PAGE_SIZE, getCollectionPool } from "@/lib/data/products";
import { getCollectionLandingData } from "@/lib/data/collectionLandingData";
import { collectionLandingDescription } from "@/lib/rangeSummary";
import { buildMetadata } from "@/lib/seo";
import { CollectionLandingView } from "@/components/CollectionLandingView";

type RouteParams = { slug: string; collection: string; page: string };

export async function generateStaticParams(): Promise<RouteParams[]> {
  const params: RouteParams[] = [];
  for (const landing of COLLECTION_LANDINGS) {
    const category = getCategoryBySlug(landing.categorySlug);
    if (!category) continue;
    const pool = await getCollectionPool(category.dbCategory, landing.collection);
    const totalPages = Math.ceil(pool.length / CATEGORY_PAGE_SIZE);
    for (let page = 2; page <= totalPages; page++) {
      params.push({ slug: landing.categorySlug, collection: landing.slug, page: String(page) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug, collection, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (!page) return {};
  const data = await getCollectionLandingData(slug, collection, page);
  if (!data) return {};
  return buildMetadata({
    // Self-canonical with a page-numbered title — page N lists different SKUs
    // than page 1 and must stay crawlable, but never competes with it.
    title: `${data.landing.seoTitle ?? data.landing.name} — Page ${page}`,
    description: `${data.landing.seoDescription ?? collectionLandingDescription(data.landing, data.summary)} Page ${page}.`,
    path: collectionLandingPath(data.landing, page),
    noindex: data.summary.count < MIN_LANDING_SKUS || !isLandingIndexable(data.landing),
  });
}

export default async function CollectionLandingPaginatedPage({ params }: { params: Promise<RouteParams> }) {
  const { slug, collection, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (!page) notFound();
  const data = await getCollectionLandingData(slug, collection, page);
  if (!data || data.summary.count === 0) notFound();
  if (page === 1) permanentRedirect(collectionLandingPath(data.landing));
  if (page > data.totalPages) notFound();
  return (
    <CollectionLandingView
      landing={data.landing}
      category={data.category}
      summary={data.summary}
      products={data.products}
      page={page}
      totalPages={data.totalPages}
      popular={data.popular}
    />
  );
}
