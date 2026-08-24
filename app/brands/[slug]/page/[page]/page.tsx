import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAllBrandsWithCounts, getBrandBySlug, getBrandCategories } from "@/lib/data/brands";
import { CATEGORIES } from "@/lib/categories";
import { brandPagePath, parsePageParam } from "@/lib/brandPagination";
import { CATEGORY_PAGE_SIZE, getProductsByBrandPage } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { BrandPageView, getBrandFaqs } from "@/components/BrandPageView";

type RouteParams = { slug: string; page: string };

export async function generateStaticParams() {
  const brands = await getAllBrandsWithCounts();
  const params: RouteParams[] = [];
  for (const brand of brands) {
    const totalPages = Math.max(1, Math.ceil(brand.productCount / CATEGORY_PAGE_SIZE));
    for (let page = 2; page <= totalPages; page++) {
      params.push({ slug: brand.slug, page: String(page) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug, page: rawPage } = await params;
  const brand = await getBrandBySlug(slug);
  const page = parsePageParam(rawPage);
  if (!brand || !page) return {};

  return buildMetadata({
    title: `${brand.name} Dealer in Hyderabad — Page ${page}`,
    description:
      brand.overview ||
      `${brand.name} products available through EightxFour in Hyderabad — request trade pricing and delivery. Page ${page}.`,
    path: brandPagePath(brand.slug, page),
    image: brand.logo_url || undefined,
  });
}

export default async function BrandPaginatedPage({ params }: { params: Promise<RouteParams> }) {
  const { slug, page: rawPage } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const page = parsePageParam(rawPage);
  if (!page) notFound();

  if (page === 1) {
    redirect(brandPagePath(brand.slug, 1));
  }

  const [{ products, totalPages }, categories] = await Promise.all([
    getProductsByBrandPage(brand.name, { page }),
    getBrandCategories(brand.name),
  ]);

  if (page > totalPages) notFound();

  const relatedCategoryConfigs = categories.map((dbCategory) => CATEGORIES.find((c) => c.dbCategory === dbCategory)).filter(Boolean);
  const faqs = getBrandFaqs(brand.name);

  return (
    <BrandPageView
      brand={brand}
      products={products}
      relatedCategoryConfigs={relatedCategoryConfigs}
      faqs={faqs}
      page={page}
      totalPages={totalPages}
    />
  );
}
