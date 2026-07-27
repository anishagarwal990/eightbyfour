import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";

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
  const { data, error } = await supabase.from("products").select("category");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data) counts[row.category] = (counts[row.category] || 0) + 1;
  return counts;
}

export async function getBrandsForCategory(dbCategory: string): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("brand").eq("category", dbCategory);
  if (error) throw error;
  return [...new Set(data.map((r) => r.brand))].sort();
}

