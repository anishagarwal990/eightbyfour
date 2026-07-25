"use client";

import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/Button";

export function CategoryProductGrid({ products }: { products: ProductRow[] }) {
  const collections = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.collection) set.add(p.collection);
    return [...set].sort();
  }, [products]);

  const hasUncategorized = products.some((p) => !p.collection);
  const [active, setActive] = useState<string | null>(null);

  const visible =
    active === null ? products : active === "__other__" ? products.filter((p) => !p.collection) : products.filter((p) => p.collection === active);

  if (collections.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant="chip" size="sm" active={active === null} onClick={() => setActive(null)}>
          All ({products.length})
        </Button>
        {collections.map((c) => {
          const count = products.filter((p) => p.collection === c).length;
          return (
            <Button key={c} type="button" variant="chip" size="sm" active={active === c} onClick={() => setActive(c)}>
              {c} ({count})
            </Button>
          );
        })}
        {hasUncategorized ? (
          <Button type="button" variant="chip" size="sm" active={active === "__other__"} onClick={() => setActive("__other__")}>
            Other ({products.filter((p) => !p.collection).length})
          </Button>
        ) : null}
      </div>
      <div key={active ?? "all"} className="filter-fade grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
