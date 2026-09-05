import { CATEGORIES } from "@/lib/categories";
import { PRICE_PAGES } from "@/lib/pricePages";

// Real page-gap analysis computed from the site's own config — no third-party
// keyword tool wired in, so this answers a narrower but 100%-real question:
// "which category has zero dedicated price page yet?" rather than fabricating
// a volume/rank number for a keyword nobody has actually looked up.

export interface CategoryPageGap {
  categorySlug: string;
  categoryName: string;
  dbCategory: string;
  pricePageCount: number;
  hasPricePage: boolean;
}

export function computeCategoryPageGaps(): CategoryPageGap[] {
  const countByDbCategory = new Map<string, number>();
  for (const page of PRICE_PAGES) {
    for (const dbCategory of page.selector.dbCategories) {
      countByDbCategory.set(dbCategory, (countByDbCategory.get(dbCategory) ?? 0) + 1);
    }
  }
  return CATEGORIES.map((c) => {
    const pricePageCount = countByDbCategory.get(c.dbCategory) ?? 0;
    return {
      categorySlug: c.slug,
      categoryName: c.name,
      dbCategory: c.dbCategory,
      pricePageCount,
      hasPricePage: pricePageCount > 0,
    };
  }).sort((a, b) => a.pricePageCount - b.pricePageCount);
}
