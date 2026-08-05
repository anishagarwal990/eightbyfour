import type { ProductRow } from "@/lib/supabase/types";

// Some product names already include the brand (e.g. "Wigwam Excel MR"),
// while most are just the shade/grade (e.g. "MR"). Avoid "Wigwam Excel
// Wigwam Excel MR" in titles/FAQs by only prefixing the brand when the name
// doesn't already start with it.
export function productDisplayName(product: Pick<ProductRow, "brand" | "name">): string {
  return product.name.toLowerCase().startsWith(product.brand.toLowerCase()) ? product.name : `${product.brand} ${product.name}`;
}
