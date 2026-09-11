import Link from "next/link";
import type { ContentEntry, ContentType } from "@/lib/mdx";
import { CONTENT_TYPE_LABEL, CONTENT_TYPE_NAV_LABEL, CONTENT_TYPE_PATH, getContent } from "@/lib/mdx";
import { getPricePage } from "@/lib/pricePages";
import { getBespokeHyderabadPage } from "@/lib/hyderabadLinks";
import { CATEGORIES } from "@/lib/categories";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { MdxContent } from "@/components/MdxContent";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { ServiceSchema } from "@/components/schema/ServiceSchema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";
import type { CategoryConfig } from "@/lib/categories";
import type { ProductSummary } from "@/lib/productRelations";
import { getProductsForGuide } from "@/lib/data/products";
import { getOpportunityProducts } from "@/lib/data/searchOpportunities";
import { brandHubName } from "@/lib/brandSeo";
import { ProductCard } from "@/components/ProductCard";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";

function resolveRelatedContent(type: ContentType, slugs: string[] | undefined): { slug: string; title: string }[] {
  if (!slugs?.length) return [];
  return slugs
    .map((slug) => {
      // /hyderabad holds two page families: MDX entries and the data-driven
      // price pages in lib/pricePages.ts. Frontmatter can point at either, so
      // resolve both here or every relatedHyderabadSlugs link to a price page
      // silently vanishes from the rendered list.
      if (type === "hyderabad") {
        const pricePage = getPricePage(slug);
        if (pricePage) return { slug, title: pricePage.h1 };
        const bespoke = getBespokeHyderabadPage(slug);
        if (bespoke) return { slug, title: bespoke.title };
      }
      const content = getContent(type, slug);
      return content ? { slug, title: content.frontmatter.title } : null;
    })
    .filter((c): c is { slug: string; title: string } => c !== null);
}

function RelatedContentSection({
  heading,
  items,
  basePath,
}: {
  heading: string;
  items: { slug: string; title: string }[];
  basePath: string;
}) {
  if (items.length === 0) return null;
  return (
    <Reveal as="section" className="px-7 py-8">
      <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
        {heading}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`${basePath}/${item.slug}`}
            className="rounded-full px-3 py-1 text-sm hover:opacity-70"
            style={{ background: "var(--paper-dim)" }}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </Reveal>
  );
}

export async function ContentDetailView({ type, entry }: { type: ContentType; entry: ContentEntry }) {
  const { frontmatter, body } = entry;

  const relatedCategories = (frontmatter.relatedCategorySlugs || [])
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter(Boolean);

  let relatedBrands: { slug: string; name: string }[] = [];
  if (frontmatter.relatedBrandSlugs?.length) {
    const allBrands = await getAllBrandsWithCounts();
    relatedBrands = frontmatter.relatedBrandSlugs
      .map((slug) => allBrands.find((b) => b.slug === slug))
      .filter((b): b is NonNullable<typeof b> => Boolean(b))
      .map((b) => ({ slug: b.slug, name: b.name }));
  }

  // Cross-links to other content types — the frontmatter fields already
  // existed (relatedGuideSlugs etc.) but were never rendered, so this data
  // was invisible on the live site regardless of what content authors set.
  const relatedGuides = resolveRelatedContent("guides", frontmatter.relatedGuideSlugs);
  const relatedApplications = resolveRelatedContent("applications", frontmatter.relatedApplicationSlugs);
  const relatedComparisons = resolveRelatedContent("comparisons", frontmatter.relatedComparisonSlugs);
  const relatedHyderabad = resolveRelatedContent("hyderabad", frontmatter.relatedHyderabadSlugs);

  // Guides and comparisons end in the products they discuss, instead of
  // category chips alone: the SKUs already closest to page one first
  // (lib/data/searchOpportunities.ts), topped up with priced products from the
  // same categories/brands. Editorial pages rank for research queries; this is
  // where that traffic reaches a product and a quote.
  const categoryConfigs = relatedCategories.filter((c): c is CategoryConfig => Boolean(c));
  let shopProducts: ProductSummary[] = [];
  if (type === "guides" || type === "comparisons") {
    const dbCategories = categoryConfigs.map((c) => c.dbCategory);
    const brandNames = relatedBrands.map((b) => b.name);
    const popular = await getOpportunityProducts({ brands: brandNames, dbCategories }, 8);
    const fill = popular.length < 8 ? await getProductsForGuide({ dbCategories, brands: brandNames, limit: 8 }) : [];
    const seen = new Set(popular.map((p) => p.slug));
    shopProducts = [...popular, ...fill.filter((p) => !seen.has(p.slug))].slice(0, 8);
  }
  const shopHeading =
    relatedBrands.length === 1 && categoryConfigs.length === 1
      ? `Shop ${brandHubName(relatedBrands[0].name, categoryConfigs[0].name)}`
      : `Shop the products in this ${type === "comparisons" ? "comparison" : "guide"}`;

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: CONTENT_TYPE_NAV_LABEL[type], path: CONTENT_TYPE_PATH[type] },
          { name: frontmatter.title, path: `${CONTENT_TYPE_PATH[type]}/${entry.slug}` },
        ]}
      />
      <FaqSchema faqs={frontmatter.faqs || []} />
      {type === "hyderabad" && (
        <ServiceSchema name={frontmatter.title} description={frontmatter.description} path={`/hyderabad/${entry.slug}`} />
      )}
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: CONTENT_TYPE_NAV_LABEL[type], href: CONTENT_TYPE_PATH[type] },
          { label: frontmatter.title },
        ]}
      />

      <section className="px-7 py-8">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          {type === "hyderabad" ? CONTENT_TYPE_LABEL[type] : `${CONTENT_TYPE_LABEL[type]} · Hyderabad`}
        </p>
        <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
          {frontmatter.title}
        </h1>
        {frontmatter.heroTagline ? (
          <p className="mt-2 text-base" style={{ color: "var(--line-strong)" }}>
            {frontmatter.heroTagline}
          </p>
        ) : null}
        {type === "hyderabad" ? (
          <a
            href={buildWhatsAppUrl(`Hi, I'd like to request a quote — found you via "${frontmatter.title}" on eightbyfour.com`)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-flex ${buttonClasses("primary")}`}
          >
            Request a Quote
          </a>
        ) : null}
      </section>

      <Reveal as="section" className="max-w-3xl px-7 pb-8">
        <MdxContent source={body} />
      </Reveal>

      {shopProducts.length > 0 ? (
        <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            {shopHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            Pricing a job? Send your list — every line is quoted, across brands, with delivery across Hyderabad.
          </p>
          <Reveal stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shopProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
          <div className="mt-5">
            <RequestQuoteButton label="Get Project Pricing" ctaLocation={`${type}_products`} context={{ content_slug: entry.slug }} />
          </div>
        </Reveal>
      ) : null}

      <RelatedContentSection heading="Related Guides" items={relatedGuides} basePath="/guides" />
      <RelatedContentSection heading="Related Applications" items={relatedApplications} basePath="/applications" />
      <RelatedContentSection heading="Related Comparisons" items={relatedComparisons} basePath="/comparisons" />
      <RelatedContentSection heading="More in Hyderabad" items={relatedHyderabad} basePath="/hyderabad" />

      {relatedCategories.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Related Products
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedCategories.map((c) =>
              c ? (
                <Link
                  key={c.slug}
                  href={`/products/${c.slug}`}
                  className="rounded-full px-3 py-1 text-sm hover:opacity-70"
                  style={{ background: "var(--paper-dim)" }}
                >
                  {c.name}
                </Link>
              ) : null
            )}
          </div>
        </Reveal>
      ) : null}

      {relatedBrands.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Related Brands
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedBrands.map((b) => (
              <Link
                key={b.slug}
                href={`/brands/${b.slug}`}
                className="rounded-full px-3 py-1 text-sm hover:opacity-70"
                style={{ background: "var(--paper-dim)" }}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}

      {frontmatter.faqs?.length ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Frequently Asked Questions
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {frontmatter.faqs.map((faq, i) => (
              <div key={i}>
                <p className="font-medium">{faq.question}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}
      </div>
    </main>
  );
}
