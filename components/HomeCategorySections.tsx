import { CategoryCaseStudy } from "@/components/CategoryCaseStudy";
import type { CategoryConfig } from "@/lib/categories";
import type { ProductRow } from "@/lib/supabase/types";

interface CategorySection {
  category: CategoryConfig;
  products: ProductRow[];
  total: number;
}

// One pinned case-study block per category: title card first, then its
// products revealed one at a time as the user keeps scrolling, before
// releasing into the next category's block.
export function HomeCategorySections({ sections }: { sections: CategorySection[] }) {
  return (
    <>
      {sections.map(({ category, products, total }) => (
        <CategoryCaseStudy
          key={category.slug}
          slug={category.slug}
          name={category.name}
          tagline={category.heroTagline}
          total={total}
          products={products}
        />
      ))}
    </>
  );
}
