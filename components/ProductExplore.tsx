import Link from "next/link";
import Image from "next/image";
import type { BrandRow, ProductRow } from "@/lib/supabase/types";
import type { ProductRelations } from "@/lib/productRelations";
import type { CategoryConfig } from "@/lib/categories";
import { collectionLandingPath, type CollectionLanding } from "@/lib/collectionLandings";
import { productIdentity } from "@/lib/productSeo";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";

/**
 * The product page's internal links, built per page by lib/productRelations.ts:
 * similar shades from the same brand, more designs in the same finish, the
 * same shade family from other brands, and the brand / category / range hubs
 * this SKU belongs to. All plain server-rendered <Link>s — crawlable, and the
 * reason a SKU deep in the catalogue gets links from its neighbours instead
 * of only from page 40 of a category.
 */
export function ProductExplore({
  product,
  identity,
  relations,
  brand,
  categoryConfig,
  collectionLanding,
}: {
  product: ProductRow;
  /** "Merino 22153 Saga Green" — pre-fills the quote list from the comparison CTA. */
  identity: string;
  relations: ProductRelations;
  brand: BrandRow | null | undefined;
  categoryConfig: CategoryConfig | undefined;
  collectionLanding: CollectionLanding | undefined;
}) {
  const brandName = brand?.name ?? product.brand;
  const coded = Boolean(product.sd_code);
  const { similar, sameFinish, alternatives } = relations;
  const eventContext = { product_slug: product.slug, brand: product.brand, category: product.category, product_code: product.sd_code };

  const browse = [
    ...(brand ? [{ href: `/brands/${brand.slug}`, label: categoryConfig ? `${brandName} ${categoryConfig.name}` : `All ${brandName} products` }] : []),
    ...(collectionLanding ? [{ href: collectionLandingPath(collectionLanding), label: `${collectionLanding.name} range` }] : []),
    ...(categoryConfig ? [{ href: `/products/${categoryConfig.slug}`, label: `${categoryConfig.name} — all brands` }] : []),
  ];

  return (
    <>
      {similar.length > 0 ? (
        <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              {coded ? `Similar ${brandName} shades` : `More from ${brandName}`}
            </h2>
            {brand ? (
              <Link href={`/brands/${brand.slug}`} className="shrink-0 text-sm underline">
                View all {brandName}
              </Link>
            ) : null}
          </div>
          {brand?.logo_url || brand?.overview ? (
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
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
          {collectionLanding ? (
            <p className="mt-4 text-sm">
              <Link href={collectionLandingPath(collectionLanding)} className="underline" style={{ color: "var(--burgundy)" }}>
                See the full {collectionLanding.name} range →
              </Link>
            </p>
          ) : null}
        </Reveal>
      ) : null}

      {sameFinish ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)" }}>
            More {brandName} designs in {sameFinish.label}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sameFinish.products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.slug}`}
                  className="inline-block rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 hover:text-[var(--burgundy)]"
                  style={{ background: "var(--paper-dim)" }}
                >
                  {productIdentity(p)}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      {alternatives.products.length > 0 ? (
        <Reveal as="section" className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            {alternatives.family ? `Similar ${alternatives.family.label} shades from other brands` : "Compare other brands"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            Comparing options for a project? Send one list — we quote {brandName} and these alternatives side by side, at project rates.
          </p>
          <Reveal stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {alternatives.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
          <div className="mt-5">
            <RequestQuoteButton
              label="Compare Project Pricing"
              variant="secondary"
              ctaLocation="product_alternatives"
              prefill={identity}
              context={eventContext}
            />
          </div>
        </Reveal>
      ) : null}

      {browse.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.15rem)" }}>
            Keep exploring
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {browse.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 hover:text-[var(--burgundy)]"
                  style={{ background: "var(--paper-dim)" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}
    </>
  );
}
