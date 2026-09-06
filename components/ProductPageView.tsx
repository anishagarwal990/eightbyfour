import Link from "next/link";
import Image from "next/image";
import type { BrandRow, ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";
import { CATEGORIES, categorySingularName, getCategoryBySlug } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuoteSection } from "@/components/ProductQuoteSection";
import { ProductGallery } from "@/components/ProductGallery";
import { LikeCommentWidget } from "@/components/LikeCommentWidget";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BrandLogo } from "@/components/BrandLogo";
import { CategoryTile, categoryMarkForDbCategory } from "@/components/CategoryMark";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { displayPrice, resolvePrice } from "@/lib/pricing";
import { productDisplayName } from "@/lib/productDisplay";
import { finishCode, productImages } from "@/lib/productSeo";
import { OfferBox } from "@/components/OfferBox";
import { PricePageLinks } from "@/components/PricePageLinks";
import { pricePagesForDbCategory } from "@/lib/pricePages";
import { ViewTracker } from "@/components/ViewTracker";

const CATEGORY_SLUG_BY_DB: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.dbCategory, c.slug])
);

function categorySlugFor(dbCategory: string): string | undefined {
  return CATEGORY_SLUG_BY_DB[dbCategory];
}

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

function buildFaqs(product: ProductRow): { question: string; answer: string }[] {
  const displayName = productDisplayName(product);
  const code = product.sd_code;
  // "{Brand} {Shade} {Code}" — the exact string the shade-code searches this
  // page is built to catch ("merino 21099", "century 3917 snow glacier").
  const codeName = code ? `${displayName} ${code}` : displayName;
  const categoryLower = categorySingularName(product.category).toLowerCase();

  const faqs: { question: string; answer: string }[] = [];

  // Answers the "what is <code>" query directly and grounds the answer in the
  // row's own fields — brand, name, finish (only when it's a per-SKU finish,
  // not one of several the design ships in), size. Never invents a spec.
  if (code) {
    const finishBit = !product.finishes?.length && product.finish ? ` in a ${product.finish} finish` : "";
    const sizeBit = product.size ? `, ${product.size}` : "";
    faqs.push({
      question: `What is ${displayName} ${code}?`,
      answer: `${code} is the ${product.brand} shade code for ${product.name}, a ${categoryLower}${finishBit}${sizeBit}. EightxFour stocks it in Hyderabad — request a quote for the current rate and lead time.`,
    });
  }

  // Local buy-intent, with the code worked in so it also catches
  // "<shade> <code> hyderabad". Replaces the old bare availability FAQ.
  faqs.push({
    question: `Where can I buy ${codeName} in Hyderabad?`,
    answer: `EightxFour supplies ${codeName} across Hyderabad with same or next-day delivery. Send your list or BOQ for a priced quote — first response in under 15 minutes during business hours.`,
  });

  // Only when there's a real rate on file — an unpriced (RFQ) SKU promising a
  // price answer is a bounce, same reasoning as the price qualifier in
  // buildProductTitle (lib/productSeo.ts).
  const price = resolvePrice(product);
  if (price) {
    faqs.push({
      question: `How much does ${codeName} cost in Hyderabad?`,
      answer: `${codeName} is currently ${displayPrice(price).netLabel}, excl. GST. Rates move with the market — request a quote for today's price on your quantity.`,
    });
  }

  faqs.push(...(product.custom_faqs || []));

  if (product.thicknesses?.length) {
    faqs.push({
      question: `What thicknesses does ${product.name} come in?`,
      answer: `${displayName} is available in ${product.thicknesses.join(", ")}.`,
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
  relatedProducts,
  ratings,
  brand,
  brandProducts,
}: {
  product: ProductRow;
  relatedProducts: ProductRow[];
  ratings?: ProductRatingSummary;
  brand?: BrandRow | null;
  brandProducts?: ProductRow[];
}) {
  const categorySlug = categorySlugFor(product.category);
  const categoryConfig = categorySlug ? getCategoryBySlug(categorySlug) : undefined;
  const categoryMarkSlug = categoryMarkForDbCategory(product.category);
  const price = resolvePrice(product);
  const images = productImages(product);
  const faqs = buildFaqs(product);
  // Surfaced next to the shade code up top rather than buried in the specs
  // table further down — the page number in the source catalogue PDF is one
  // of the most useful facts on a page built around "go check the real PDF
  // for the actual shade," so it shouldn't take scrolling to find.
  const cataloguePage = product.spec_table?.find((row) => row.label === "Catalogue Page")?.value;
  // The shade code leads the H1 whenever the product has one — it's the exact
  // string the decor-code searches use ("163", "3917 snow glacier", "21099
  // merino"), and burying it below the name cedes those queries. When finish
  // is a per-SKU differentiator (Virgo-style — see finishCode's guard in
  // lib/productSeo.ts) it rides along after the code ("6511 SF — Tahiti Samoa
  // Teak"); for multi-finish designs the code alone leads ("163 — Bay").
  const finish = finishCode(product);
  const h1Text = product.sd_code
    ? finish
      ? `${product.sd_code} ${finish} — ${product.name}`
      : `${product.sd_code} — ${product.name}`
    : product.name;
  // Cross-sell using the category's own editorial "related categories" so a
  // Laminates product doesn't get told to buy more Laminates — falls back to
  // the general Adhesives/Laminates pair for categories with none configured.
  const crossSellCategories = categoryConfig
    ? CATEGORIES.filter((c) => categoryConfig.relatedCategorySlugs.includes(c.slug)).slice(0, 3)
    : [];
  const frequentlyBoughtWith =
    crossSellCategories.length > 0
      ? crossSellCategories
      : CATEGORIES.filter((c) => (c.slug === "adhesive" || c.slug === "laminates") && c.slug !== categorySlug);
  const breadcrumbPaths = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(categoryConfig ? [{ name: categoryConfig.name, path: `/products/${categoryConfig.slug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <main>
      <ViewTracker
        event="product_view"
        dedupeKey={product.slug}
        params={{
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          brand: product.brand,
          product_code: product.sd_code,
          finish: product.finish,
        }}
      />
      <BreadcrumbSchema items={breadcrumbPaths} />
      <FaqSchema faqs={faqs} />
      <ProductSchema product={product} ratings={ratings} />
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          ...(categoryConfig ? [{ label: categoryConfig.name, href: `/products/${categoryConfig.slug}` }] : []),
          { label: product.name },
        ]}
      />

      {/* Plain section, not <Reveal> — this is always above the fold on load, so
          gating it behind an IntersectionObserver just delays the page's most
          important content (title, price, CTA) for no benefit. The entrance
          animation still plays via the hardcoded is-visible class, it just
          isn't scroll-gated. */}
      <section className="reveal-strong is-visible grid grid-cols-1 gap-8 px-7 py-8 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={images} productId={product.id} productName={product.name} />
        </div>

        <div>
          {product.brand === "EightByFour" && categoryMarkSlug ? (
            <CategoryTile slug={categoryMarkSlug} size={40} />
          ) : (
            <BrandLogo brand={product.brand} height={40} />
          )}
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="serif" style={{ fontSize: "var(--fs-h1)" }}>
              {h1Text}
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
          <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
            {product.category} in Hyderabad · {product.size || "Standard sheet size"}
          </p>
          {product.sd_code || cataloguePage ? (
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--burgundy)" }}>
              {product.sd_code ? <>Shade Code: {product.sd_code}</> : null}
              {product.sd_code && cataloguePage ? " · " : null}
              {cataloguePage ? <>Catalogue Page {cataloguePage}</> : null}
            </p>
          ) : null}
          {product.description ? (
            <div className="mt-4">
              <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
                Product Description
              </h2>
              <p className="mt-2" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", whiteSpace: "pre-line" }}>
                {product.description}
              </p>
              {product.category === "Laminates" ? (
                <div className="mt-2 flex flex-col gap-1">
                  {product.brand === "Merino" ? (
                    <Link href="/guides/merino-laminate-finishes-guide" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                      See our full guide to Merino&rsquo;s finish range →
                    </Link>
                  ) : null}
                  {product.brand === "Greenlam" ? (
                    <Link href="/guides/greenlam-laminate-finishes-guide" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                      See our full guide to Greenlam&rsquo;s finish range →
                    </Link>
                  ) : null}
                  <Link href="/guides/laminate-care-and-maintenance" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                    Laminate care &amp; maintenance guide →
                  </Link>
                </div>
              ) : null}
              {product.category === "Plywood" && product.brand === "Wigwam Excel" ? (
                <div className="mt-2 flex flex-col gap-1">
                  <Link href="/guides/why-calibrated-plywood-matters" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                    Why calibrated plywood matters →
                  </Link>
                </div>
              ) : null}
              {product.category === "Birch Plywood" ? (
                <div className="mt-2 flex flex-col gap-1">
                  <Link href="/comparisons/birch-ply-vs-standard-plywood" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                    Birch Ply vs Standard Plywood — full comparison →
                  </Link>
                </div>
              ) : null}
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
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--burgundy)", color: "var(--paper)" }}
              >
                <CheckIcon />
                In Stock — Hyderabad
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

          <div className="mt-5">
            <ProductQuoteSection product={product} />
          </div>

          <div className="mt-6">
            {[
              [product.category === "Adhesive" ? "Pack Sizes" : "Thicknesses", product.variants ? null : product.thicknesses],
              ["Also available in finishes", product.finishes],
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

      {relatedProducts.length > 0 ? (
        <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Related Products
          </h2>
          <Reveal stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
        </Reveal>
      ) : null}

      {brand && brandProducts && brandProducts.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              More from {brand.name}
            </h2>
            <Link href={`/brands/${brand.slug}`} className="shrink-0 text-sm underline">
              View brand
            </Link>
          </div>
          {brand.logo_url || brand.overview ? (
            <div className="mt-3 flex items-center gap-4">
              {brand.logo_url ? (
                <Image
                  src={brand.logo_url}
                  alt={`${brand.name} logo`}
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain"
                  style={{ width: "auto", height: "32px" }}
                />
              ) : null}
              {brand.overview ? (
                <p className="text-sm" style={{ color: "var(--line-strong)" }}>
                  {brand.overview}
                </p>
              ) : null}
            </div>
          ) : null}
          <Reveal stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {brandProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
        </Reveal>
      ) : null}

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
