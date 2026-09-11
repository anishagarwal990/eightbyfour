import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";
import type { ProductSummary } from "@/lib/productRelations";
import type { RangeSummary } from "@/lib/rangeSummary";
import { collectionLandingPath, collectionLandingsForBrand, type CollectionLanding } from "@/lib/collectionLandings";
import { CATEGORY_PAGE_SIZE } from "@/lib/data/products";
import { productIdentity } from "@/lib/productSeo";
import { CategoryProductGrid } from "@/components/CategoryProductGrid";
import { CategoryPagination, CategoryPaginationLinks } from "@/components/CategoryPagination";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { CollectionPageSchema } from "@/components/schema/CollectionPageSchema";
import { ViewTracker } from "@/components/ViewTracker";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";

const CHIP_LINK_CLASS =
  "inline-block rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 hover:text-[var(--burgundy)]";

function listJoin(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * A manufacturer range with its own URL — /products/{category}/collections/{range}.
 * Everything above the grid is counted from the range's own SKUs (see
 * lib/rangeSummary.ts), so each range page says something specific about its
 * range rather than repeating the category's copy, which is what the
 * `?collection=` filter pages it replaces used to do.
 */
export function CollectionLandingView({
  landing,
  category,
  summary,
  products,
  page,
  totalPages,
  popular,
}: {
  landing: CollectionLanding;
  category: CategoryConfig;
  summary: RangeSummary;
  products: ProductRow[];
  page: number;
  totalPages: number;
  popular: ProductSummary[];
}) {
  const lean = page > 1;
  const brandDisplay = landing.brand === "EightByFour" ? "EightxFour" : landing.brand;
  const siblings = collectionLandingsForBrand(landing.brandSlug).filter((l) => l.slug !== landing.slug && l.categorySlug === landing.categorySlug);
  const eventContext = { category: category.dbCategory, brand: landing.brand, collection: landing.collection };
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: category.name, href: `/products/${category.slug}` },
    { label: landing.name },
  ];
  const finishes = summary.finishes.slice(0, 4);

  return (
    <main>
      <ViewTracker
        event="category_view"
        dedupeKey={`${landing.slug}:${page}`}
        params={{ ...eventContext, page, landing: landing.slug, product_count: summary.count }}
      />
      <BreadcrumbSchema items={crumbs.map((c) => ({ name: c.label, path: c.href ?? collectionLandingPath(landing) }))} />
      <CollectionPageSchema
        name={lean ? `${landing.name} — Page ${page}` : landing.name}
        path={collectionLandingPath(landing, page)}
        totalItems={summary.count}
        pageOffset={(page - 1) * CATEGORY_PAGE_SIZE}
        items={products.map((p) => ({ name: productIdentity(p), url: `/products/${p.slug}` }))}
      />
      <CategoryPaginationLinks slug={category.slug} page={page} totalPages={totalPages} collection={landing.collection} />
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs items={crumbs} />

        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {brandDisplay} · {category.name}
            {lean ? ` · Page ${page} of ${totalPages}` : " · Hyderabad"}
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            {landing.name}
            {lean ? ` — Page ${page}` : ""}
          </h1>
          {lean ? (
            <p className="mt-2">
              <Link href={collectionLandingPath(landing)} className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                ← All {landing.name}
              </Link>
            </p>
          ) : (
            <>
              <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
                {landing.intro ?? (
                  <>
                    The {landing.name} range: {summary.count} designs
                    {summary.codeRange ? `, shade codes ${summary.codeRange.from} to ${summary.codeRange.to}` : ""}.
                    {finishes.length > 0
                      ? ` Finishes: ${listJoin(finishes)}${summary.finishes.length > finishes.length ? ` and ${summary.finishes.length - finishes.length} more` : ""}.`
                      : ""}{" "}
                    {summary.priceFrom
                      ? `Listed rates start at ${summary.priceFrom} (excl. GST) on ${summary.pricedCount} of ${summary.count} designs; project quantities are priced on request.`
                      : "Rates are on request — they depend on quantity, finish and delivery location."}{" "}
                    Compare it with other brands on one quote, with delivery across Hyderabad.
                  </>
                )}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <RequestQuoteButton label="Get Project Pricing" ctaLocation="collection_hero" context={eventContext} />
                <WhatsAppTrackedLink
                  href={buildWhatsAppUrl(`Hi, I'd like project pricing for the ${landing.name} range. Requirement: `)}
                  source="collection_hero"
                  context={{ ...eventContext, cta_location: "collection_hero" }}
                  className={buttonClasses("secondary", "md")}
                >
                  WhatsApp for Quote
                </WhatsAppTrackedLink>
              </div>
            </>
          )}
        </section>

        {!lean && popular.length > 0 ? (
          <Reveal as="section" className="px-7 py-6">
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              Most searched in this range
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {popular.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.slug}`} className={CHIP_LINK_CLASS} style={{ background: "var(--paper-dim)" }}>
                    {productIdentity(p)}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        <Reveal as="section" className="px-7 py-8">
          {!lean ? (
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              All {landing.name} designs
            </h2>
          ) : null}
          <div className={lean ? "" : "mt-4"}>
            <CategoryProductGrid products={products} />
            <CategoryPagination slug={category.slug} page={page} totalPages={totalPages} collection={landing.collection} />
          </div>
        </Reveal>

        {!lean ? (
          <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              Compare and explore
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              <li>
                <Link href={`/brands/${landing.brandSlug}`} className={CHIP_LINK_CLASS} style={{ background: "var(--paper)" }}>
                  All {brandDisplay} {category.name.toLowerCase()}
                </Link>
              </li>
              {siblings.map((l) => (
                <li key={l.slug}>
                  <Link href={collectionLandingPath(l)} className={CHIP_LINK_CLASS} style={{ background: "var(--paper)" }}>
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/products/${category.slug}`} className={CHIP_LINK_CLASS} style={{ background: "var(--paper)" }}>
                  {category.name} — all brands
                </Link>
              </li>
            </ul>
          </Reveal>
        ) : null}
      </div>
    </main>
  );
}
