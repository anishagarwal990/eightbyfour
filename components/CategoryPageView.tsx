import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import { CATEGORIES } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";
import type { CategoryBrand, CategoryFilterCounts } from "@/lib/data/products";
import { CategoryProductGrid } from "@/components/CategoryProductGrid";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { PlywoodFilterableGrid } from "@/components/PlywoodFilterableGrid";
import { CategoryPagination, CategoryPaginationLinks } from "@/components/CategoryPagination";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { CollectionPageSchema } from "@/components/schema/CollectionPageSchema";
import { CATEGORY_PAGE_SIZE } from "@/lib/data/products";
import { categoryPageUrl } from "@/lib/categoryPagination";
import { productDisplayName } from "@/lib/productDisplay";
import { ViewTracker } from "@/components/ViewTracker";
import { CategoryTile, isCategoryMarkSlug } from "@/components/CategoryMark";
import { BrandLogo } from "@/components/BrandLogo";

// Brand pill in "Brands Available" — fixed-height box so every logo (odd
// aspect ratios included) sits centered at the same scale, with a filled
// background and hover lift so it reads as a button, not a bare image.
const BRAND_PILL_CLASS =
  "flex h-11 min-w-[64px] items-center justify-center rounded-[var(--radius-xs)] bg-[var(--paper-dim)] px-4 transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out-soft)]";

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
      <ViewTracker
        event="category_view"
        dedupeKey={`${category.slug}:${page}:${collection ?? ""}`}
        params={{ category: category.dbCategory, page, collection, product_count: filterCounts.total }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: category.name, path: `/products/${category.slug}` },
        ]}
      />
      <FaqSchema faqs={category.faqs} />
      <CollectionPageSchema
        name={`${category.name} Products`}
        path={categoryPageUrl(category.slug, page, collection)}
        totalItems={filterCounts.total}
        pageOffset={(page - 1) * CATEGORY_PAGE_SIZE}
        items={products.map((p) => ({ name: productDisplayName(p), slug: p.slug }))}
      />
      <CategoryPaginationLinks slug={category.slug} page={page} totalPages={totalPages} collection={collection} />
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name }]} />

      <section className="px-7 py-8">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          {category.name} · Hyderabad
        </p>
        <h1 className="font-display mt-2" style={{ fontSize: "var(--fs-h1)" }}>
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
          <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
            Brands Available
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {brands.map((b) => {
              // EightByFour's own stock is sold under a category sub-brand —
              // the colored tile alone stands in for the name, same as any
              // other brand's logo would.
              if (b.name === "EightByFour" && isCategoryMarkSlug(category.slug)) {
                return b.slug ? (
                  <Link key={b.name} href={`/brands/${b.slug}?category=${category.slug}`} aria-label="EightxFour" className={BRAND_PILL_CLASS}>
                    <CategoryTile slug={category.slug} size={32} />
                  </Link>
                ) : (
                  <span key={b.name} aria-label="EightxFour" className={BRAND_PILL_CLASS}>
                    <CategoryTile slug={category.slug} size={32} />
                  </span>
                );
              }
              return b.slug ? (
                <Link key={b.name} href={`/brands/${b.slug}`} className={BRAND_PILL_CLASS}>
                  <BrandLogo brand={b.name} height={22} />
                </Link>
              ) : (
                <span key={b.name} className={BRAND_PILL_CLASS}>
                  <BrandLogo brand={b.name} height={22} />
                </span>
              );
            })}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="px-7 py-8">
        <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
          {category.name} Products
        </h2>
        <div className="mt-4">
          <CategoryFilterBar slug={category.slug} filterCounts={filterCounts} active={collection} />
          {products.length > 0 ? (
            category.slug === "plywood" ? (
              <PlywoodFilterableGrid products={products} />
            ) : (
              <CategoryProductGrid products={products} />
            )
          ) : (
            <p style={{ color: "var(--line-strong)" }}>No products found for this filter.</p>
          )}
          <CategoryPagination slug={category.slug} page={page} totalPages={totalPages} collection={collection} />
        </div>
      </Reveal>

      <Reveal as="section" className="px-7 py-8">
        <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
          Buying Guide
        </h2>
        <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
          {category.buyingGuide}
        </p>
      </Reveal>

      {category.applicationSlugs.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
            Applications
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {category.applicationSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/applications/${slug}`}
                className="rounded-[var(--radius-xs)] px-3 py-1 text-sm hover:opacity-70"
                style={{ background: "var(--paper-dim)" }}
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="px-7 py-8">
        <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
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
          <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
            Related Categories
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {related.map((c) => (
              <Link key={c.slug} href={`/products/${c.slug}`} className="rounded-[var(--radius-xs)] px-4 py-1.5 text-sm hover:opacity-70" style={{ background: "var(--paper-dim)" }}>
                {c.name}
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}
      </div>
    </main>
  );
}
