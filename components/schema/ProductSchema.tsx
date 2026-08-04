import { SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";

const MAX_REVIEWS_IN_SCHEMA = 20;

function buildOffers(product: ProductRow) {
  const table = product.price_table;
  if (!table || typeof table !== "object") return undefined;
  const t = table as { starting_price?: unknown; min_price?: unknown; max_price?: unknown };
  const url = `${SITE_URL}/products/${product.slug}`;
  const base = {
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url,
  };
  if (typeof t.min_price === "number" && typeof t.max_price === "number") {
    return {
      "@type": "AggregateOffer",
      ...base,
      lowPrice: t.min_price,
      highPrice: t.max_price,
    };
  }
  if (typeof t.starting_price === "number") {
    return {
      "@type": "Offer",
      ...base,
      price: t.starting_price,
    };
  }
  // No price on file for this SKU (RFQ/quote-based, not fixed pricing) — still
  // declare availability so the page has a real `offers` entry rather than
  // inventing a price. Google requires at least one of offers/review/
  // aggregateRating for the Product rich result; this satisfies that without
  // fabricating pricing data.
  return {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
    url,
  };
}

export function ProductSchema({ product, ratings }: { product: ProductRow; ratings?: ProductRatingSummary }) {
  const hasRatings = !!ratings && ratings.count > 0;

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    sku: String(product.id),
    category: product.category,
    description: product.description || undefined,
    image: product.main_img_url || undefined,
    brand: { "@type": "Brand", name: product.brand },
    url: `${SITE_URL}/products/${product.slug}`,
    offers: buildOffers(product),
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
