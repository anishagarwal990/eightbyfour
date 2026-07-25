import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BrandRow } from "@/lib/supabase/types";

export interface BrandWithCount extends BrandRow {
  productCount: number;
}

export async function getAllBrandsWithCounts(): Promise<BrandWithCount[]> {
  const supabase = createServerSupabaseClient();
  const [{ data: brands, error: bErr }, { data: products, error: pErr }] = await Promise.all([
    supabase.from("brands").select("*").order("name"),
    supabase.from("products").select("brand"),
  ]);
  if (bErr) throw bErr;
  if (pErr) throw pErr;

  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);

  return brands
    .map((b) => ({ ...b, productCount: counts.get(b.name) || 0 }))
    .filter((b) => b.productCount > 0);
}

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("brands").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBrandCategories(brandName: string): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("category").eq("brand", brandName);
  if (error) throw error;
  return [...new Set(data.map((r) => r.category))].sort();
}
