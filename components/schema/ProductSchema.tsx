import { SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";
import type { ProductRatingSummary } from "@/lib/data/reviews";

const MAX_REVIEWS_IN_SCHEMA = 20;

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
    areaServed: { "@type": "City", name: "Hyderabad" },
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
