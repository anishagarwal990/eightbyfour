import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";
import { CATEGORIES } from "@/lib/categories";

export async function getProductsByCategory(dbCategory: string): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", dbCategory)
    .order("brand")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("slug");
  if (error) throw error;
  return data.map((r) => r.slug);
}

export async function getRelatedProducts(product: ProductRow, limit = 4): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .neq("id", product.id)
    .order("brand")
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductsByBrand(brandName: string): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand", brandName)
    .order("category")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const supabase = createServerSupabaseClient();
  // Per-category head counts, not one unbounded `.select("category")` - that
  // silently truncates at PostgREST's default 1000-row cap once the table
  // passes that size, undercounting (or zeroing) every category whose rows
  // don't make the cut.
  const dbCategories = CATEGORIES.map((c) => c.dbCategory);
  const results = await Promise.all(
    dbCategories.map(async (cat) => {
      const { count, error } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("category", cat);
      if (error) throw error;
      return [cat, count || 0] as const;
    })
  );
  return Object.fromEntries(results);
}

export interface CategoryBrand {
  name: string;
  slug: string | null;
}

export async function getBrandsForCategory(dbCategory: string): Promise<CategoryBrand[]> {
  const supabase = createServerSupabaseClient();
  const [{ data: products, error: pErr }, { data: brandRows, error: bErr }] = await Promise.all([
    supabase.from("products").select("brand").eq("category", dbCategory),
    supabase.from("brands").select("name, slug"),
  ]);
  if (pErr) throw pErr;
  if (bErr) throw bErr;
  const slugByName = new Map(brandRows.map((b) => [b.name, b.slug]));
  const names = [...new Set(products.map((r) => r.brand))].sort();
  return names.map((name) => ({ name, slug: slugByName.get(name) ?? null }));
}

