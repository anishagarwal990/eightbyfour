import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import { CATEGORIES } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";
import type { CategoryBrand, CategoryFilterCounts } from "@/lib/data/products";
import { CategoryProductGrid } from "@/components/CategoryProductGrid";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { CategoryPagination, CategoryPaginationLinks } from "@/components/CategoryPagination";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";

export function CategoryPageView({
  category,
  products,
  brands,
  filterCounts,
  page,
  totalPages,
  collection,
}: {
  category: CategoryConfig;
  products: ProductRow[];
  brands: CategoryBrand[];
  filterCounts: CategoryFilterCounts;
  page: number;
  totalPages: number;
  collection: string | null;
}) {
  const related = CATEGORIES.filter((c) => category.relatedCategorySlugs.includes(c.slug));

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: category.name, path: `/products/${category.slug}` },
        ]}
      />
      <FaqSchema faqs={category.faqs} />
      <CategoryPaginationLinks slug={category.slug} page={page} totalPages={totalPages} collection={collection} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name }]} />

      <section className="px-7 py-8">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          {category.name} · Hyderabad
        </p>
        <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
          {category.name} Supplier in Hyderabad
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--line-strong)" }}>
          {category.heroTagline}
        </p>
        <p className="mt-4 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
          {category.overview}
        </p>
      </section>

      {brands.length > 0 ? (
        <Reveal as="section" className="px-7 py-6">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Brands Available
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {brands.map((b) =>
              b.slug ? (
                <Link
                  key={b.name}
                  href={`/brands/${b.slug}`}
                  className="rounded-full border px-3 py-1 text-sm hover:opacity-70"
                  style={{ borderColor: "var(--line)" }}
                >
                  {b.name}
                </Link>
              ) : (
                <span key={b.name} className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: "var(--line)" }}>
                  {b.name}
                </span>
              )
            )}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          {category.name} Products
        </h2>
        <div className="mt-4">
          <CategoryFilterBar slug={category.slug} filterCounts={filterCounts} active={collection} />
          {products.length > 0 ? (
            <CategoryProductGrid products={products} />
          ) : (
            <p style={{ color: "var(--line-strong)" }}>No products found for this filter.</p>
          )}
          <CategoryPagination slug={category.slug} page={page} totalPages={totalPages} collection={collection} />
        </div>
      </Reveal>

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Buying Guide
        </h2>
        <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
          {category.buyingGuide}
        </p>
      </Reveal>

      {category.applicationSlugs.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Applications
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {category.applicationSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/applications/${slug}`}
                className="rounded-full border px-3 py-1 text-sm hover:opacity-70"
                style={{ borderColor: "var(--line)" }}
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Frequently Asked Questions
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {category.faqs.map((faq, i) => (
            <div key={i}>
              <p className="font-medium">{faq.question}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {related.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Related Categories
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {related.map((c) => (
              <Link key={c.slug} href={`/products/${c.slug}`} className="rounded-full border px-4 py-1.5 text-sm hover:opacity-70" style={{ borderColor: "var(--line)" }}>
                {c.name}
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}
    </main>
  );
}
