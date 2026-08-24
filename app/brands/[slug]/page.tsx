import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllBrandsWithCounts, getBrandBySlug, getBrandCategories, getEightByFourCategoryCounts } from "@/lib/data/brands";
import { getProductsByBrand, getProductsByBrandPage } from "@/lib/data/products";
import type { ProductRow } from "@/lib/supabase/types";
import type { ShadeEntry } from "@/components/ShadeFinishPicker";
import { CATEGORIES } from "@/lib/categories";
import { buildMetadata } from "@/lib/seo";
import { brandPagePath } from "@/lib/brandPagination";
import { BrandPageView, getBrandFaqs } from "@/components/BrandPageView";
import { SOURCE_ONLY_BRANDS, getSourceOnlyBrandBySlug } from "@/lib/source-only-brands";
import { SourceOnlyBrandPageView } from "@/components/SourceOnlyBrandPageView";
import { getSourceOnlyBrandContent } from "@/lib/source-only-brand-content";

export async function generateStaticParams() {
  const brands = await getAllBrandsWithCounts();
  return [...brands.map((b) => ({ slug: b.slug })), ...SOURCE_ONLY_BRANDS.map((b) => ({ slug: b.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (brand) {
    const isEightByFour = brand.slug === "eightbyfour";
    return buildMetadata({
      title: isEightByFour
        ? "EightxFour Products in Hyderabad — Downloads & Pricing"
        : `${brand.name} Dealer in Hyderabad — Products, Downloads & Pricing`,
      description:
        brand.overview ||
        (isEightByFour
          ? "EightxFour's own product line in Hyderabad — request trade pricing and delivery."
          : `${brand.name} products available through EightxFour in Hyderabad — request trade pricing and delivery.`),
      path: brandPagePath(brand.slug, 1),
      image: brand.logo_url || undefined,
    });
  }

  const sourceOnly = getSourceOnlyBrandBySlug(slug);
  if (sourceOnly) {
    const content = getSourceOnlyBrandContent(sourceOnly.slug);
    return buildMetadata({
      title: content
        ? `${sourceOnly.name} in Hyderabad — ${content.tagline}`
        : `${sourceOnly.name} in Hyderabad — Ask for Availability & Quote`,
      description:
        content?.intro ||
        `EightxFour sources ${sourceOnly.name} through our manufacturer network — request a quote and we'll get back to you in under 15 minutes.`,
      path: `/brands/${sourceOnly.slug}`,
    });
  }

  return {};
}

// Brands catalogued as one product row per Code+Finish combination (finish is
// a core, per-SKU differentiator, not a minor variant) — these get the
// shade/code + finish picker on their brand page in addition to the regular
// product grid. See ShadeFinishPicker for why.
const SHADE_FINDER_BRANDS = new Set(["virgo", "century-laminates"]);

function buildShadeFinder(products: ProductRow[]): ShadeEntry[] {
  const byCode = new Map<string, ShadeEntry>();
  for (const p of products) {
    if (!p.sd_code || !p.finish) continue;
    let entry = byCode.get(p.sd_code);
    if (!entry) {
      entry = { code: p.sd_code, name: p.name, finishes: [] };
      byCode.set(p.sd_code, entry);
    }
    entry.finishes.push({ code: p.sd_code, finish: p.finish, slug: p.slug });
  }
  return [...byCode.values()].sort((a, b) => {
    const na = Number(a.code);
    const nb = Number(b.code);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.code.localeCompare(b.code);
  });
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    const sourceOnly = getSourceOnlyBrandBySlug(slug);
    if (sourceOnly) return <SourceOnlyBrandPageView brand={sourceOnly} />;
    notFound();
  }

  const [{ products, totalPages }, categories, shadeFinderProducts, subBrandCounts] = await Promise.all([
    getProductsByBrandPage(brand.name, { page: 1 }),
    getBrandCategories(brand.name),
    SHADE_FINDER_BRANDS.has(brand.slug) ? getProductsByBrand(brand.name) : Promise.resolve<ProductRow[]>([]),
    brand.slug === "eightbyfour" ? getEightByFourCategoryCounts() : Promise.resolve<Record<string, number>>({}),
  ]);
  const relatedCategoryConfigs = categories
    .map((dbCategory) => CATEGORIES.find((c) => c.dbCategory === dbCategory))
    .filter(Boolean);

  const faqs = getBrandFaqs(brand.name);
  const shadeFinder = shadeFinderProducts.length > 0 ? buildShadeFinder(shadeFinderProducts) : undefined;

  return (
    <BrandPageView
      brand={brand}
      products={products}
      relatedCategoryConfigs={relatedCategoryConfigs}
      faqs={faqs}
      page={1}
      totalPages={totalPages}
      shadeFinder={shadeFinder}
      allProducts={shadeFinderProducts.length > 0 ? shadeFinderProducts : undefined}
      subBrandCounts={brand.slug === "eightbyfour" ? subBrandCounts : undefined}
    />
  );
}
