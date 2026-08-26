import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";
import { hasThickness } from "@/lib/thickness";
import type { PriceSelector } from "@/lib/pricePages";

// PostgREST caps a single select at 1000 rows — same paging contract as
// lib/data/products.ts. A brand-scoped laminate selector still runs past it
// (Greenlam alone is 737 and Century Laminates 705, but a two-brand page
// clears 1000), so page rather than assuming one round-trip is enough.
const PAGE = 1000;

/**
 * Products backing one Hyderabad price page.
 *
 * Category/brand/collection filters are pushed down to PostgREST because
 * they map to indexed equality columns. Grade, thickness and name filters
 * run in memory: `thicknesses` is a text[] whose entries are author-entered
 * free text ("0.72 - 0.82 mm"), so it needs the numeric parsing in
 * lib/thickness.ts rather than an `.contains()` on the raw strings.
 */
export async function getPricePageProducts(selector: PriceSelector): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  const rows: ProductRow[] = [];

  for (let from = 0; ; from += PAGE) {
    let query = supabase.from("products").select("*").in("category", selector.dbCategories);
    if (selector.brands?.length) query = query.in("brand", selector.brands);
    if (selector.collections?.length) query = query.in("collection", selector.collections);
    if (selector.slugs?.length) query = query.in("slug", selector.slugs);
    const { data, error } = await query.order("brand").order("name").range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  const gradeSet = selector.grades?.length ? new Set(selector.grades.map((g) => g.toUpperCase())) : null;
  const namePattern = selector.namePattern ? new RegExp(selector.namePattern, "i") : null;
  const certPattern = selector.certificationPattern ? new RegExp(selector.certificationPattern, "i") : null;

  return rows.filter((product) => {
    if (selector.excludeSlugs?.includes(product.slug)) return false;
    if (gradeSet && !(product.grade && gradeSet.has(product.grade.toUpperCase()))) return false;
    if (namePattern && !namePattern.test(`${product.brand} ${product.name} ${product.collection ?? ""}`)) return false;
    if (certPattern && !(product.certifications ?? []).some((c) => certPattern.test(c))) return false;
    if (selector.thicknessMm !== undefined && !hasThickness(product.thicknesses, selector.thicknessMm, selector.thicknessTolerance ?? 0)) {
      return false;
    }
    return true;
  });
}
