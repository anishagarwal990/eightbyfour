import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import type { ProductRow } from "@/lib/supabase/types";

export const ADMIN_PAGE_SIZE = 50;

export interface AdminProductQuery {
  search?: string;
  category?: string;
  brand?: string;
  /** "unpriced" narrows to rows the price pages currently render as "Request current price". */
  filter?: "all" | "unpriced" | "no-rates" | "no-description";
  page?: number;
}

export interface AdminProductPage {
  products: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
}

/** Escape PostgREST's `or=` filter syntax — a comma or paren in a search term would otherwise break out of the expression. */
function escapeFilterValue(value: string): string {
  return value.replace(/[,()\\]/g, " ").trim();
}

export async function listAdminProducts(query: AdminProductQuery): Promise<AdminProductPage> {
  const supabase = await createAdminSupabaseClient();
  const page = Math.max(1, query.page ?? 1);

  const build = (selection: string, head: boolean) => {
    let q = supabase.from("products").select(selection, head ? { count: "exact", head: true } : undefined);
    if (query.category) q = q.eq("category", query.category);
    if (query.brand) q = q.eq("brand", query.brand);
    const term = query.search ? escapeFilterValue(query.search) : "";
    if (term) q = q.or(`name.ilike.%${term}%,brand.ilike.%${term}%,collection.ilike.%${term}%,sd_code.ilike.%${term}%,slug.ilike.%${term}%`);
    if (query.filter === "unpriced") q = q.is("price_table", null);
    if (query.filter === "no-rates") q = q.is("variants", null);
    if (query.filter === "no-description") q = q.is("description", null);
    return q;
  };

  const { count, error: countError } = await build("*", true);
  if (countError) throw countError;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  if (total === 0 || page > totalPages) return { products: [], total, page, totalPages };

  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const { data, error } = await build("*", false)
    .order("brand")
    .order("name")
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw error;
  return { products: data as unknown as ProductRow[], total, page, totalPages };
}

export async function getAdminProduct(slug: string): Promise<ProductRow | null> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as ProductRow | null;
}

/** Distinct categories and brands, for the list filters. */
export async function getAdminFacets(): Promise<{ categories: string[]; brands: string[] }> {
  const supabase = await createAdminSupabaseClient();
  const PAGE = 1000;
  const categories = new Set<string>();
  const brands = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("products").select("category, brand").range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data) {
      categories.add(row.category);
      brands.add(row.brand);
    }
    if (data.length < PAGE) break;
  }
  return { categories: [...categories].sort(), brands: [...brands].sort() };
}
