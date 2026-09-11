import type { ProductRow } from "@/lib/supabase/types";
import { finishLabel } from "./finishGlossary.ts";

// Internal-linking engine for product pages.
//
// Before this, every product page's "Related Products" and "More from
// {brand}" blocks pulled the first few rows of an unordered brand query — so
// all ~490 Merino pages linked to the same handful of SKUs, and the rest of
// the catalogue got its internal links only from deep category pagination.
// This builds each page's links from its own data instead, in four groups:
//
//   1. Other finishes — the same brand + shade code in another finish
//      (Century "3903 LN" ↔ "3903 SU", Merino "22133" Standard ↔ MR+).
//   2. Similar shades — the nearest design codes in the same brand, same
//      range first. Manufacturers number designs in series, so code
//      neighbours are real catalogue neighbours, and every SKU ends up
//      linked from the SKUs around it rather than from none.
//   3. Same finish — more designs in the finish this SKU is sold in, where
//      that finish actually distinguishes it.
//   4. Other brands — same category and shade family ("green", "walnut",
//      "marble"), read from the shade name itself, spread across brands —
//      the "compare project pricing across brands" path. Code-less boards
//      compare against the rest of their category.
//
// Pure: pools are fetched in lib/data/products.ts, and lib/productRelations
// .test.ts pins the ordering.

/** Columns a product card and the relation engine need — not the heavy description/spec fields. */
export const PRODUCT_SUMMARY_COLUMNS =
  "id,slug,category,brand,name,collection,sd_code,finish,finishes,size,thicknesses,main_img_url,price_table,warranty";

export type ProductSummary = Pick<
  ProductRow,
  | "id"
  | "slug"
  | "category"
  | "brand"
  | "name"
  | "collection"
  | "sd_code"
  | "finish"
  | "finishes"
  | "size"
  | "thicknesses"
  | "main_img_url"
  | "price_table"
  | "warranty"
>;

export interface ShadeFamily {
  key: string;
  /** Lowercase noun for headings — "Similar green laminates from other brands". */
  label: string;
  terms: readonly string[];
}

// Wood species first: "Gigan Lowa Walnut" is better matched as a walnut than
// by any colour word around it. Terms are whole words that appear in shade
// names on file; a name matching none gets no cross-brand block rather than
// a guessed one.
const SHADE_FAMILIES: readonly ShadeFamily[] = [
  { key: "walnut", label: "walnut", terms: ["walnut"] },
  { key: "oak", label: "oak", terms: ["oak"] },
  { key: "teak", label: "teak", terms: ["teak"] },
  { key: "ash", label: "ash wood", terms: ["ash"] },
  { key: "pine", label: "pine", terms: ["pine"] },
  { key: "maple", label: "maple", terms: ["maple"] },
  { key: "beech", label: "beech", terms: ["beech"] },
  { key: "elm", label: "elm", terms: ["elm"] },
  { key: "cherry", label: "cherry", terms: ["cherry"] },
  { key: "wenge", label: "wenge", terms: ["wenge"] },
  { key: "acacia", label: "acacia", terms: ["acacia"] },
  { key: "chestnut", label: "chestnut", terms: ["chestnut"] },
  { key: "hickory", label: "hickory", terms: ["hickory"] },
  { key: "rosewood", label: "rosewood", terms: ["rosewood", "mahogany"] },
  { key: "marble", label: "marble", terms: ["marble", "statuario", "marquina", "carrara", "calacatta"] },
  { key: "concrete", label: "concrete", terms: ["concrete", "cement"] },
  { key: "stone", label: "stone", terms: ["stone", "slate", "granite", "terrazzo"] },
  { key: "white", label: "white", terms: ["white", "ivory"] },
  { key: "black", label: "black", terms: ["black", "ebony", "noir"] },
  { key: "grey", label: "grey", terms: ["grey", "gray", "charcoal", "graphite"] },
  { key: "beige", label: "beige", terms: ["beige", "cream", "sand", "almond"] },
  { key: "brown", label: "brown", terms: ["brown", "chocolate", "coffee", "mocha"] },
  { key: "green", label: "green", terms: ["green", "sage", "olive", "moss", "jade", "mint"] },
  { key: "blue", label: "blue", terms: ["blue", "navy", "denim", "teal", "aqua"] },
  { key: "red", label: "red", terms: ["red", "maroon", "wine", "burgundy"] },
  { key: "pink", label: "pink", terms: ["pink", "rose", "blush"] },
  { key: "yellow", label: "yellow", terms: ["yellow", "mustard", "lemon"] },
  { key: "purple", label: "purple", terms: ["purple", "lilac", "lavender", "mauve", "violet"] },
  { key: "metallic", label: "metallic", terms: ["gold", "golden", "silver", "copper", "bronze", "steel", "metallic"] },
];

function nameWords(name: string): Set<string> {
  return new Set(name.toLowerCase().split(/[^a-z]+/).filter(Boolean));
}

/** The shade family a name belongs to, or null when no family word appears in it. */
export function shadeFamilyOf(name: string): ShadeFamily | null {
  const tokens = nameWords(name);
  return SHADE_FAMILIES.find((f) => f.terms.some((t) => tokens.has(t))) ?? null;
}

export function matchesShadeFamily(name: string, family: ShadeFamily): boolean {
  const tokens = nameWords(name);
  return family.terms.some((t) => tokens.has(t));
}

export interface ProductRelations {
  otherFinishes: ProductSummary[];
  similar: ProductSummary[];
  sameFinish: { label: string; products: ProductSummary[] } | null;
  alternatives: { family: ShadeFamily | null; products: ProductSummary[] };
}

// Kept small deliberately — a SKU page is a product page, not a directory of
// the catalogue. Each cap sits inside the range the risk-reduction pass
// asked for (4-6 per relevance group), so the page links to a tight,
// semantically relevant set rather than everything nearby.
export const RELATION_LIMITS = { otherFinishes: 6, similar: 6, sameFinish: 6, alternatives: 6 } as const;

type Subject = Pick<ProductRow, "id" | "brand" | "category" | "name" | "collection" | "sd_code" | "finish" | "finishes">;

const norm = (value: string) => value.trim().toLowerCase();

function codeNumber(code: string | null): number | null {
  const match = code?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

// FNV-1a — a cheap, stable hash, so "spread" orderings are deterministic per
// page (the same build always renders the same links) while still differing
// from page to page.
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function spreadKey(seed: number, id: number): number {
  return hash(`${seed}:${id}`);
}

function finishesOf(p: Pick<ProductRow, "finish" | "finishes">): string[] {
  return (p.finishes?.length ? p.finishes : p.finish ? [p.finish] : []).map(norm);
}

/**
 * The finish that actually sets this SKU apart: its own finish on per-SKU
 * catalogues (Virgo, Century Laminates), or the first non-default finish of a
 * multi-finish design. Null when "Standard" is all there is to say.
 */
export function distinguishingFinish(product: Pick<ProductRow, "finish" | "finishes">): string | null {
  if (!product.finishes?.length) return product.finish?.trim() || null;
  return product.finishes.map((f) => f.trim()).find((f) => f && f.toLowerCase() !== "standard") ?? null;
}

/** One row per design code — per-SKU-finish catalogues have a row per code+finish, and a list of four "3903"s helps nobody. */
function onePerDesign(pool: ProductSummary[], preferFinish: string | null): ProductSummary[] {
  const byKey = new Map<string, ProductSummary>();
  const wanted = preferFinish ? norm(preferFinish) : null;
  for (const p of pool) {
    const key = p.sd_code ? `${norm(p.brand)}|${norm(p.sd_code)}` : `id:${p.id}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, p);
    } else if (wanted && finishesOf(p).includes(wanted) && !finishesOf(current).includes(wanted)) {
      // Prefer the variant in the finish the visitor is already looking at.
      byKey.set(key, p);
    }
  }
  return [...byKey.values()];
}

function compareNearest(product: Subject) {
  const base = codeNumber(product.sd_code);
  const collection = product.collection ? norm(product.collection) : null;
  const distance = (p: ProductSummary) => {
    const n = codeNumber(p.sd_code);
    return base !== null && n !== null ? Math.abs(n - base) : Number.MAX_SAFE_INTEGER;
  };
  return (a: ProductSummary, b: ProductSummary) => {
    const sameA = collection !== null && a.collection !== null && norm(a.collection) === collection;
    const sameB = collection !== null && b.collection !== null && norm(b.collection) === collection;
    if (sameA !== sameB) return sameA ? -1 : 1;
    const d = distance(a) - distance(b);
    if (d !== 0) return d;
    return spreadKey(product.id, a.id) - spreadKey(product.id, b.id);
  };
}

/** Round-robin across brands, in the order each brand first appears — four alternatives from one brand isn't a comparison. */
function spreadAcrossBrands(candidates: ProductSummary[], limit: number): ProductSummary[] {
  const queues = new Map<string, ProductSummary[]>();
  for (const c of candidates) {
    const queue = queues.get(c.brand);
    if (queue) queue.push(c);
    else queues.set(c.brand, [c]);
  }
  const out: ProductSummary[] = [];
  const lists = [...queues.values()];
  for (let round = 0; out.length < limit && lists.some((l) => round < l.length); round++) {
    for (const list of lists) {
      if (out.length >= limit) break;
      if (round < list.length) out.push(list[round]);
    }
  }
  return out;
}

/**
 * @param brandPool  same brand + same category (lean rows) — the product itself may be in it
 * @param altPool    same category, any brand — pre-filtered to the shade family for coded SKUs
 */
export function buildProductRelations(
  product: Subject,
  brandPool: ProductSummary[],
  altPool: ProductSummary[],
  limits: { otherFinishes: number; similar: number; sameFinish: number; alternatives: number } = RELATION_LIMITS
): ProductRelations {
  const code = product.sd_code ? norm(product.sd_code) : null;
  const sameDesign = (p: ProductSummary) => code !== null && p.sd_code !== null && norm(p.sd_code) === code;
  const pool = brandPool.filter((p) => p.id !== product.id && p.category === product.category);

  const otherFinishes = pool
    .filter(sameDesign)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, limits.otherFinishes);

  const used = new Set<number>([product.id, ...otherFinishes.map((p) => p.id)]);
  const ownFinish = distinguishingFinish(product);
  const nearest = onePerDesign(
    pool.filter((p) => !used.has(p.id) && !sameDesign(p)),
    ownFinish
  ).sort(compareNearest(product));

  const similar = nearest.slice(0, limits.similar);
  for (const p of similar) used.add(p.id);

  // Only for shade catalogues, and only when the finish means something —
  // "more Standard-finish Merino" is the whole range, not a relation.
  const finish = code !== null ? ownFinish : null;
  const sameFinishProducts = finish
    ? nearest.filter((p) => !used.has(p.id) && finishesOf(p).includes(norm(finish))).slice(0, limits.sameFinish)
    : [];
  for (const p of sameFinishProducts) used.add(p.id);

  // Coded shades compare within their shade family; a shade name with no
  // family word gets no cross-brand block rather than an arbitrary one.
  const family = code !== null ? shadeFamilyOf(product.name) : null;
  const altCandidates =
    code !== null && !family
      ? []
      : onePerDesign(
          altPool.filter(
            (p) =>
              p.brand !== product.brand &&
              p.category === product.category &&
              !used.has(p.id) &&
              (!family || matchesShadeFamily(p.name, family))
          ),
          null
        ).sort((a, b) => spreadKey(product.id, a.id) - spreadKey(product.id, b.id));

  return {
    otherFinishes,
    similar,
    sameFinish: finish && sameFinishProducts.length > 0 ? { label: finishLabel(product.brand, finish), products: sameFinishProducts } : null,
    alternatives: { family, products: spreadAcrossBrands(altCandidates, limits.alternatives) },
  };
}
