"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSavedIds } from "@/lib/saved";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import type { ProductRow } from "@/lib/supabase/types";

export function SavedProductsView() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);

  useEffect(() => {
    const ids = getSavedIds();
    const query =
      ids.length > 0
        ? createBrowserSupabaseClient().from("products").select("*").in("id", ids)
        : Promise.resolve({ data: [] as ProductRow[] });
    query.then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <main>
      <section className="px-7 py-8">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          Your Shortlist
        </p>
        <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
          Saved Products
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
          Products you&rsquo;ve saved on this device.
        </p>
      </section>

      <section className="px-7 pb-16">
        {products === null ? (
          <p className="text-sm" style={{ color: "var(--line-strong)" }}>
            Loading…
          </p>
        ) : products.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--line-strong)" }}>
            No saved products yet.{" "}
            <Link href="/products" className="underline">
              Browse products
            </Link>{" "}
            and tap Save on anything you want to come back to.
          </p>
        ) : (
          <Reveal stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
        )}
      </section>
    </main>
  );
}
