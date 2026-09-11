import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CATEGORIES, categorySeo, getCategoryBySlug } from "@/lib/categories";
import { categoryPageUrl, firstSearchParam } from "@/lib/categoryPagination";
import { collectionLandingPath, getCollectionLanding } from "@/lib/collectionLandings";
import {
  getAllProductSlugs,
  getBrandsForCategory,
  getCategoryFilterCounts,
  getCategoryPriceContext,
  getProductBySlug,
  getProductRelations,
  getProductsByCategoryPage,
  type CategoryFilterCounts,
} from "@/lib/data/products";
import { getBrandByName } from "@/lib/data/brands";
import { getProductReviews } from "@/lib/data/reviews";
import { getOpportunityProducts } from "@/lib/data/searchOpportunities";
import { buildMetadata } from "@/lib/seo";
import { bestProductImage, buildProductDescription, buildProductTitle } from "@/lib/productSeo";
import { CategoryPageView } from "@/components/CategoryPageView";
import { ProductPageView } from "@/components/ProductPageView";

export async function generateStaticParams() {
  const categorySlugs = CATEGORIES.map((c) => ({ slug: c.slug }));
  const productSlugs = (await getAllProductSlugs()).map((slug) => ({ slug }));
  return [...categorySlugs, ...productSlugs];
}

type CategorySearchParams = { collection?: string | string[] };

/** SKUs behind a filter value — a filter that matches nothing is noindexed rather than served as a thin page. */
function filteredCount(counts: CategoryFilterCounts, collection: string): number {
  if (collection === "other") return counts.otherCount;
  return counts.collections.find((c) => c.name === collection)?.count ?? 0;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (category) {
    const collection = firstSearchParam((await searchParams).collection);
    const landing = getCollectionLanding(category.slug, collection);
    const counts = await getCategoryFilterCounts(category.dbCategory);
    const seo = categorySeo(category);
    // A collection with its own landing page 308s there before rendering
    // (below). Any other ?collection= value is a UX view of this category:
    // its canonical is the category itself, so ~100 filter URLs stop
    // competing with it (and with each other) for the category's queries.
    return buildMetadata({
      title: collection && !landing ? `${category.name} — ${collection} (Prices & Brands)` : seo.title,
      description: seo.description,
      path: landing ? collectionLandingPath(landing) : categoryPageUrl(category.slug, 1, null),
      noindex: counts.total === 0 || (collection !== null && !landing && filteredCount(counts, collection) === 0),
    });
  }

  const product = await getProductBySlug(slug);
  if (product) {
    // "Merino 22153 Saga Green Laminate — Price & Finishes": brand + shade
    // code + shade + type, then one intent qualifier the row can back up —
    // see buildProductTitle in lib/productSeo.ts.
    return buildMetadata({
      title: buildProductTitle(product),
      description: buildProductDescription(product),
      path: `/products/${product.slug}`,
      image: bestProductImage(product)?.src,
    });
  }

  return {};
}

export default async function ProductOrCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}) {
  const { slug } = await params;

  const category = getCategoryBySlug(slug);
  if (category) {
    const collection = firstSearchParam((await searchParams).collection);
    const landing = getCollectionLanding(category.slug, collection);
    if (landing) permanentRedirect(collectionLandingPath(landing));

    const [{ products, totalPages }, brands, filterCounts, priceContext, popularProducts] = await Promise.all([
      getProductsByCategoryPage(category.dbCategory, { page: 1, collection }),
      getBrandsForCategory(category.dbCategory),
      getCategoryFilterCounts(category.dbCategory),
      getCategoryPriceContext(category.dbCategory),
      collection ? Promise.resolve([]) : getOpportunityProducts({ dbCategories: [category.dbCategory] }, 12),
    ]);
    return (
      <CategoryPageView
        category={category}
        products={products}
        brands={brands}
        filterCounts={filterCounts}
        priceContext={priceContext}
        page={1}
        totalPages={totalPages}
        collection={collection}
        popularProducts={popularProducts}
      />
    );
  }

  const product = await getProductBySlug(slug);
  if (product) {
    const [relations, ratings, brand] = await Promise.all([
      getProductRelations(product),
      getProductReviews(product.id),
      getBrandByName(product.brand),
    ]);
    return <ProductPageView product={product} relations={relations} ratings={ratings} brand={brand} />;
  }

  notFound();
}
