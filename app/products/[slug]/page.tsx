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
import { productDisplayName } from "@/lib/productDisplay";
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
    return buildMetadata({
      title: `${category.name}${filterSuffix} Supplier in Hyderabad — Buy ${category.name} Online`,
      description: `${category.heroTagline} Live stock, brand options and a buying guide for ${category.name.toLowerCase()} in Hyderabad.`,
      path: categoryPageUrl(category.slug, 1, collection ?? null),
    });
  }

  const product = await getProductBySlug(slug);
  if (product) {
    // Many catalogue items share a brand + shade name (e.g. four different
    // "Greenlam Black" laminates in SUD/ARN/HDG/ECO finishes with different
    // shade codes) — without a disambiguator, those pages produce identical
    // <title> and meta description text, which is a duplicate-content SEO
    // issue. Append the shade code (or finish, when there's no code) so every
    // product gets a unique title/description even when the display name repeats.
    const disambiguator = product.sd_code ? ` (${product.sd_code})` : product.finish ? ` — ${product.finish}` : "";
    const displayName = productDisplayName(product);
    return buildMetadata({
      title: `${displayName}${disambiguator} — ${product.category} in Hyderabad`,
      description:
        product.description ||
        `${displayName}${disambiguator}, available in Hyderabad through EightByFour. Request trade pricing and delivery.`,
      path: `/products/${product.slug}`,
      image: product.main_img_url || undefined,
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
    const brandProducts = brandProductsRaw.filter((p) => p.id !== product.id).slice(0, 4);
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
