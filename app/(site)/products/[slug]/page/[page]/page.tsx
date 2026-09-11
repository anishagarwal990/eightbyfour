import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CATEGORIES, categorySeo, getCategoryBySlug } from "@/lib/categories";
import { categoryPageUrl, firstSearchParam, parsePageParam } from "@/lib/categoryPagination";
import { collectionLandingPath, getCollectionLanding } from "@/lib/collectionLandings";
import {
  CATEGORY_PAGE_SIZE,
  getBrandsForCategory,
  getCategoryFilterCounts,
  getProductsByCategoryPage,
} from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { CategoryPageView } from "@/components/CategoryPageView";

type RouteParams = { slug: string; page: string };
type CategorySearchParams = { collection?: string | string[] };

export async function generateStaticParams() {
  const params: RouteParams[] = [];
  for (const category of CATEGORIES) {
    const { total } = await getCategoryFilterCounts(category.dbCategory);
    const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
    for (let page = 2; page <= totalPages; page++) {
      params.push({ slug: category.slug, page: String(page) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<CategorySearchParams>;
}): Promise<Metadata> {
  const { slug, page: rawPage } = await params;
  const category = getCategoryBySlug(slug);
  const page = parsePageParam(rawPage);
  if (!category || !page) return {};

  const collection = firstSearchParam((await searchParams).collection);
  const landing = getCollectionLanding(category.slug, collection);
  const seo = categorySeo(category);
  const scope = collection && !landing ? `${category.name} — ${collection}` : category.name;
  return buildMetadata({
    // Page N of the category self-canonicals (with a page-numbered title so it
    // never competes with the hub for the head "{category}" intent) — that's
    // what keeps the whole catalogue crawlable. Page N of a UX filter is a
    // view of the category, so it canonicals to the category itself.
    title: `${scope} — Page ${page}`,
    description: `${seo.description} Page ${page} of the ${category.name.toLowerCase()} catalogue.`,
    path: landing
      ? collectionLandingPath(landing, page)
      : collection
        ? categoryPageUrl(category.slug, 1, null)
        : categoryPageUrl(category.slug, page, null),
  });
}

export default async function CategoryPaginatedPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<CategorySearchParams>;
}) {
  const { slug, page: rawPage } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const page = parsePageParam(rawPage);
  if (!page) notFound();

  const collection = firstSearchParam((await searchParams).collection);
  const landing = getCollectionLanding(category.slug, collection);
  if (landing) permanentRedirect(collectionLandingPath(landing, page));

  // /page/1 is the same content as the base category URL — redirect instead
  // of serving a duplicate so there's exactly one canonical URL for it.
  if (page === 1) {
    permanentRedirect(categoryPageUrl(category.slug, 1, collection));
  }

  const [{ products, totalPages }, brands, filterCounts] = await Promise.all([
    getProductsByCategoryPage(category.dbCategory, { page, collection }),
    getBrandsForCategory(category.dbCategory),
    getCategoryFilterCounts(category.dbCategory),
  ]);

  if (page > totalPages) notFound();

  return (
    <CategoryPageView
      category={category}
      products={products}
      brands={brands}
      filterCounts={filterCounts}
      page={page}
      totalPages={totalPages}
      collection={collection}
    />
  );
}
