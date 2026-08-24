import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BrandRow } from "@/lib/supabase/types";

export interface BrandWithCount extends BrandRow {
  productCount: number;
}

// EightByFour is the site's own brand, not a peer manufacturer — it must
// never appear as a tile in the "Shop by Brand" directory (megamenu,
// /brands index) alongside Greenlam/Century/etc, or generateStaticParams
// would pre-render /brands/eightbyfour as if it were one of the
// manufacturers EightByFour carries. The route itself still works via
// getBrandBySlug for the products that do carry it.
const BRAND_DIRECTORY_EXCLUDED_SLUGS = new Set(["eightbyfour"]);

export async function getAllBrandsWithCounts(): Promise<BrandWithCount[]> {
  const supabase = createServerSupabaseClient();

  // One grouped RPC instead of a per-brand head-count query — the old
  // Promise.all of 19+ parallel count queries was bursting past PostgREST's
  // connection pool on every homepage load, tripping fetchWithRetry's
  // backoff on the overflow and adding tens of seconds to render time.
  const [{ data: brands, error: bErr }, { data: counts, error: cErr }] = await Promise.all([
    supabase.from("brands").select("*").order("name"),
    supabase.rpc("get_brand_product_counts"),
  ]);
  if (bErr) throw bErr;
  if (cErr) throw cErr;

  const countByBrand = new Map((counts as { brand: string; count: number }[]).map((r) => [r.brand, r.count]));
  const counted = brands.map((b): BrandWithCount => ({ ...b, productCount: countByBrand.get(b.name) ?? 0 }));

  return counted.filter((b) => b.productCount > 0 && !BRAND_DIRECTORY_EXCLUDED_SLUGS.has(b.slug));
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
// one grouped RPC instead of a per-brand (count + sample) query pair. This
// runs on every page via the root layout, so the old N-brand Promise.all was
// bursting the connection pool on every single request site-wide, not just
// the homepage.
export async function getBrandsMenuData(sampleSize = 3): Promise<BrandMenuEntry[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_brands_menu_data", { sample_size: sampleSize });
  if (error) throw error;

  const rows = data as { brand_name: string; brand_slug: string; product_count: number; sample_products: { name: string; slug: string }[] }[];
  return rows
    .map((r) => ({ name: r.brand_name, slug: r.brand_slug, productCount: r.product_count, sampleProducts: r.sample_products }))
    .filter((e) => e.productCount > 0 && !BRAND_DIRECTORY_EXCLUDED_SLUGS.has(e.slug));
}

export async function getBrandCategories(brandName: string): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("category").eq("brand", brandName);
  if (error) throw error;
  return [...new Set(data.map((r) => r.category))].sort();
}

// SKU counts for EightByFour's own stock, broken down by category, so the
// /brands directory can show its three category marks (Plywood Shop,
// Laminates, Veneers) with real counts instead of the single excluded
// "EightByFour" row — see BRAND_DIRECTORY_EXCLUDED_SLUGS above.
export async function getEightByFourCategoryCounts(): Promise<Record<string, number>> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("category").eq("brand", "EightByFour");
  if (error) throw error;
  return data.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});
}
