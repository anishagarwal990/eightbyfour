import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";
import { CATEGORIES } from "@/lib/categories";

// Products/page for the paginated category grid — keeps each category page's
// server-rendered payload to a few dozen products instead of the full
// category (1,349 rows for Laminates) that used to get embedded in the HTML.
export const CATEGORY_PAGE_SIZE = 60;

export interface PaginatedProducts {
  products: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getProductsByCategoryPage(
  dbCategory: string,
  opts: { page: number; pageSize?: number; collection?: string | null }
): Promise<PaginatedProducts> {
  const supabase = createServerSupabaseClient();
  const pageSize = opts.pageSize ?? CATEGORY_PAGE_SIZE;
  const page = Math.max(1, opts.page);
  const { collection } = opts;

  // Count first — PostgREST throws (rather than returning empty) when
  // .range() starts past the last row, so an out-of-range page must be
  // caught before issuing the ranged query, not after.
  let countQuery = supabase.from("products").select("*", { count: "exact", head: true }).eq("category", dbCategory);
  countQuery = collection === "other" ? countQuery.is("collection", null) : collection ? countQuery.eq("collection", collection) : countQuery;
  const { count, error: countError } = await countQuery;
  if (countError) throw countError;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0 || page > totalPages) {
    return { products: [], total, page, pageSize, totalPages };
  }

  let dataQuery = supabase.from("products").select("*").eq("category", dbCategory);
  dataQuery = collection === "other" ? dataQuery.is("collection", null) : collection ? dataQuery.eq("collection", collection) : dataQuery;
  const from = (page - 1) * pageSize;
  const { data, error } = await dataQuery.order("brand").order("name").range(from, from + pageSize - 1);
  if (error) throw error;
  return { products: data, total, page, pageSize, totalPages };
}

export interface CategoryFilterCounts {
  total: number;
  collections: { name: string; count: number }[];
  otherCount: number;
}

export async function getCategoryFilterCounts(dbCategory: string): Promise<CategoryFilterCounts> {
  const supabase = createServerSupabaseClient();
  // Only the `collection` column, not full rows — cheap enough to page
  // through in full even for the largest categories, unlike getProductsByCategory.
  const PAGE = 1000;
  const values: (string | null)[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("collection")
      .eq("category", dbCategory)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    values.push(...data.map((r) => r.collection));
    if (data.length < PAGE) break;
  }

  const counts = new Map<string, number>();
  let otherCount = 0;
  for (const c of values) {
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    else otherCount++;
  }
  return {
    total: values.length,
    collections: [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count })),
    otherCount,
  };
}

export async function getProductsByCategory(dbCategory: string): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  // PostgREST caps a single select at 1000 rows - Laminates alone runs past
  // that, so page through with .range() or rows past the cap (newest brands,
  // highest ids) silently vanish from the category grid.
  const PAGE = 1000;
  const all: ProductRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", dbCategory)
      .order("brand")
      .order("name")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  // PostgREST caps a single select at 1000 rows — page through with .range()
  // the same way getProductsByCategory() does, or products past the cap
  // (alphabetically-later brands, e.g. most of Laminates) silently vanish
  // from every consumer of this function, including the sitemap.
  const PAGE = 1000;
  const slugs: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("products").select("slug").range(from, from + PAGE - 1);
    if (error) throw error;
    slugs.push(...data.map((r) => r.slug));
    if (data.length < PAGE) break;
  }
  return slugs;
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

export async function getProductsByBrandPage(
  brandName: string,
  opts: { page: number; pageSize?: number }
): Promise<PaginatedProducts> {
  const supabase = createServerSupabaseClient();
  const pageSize = opts.pageSize ?? CATEGORY_PAGE_SIZE;
  const page = Math.max(1, opts.page);

  // Count first — see getProductsByCategoryPage for why: PostgREST throws on
  // an out-of-range .range() rather than returning empty.
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand", brandName);
  if (countError) throw countError;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0 || page > totalPages) {
    return { products: [], total, page, pageSize, totalPages };
  }

  const from = (page - 1) * pageSize;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand", brandName)
    .order("category")
    .order("name")
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return { products: data, total, page, pageSize, totalPages };
}

export async function searchProducts(query: string): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  const term = `%${query}%`;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.${term},brand.ilike.${term},collection.ilike.${term}`)
    .order("brand")
    .order("name")
    .limit(500);
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

