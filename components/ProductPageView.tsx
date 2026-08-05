import Link from "next/link";
import Image from "next/image";
import type { BrandRow, ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuoteSection } from "@/components/ProductQuoteSection";
import { ProductGallery } from "@/components/ProductGallery";
import { LikeCommentWidget } from "@/components/LikeCommentWidget";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BrandLogo } from "@/components/BrandLogo";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { resolvePrice } from "@/lib/pricing";
import { productDisplayName } from "@/lib/productDisplay";
import { OfferBox } from "@/components/OfferBox";

const CATEGORY_SLUG_BY_DB: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.dbCategory, c.slug])
);

function categorySlugFor(dbCategory: string): string | undefined {
  return CATEGORY_SLUG_BY_DB[dbCategory];
}

function buildFaqs(product: ProductRow): { question: string; answer: string }[] {
  const displayName = productDisplayName(product);
  const faqs = [
    {
      question: `Is ${displayName} available in Hyderabad?`,
      answer: `Yes — EightByFour stocks ${displayName} for delivery across Hyderabad. Request a quote for current availability and lead time.`,
    },
    ...(product.custom_faqs || []),
  ];
  if (product.thicknesses?.length) {
    faqs.push({
      question: `What thicknesses does ${product.name} come in?`,
      answer: `${displayName} is available in ${product.thicknesses.join(", ")}.`,
    });
  }
  if (product.warranty) {
    faqs.push({
      question: `What warranty does ${product.name} carry?`,
      answer: `${product.brand} backs ${product.name} with a ${product.warranty} warranty.`,
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
  const displayName = productDisplayName(product);
  const price = resolvePrice(product);
  const images = [product.main_img_url, product.edge_img_url, product.app_img_url, ...(product.gallery_img_urls || [])].filter(
    Boolean
  ) as string[];
  const faqs = buildFaqs(product);
  const breadcrumbPaths = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(categoryConfig ? [{ name: categoryConfig.name, path: `/products/${categoryConfig.slug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <main>
      <BreadcrumbSchema items={breadcrumbPaths} />
      <FaqSchema faqs={faqs} />
      <ProductSchema product={product} ratings={ratings} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          ...(categoryConfig ? [{ label: categoryConfig.name, href: `/products/${categoryConfig.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <section className="grid grid-cols-1 gap-8 px-7 py-8 lg:grid-cols-2">
        <ProductGallery images={images} alt={displayName} />

        <div>
          <BrandLogo brand={product.brand} height={40} />
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            {product.name}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
            Available in Hyderabad · {product.size || "Standard sheet size"}
          </p>
          {product.sd_code ? (
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--burgundy)" }}>
              Shade Code: {product.sd_code}
            </p>
          ) : null}
          {product.description ? (
            <div className="mt-4">
              <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
                Product Description
              </h2>
              <p className="mt-2" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
                {product.description}
              </p>
              {product.category === "Laminates" ? (
                <div className="mt-2 flex flex-col gap-1">
                  {product.brand === "Merino" ? (
                    <Link href="/guides/merino-laminate-finishes-guide" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                      See our full guide to Merino's finish range →
                    </Link>
                  ) : null}
                  {product.brand === "Greenlam" ? (
                    <Link href="/guides/greenlam-laminate-finishes-guide" className="text-sm underline" style={{ color: "var(--burgundy)" }}>
                      See our full guide to Greenlam's finish range →
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
            </div>
          ) : null}

          {product.features?.length ? (
            <div className="mt-4">
              <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)", color: "var(--burgundy)" }}>
                Key Features
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm" style={{ lineHeight: "var(--lh-normal)" }}>
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden style={{ color: "var(--burgundy)" }}>
                      •
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5">
            <ProductQuoteSection product={product} />
          </div>

          <div className="mt-6">
            {[
              [product.category === "Adhesive" ? "Pack Sizes" : "Thicknesses", product.thicknesses],
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
                        className="rounded-full border px-3 py-1 text-xs"
                        style={{ borderColor: "var(--line)", background: "var(--paper)" }}
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
                  <div key={label} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--line)" }}>
                    <dt style={{ color: "var(--line-strong)" }}>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              {(product.spec_table || []).map((row) => (
                <div key={row.label} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--line)" }}>
                  <dt style={{ color: "var(--line-strong)" }}>{row.label}</dt>
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

      <Reveal as="section" className="px-7 py-8">
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
        <LikeCommentWidget productId={product.id} initialRatings={ratings} />
      </Reveal>

      {relatedProducts.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
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

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Frequently Bought Together
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/products/adhesive" className="rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: "var(--line)" }}>
            Adhesives
          </Link>
          <Link href="/products/laminates" className="rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: "var(--line)" }}>
            Laminates &amp; Edge Banding
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
