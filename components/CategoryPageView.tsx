import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import { CATEGORIES, categorySeo, categorySingularName } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";
import type { CategoryBrand, CategoryFilterCounts, CategoryPriceContext } from "@/lib/data/products";
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
import { unitLabel } from "@/lib/pricing";
import { ViewTracker } from "@/components/ViewTracker";
import { CategoryTile, isCategoryMarkSlug } from "@/components/CategoryMark";
import { PricePageLinks } from "@/components/PricePageLinks";
import { pricePagesForDbCategory } from "@/lib/pricePages";
import { BrandLogo } from "@/components/BrandLogo";
import type { ProductSummary } from "@/lib/productRelations";
import { collectionLandingsForCategory } from "@/lib/collectionLandings";
import { productIdentity } from "@/lib/productSeo";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";

// Brand pill in "Brands Available" — fixed-height box so every logo (odd
// aspect ratios included) sits centered at the same scale, with a filled
// background and hover lift so it reads as a button, not a bare image.
const BRAND_PILL_CLASS =
  "flex h-11 min-w-[64px] items-center justify-center rounded-full bg-[var(--paper-dim)] px-4 transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]";

const CHIP_LINK_CLASS =
  "rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 hover:text-[var(--burgundy)]";

// A category with more distinct `collection` values than this doesn't get a
// server-rendered "Shop by …" block — 100+ text links on a landing page is
// the link-dump the SEO brief warns against, and those pages are still
// reachable through the CategoryFilterBar chips. Veneers (9 ranges) and the
// board categories are the ones this actually surfaces.
const SHOP_BY_COLLECTION_MAX = 14;

// dbCategory → the noun the "Shop by …" heading uses for its collection axis.
const COLLECTION_AXIS_LABEL: Record<string, string> = {
  Veneers: "Veneer Type",
  Laminates: "Design Range",
};

function priceLine(ctx: CategoryPriceContext | undefined, categoryName: string): string | null {
  if (!ctx || ctx.from === null) return null;
  const unit = ctx.unit ? `/${unitLabel(ctx.unit)}` : "";
  return `Transparent ${categoryName.toLowerCase()} prices — from ₹${ctx.from.toLocaleString("en-IN")}${unit}, shown before you ask, across ${ctx.pricedCount} priced options.`;
}

export function CategoryPageView({
  category,
  products,
  brands,
  filterCounts,
  priceContext,
  page,
  totalPages,
  collection,
  popularProducts,
}: {
  category: CategoryConfig;
  products: ProductRow[];
  brands: CategoryBrand[];
  filterCounts: CategoryFilterCounts;
  priceContext?: CategoryPriceContext;
  page: number;
  totalPages: number;
  collection: string | null;
  /** High-opportunity SKUs from the Search Console snapshot (lib/data/searchOpportunities.ts). */
  popularProducts?: ProductSummary[];
}) {
  const seo = categorySeo(category);
  const related = CATEGORIES.filter((c) => category.relatedCategorySlugs.includes(c.slug));
  const pricePages = pricePagesForDbCategory(category.dbCategory);
  const singular = categorySingularName(category.name);
  const linkableBrands = brands.filter((b) => b.slug && b.name !== "EightByFour");
  const collectionAxis = COLLECTION_AXIS_LABEL[category.dbCategory] ?? "Range";
  // Every collection when there are few enough to list; otherwise only the
  // ranges that have their own landing page (lib/collectionLandings.ts) —
  // Laminates has 100+ collection values, and most are filters, not
  // destinations. Hrefs come from categoryPageUrl, so landing ranges link to
  // their clean /collections/ URL.
  const landings = collectionLandingsForCategory(category.slug);
  const landingName = (name: string) => landings.find((l) => l.collection === name)?.name;
  const collectionLinks =
    filterCounts.collections.length <= SHOP_BY_COLLECTION_MAX
      ? filterCounts.collections
      : filterCounts.collections.filter((c) => landingName(c.name));
  const showShopByCollection = !collection && collectionLinks.length > 1;

  // Page 2+ of a category is a slice of the same catalogue — it self-canonicals
  // (see the route's generateMetadata) but must not re-serve the hub's whole
  // marketing body (overview, brand grid, buying guide, FAQ, price-page links),
  // which is what makes a deep page compete with /products/{slug} for the head
  // term. Lean pages carry only what helps a crawler reach the products on them.
  const lean = page > 1;

  const uspLine = priceLine(priceContext, category.name);

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
      {!lean ? <FaqSchema faqs={category.faqs} /> : null}
      <CollectionPageSchema
        name={lean ? `${category.name} Products — Page ${page}` : `${category.name} Products`}
        path={categoryPageUrl(category.slug, page, collection)}
        totalItems={filterCounts.total}
        pageOffset={(page - 1) * CATEGORY_PAGE_SIZE}
        items={products.map((p) => ({ name: productDisplayName(p), url: `/products/${p.slug}` }))}
      />
      <CategoryPaginationLinks slug={category.slug} page={page} totalPages={totalPages} collection={collection} />
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name }]} />

      {lean ? (
        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {category.name} · Page {page} of {totalPages}
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            {collection ? `${category.name} — ${collection}` : category.name} — Page {page}
          </h1>
          <p className="mt-2">
            <Link href={categoryPageUrl(category.slug, 1, collection)} className="text-sm underline" style={{ color: "var(--burgundy)" }}>
              ← All {collection ? `${collection} ` : ""}{category.name.toLowerCase()}
            </Link>
          </p>
        </section>
      ) : (
        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {category.name} · Hyderabad
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            {seo.h1}
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--line-strong)" }}>
            {category.heroTagline}
          </p>
          {uspLine ? (
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--burgundy)" }}>
              {uspLine}
            </p>
          ) : null}
          <p className="mt-4 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
            {category.overview}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <RequestQuoteButton label="Get Project Pricing" ctaLocation="category_hero" context={{ category: category.dbCategory }} />
            <WhatsAppTrackedLink
              href={buildWhatsAppUrl(`Hi, I'd like project pricing for ${category.name.toLowerCase()}. Requirement: `)}
              source="category_hero"
              context={{ category: category.dbCategory, cta_location: "category_hero" }}
              className={buttonClasses("secondary", "md")}
            >
              WhatsApp for Quote
            </WhatsAppTrackedLink>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
            Project quantities or mixed brands? Send one list — it&rsquo;s quoted as a single project order, with delivery across Hyderabad.
          </p>
        </section>
      )}

      {!lean && linkableBrands.length > 0 ? (
        <Reveal as="section" className="px-7 py-6">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Shop {category.name} by Brand
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {linkableBrands.map((b) => (
              <Link key={b.name} href={`/brands/${b.slug}`} className={BRAND_PILL_CLASS} aria-label={`${b.name} ${singular.toLowerCase()}`}>
                <BrandLogo brand={b.name} height={22} />
              </Link>
            ))}
          </div>
          {/* Descriptive text anchors alongside the logo pills — a crawler
              reading "Merino laminates" / "Greenlam laminates" gets the
              category ↔ brand relationship the logo-only links didn't carry. */}
          <p className="mt-3 text-sm" style={{ color: "var(--line-strong)" }}>
            {linkableBrands.map((b, i) => (
              <span key={b.slug}>
                {i > 0 ? " · " : ""}
                <Link href={`/brands/${b.slug}`} className="underline-offset-2 hover:underline" style={{ color: "var(--ink)" }}>
                  {b.name} {singular.toLowerCase()}
                </Link>
              </span>
            ))}
          </p>
          {isCategoryMarkSlug(category.slug) && brands.some((b) => b.name === "EightByFour") ? (
            <div className="mt-3">
              <Link
                href={`/brands/eightbyfour?category=${category.slug}`}
                className="inline-flex items-center gap-2 text-sm underline-offset-2 hover:underline"
                style={{ color: "var(--ink)" }}
              >
                <CategoryTile slug={category.slug} size={24} />
                EightxFour {singular.toLowerCase()}
              </Link>
            </div>
          ) : null}
        </Reveal>
      ) : null}

      {/* Pages already on Google's page 1–2 for their code, linked from the
          hub with the most internal authority — see lib/data/searchOpportunities.ts. */}
      {!lean && popularProducts && popularProducts.length > 0 ? (
        <Reveal as="section" className="px-7 py-6">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Most searched {category.name.toLowerCase()}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
            The {singular.toLowerCase()} designs buyers look up most — by brand and shade code.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {popularProducts.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} className={`inline-block ${CHIP_LINK_CLASS}`} style={{ background: "var(--paper-dim)" }}>
                  {productIdentity(p)}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      {!lean && showShopByCollection ? (
        <Reveal as="section" className="px-7 py-6">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Shop {category.name} by {collectionAxis}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {collectionLinks.map((c) => (
              <Link key={c.name} href={categoryPageUrl(category.slug, 1, c.name)} className={CHIP_LINK_CLASS} style={{ background: "var(--paper-dim)" }}>
                {landingName(c.name) ?? c.name} ({c.count})
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="px-7 py-8">
        {!lean ? (
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            {category.name} Products
          </h2>
        ) : null}
        <div className={lean ? "" : "mt-4"}>
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

      {!lean ? (
        <>
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
                    className="rounded-full px-3 py-1 text-sm hover:opacity-70"
                    style={{ background: "var(--paper-dim)" }}
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

          <PricePageLinks
            links={pricePages}
            intro={`Live ${category.name.toLowerCase()} rates in Hyderabad by grade, thickness and brand — read alongside this catalogue when you are pricing a job rather than browsing.`}
          />

          {related.length > 0 ? (
            <Reveal as="section" className="px-7 py-8">
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                Related Categories
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {related.map((c) => (
                  <Link key={c.slug} href={`/products/${c.slug}`} className="rounded-full px-4 py-1.5 text-sm hover:opacity-70" style={{ background: "var(--paper-dim)" }}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </Reveal>
          ) : null}
        </>
      ) : null}
      </div>
    </main>
  );
}
