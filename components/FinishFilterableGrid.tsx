"use client";

import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { trackEvent } from "@/lib/analytics";

const PAGE_SIZE = 60;

function finishLabel(product: ProductRow): string {
  const row = product.spec_table?.find((r) => r.label === "Finish Name");
  return row ? row.value : product.finish || "Other";
}

function countOptions(products: ProductRow[]): { value: string; label: string; count: number }[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const p of products) {
    if (!p.finish) continue;
    const existing = counts.get(p.finish);
    if (existing) existing.count++;
    else counts.set(p.finish, { label: finishLabel(p), count: 1 });
  }
  return [...counts.entries()]
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => b.count - a.count);
}

// Client-side finish filter + "show more" pagination over the brand's full
// product list — used for catalogues (like Virgo) where every SKU is a
// Code+Finish combination and finish is the primary way to narrow the grid,
// not a minor attribute. Filtering client-side (rather than a server round
// trip per chip click) keeps this snappy for a few hundred SKUs; see
// PlywoodFilterableGrid for the same pattern applied to a different facet set.
export function FinishFilterableGrid({ products, brandName }: { products: ProductRow[]; brandName: string }) {
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const options = useMemo(() => countOptions(products), [products]);

  const filtered = useMemo(
    () => (selectedFinish ? products.filter((p) => p.finish === selectedFinish) : products),
    [products, selectedFinish]
  );

  function selectFinish(value: string | null) {
    setSelectedFinish(value);
    setVisibleCount(PAGE_SIZE);
    if (value) trackEvent("product_filter", { filter_type: "finish", filter_value: value, brand: brandName });
  }

  return (
    <div>
      {options.length > 1 ? (
        <div className="mb-5 rounded-2xl p-4 sm:p-5" style={{ background: "var(--card)" }}>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="tracked-caps text-xs font-medium" style={{ color: "var(--line-strong)" }}>
              Filter by Finish
            </span>
            {selectedFinish ? (
              <button
                type="button"
                onClick={() => selectFinish(null)}
                className="cursor-pointer text-sm underline-offset-2 hover:underline"
                style={{ color: "var(--burgundy)" }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectFinish(null)}
              aria-pressed={selectedFinish === null}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
              style={
                selectedFinish === null
                  ? { background: "color-mix(in srgb, var(--burgundy) 14%, var(--paper))", color: "var(--burgundy)", fontWeight: 600 }
                  : { background: "var(--paper)", color: "var(--ink)" }
              }
            >
              All Finishes ({products.length})
            </button>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => selectFinish(o.value)}
                aria-pressed={selectedFinish === o.value}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                style={
                  selectedFinish === o.value
                    ? { background: "color-mix(in srgb, var(--burgundy) 14%, var(--paper))", color: "var(--burgundy)", fontWeight: 600 }
                    : { background: "var(--paper)", color: "var(--ink)" }
                }
              >
                {o.label} ({o.count})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mb-3 text-sm" style={{ color: "var(--line-strong)" }}>
        {filtered.length} of {products.length} {brandName} products
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.slice(0, visibleCount).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {visibleCount < filtered.length ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border px-5 py-2.5 text-sm font-medium transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
            style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}
          >
            Show More ({filtered.length - visibleCount} left)
          </button>
        </div>
      ) : null}
    </div>
  );
}
