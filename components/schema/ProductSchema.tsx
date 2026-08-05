import { SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";
import { productDisplayName } from "@/lib/productDisplay";

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

export function ProductSchema({ product, ratings }: { product: ProductRow; ratings?: ProductRatingSummary }) {
  const hasRatings = !!ratings && ratings.count > 0;

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productDisplayName(product),
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
