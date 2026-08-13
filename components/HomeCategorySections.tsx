import { CategoryScrollSpy } from "@/components/CategoryScrollSpy";
import type { CategoryConfig } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";

interface CategorySection {
  category: CategoryConfig;
  products: ProductRow[];
  total: number;
}

// A single scroll-spy list of categories with one pinned photo panel that
// swaps to match whichever name is nearest viewport-center as the list
// scrolls past it.
export function HomeCategorySections({ sections }: { sections: CategorySection[] }) {
  const items = sections
    .filter(({ products }) => products[0]?.main_img_url)
    .map(({ category, products, total }) => ({
      slug: category.slug,
      name: category.name,
      tagline: category.heroTagline,
      total,
      image: products[0].main_img_url as string,
    }));

  return <CategoryScrollSpy items={items} />;
}
