import type { ProductRow } from "@/lib/supabase/types";
import { ProductCard } from "@/components/ProductCard";

// Plain server component — the caller already fetched only the current
// page's products, so this just renders them. Real pagination/filtering
// lives in CategoryPagination/CategoryFilterBar as crawlable links.
export function CategoryProductGrid({ products }: { products: ProductRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
