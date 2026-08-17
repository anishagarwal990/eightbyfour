import Link from "next/link";
import Image from "next/image";
import type { CategoryConfig } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";
import type { BrandRow } from "@/lib/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { BrandPagination, BrandPaginationLinks } from "@/components/BrandPagination";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { getContent } from "@/lib/mdx";
import { BRAND_GUIDE_SLUGS } from "@/lib/brandGuides";

export interface BrandFaq {
  question: string;
  answer: string;
}

export function getBrandFaqs(brandName: string): BrandFaq[] {
  return [
    {
      question: `Is ${brandName} available for delivery across Hyderabad?`,
      answer: `Yes — EightByFour delivers ${brandName} products across Hyderabad. Request a quote on any product page for current pricing and lead time.`,
    },
    {
      question: `Can I get trade pricing on ${brandName} products?`,
      answer: "Yes — trade and bulk pricing is available on request for contractors, architects and builders.",
    },
  ];
}

export function BrandPageView({
  brand,
  products,
  relatedCategoryConfigs,
  faqs,
  page,
  totalPages,
}: {
  brand: BrandRow;
  products: ProductRow[];
  relatedCategoryConfigs: (CategoryConfig | undefined)[];
  faqs: BrandFaq[];
  page: number;
  totalPages: number;
}) {
  const relatedGuides = (BRAND_GUIDE_SLUGS[brand.slug] || [])
    .map((slug) => {
      const content = getContent("guides", slug);
      return content ? { slug, title: content.frontmatter.title } : null;
    })
    .filter((g): g is { slug: string; title: string } => g !== null);

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
      <BrandPaginationLinks slug={brand.slug} page={page} totalPages={totalPages} />
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]} />

      <section className="flex flex-wrap items-center gap-6 px-7 py-8">
        {brand.logo_url ? (
          <div className="relative h-16 w-40 shrink-0">
            <Image
              src={brand.logo_url}
              alt={`${brand.name} logo`}
              fill
              sizes="160px"
              priority
              className="object-contain object-left"
            />
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

      {brand.range_image_url ? (
        <section className="px-7 pb-6">
          <div className="relative aspect-[1184/620] w-full overflow-hidden rounded-sm" style={{ background: "var(--paper-dim)" }}>
            <Image
              src={brand.range_image_url}
              alt={`${brand.name} product range`}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </section>
      ) : null}

      {brand.overview ? (
        <section className="px-7 pb-6">
          <p className="max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
            {brand.overview}
          </p>
        </section>
      ) : null}

      {relatedGuides.length > 0 ? (
        <section className="px-7 py-6">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Guides
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="rounded-full border px-3 py-1 text-sm hover:opacity-70"
                style={{ borderColor: "var(--line)" }}
              >
                {g.title}
              </Link>
            ))}
          </div>
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
        <BrandPagination slug={brand.slug} page={page} totalPages={totalPages} />
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
      </div>
    </main>
  );
}
