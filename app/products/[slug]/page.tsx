import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import {
  getAllProductSlugs,
  getBrandsForCategory,
  getProductBySlug,
  getProductsByCategory,
  getRelatedProducts,
} from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { CategoryPageView } from "@/components/CategoryPageView";
import { ProductPageView } from "@/components/ProductPageView";

export async function generateStaticParams() {
  const categorySlugs = CATEGORIES.map((c) => ({ slug: c.slug }));
  const productSlugs = (await getAllProductSlugs()).map((slug) => ({ slug }));
  return [...categorySlugs, ...productSlugs];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (category) {
    return buildMetadata({
      title: `${category.name} Supplier in Hyderabad — Buy ${category.name} Online`,
      description: `${category.heroTagline} Live stock, brand options and a buying guide for ${category.name.toLowerCase()} in Hyderabad.`,
      path: `/products/${category.slug}`,
    });
  }

  const product = await getProductBySlug(slug);
  if (product) {
    return buildMetadata({
      title: `${product.brand} ${product.name} — ${product.category} in Hyderabad`,
      description:
        product.description ||
        `${product.brand} ${product.name}, available in Hyderabad through EightByFour. Request trade pricing and delivery.`,
      path: `/products/${product.slug}`,
      image: product.main_img_url || undefined,
    });
  }

  return {};
}

export default async function ProductOrCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = getCategoryBySlug(slug);
  if (category) {
    const [products, brands] = await Promise.all([
      getProductsByCategory(category.dbCategory),
      getBrandsForCategory(category.dbCategory),
    ]);
    return <CategoryPageView category={category} products={products} brands={brands} />;
  }

  const product = await getProductBySlug(slug);
  if (product) {
    const relatedProducts = await getRelatedProducts(product);
    return <ProductPageView product={product} relatedProducts={relatedProducts} />;
  }

  notFound();
}
