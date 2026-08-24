import Link from "next/link";
import Image from "next/image";
import type { CategoryConfig } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";
import type { BrandRow } from "@/lib/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { ShadeFinishPicker, type ShadeEntry } from "@/components/ShadeFinishPicker";
import { FinishFilterableGrid } from "@/components/FinishFilterableGrid";
import { BrandPagination, BrandPaginationLinks } from "@/components/BrandPagination";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { getContent } from "@/lib/mdx";
import { BRAND_GUIDE_SLUGS } from "@/lib/brandGuides";
import { Reveal } from "@/components/Reveal";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";

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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5 9.5 17 19 6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.92 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.84c0 4.55-3.71 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.3c-.23.24-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.16 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function BrandPageView({
  brand,
  products,
  relatedCategoryConfigs,
  faqs,
  page,
  totalPages,
  shadeFinder,
  allProducts,
}: {
  brand: BrandRow;
  products: ProductRow[];
  relatedCategoryConfigs: (CategoryConfig | undefined)[];
  faqs: BrandFaq[];
  page: number;
  totalPages: number;
  /** Code+Finish shade picker (Virgo-style catalogues where finish is a per-SKU differentiator, not a minor filter). */
  shadeFinder?: ShadeEntry[];
  /** Full unpaginated product list for finish-filterable brands — renders in place of the plain paginated grid when present (page 1 only; paginated /page/N routes keep the server-paginated grid). */
  allProducts?: ProductRow[];
}) {
  const relatedGuides = (BRAND_GUIDE_SLUGS[brand.slug] || [])
    .map((slug) => {
      const content = getContent("guides", slug);
      return content ? { slug, title: content.frontmatter.title } : null;
    })
    .filter((g): g is { slug: string; title: string } => g !== null);

  const certifications = [...new Set(products.flatMap((p) => p.certifications || []))].slice(0, 6);

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
      <div className="px-7 pt-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]} />
      </div>

      <section className="reveal-strong is-visible grid grid-cols-1 gap-8 px-7 py-8 lg:grid-cols-[2fr_1fr] lg:items-center">
        <div>
          {brand.logo_url ? (
            <div className="relative mb-5 h-16 w-40 shrink-0">
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
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {brand.name} · Hyderabad
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-tight)" }}>
            {/* EightByFour is the site's own brand, not a third party it "deals" —
                every other brand on this template is external, so only this one
                needs different copy. */}
            {brand.slug === "eightbyfour" ? "EightByFour Products in Hyderabad" : `${brand.name} Dealer in Hyderabad`}
          </h1>
          {brand.overview ? (
            <p className="mt-4 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
              {brand.overview}
            </p>
          ) : null}

          {certifications.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: "var(--card)", color: "var(--ink)" }}
                >
                  <span style={{ color: "var(--burgundy)" }}>
                    <CheckIcon />
                  </span>
                  {cert}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <RequestQuoteButton label={`Get ${brand.name} Pricing`} />
            <WhatsAppTrackedLink
              href={buildWhatsAppUrl(`Hi, I'm interested in ${brand.name} products. Can you share pricing and availability?`)}
              source="brand_page"
              context={{ brand: brand.name }}
              className={buttonClasses("secondary", "md")}
            >
              <WhatsAppIcon />
              WhatsApp
            </WhatsAppTrackedLink>
          </div>
        </div>

        {brand.range_image_url ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm" style={{ background: "var(--paper-dim)" }}>
            <Image
              src={brand.range_image_url}
              alt={`${brand.name} product range`}
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover"
            />
          </div>
        ) : null}
      </section>

      {shadeFinder && shadeFinder.length > 0 ? (
        <Reveal as="section" className="px-7 py-6">
          <ShadeFinishPicker brandName={brand.name} shades={shadeFinder} />
        </Reveal>
      ) : null}

      {relatedGuides.length > 0 || relatedCategoryConfigs.length > 0 ? (
        <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {relatedCategoryConfigs.length > 0 ? (
              <div>
                <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                  Shop by Category
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedCategoryConfigs.map((c) =>
                    c ? (
                      <Link
                        key={c.slug}
                        href={`/products/${c.slug}`}
                        className="rounded-full border px-3 py-1 text-sm transition-colors duration-150 hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                        style={{ borderColor: "var(--line)", background: "var(--paper)" }}
                      >
                        {c.name}
                      </Link>
                    ) : null
                  )}
                </div>
              </div>
            ) : null}

            {relatedGuides.length > 0 ? (
              <div>
                <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                  Guides
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedGuides.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guides/${g.slug}`}
                      className="rounded-full border px-3 py-1 text-sm transition-colors duration-150 hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                      style={{ borderColor: "var(--line)", background: "var(--paper)" }}
                    >
                      {g.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          All {brand.name} Products in Hyderabad
        </h2>
        {allProducts ? (
          <div className="mt-4">
            <FinishFilterableGrid products={allProducts} brandName={brand.name} />
          </div>
        ) : (
          <>
            <Reveal stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Reveal>
            <BrandPagination slug={brand.slug} page={page} totalPages={totalPages} />
          </>
        )}
      </Reveal>

      <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
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
      </Reveal>
      </div>
    </main>
  );
}
