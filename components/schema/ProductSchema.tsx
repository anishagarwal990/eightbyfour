import { SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";

export function ProductSchema({ product }: { product: ProductRow }) {
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
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
