import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import type { QuoteRateRow } from "@/lib/supabase/types";
import { isUuid } from "@/lib/uuid";

export const RATE_PAGE_SIZE = 100;

export interface RateFilters {
  search?: string;
  category?: string;
  brand?: string;
  thickness?: string;
  basis?: string;
  /** "active" | "inactive" — omit for all. */
  state?: string;
  page?: number;
}

export interface RateListResult {
  rows: QuoteRateRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listRates(filters: RateFilters = {}): Promise<RateListResult> {
  const supabase = await createAdminSupabaseClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * RATE_PAGE_SIZE;

  let query = supabase.from("quote_rates").select("*", { count: "exact" });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.brand) query = query.ilike("brand", filters.brand);
  if (filters.thickness) query = query.eq("thickness", filters.thickness);
  if (filters.basis) query = query.eq("pricing_basis", filters.basis);
  if (filters.state === "active") query = query.eq("active", true);
  if (filters.state === "inactive") query = query.eq("active", false);

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `brand.ilike.${term},product_name.ilike.${term},range_name.ilike.${term},category.ilike.${term},thickness.ilike.${term},grade.ilike.${term}`
    );
  }

  const { data, error, count } = await query
    .order("brand", { ascending: true, nullsFirst: false })
    .order("product_name", { ascending: true, nullsFirst: true })
    .order("thickness", { ascending: true, nullsFirst: true })
    .range(from, from + RATE_PAGE_SIZE - 1);
  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: (data ?? []) as QuoteRateRow[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / RATE_PAGE_SIZE)),
  };
}

export async function getRate(id: string): Promise<QuoteRateRow | null> {
  if (!isUuid(id)) return null;
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("quote_rates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as QuoteRateRow | null) ?? null;
}

/** Distinct values for the filter selects — cheap at Rate Book volumes. */
export interface RateFacets {
  categories: string[];
  brands: string[];
  thicknesses: string[];
}

export async function getRateFacets(): Promise<RateFacets> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("quote_rates").select("category, brand, thickness");
  if (error) throw error;
  const cat = new Set<string>();
  const brand = new Set<string>();
  const thick = new Set<string>();
  for (const r of (data ?? []) as Pick<QuoteRateRow, "category" | "brand" | "thickness">[]) {
    if (r.category) cat.add(r.category);
    if (r.brand) brand.add(r.brand);
    if (r.thickness) thick.add(r.thickness);
  }
  return {
    categories: [...cat].sort(),
    brands: [...brand].sort(),
    thicknesses: [...thick].sort(),
  };
}

export interface RateMatchQuery {
  brand?: string | null;
  rangeName?: string | null;
  label?: string | null;
  thickness?: string | null;
  grade?: string | null;
}

/**
 * Candidate Rate Book rows for a requirement line under an option. Filters to
 * active rows whose effective window covers today, then narrows by brand and
 * (loosely) product/range, and by thickness. The caller applies a rate ONLY
 * when exactly one candidate comes back — an ambiguous or empty result leaves
 * the line UNRESOLVED for a human to resolve.
 */
export async function findRateCandidates(q: RateMatchQuery): Promise<QuoteRateRow[]> {
  const supabase = await createAdminSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("quote_rates")
    .select("*")
    .eq("active", true)
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`);

  if (q.brand?.trim()) query = query.ilike("brand", `%${q.brand.trim()}%`);
  if (q.thickness?.trim()) query = query.ilike("thickness", q.thickness.trim());

  const { data, error } = await query.limit(50);
  if (error) throw error;
  let rows = (data ?? []) as QuoteRateRow[];

  // Range / product / label narrowing, in memory — the option label is free
  // text ("Austin Gold", "Marine Blue") and may land in either column.
  const needle = [q.rangeName, q.label].map((s) => s?.trim().toLowerCase()).find(Boolean);
  if (needle) {
    const matched = rows.filter((r) => {
      const hay = `${r.range_name ?? ""} ${r.product_name ?? ""} ${r.brand ?? ""}`.toLowerCase();
      return needle.split(/\s+/).every((w) => hay.includes(w));
    });
    if (matched.length > 0) rows = matched;
  }
  if (q.grade?.trim()) {
    const g = q.grade.trim().toLowerCase();
    const byGrade = rows.filter((r) => (r.grade ?? "").toLowerCase() === g);
    if (byGrade.length > 0) rows = byGrade;
  }
  return rows;
}
