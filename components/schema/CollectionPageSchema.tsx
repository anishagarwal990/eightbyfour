import { SITE_URL } from "@/lib/seo";

// Distinguishes a category/listing page from an individual Product page at
// the schema level — both currently render on the same flat /products/<slug>
// URL pattern with otherwise-identical HomeAndConstructionBusiness +
// BreadcrumbList + FAQPage blocks, giving search engines no structural
// signal for which is which.
export function CollectionPageSchema({
  name,
  path,
  totalItems,
  items,
  pageOffset,
}: {
  name: string;
  path: string;
  totalItems: number;
  items: { name: string; slug: string }[];
  /** 0-based index of the first `items` entry within the full listing (for paginated categories). */
  pageOffset: number;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${SITE_URL}${path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalItems,
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: pageOffset + i + 1,
        name: item.name,
        url: `${SITE_URL}/products/${item.slug}`,
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
