import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";
import { CATEGORIES } from "@/lib/categories";
import {
  buildProductRelations,
  PRODUCT_SUMMARY_COLUMNS,
  shadeFamilyOf,
  type ProductRelations,
  type ProductSummary,
} from "@/lib/productRelations";
import { cachedPool } from "@/lib/data/poolCache";

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

/**
 * Same as getAllProductSlugs() but with created_at, for sitemap.ts's
 * lastModified — there's no updated_at column on `products` yet, so
 * created_at is the best real per-row signal available today. Still a real,
 * distinct-per-product date rather than the same "now" timestamp on every
 * URL, which is what Google explicitly discounts.
 */
export async function getAllProductSlugsWithDates(): Promise<{ slug: string; created_at: string; updated_at: string }[]> {
  const supabase = createServerSupabaseClient();
  const PAGE = 1000;
  const rows: { slug: string; created_at: string; updated_at: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("products").select("slug, created_at, updated_at").range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

/**
 * Every product of one brand in one category, lean columns only — the pool
 * the relation engine picks "other finishes", "similar shades" and "same
 * finish" links from. Shared by every product page of that brand+category,
 * hence cached (see lib/data/poolCache.ts). Ordered by id so the pool, and
 * with it every page's links, is stable between builds.
 */
function getBrandCategoryPool(brand: string, category: string): Promise<ProductSummary[]> {
  return cachedPool(`brand-category:${brand}|${category}`, async () => {
    const supabase = createServerSupabaseClient();
    const PAGE = 1000;
    const rows: ProductSummary[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SUMMARY_COLUMNS)
        .eq("brand", brand)
        .eq("category", category)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      rows.push(...(data as ProductSummary[]));
      if (data.length < PAGE) break;
    }
    return rows;
  });
}

/**
 * Cross-brand candidates for the "other brands" block: for a coded shade,
 * every SKU in the category whose name carries a word of the same shade
 * family ("green", "sage", "olive"…); for a code-less board, the category.
 * The relation engine re-checks family membership on whole words.
 */
function getAlternativesPool(product: ProductRow): Promise<ProductSummary[]> {
  const family = product.sd_code ? shadeFamilyOf(product.name) : null;
  if (product.sd_code && !family) return Promise.resolve([]);
  const key = family ? `family:${product.category}|${family.key}` : `category:${product.category}`;
  return cachedPool(key, async () => {
    const supabase = createServerSupabaseClient();
    let query = supabase.from("products").select(PRODUCT_SUMMARY_COLUMNS).eq("category", product.category);
    if (family) query = query.or(family.terms.map((term) => `name.ilike.%${term}%`).join(","));
    const { data, error } = await query.order("id").limit(family ? 400 : 200);
    if (error) throw error;
    return data as ProductSummary[];
  });
}

/** The product page's internal links — see lib/productRelations.ts for the rules. */
export async function getProductRelations(product: ProductRow): Promise<ProductRelations> {
  const [brandPool, altPool] = await Promise.all([getBrandCategoryPool(product.brand, product.category), getAlternativesPool(product)]);
  return buildProductRelations(product, brandPool, altPool);
}

/** Every SKU of one range (category + exact collection value), lean — for a collection landing page's facts. */
export function getCollectionPool(dbCategory: string, collection: string): Promise<ProductSummary[]> {
  return cachedPool(`collection:${dbCategory}|${collection}`, async () => {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SUMMARY_COLUMNS)
      .eq("category", dbCategory)
      .eq("collection", collection)
      .order("id")
      .limit(1000);
    if (error) throw error;
    return data as ProductSummary[];
  });
}

/**
 * Lean rows for a list of slugs, in the order given. Chunked so a long list
 * never builds a PostgREST URL past proxy length limits.
 */
export async function fetchProductSummariesBySlugs(slugs: string[]): Promise<ProductSummary[]> {
  if (slugs.length === 0) return [];
  const supabase = createServerSupabaseClient();
  const CHUNK = 80;
  const rows: ProductSummary[] = [];
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const { data, error } = await supabase.from("products").select(PRODUCT_SUMMARY_COLUMNS).in("slug", slugs.slice(i, i + CHUNK));
    if (error) throw error;
    rows.push(...(data as ProductSummary[]));
  }
  const order = new Map(slugs.map((slug, i) => [slug, i]));
  return rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

/**
 * A handful of real products for a guide's "shop this" grid: priced first,
 * from the guide's categories (and brands, when it's about one).
 */
export async function getProductsForGuide(opts: { dbCategories: string[]; brands?: string[]; limit: number }): Promise<ProductSummary[]> {
  if (opts.dbCategories.length === 0) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase.from("products").select(PRODUCT_SUMMARY_COLUMNS).in("category", opts.dbCategories);
  if (opts.brands?.length) query = query.in("brand", opts.brands);
  const { data, error } = await query.not("price_table", "is", null).order("id").limit(opts.limit);
  if (error) throw error;
  return data as ProductSummary[];
}

export interface CatalogueFreshness {
  byCategory: Map<string, Date>;
  byBrand: Map<string, Date>;
  /** Keyed `${dbCategory}|${collection}`. */
  byCollection: Map<string, Date>;
}

/**
 * Latest product edit per category, brand and range — the sitemap's
 * lastModified for listing pages, which change when their products do, not
 * on every request (a `new Date()` lastmod that moves on every crawl is one
 * Google learns to ignore).
 */
export async function getCatalogueFreshness(): Promise<CatalogueFreshness> {
  const supabase = createServerSupabaseClient();
  const PAGE = 1000;
  const freshness: CatalogueFreshness = { byCategory: new Map(), byBrand: new Map(), byCollection: new Map() };
  const bump = (map: Map<string, Date>, key: string, date: Date) => {
    const current = map.get(key);
    if (!current || date > current) map.set(key, date);
  };
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("category, brand, collection, created_at, updated_at")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data as { category: string; brand: string; collection: string | null; created_at: string; updated_at: string | null }[]) {
      const date = new Date(row.updated_at || row.created_at);
      if (Number.isNaN(date.getTime())) continue;
      bump(freshness.byCategory, row.category, date);
      bump(freshness.byBrand, row.brand, date);
      if (row.collection) bump(freshness.byCollection, `${row.category}|${row.collection}`, date);
    }
    if (data.length < PAGE) break;
  }
  return freshness;
}

/**
 * Every SKU of a brand, lean columns only — the brand page's code finder and
 * finish-filterable grid (Virgo, Century Laminates) serialize this whole list
 * to the browser, so it carries card fields and nothing heavier.
 */
export async function getBrandProductSummaries(brandName: string): Promise<ProductSummary[]> {
  const supabase = createServerSupabaseClient();
  const PAGE = 1000;
  const rows: ProductSummary[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SUMMARY_COLUMNS)
      .eq("brand", brandName)
      .order("category")
      .order("name")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as ProductSummary[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

export async function getProductsByBrandPage(
  brandName: string,
  opts: { page: number; pageSize?: number; categories?: string[] }
): Promise<PaginatedProducts> {
  const supabase = createServerSupabaseClient();
  const pageSize = opts.pageSize ?? CATEGORY_PAGE_SIZE;
  const page = Math.max(1, opts.page);
  const { categories } = opts;

  // Count first — see getProductsByCategoryPage for why: PostgREST throws on
  // an out-of-range .range() rather than returning empty.
  let countQuery = supabase.from("products").select("*", { count: "exact", head: true }).eq("brand", brandName);
  countQuery = categories && categories.length > 0 ? countQuery.in("category", categories) : countQuery;
  const { count, error: countError } = await countQuery;
  if (countError) throw countError;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0 || page > totalPages) {
    return { products: [], total, page, pageSize, totalPages };
  }

  let dataQuery = supabase.from("products").select("*").eq("brand", brandName);
  dataQuery = categories && categories.length > 0 ? dataQuery.in("category", categories) : dataQuery;
  const from = (page - 1) * pageSize;
  const { data, error } = await dataQuery.order("category").order("name").range(from, from + pageSize - 1);
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
  // One grouped RPC instead of a per-category head-count query — the old
  // Promise.all of 17+ parallel count queries was bursting past PostgREST's
  // connection pool on every homepage load, tripping fetchWithRetry's
  // backoff on the overflow and adding tens of seconds to render time.
  const { data, error } = await supabase.rpc("get_category_counts");
  if (error) throw error;
  const counts = Object.fromEntries((data as { category: string; count: number }[]).map((r) => [r.category, r.count]));
  return Object.fromEntries(CATEGORIES.map((c) => [c.dbCategory, counts[c.dbCategory] ?? 0]));
}

// Sample products for a category with no count query attached — for callers
// (like the homepage grid) that already have the total from
// getCategoryCounts() and only need a few representative rows, not another
// per-category round-trip just to learn a number they already have.
export async function getCategorySampleProducts(dbCategory: string, limit = 10): Promise<ProductRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("*").eq("category", dbCategory).limit(limit);
  if (error) throw error;
  return data;
}

export interface CategoryPriceContext {
  /** Lowest per-unit rate on file across the category, for a "from ₹X" line. Null when nothing in the category is priced. */
  from: number | null;
  /** Unit the floor price is quoted in (sheet / sqft / …) — from the same row. */
  unit: string | null;
  /** How many SKUs in the category carry a real rate, for "prices on N of M". */
  pricedCount: number;
  total: number;
}

// Cheap price context for a category landing page — a single grouped query
// over the `price_table` JSON rather than pulling every row. Only reads the
// two common single-rate shapes ({starting_price} / {min_price}); per-pack
// array pricing (Fevicol) is rare enough to skip for a category-level floor.
export async function getCategoryPriceContext(dbCategory: string): Promise<CategoryPriceContext> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("price_table")
    .eq("category", dbCategory)
    .not("price_table", "is", null);
  if (error) throw error;

  let from: number | null = null;
  let unit: string | null = null;
  let pricedCount = 0;
  for (const row of data as { price_table: unknown }[]) {
    const t = row.price_table;
    if (!t || typeof t !== "object" || Array.isArray(t)) continue;
    const obj = t as { starting_price?: unknown; min_price?: unknown; unit?: unknown };
    const rate = typeof obj.starting_price === "number" ? obj.starting_price : typeof obj.min_price === "number" ? obj.min_price : null;
    if (rate === null || rate <= 0) continue;
    pricedCount++;
    if (from === null || rate < from) {
      from = rate;
      unit = typeof obj.unit === "string" ? obj.unit : null;
    }
  }

  const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("category", dbCategory);
  return { from, unit, pricedCount, total: count ?? 0 };
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

