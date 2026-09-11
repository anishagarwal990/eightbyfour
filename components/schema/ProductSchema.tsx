import { SITE_NAME, SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";
import { applyDiscount, resolvePrice } from "@/lib/pricing";
import { buildProductHeading, isNamedCollection, productFinishLabels, productImages } from "@/lib/productSeo";

const MAX_REVIEWS_IN_SCHEMA = 20;

/** Structured data wants absolute URLs; catalogue images are a mix of CDN URLs and site-relative paths. */
function absoluteUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

// Delegates to resolvePrice() (lib/pricing.ts) so schema pricing can never
// drift from what's shown on the page — that function already handles the
// three price_table shapes on file: single {starting_price}, range
// {min_price, max_price}, and per-pack arrays (e.g. Fevicol).
function buildOffers(product: ProductRow) {
  const price = resolvePrice(product);
  const url = `${SITE_URL}/products/${product.slug}`;
  // No `availability` — EightxFour is a procurement platform and doesn't
  // hold verified real-time inventory per SKU, so `InStock` would be an
  // invented claim. `availability` is optional on schema.org's Offer; an
  // Offer with a real price and no availability is still valid, it just
  // isn't eligible for the subset of rich results that key off stock status
  // — the correct outcome until real inventory data exists.
  const base = {
    priceCurrency: "INR",
    url,
    seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
  if (price?.kind === "range") {
    const table = product.price_table;
    // Google's Merchant validator flags AggregateOffer as invalid when
    // offerCount is absent, even though schema.org marks it optional. Use
    // the real pack count when the price_table is an array (e.g. Fevicol);
    // otherwise this is a single min/max range listing, so 1.
    const offerCount = Array.isArray(table) ? table.length : 1;
    return {
      "@type": "AggregateOffer",
      ...base,
      // Net of any fixed discount — Google compares the marked-up price
      // against what the page actually shows, and a list price here against a
      // discounted price on the page is a mismatch that costs the rich result.
      lowPrice: applyDiscount(price.min, price.discountPct),
      highPrice: applyDiscount(price.max, price.discountPct),
      offerCount,
    };
  }
  if (price?.kind === "single") {
    return {
      "@type": "Offer",
      ...base,
      price: applyDiscount(price.amount, price.discountPct),
      itemCondition: "https://schema.org/NewCondition",
    };
  }
  // No price on file for this SKU (RFQ/quote-based, not fixed pricing).
  // Google's structured-data validator requires `price` on any Offer that's
  // present — a price-less Offer fails validation, it doesn't just skip rich
  // results. So for unpriced SKUs we omit `offers` entirely rather than
  // emit an Offer that's guaranteed to error. These pages simply aren't
  // Product-rich-result eligible until they have a real price or reviews —
  // which is the correct outcome for an RFQ product with no fixed price,
  // not a bug to work around with fabricated data.
  return undefined;
}

// Real spec fields only — never invent values the product row doesn't have.
function buildAdditionalProperties(product: ProductRow) {
  const props: { "@type": "PropertyValue"; name: string; value: string }[] = [];
  const add = (name: string, value: string | null | undefined) => {
    if (value?.trim()) props.push({ "@type": "PropertyValue", name, value: value.trim() });
  };
  const finishes = productFinishLabels(product);
  add(finishes.length > 1 ? "Available finishes" : "Finish", finishes.join(", "));
  add("Thickness", product.thicknesses?.join(", "));
  add("Sheet size", product.size);
  if (isNamedCollection(product)) add("Range", product.collection);
  add("Grade", product.grade);
  add("Core", product.core);
  add("Certifications", product.certifications?.join(", "));
  add("Applications", product.applications?.join(", "));
  return props.length ? props : undefined;
}

export function ProductSchema({ product, ratings }: { product: ProductRow; ratings?: ProductRatingSummary }) {
  const hasRatings = !!ratings && ratings.count > 0;
  const offers = buildOffers(product);

  // Google requires at least one of offers/review/aggregateRating on a
  // Product. RFQ-priced SKUs (no fixed price_table) have none of the three —
  // emitting Product markup anyway is what trips the GSC "Either offers,
  // review, or aggregateRating should be specified" error. Skipping the
  // block entirely for these pages is correct: they're not eligible for
  // Product rich results until priced or reviewed, and unclaimed pages
  // don't get flagged as errors the way invalid ones do.
  if (!offers && !hasRatings) return null;

  // Real product photos only — the brand-logo stand-in some ranges show
  // until their swatches are imported is not a picture of this product.
  const images = productImages(product)
    .filter((img) => !img.isPlaceholder)
    .map((img) => absoluteUrl(img.src));

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    // Same string as the H1 — "Merino 22153 Saga Green Laminate".
    name: buildProductHeading(product),
    // Real shade/decor code as the SKU/MPN when the row has one — that's the
    // identifier buyers and the manufacturer actually use ("Merino 22153"),
    // and what the decor-code searches this page targets are looking for. The
    // internal row id stays as the fallback so every Product still has a sku.
    sku: product.sd_code || product.eb_code || String(product.id),
    mpn: product.sd_code || undefined,
    category: product.category,
    description: product.description || undefined,
    image: images.length > 0 ? images : undefined,
    brand: { "@type": "Brand", name: product.brand },
    url: `${SITE_URL}/products/${product.slug}`,
    additionalProperty: buildAdditionalProperties(product),
    offers,
    aggregateRating: hasRatings
      ? {
          "@type": "AggregateRating",
          ratingValue: Math.round(ratings.average * 10) / 10,
          reviewCount: ratings.count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    review: hasRatings
      ? ratings.reviews.slice(0, MAX_REVIEWS_IN_SCHEMA).map((r) => ({
          "@type": "Review",
          reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
          author: { "@type": "Person", name: r.name },
          reviewBody: r.comment,
          datePublished: r.created_at,
        }))
      : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
