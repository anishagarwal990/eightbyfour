import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllBrandsWithCounts, getBrandBySlug, getBrandCategories } from "@/lib/data/brands";
import { getProductsByBrand } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/categories";
import { buildMetadata } from "@/lib/seo";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";

export async function generateStaticParams() {
  const brands = await getAllBrandsWithCounts();
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return buildMetadata({
    title: `${brand.name} Dealer in Hyderabad — Products, Downloads & Pricing`,
    description:
      brand.overview ||
      `${brand.name} products available through EightByFour in Hyderabad — request trade pricing and delivery.`,
    path: `/brands/${brand.slug}`,
    image: brand.logo_url || undefined,
  });
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [products, categories] = await Promise.all([getProductsByBrand(brand.name), getBrandCategories(brand.name)]);
  const relatedCategoryConfigs = categories
    .map((dbCategory) => CATEGORIES.find((c) => c.dbCategory === dbCategory))
    .filter(Boolean);

  const faqs = [
    {
      question: `Is ${brand.name} available for delivery across Hyderabad?`,
      answer: `Yes — EightByFour delivers ${brand.name} products across Hyderabad. Request a quote on any product page for current pricing and lead time.`,
    },
    {
      question: `Can I get trade pricing on ${brand.name} products?`,
      answer: "Yes — trade and bulk pricing is available on request for contractors, architects and builders.",
    },
  ];

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
          { name: brand.name, path: `/brands/${brand.slug}` },
        ]}
      />
      <FaqSchema faqs={faqs} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]} />

      <section className="flex flex-wrap items-center gap-6 px-7 py-8">
        {brand.logo_url ? (
          <div className="relative h-16 w-40 shrink-0">
            <Image src={brand.logo_url} alt={`${brand.name} logo`} fill className="object-contain object-left" />
          </div>
        ) : null}
        <div>
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {brand.name} · Hyderabad
          </p>
          <h1 className="serif mt-1" style={{ fontSize: "var(--fs-h1)" }}>
            {brand.name} Dealer in Hyderabad
          </h1>
        </div>
      </section>

      {brand.overview ? (
        <section className="px-7 pb-6">
          <p className="max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
            {brand.overview}
          </p>
        </section>
      ) : null}

      {relatedCategoryConfigs.length > 0 ? (
        <section className="px-7 py-6">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Categories
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedCategoryConfigs.map((c) =>
              c ? (
                <Link
                  key={c.slug}
                  href={`/products/${c.slug}`}
                  className="rounded-full border px-3 py-1 text-sm hover:opacity-70"
                  style={{ borderColor: "var(--line)" }}
                >
                  {c.name}
                </Link>
              ) : null
            )}
          </div>
        </section>
      ) : null}

      <section className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          All {brand.name} Products in Hyderabad
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Frequently Asked Questions
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div key={i}>
              <p className="font-medium">{faq.question}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
