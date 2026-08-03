import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllBrandsWithCounts, getBrandBySlug, getBrandCategories } from "@/lib/data/brands";
import { getProductsByBrandPage } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/categories";
import { buildMetadata } from "@/lib/seo";
import { brandPagePath } from "@/lib/brandPagination";
import { BrandPageView, getBrandFaqs } from "@/components/BrandPageView";
import { SOURCE_ONLY_BRANDS, getSourceOnlyBrandBySlug } from "@/lib/source-only-brands";
import { SourceOnlyBrandPageView } from "@/components/SourceOnlyBrandPageView";

export async function generateStaticParams() {
  const brands = await getAllBrandsWithCounts();
  return [...brands.map((b) => ({ slug: b.slug })), ...SOURCE_ONLY_BRANDS.map((b) => ({ slug: b.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (brand) {
    return buildMetadata({
      title: `${brand.name} Dealer in Hyderabad — Products, Downloads & Pricing`,
      description:
        brand.overview ||
        `${brand.name} products available through EightByFour in Hyderabad — request trade pricing and delivery.`,
      path: brandPagePath(brand.slug, 1),
      image: brand.logo_url || undefined,
    });
  }

  const sourceOnly = getSourceOnlyBrandBySlug(slug);
  if (sourceOnly) {
    return buildMetadata({
      title: `${sourceOnly.name} in Hyderabad — Ask for Availability & Quote`,
      description: `EightByFour sources ${sourceOnly.name} through our manufacturer network — request a quote and we'll get back to you in under 15 minutes.`,
      path: `/brands/${sourceOnly.slug}`,
    });
  }

  return {};
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    const sourceOnly = getSourceOnlyBrandBySlug(slug);
    if (sourceOnly) return <SourceOnlyBrandPageView brand={sourceOnly} />;
    notFound();
  }

  const [{ products, totalPages }, categories] = await Promise.all([
    getProductsByBrandPage(brand.name, { page: 1 }),
    getBrandCategories(brand.name),
  ]);
  const relatedCategoryConfigs = categories
    .map((dbCategory) => CATEGORIES.find((c) => c.dbCategory === dbCategory))
    .filter(Boolean);

  const faqs = getBrandFaqs(brand.name);

  return (
    <BrandPageView
      brand={brand}
      products={products}
      relatedCategoryConfigs={relatedCategoryConfigs}
      faqs={faqs}
      page={1}
      totalPages={totalPages}
    />
  );
}
