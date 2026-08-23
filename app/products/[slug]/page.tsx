import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { categoryPageUrl } from "@/lib/categoryPagination";
import {
  getAllProductSlugs,
  getBrandsForCategory,
  getCategoryFilterCounts,
  getProductBySlug,
  getProductsByBrand,
  getProductsByCategoryPage,
  getRelatedProducts,
} from "@/lib/data/products";
import { getBrandByName } from "@/lib/data/brands";
import { getProductReviews } from "@/lib/data/reviews";
import { buildMetadata } from "@/lib/seo";
import { bestProductImage, buildProductDescription, buildProductTitle } from "@/lib/productSeo";
import { CategoryPageView } from "@/components/CategoryPageView";
import { ProductPageView } from "@/components/ProductPageView";

export async function generateStaticParams() {
  const categorySlugs = CATEGORIES.map((c) => ({ slug: c.slug }));
  const productSlugs = (await getAllProductSlugs()).map((slug) => ({ slug }));
  return [...categorySlugs, ...productSlugs];
}

type CategorySearchParams = { collection?: string };

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
    const { collection } = await searchParams;
    const filterSuffix = collection ? ` — ${collection}` : "";
    const { total } = await getCategoryFilterCounts(category.dbCategory);
    return buildMetadata({
      title: `${category.name}${filterSuffix} Supplier in Hyderabad — Buy ${category.name} Online`,
      description: `${category.heroTagline} Live stock, brand options and a buying guide for ${category.name.toLowerCase()} in Hyderabad.`,
      path: categoryPageUrl(category.slug, 1, collection ?? null),
      noindex: total === 0,
    });
  }

  const product = await getProductBySlug(slug);
  if (product) {
    // Title fronts product name + shade code (product.sd_code), which is
    // what disambiguates the many catalogue items sharing a brand + shade
    // name (e.g. four different "Greenlam Black" laminates in SUD/ARN/HDG/ECO
    // finishes) — see buildProductTitle in lib/productSeo.ts.
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
    const { collection } = await searchParams;
    const [{ products, totalPages }, brands, filterCounts] = await Promise.all([
      getProductsByCategoryPage(category.dbCategory, { page: 1, collection: collection ?? null }),
      getBrandsForCategory(category.dbCategory),
      getCategoryFilterCounts(category.dbCategory),
    ]);
    return (
      <CategoryPageView
        category={category}
        products={products}
        brands={brands}
        filterCounts={filterCounts}
        page={1}
        totalPages={totalPages}
        collection={collection ?? null}
      />
    );
  }

  const product = await getProductBySlug(slug);
  if (product) {
    const [relatedProducts, ratings, brand, brandProductsRaw] = await Promise.all([
      getRelatedProducts(product),
      getProductReviews(product.id),
      getBrandByName(product.brand),
      getProductsByBrand(product.brand),
    ]);
    // Same shade code first (e.g. other finishes of the same Virgo design) —
    // a more useful "more from this brand" than an arbitrary brand-wide slice
    // when the brand differentiates SKUs by code+finish.
    const brandProducts = brandProductsRaw
      .filter((p) => p.id !== product.id)
      .sort((a, b) => Number(b.sd_code === product.sd_code) - Number(a.sd_code === product.sd_code))
      .slice(0, 4);
    return (
      <ProductPageView
        product={product}
        relatedProducts={relatedProducts}
        ratings={ratings}
        brand={brand}
        brandProducts={brandProducts}
      />
    );
  }

  notFound();
}
