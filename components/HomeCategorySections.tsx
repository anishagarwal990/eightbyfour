import { CategoryScrollSpy } from "@/components/CategoryScrollSpy";
import { CategoryExploreIntro } from "@/components/CategoryExploreIntro";
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
  // Categories with no live products yet (the catalogue-expansion "coming
  // soon" entries) still get a row — CategoryScrollSpy renders those with a
  // placeholder instead of a product photo, rather than being dropped
  // silently from the list.
  const items = sections.map(({ category, products, total }) => ({
    slug: category.slug,
    name: category.name,
    tagline: category.heroTagline,
    total,
    image: products[0]?.main_img_url ?? null,
  }));

  return (
    <>
      <CategoryExploreIntro items={items} />
      <CategoryScrollSpy items={items} />
    </>
  );
}
