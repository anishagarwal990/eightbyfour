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

export interface HeroPreviewImage {
  src: string;
  alt: string;
}

/** Real product photos, mixed across categories (not grouped), for the hero's flanking columns. */
export async function getHeroPreviewImages(): Promise<HeroPreviewImage[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("category,brand,name,main_img_url")
    .not("main_img_url", "is", null)
    .order("category")
    .order("id");
  if (error) throw error;

  const perCategory = new Map<string, HeroPreviewImage[]>();
  for (const row of data as { category: string; brand: string; name: string; main_img_url: string }[]) {
    const list = perCategory.get(row.category) ?? [];
    if (list.length < 6) {
      list.push({ src: row.main_img_url, alt: `${row.brand} ${row.name}` });
      perCategory.set(row.category, list);
    }
  }

  // Round-robin across categories so the resulting list alternates
  // (veneer, adhesive, plywood, veneer, ...) instead of running in
  // same-category blocks.
  const buckets = [...perCategory.values()];
  const mixed: HeroPreviewImage[] = [];
  let round = 0;
  while (mixed.length < buckets.reduce((n, b) => n + b.length, 0)) {
    for (const bucket of buckets) {
      if (bucket[round]) mixed.push(bucket[round]);
    }
    round++;
  }
  return mixed;
}
