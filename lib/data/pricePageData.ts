import { getPricePageProducts } from "@/lib/data/priceProducts";
import { getCategoryByDbCategory } from "@/lib/categories";
import { categoryPageUrl } from "@/lib/categoryPagination";
import { toPriceRow, toRangeGroups, rowFromPrice, type PriceRangeGroup, type PriceRow } from "@/lib/priceRows";
import type { PricePageConfig } from "@/lib/pricePages";

export interface PricePageData {
  rows: PriceRow[];
  groups: PriceRangeGroup[];
}

/**
 * Everything a price page renders, resolved from the live catalogue.
 *
 * Rows are always built (the headline span, the picks and the ItemList
 * schema all read from them) even on "ranges" pages, where the table itself
 * renders the grouped view instead.
 */
export async function getPricePageData(config: PricePageConfig): Promise<PricePageData> {
  const products = await getPricePageProducts(config.selector);
  const focus = config.focusThicknessMm ?? null;

  const rows = products
    .map((product) => toPriceRow(product, focus))
    // Cheapest first, with unpriced rows last rather than sorted as zero —
    // a "request price" row at the top of a price table reads as free.
    .sort((a, b) => {
      const left = rowFromPrice(a);
      const right = rowFromPrice(b);
      if (left === null && right === null) return a.brand.localeCompare(b.brand);
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    });

  const groups = toRangeGroups(products, (product) => {
    const category = getCategoryByDbCategory(product.category);
    // Link into the real filtered category URL the site already serves and
    // already lists in the sitemap — never a URL invented for this page.
    return category ? categoryPageUrl(category.slug, 1, product.collection) : `/products/${product.slug}`;
  });

  return { rows, groups };
}
