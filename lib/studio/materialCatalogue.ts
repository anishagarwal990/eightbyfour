import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolvePrice } from "@/lib/pricing";
import type { ProductRow } from "@/lib/supabase/types";

/**
 * The real catalogue, shaped for the Studio material pickers.
 *
 * The curated lists in lib/studio/catalogue.ts are the seed defaults and the
 * offline fallback; this is what the "change board" / "change laminate"
 * pickers actually search. Boards come from every board category at once
 * (plywood, MDF/HDHMR, boil boards, blockboard, birch) because a customer
 * pressing a panel does not think in our category boundaries.
 *
 * A standard sheet is 8 × 4 ft = 32 sq ft. Boards are priced per sq ft as a
 * RANGE across their thicknesses — there is no per-thickness rate on most
 * rows — so the per-sheet figure here is a range too, and the picker shows it
 * as "from ₹X". Laminates are priced per sheet directly, or not at all: most
 * laminate rows carry no price, and those resolve to null rather than a
 * guess.
 */

const SHEET_SQFT = 32;

export type StudioMaterialKind = "board" | "laminate";

const CATEGORIES: Record<StudioMaterialKind, string[]> = {
  board: ["Plywood", "Birch Plywood", "Boil Boards", "MDF and HDHMR", "Blockboard"],
  laminate: ["Laminates"],
};

export interface StudioMaterial {
  slug: string;
  name: string;
  brand: string;
  /** Range / sub-brand, e.g. "Solid Trendz". */
  collection: string | null;
  /** BWP / MR / FR / HDF … boards only. */
  grade: string | null;
  warranty: string | null;
  /** Finish code, laminates only, e.g. "SU". */
  finish: string | null;
  thicknesses: string[];
  category: string;
  href: string;
  /** Per-sheet price. `from` is true when it is the bottom of a range. null = not on file. */
  sheetPrice: { amount: number; from: boolean } | null;
}

export interface StudioMaterialFacets {
  brands: { name: string; count: number }[];
  grades: string[];
  thicknesses: string[];
}

function sheetPriceOf(product: ProductRow): StudioMaterial["sheetPrice"] {
  const price = resolvePrice(product);
  if (!price) return null;
  if (price.unit === "sheet") {
    return price.kind === "single"
      ? { amount: price.amount, from: false }
      : { amount: price.min, from: true };
  }
  if (price.unit === "sqft") {
    return price.kind === "single"
      ? { amount: Math.round(price.amount * SHEET_SQFT), from: false }
      : { amount: Math.round(price.min * SHEET_SQFT), from: true };
  }
  return null;
}

function toMaterial(p: ProductRow): StudioMaterial {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    collection: p.collection,
    grade: p.grade,
    warranty: p.warranty,
    finish: p.finish,
    thicknesses: p.thicknesses ?? [],
    category: p.category,
    href: `/products/${p.slug}`,
    sheetPrice: sheetPriceOf(p),
  };
}

export interface StudioMaterialQuery {
  brand?: string;
  grade?: string;
  /** Substring match against the thickness labels, e.g. "19". */
  thickness?: string;
  /** Free text over name / brand / collection / slug. */
  q?: string;
  limit?: number;
  offset?: number;
}

export interface StudioMaterialPage {
  items: StudioMaterial[];
  total: number;
  hasMore: boolean;
}

export async function getStudioMaterials(
  kind: StudioMaterialKind,
  query: StudioMaterialQuery = {}
): Promise<StudioMaterialPage> {
  const supabase = createServerSupabaseClient();
  const limit = Math.min(Math.max(query.limit ?? 40, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);

  let base = supabase.from("products").select("*", { count: "exact" }).in("category", CATEGORIES[kind]);
  if (query.brand) base = base.eq("brand", query.brand);
  if (query.grade) base = base.eq("grade", query.grade);
  if (query.q) {
    const term = `%${query.q.replace(/[%_]/g, "")}%`;
    base = base.or(`name.ilike.${term},brand.ilike.${term},collection.ilike.${term},slug.ilike.${term}`);
  }

  const { data, error, count } = await base
    .order("brand")
    .order("name")
    .range(offset, offset + limit - 1);
  if (error) throw error;

  // Thickness is a text[] column — filter in JS rather than fight PostgREST
  // array-contains on a substring.
  let rows = data as ProductRow[];
  if (query.thickness) {
    const needle = query.thickness.toLowerCase();
    rows = rows.filter((r) => (r.thicknesses ?? []).some((t) => t.toLowerCase().includes(needle)));
  }

  const total = count ?? rows.length;
  return {
    items: rows.map(toMaterial),
    total,
    hasMore: offset + limit < total,
  };
}

export async function getStudioMaterialFacets(kind: StudioMaterialKind): Promise<StudioMaterialFacets> {
  const supabase = createServerSupabaseClient();
  const PAGE = 1000;
  const rows: Pick<ProductRow, "brand" | "grade" | "thicknesses">[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("brand, grade, thicknesses")
      .in("category", CATEGORIES[kind])
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  const brandCounts = new Map<string, number>();
  const grades = new Set<string>();
  const thicknesses = new Set<string>();
  for (const r of rows) {
    if (r.brand) brandCounts.set(r.brand, (brandCounts.get(r.brand) ?? 0) + 1);
    if (r.grade) grades.add(r.grade);
    for (const t of r.thicknesses ?? []) thicknesses.add(t.trim());
  }

  return {
    brands: [...brandCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count })),
    grades: [...grades].sort(),
    thicknesses: [...thicknesses].sort(sortThickness),
  };
}

/** "6mm" < "12mm" < "18mm" — numeric where possible. */
function sortThickness(a: string, b: string): number {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b);
}
