import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CATEGORIES, categorySeo, getCategoryBySlug } from "@/lib/categories";
import { categoryPageUrl, parsePageParam } from "@/lib/categoryPagination";
import {
  CATEGORY_PAGE_SIZE,
  getBrandsForCategory,
  getCategoryFilterCounts,
  getProductsByCategoryPage,
} from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { CategoryPageView } from "@/components/CategoryPageView";

type RouteParams = { slug: string; page: string };
type CategorySearchParams = { collection?: string };

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

  const { collection } = await searchParams;
  const seo = categorySeo(category);
  const scope = collection ? `${category.name} — ${collection}` : category.name;
  return buildMetadata({
    // Self-canonical (buildMetadata canonicals to this page's own URL, not
    // page 1) with a page-numbered title so page N never competes with the
    // hub for the head "{category}" / "{category} price" intent.
    title: `${scope} — Page ${page}`,
    description: `${seo.description} Page ${page} of the ${category.name.toLowerCase()} catalogue.`,
    path: categoryPageUrl(category.slug, page, collection ?? null),
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

  const { collection } = await searchParams;

  // /page/1 is the same content as the base category URL — redirect instead
  // of serving a duplicate so there's exactly one canonical URL for it.
  if (page === 1) {
    redirect(categoryPageUrl(category.slug, 1, collection ?? null));
  }

  const [{ products, totalPages }, brands, filterCounts] = await Promise.all([
    getProductsByCategoryPage(category.dbCategory, { page, collection: collection ?? null }),
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
      collection={collection ?? null}
    />
  );
}
