import { SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";
import { productDisplayName } from "@/lib/productDisplay";
import { resolvePrice } from "@/lib/pricing";

const MAX_REVIEWS_IN_SCHEMA = 20;

// Delegates to resolvePrice() (lib/pricing.ts) so schema pricing can never
// drift from what's shown on the page — that function already handles the
// three price_table shapes on file: single {starting_price}, range
// {min_price, max_price}, and per-pack arrays (e.g. Fevicol).
function buildOffers(product: ProductRow) {
  const price = resolvePrice(product);
  const url = `${SITE_URL}/products/${product.slug}`;
  const base = {
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url,
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
      lowPrice: price.min,
      highPrice: price.max,
      offerCount,
    };
  }
  if (price?.kind === "single") {
    return {
      "@type": "Offer",
      ...base,
      price: price.amount,
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
  if (product.grade) props.push({ "@type": "PropertyValue", name: "Grade", value: product.grade });
  if (product.core) props.push({ "@type": "PropertyValue", name: "Core", value: product.core });
  if (product.certifications?.length) props.push({ "@type": "PropertyValue", name: "Certifications", value: product.certifications.join(", ") });
  if (product.applications?.length) props.push({ "@type": "PropertyValue", name: "Applications", value: product.applications.join(", ") });
  return props.length ? props : undefined;
}

export function ProductSchema({ product, ratings }: { product: ProductRow; ratings?: ProductRatingSummary }) {
  const hasRatings = !!ratings && ratings.count > 0;
  const offers = buildOffers(product);
  const additionalProperty = buildAdditionalProperties(product);

  // Google requires at least one of offers/review/aggregateRating on a
  // Product. RFQ-priced SKUs (no fixed price_table) have none of the three —
  // emitting Product markup anyway is what trips the GSC "Either offers,
  // review, or aggregateRating should be specified" error. Skipping the
  // block entirely for these pages is correct: they're not eligible for
  // Product rich results until priced or reviewed, and unclaimed pages
  // don't get flagged as errors the way invalid ones do.
  if (!offers && !hasRatings) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productDisplayName(product),
    sku: String(product.id),
    category: product.category,
    description: product.description || undefined,
    image: product.main_img_url || product.edge_img_url || product.app_img_url || undefined,
    brand: { "@type": "Brand", name: product.brand },
    url: `${SITE_URL}/products/${product.slug}`,
    additionalProperty,
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
