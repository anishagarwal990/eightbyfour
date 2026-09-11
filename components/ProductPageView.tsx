import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { BrandRow, ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";
import type { ProductRelations } from "@/lib/productRelations";
import { CATEGORIES, getCategoryByDbCategory } from "@/lib/categories";
import { collectionLandingPath, getCollectionLanding } from "@/lib/collectionLandings";
import { BRAND_GUIDE_SLUGS, CATEGORY_COMPARISON_SLUGS, CATEGORY_GUIDE_SLUGS } from "@/lib/brandGuides";
import { getContent } from "@/lib/mdx";
import { ProductQuoteSection } from "@/components/ProductQuoteSection";
import { ProductGallery } from "@/components/ProductGallery";
import { LikeCommentWidget } from "@/components/LikeCommentWidget";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { BrandLogo } from "@/components/BrandLogo";
import { CategoryTile, categoryMarkForDbCategory } from "@/components/CategoryMark";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { displayPrice, resolvePrice } from "@/lib/pricing";
import { buildProductHeading, isNamedCollection, productFinishLabels, productIdentity, productImages, productTypeWord } from "@/lib/productSeo";
import { OfferBox } from "@/components/OfferBox";
import { PricePageLinks } from "@/components/PricePageLinks";
import { pricePagesForDbCategory } from "@/lib/pricePages";
import { ViewTracker } from "@/components/ViewTracker";
import { ProductExplore } from "@/components/ProductExplore";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5 12.5 9.5 17 19 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M7 2.75h7.5L19 7.25V19.5a1.75 1.75 0 0 1-1.75 1.75h-8.5A1.75 1.75 0 0 1 7 19.5V2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14.5 2.75V7h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M9 13.2h1.1c.5 0 .9.4.9.9v.1c0 .5-.4.9-.9.9H9v-1.9Zm0 0v3.3M12.6 13.2h1.15c.75 0 1.35.6 1.35 1.35v.6c0 .75-.6 1.35-1.35 1.35H12.6v-3.3Zm4.4 0h-1.9v3.3m0-1.65h1.7"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The guides that answer this buyer's next question — the brand's own guide
 * (Merino/Greenlam finishes, Wigwam calibration) plus its category's (grades,
 * moisture, care). Replaces links that used to be hand-placed on a few
 * brands' pages only.
 */
function guideLinksFor(product: ProductRow, brandSlug: string | undefined): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const guideSlugs = [...new Set([...(brandSlug ? (BRAND_GUIDE_SLUGS[brandSlug] ?? []) : []), ...(CATEGORY_GUIDE_SLUGS[product.category] ?? [])])];
  for (const slug of guideSlugs) {
    const entry = getContent("guides", slug);
    if (entry) links.push({ href: `/guides/${slug}`, label: entry.frontmatter.title });
  }
  for (const slug of CATEGORY_COMPARISON_SLUGS[product.category] ?? []) {
    const entry = getContent("comparisons", slug);
    if (entry) links.push({ href: `/comparisons/${slug}`, label: entry.frontmatter.title });
  }
  return links.slice(0, 3);
}

function buildFaqs(product: ProductRow, identity: string): { question: string; answer: string }[] {
  const code = product.sd_code;
  const typeLower = productTypeWord(product).toLowerCase();
  const faqs: { question: string; answer: string }[] = [];

  // Answers the "what is <code>" query directly and grounds the answer in the
  // row's own fields — brand, name, finish (only when it's a per-SKU finish,
  // not one of several the design ships in), size. Never invents a spec.
  if (code) {
    const ownFinish = !product.finishes?.length ? productFinishLabels(product)[0] : undefined;
    const finishBit = ownFinish ? ` in a ${ownFinish} finish` : "";
    const sizeBit = product.size ? `, ${product.size}` : "";
    faqs.push({
      question: `What is ${identity}?`,
      answer: `${code} is the ${product.brand} shade code for ${product.name || "this design"}, a ${typeLower}${finishBit}${sizeBit}. EightxFour supplies it in Hyderabad — request a quote for today's rate and lead time.`,
    });
  }

  // Local buy-intent, with the code worked in so it also catches
  // "<shade> <code> hyderabad". No stock/delivery-speed guarantee — we don't
  // hold verified inventory data per SKU, so the promise here is a quote and
  // a confirmed availability/delivery timeline, not a stock claim.
  faqs.push({
    question: `Where can I buy ${identity} in Hyderabad?`,
    answer: `EightxFour supplies ${identity} across Hyderabad — request a quote and we'll confirm current availability and delivery timeline against your quantity. Send your list or BOQ for a priced quote; first response in under 15 minutes during business hours.`,
  });

  // A priced SKU quotes its rate; an unpriced one says plainly that it is
  // priced on request and why — still an answer to "<code> price", never a
  // borrowed or estimated number.
  const price = resolvePrice(product);
  if (price) {
    faqs.push({
      question: `How much does ${identity} cost in Hyderabad?`,
      answer: `${identity} is currently ${displayPrice(price).netLabel}, excl. GST. Rates move with the market — request a quote for today's price on your quantity; project quantities are priced as one order.`,
    });
  } else {
    faqs.push({
      question: `What is the price of ${identity}?`,
      answer: `${identity} is priced on request — the rate depends on quantity, finish, thickness and delivery location, so we confirm today's price against your requirement. Orders spanning several products or brands are quoted together as one project.`,
    });
  }

  faqs.push(...(product.custom_faqs || []));

  if (product.thicknesses?.length) {
    faqs.push({
      question: `What thicknesses does ${product.name} come in?`,
      answer: `${identity} is available in ${product.thicknesses.join(", ")}.`,
    });
  }
  if (product.warranty) {
    faqs.push({
      question: `What warranty does ${product.name} carry?`,
      answer: `${product.brand} backs ${product.name} with a ${product.warranty}.`,
    });
  }
  return faqs;
}

export function ProductPageView({
  product,
  relations,
  ratings,
  brand,
}: {
  product: ProductRow;
  relations: ProductRelations;
  ratings?: ProductRatingSummary;
  brand?: BrandRow | null;
}) {
  const categoryConfig = getCategoryByDbCategory(product.category);
  const categoryMarkSlug = categoryMarkForDbCategory(product.category);
  const price = resolvePrice(product);
  const images = productImages(product);
  // "Merino 22153 Saga Green Laminate" — brand, code, shade and type in the
  // H1, the same string as the title's lead and the schema name. The shade
  // code still sits right after the brand, where code searches look for it.
  const heading = buildProductHeading(product);
  const identity = productIdentity(product);
  const faqs = buildFaqs(product, identity);
  const finishLabels = productFinishLabels(product);
  const collectionLanding = categoryConfig ? getCollectionLanding(categoryConfig.slug, product.collection) : undefined;
  const guideLinks = guideLinksFor(product, brand?.slug);
  // Surfaced up top rather than buried in the specs table further down — the
  // page number in the source catalogue PDF is one of the most useful facts
  // on a page built around "go check the real PDF for the actual shade".
  const cataloguePage = product.spec_table?.find((row) => row.label === "Catalogue Page")?.value;
  const eventContext = {
    product_id: product.id,
    product_slug: product.slug,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    product_code: product.sd_code,
  };

  // Cross-sell using the category's own editorial "related categories" so a
  // Laminates product doesn't get told to buy more Laminates — falls back to
  // the general Adhesives/Laminates pair for categories with none configured.
  const crossSellCategories = categoryConfig
    ? CATEGORIES.filter((c) => categoryConfig.relatedCategorySlugs.includes(c.slug)).slice(0, 3)
    : [];
  const frequentlyBoughtWith =
    crossSellCategories.length > 0
      ? crossSellCategories
      : CATEGORIES.filter((c) => (c.slug === "adhesive" || c.slug === "laminates") && c.slug !== categoryConfig?.slug);

  // One trail for both the visible breadcrumb and its BreadcrumbList, so the
  // two can never disagree: Home › Products › Laminates › Merino › Merino 22153 Saga Green.
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    ...(categoryConfig ? [{ label: categoryConfig.name, href: `/products/${categoryConfig.slug}` }] : []),
    ...(brand ? [{ label: brand.name, href: `/brands/${brand.slug}` }] : []),
    { label: identity },
  ];

  // The first screen answers what a code-searcher came for: what it is, whose
  // it is, which code/finish/size, and whether it can be priced and sourced.
  // Only fields the row actually has.
  const linkStyle = { color: "var(--burgundy)" };
  const glance: [string, ReactNode][] = (
    [
      [
        "Brand",
        brand ? (
          <Link href={`/brands/${brand.slug}`} className="underline-offset-2 hover:underline" style={linkStyle}>
            {brand.name}
          </Link>
        ) : (
          product.brand
        ),
      ],
      ["Shade code", product.sd_code],
      [finishLabels.length > 1 ? "Finishes" : "Finish", finishLabels.join(", ") || null],
      [product.category === "Adhesive" ? "Pack sizes" : "Thickness", product.thicknesses?.join(", ") || null],
      ["Sheet size", product.size],
      ["Grade", product.grade],
      [
        "Range",
        isNamedCollection(product) ? (
          collectionLanding ? (
            <Link href={collectionLandingPath(collectionLanding)} className="underline-offset-2 hover:underline" style={linkStyle}>
              {product.collection}
            </Link>
          ) : (
            product.collection
          )
        ) : null,
      ],
      ["Catalogue page", cataloguePage ?? null],
      [
        "Category",
        categoryConfig ? (
          <Link href={`/products/${categoryConfig.slug}`} className="underline-offset-2 hover:underline" style={linkStyle}>
            {categoryConfig.name}
          </Link>
        ) : (
          product.category
        ),
      ],
    ] as [string, ReactNode][]
  ).filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <main>
      <ViewTracker
        event="product_view"
        dedupeKey={product.slug}
        params={{
          ...eventContext,
          finish: product.finish,
          price_shown: price ? 1 : 0,
        }}
      />
      <BreadcrumbSchema items={crumbs.map((c) => ({ name: c.label, path: c.href ?? `/products/${product.slug}` }))} />
      <FaqSchema faqs={faqs} />
      <ProductSchema product={product} ratings={ratings} />
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs items={crumbs} />

      {/* Plain section, not <Reveal> — this is always above the fold on load, so
          gating it behind an IntersectionObserver just delays the page's most
          important content (title, price, CTA) for no benefit. The entrance
          animation still plays via the hardcoded is-visible class, it just
          isn't scroll-gated. */}
      {/* On a phone this reads identity → swatch → price: the H1 and the
          at-a-glance facts sit above the gallery and the price box right
          below it, instead of a full screen of image before the page says
          what it is. Desktop keeps the gallery left with both blocks beside
          it. */}
      <section className="reveal-strong is-visible grid grid-cols-1 gap-x-8 gap-y-6 px-7 py-8 lg:grid-cols-2">
        <div className="order-2 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={images} productId={product.id} productName={product.name} />
        </div>

        <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
          {product.brand === "EightByFour" && categoryMarkSlug ? (
            <CategoryTile slug={categoryMarkSlug} size={40} />
          ) : (
            <BrandLogo brand={product.brand} height={40} />
          )}
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="serif" style={{ fontSize: "var(--fs-h1)" }}>
              {heading}
            </h1>
            {product.catalogue_url ? (
              <a
                href={product.catalogue_url}
                target="_blank"
                rel="noopener noreferrer"
                title={`View ${product.brand} catalogue (PDF)`}
                aria-label={`View ${product.brand} catalogue (PDF)`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}
              >
                <PdfIcon />
              </a>
            ) : null}
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3" aria-label="Product at a glance">
            {glance.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs" style={{ color: "var(--line-strong)" }}>
                  {label}
                </dt>
                <dd className="break-words font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {relations.otherFinishes.length > 0 ? (
            <p className="mt-3 text-sm">
              <span style={{ color: "var(--line-strong)" }}>Also available as: </span>
              {relations.otherFinishes.map((p, i) => (
                <span key={p.id}>
                  {i > 0 ? " · " : null}
                  <Link href={`/products/${p.slug}`} className="font-medium underline-offset-2 hover:underline" style={linkStyle}>
                    {[p.sd_code, productFinishLabels(p).join(" / ")].filter(Boolean).join(" ")}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>

        <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-2">
          <ProductQuoteSection product={product} displayTitle={identity} />

          {product.description ? (
            <div className="mt-6">
              <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
                Product Description
              </h2>
              <p className="mt-2" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", whiteSpace: "pre-line" }}>
                {product.description}
              </p>
            </div>
          ) : null}

          {guideLinks.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1">
              {guideLinks.map((g) => (
                <Link key={g.href} href={g.href} className="text-sm underline" style={linkStyle}>
                  {g.label} →
                </Link>
              ))}
            </div>
          ) : null}

          {product.features?.length ? (
            <div className="mt-5">
              <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
                Key Features
              </h2>
              <p
                className="serif mt-3 border-l-2 pl-4"
                style={{ borderColor: "var(--burgundy)", fontSize: "var(--fs-h3, 1.15rem)", lineHeight: "var(--lh-tight)" }}
              >
                {product.features[0]}
              </p>
              {product.features.length > 1 ? (
                <ul className="mt-4 flex flex-col">
                  {product.features.slice(1).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 border-b py-2.5 text-sm"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--burgundy) 12%, var(--paper))" }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--burgundy)" }}>
                          <path d="M5 12.5 9.5 17 19 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {product.certifications?.length || product.warranty ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Not "In Stock" — EightxFour is a procurement platform and
                  doesn't hold verified real-time inventory per SKU. Neutral
                  wording here, and no `availability` claim in ProductSchema
                  either (see components/schema/ProductSchema.tsx). */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--burgundy)", color: "var(--paper)" }}
              >
                <CheckIcon />
                Check Availability — Hyderabad
              </span>
              {product.certifications?.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: "var(--card)", color: "var(--ink)" }}
                >
                  <CheckIcon />
                  {cert}
                </span>
              ))}
              {product.warranty ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: "var(--card)", color: "var(--ink)" }}
                >
                  <CheckIcon />
                  {product.warranty}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6">
            {[
              ["Applications", product.applications],
              ["Certifications", product.certifications],
            ]
              .filter(([, values]) => Array.isArray(values) && (values as string[]).length > 0)
              .map(([label, values]) => (
                <div key={label as string} className="flex flex-col gap-1.5 border-b py-3 text-sm" style={{ borderColor: "var(--line)" }}>
                  <span style={{ color: "var(--line-strong)" }}>{label as string}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {(values as string[]).map((v) => (
                      <span
                        key={v}
                        className="rounded-full px-3 py-1 text-xs"
                        style={{ background: "var(--card)" }}
                      >
                        {v}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-6">
            <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
              Technical Specifications
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {[
                ["Brand", product.brand],
                ["Shade Code", product.sd_code],
                ["Edge Band Code", product.eb_code],
                ["Size", product.size],
                ["Grade", product.grade],
                ["Core", product.core],
                ["Density", product.density],
                ["Finish", !product.finishes?.length ? product.finish : undefined],
                ["Warranty", product.warranty],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 border-b py-2 text-sm" style={{ borderColor: "var(--line)" }}>
                    <dt className="text-xs" style={{ color: "var(--line-strong)" }}>{label}</dt>
                    {label === "Brand" && brand?.logo_url ? (
                      <dd>
                        <Image
                          src={brand.logo_url}
                          alt={`${value} logo`}
                          width={140}
                          height={40}
                          className="object-contain"
                          style={{ width: "auto", height: "28px" }}
                        />
                      </dd>
                    ) : (
                      <dd>{value}</dd>
                    )}
                  </div>
                ))}
              {(product.spec_table || []).map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 border-b py-2 text-sm" style={{ borderColor: "var(--line)" }}>
                  <dt className="text-xs" style={{ color: "var(--line-strong)" }}>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            {price ? (
              <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
                Prices shown are excl. GST.
              </p>
            ) : null}
            {price?.cashbackPct ? (
              <div className="mt-3">
                <OfferBox cashbackPct={price.cashbackPct} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* How pricing works, in three lines — the procurement side of the page:
          project quantities, multi-brand quotes, Hyderabad delivery. Only
          claims the business already makes elsewhere on the site. */}
      <section className="px-7 pb-8" aria-labelledby="pricing-heading">
        <div className="rounded-2xl p-6" style={{ background: "var(--paper-dim)" }}>
          <h2 id="pricing-heading" className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
            Pricing, project orders &amp; delivery
          </h2>
          <ul className="mt-3 grid gap-4 text-sm sm:grid-cols-3" style={{ lineHeight: "var(--lh-normal)" }}>
            <li>
              <p className="font-medium">{price ? `Listed from ${displayPrice(price).netLabel}, excl. GST` : "Price on request"}</p>
              <p style={{ color: "var(--line-strong)" }}>
                The rate for a job depends on quantity, finish, thickness, availability and delivery location — we confirm today&rsquo;s price against your requirement.
              </p>
            </li>
            <li>
              <p className="font-medium">Better pricing on project quantities</p>
              <p style={{ color: "var(--line-strong)" }}>
                Ordering multiple sheets or a full BOQ? Send the list and it&rsquo;s quoted as one project order.
              </p>
            </li>
            <li>
              <p className="font-medium">Multi-brand sourcing, Hyderabad delivery</p>
              <p style={{ color: "var(--line-strong)" }}>
                Compare {product.brand} with other brands on the same quote, delivered to site across Hyderabad.
              </p>
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <RequestQuoteButton label="Get Project Pricing" ctaLocation="product_pricing_band" prefill={identity} context={eventContext} />
            <WhatsAppTrackedLink
              href={buildWhatsAppUrl(`Hi, I'd like project pricing for ${identity}. Quantity: `)}
              source="product_pricing_band"
              context={{ ...eventContext, cta_location: "product_pricing_band" }}
              className={buttonClasses("secondary", "md")}
            >
              WhatsApp for Quote
            </WhatsAppTrackedLink>
          </div>
        </div>
      </section>

      <ProductExplore
        product={product}
        identity={identity}
        relations={relations}
        brand={brand}
        categoryConfig={categoryConfig}
        collectionLanding={collectionLanding}
      />

      {product.how_to_apply?.length ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            How to Apply
          </h2>
          <ol className="mt-3 flex flex-col gap-3 text-sm">
            {product.how_to_apply.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="serif shrink-0" style={{ color: "var(--burgundy)" }}>
                  {i + 1}.
                </span>
                <span style={{ lineHeight: "var(--lh-normal)" }}>{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      ) : null}

      {product.catalogue_url || product.tech_sheet_url || product.installation_guide_url ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Downloads
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {product.catalogue_url ? (
              <li>
                <a href={product.catalogue_url} className="underline" target="_blank" rel="noopener noreferrer">
                  Catalogue
                </a>
              </li>
            ) : null}
            {product.tech_sheet_url ? (
              <li>
                <a href={product.tech_sheet_url} className="underline" target="_blank" rel="noopener noreferrer">
                  Technical Sheet
                </a>
              </li>
            ) : null}
            {product.installation_guide_url ? (
              <li>
                <a href={product.installation_guide_url} className="underline" target="_blank" rel="noopener noreferrer">
                  Installation Guide
                </a>
              </li>
            ) : null}
          </ul>
        </Reveal>
      ) : null}

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

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Reviews &amp; Ratings
        </h2>
        <div className="mt-4">
          <LikeCommentWidget productId={product.id} initialRatings={ratings} />
        </div>
      </Reveal>

      <PricePageLinks
        links={pricePagesForDbCategory(product.category, 5)}
        intro={`Comparing this against the rest of the ${product.category.toLowerCase()} range — current Hyderabad rates by grade, thickness and brand.`}
      />

      {frequentlyBoughtWith.length > 0 ? (
        <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Frequently Bought Together
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {frequentlyBoughtWith.map((c) => (
              <Link key={c.slug} href={`/products/${c.slug}`} className="rounded-full px-4 py-1.5 text-sm" style={{ background: "var(--paper)" }}>
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
