import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BrandRow } from "@/lib/supabase/types";

export interface BrandWithCount extends BrandRow {
  productCount: number;
}

export async function getAllBrandsWithCounts(): Promise<BrandWithCount[]> {
  const supabase = createServerSupabaseClient();
  const { data: brands, error: bErr } = await supabase.from("brands").select("*").order("name");
  if (bErr) throw bErr;

  // Per-brand exact head counts, not one unbounded `.select("brand")` across
  // the whole products table — that silently truncates at PostgREST's
  // default 1000-row cap (2,004 products total here), undercounting any
  // brand whose rows don't make the cut. Same bug class as getCategoryCounts.
  const counted = await Promise.all(
    brands.map(async (b): Promise<BrandWithCount> => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("brand", b.name);
      if (error) throw error;
      return { ...b, productCount: count || 0 };
    })
  );

  return counted.filter((b) => b.productCount > 0);
}

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("brands").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBrandByName(name: string): Promise<BrandRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("brands").select("*").eq("name", name).maybeSingle();
  if (error) throw error;
  return data;
}

export interface BrandMenuEntry {
  name: string;
  slug: string;
  productCount: number;
  sampleProducts: { name: string; slug: string }[];
}

// Small sample of product names per brand for the products nav mega-menu —
// one limited query per brand (cheap) rather than pulling every product row.
export async function getBrandsMenuData(sampleSize = 3): Promise<BrandMenuEntry[]> {
  const supabase = createServerSupabaseClient();
  const { data: brands, error } = await supabase.from("brands").select("name, slug").order("name");
  if (error) throw error;

  const entries = await Promise.all(
    brands.map(async (b): Promise<BrandMenuEntry> => {
      const { data: products, error: pErr, count } = await supabase
        .from("products")
        .select("name, slug", { count: "exact" })
        .eq("brand", b.name)
        .order("name")
        .limit(sampleSize);
      if (pErr) throw pErr;
      return { name: b.name, slug: b.slug, productCount: count || 0, sampleProducts: products };
    })
  );

  return entries.filter((e) => e.productCount > 0);
}

export async function getBrandCategories(brandName: string): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("category").eq("brand", brandName);
  if (error) throw error;
  return [...new Set(data.map((r) => r.category))].sort();
}
