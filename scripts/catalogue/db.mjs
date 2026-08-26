import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", ".env") });

export const PROJECT_ROOT = join(__dirname, "..", "..");

export function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  return createClient(url, key, { auth: { persistSession: false } });
}

// PostgREST caps a single select at 1000 rows and the catalogue is ~3,100,
// so every read here pages. A silent truncation at 1000 would look like
// "these products no longer exist" and an import built on it would be a diff
// against a third of the catalogue.
const PAGE = 1000;

// PostgREST puts filters in the query string, so an `.in("slug", [...])`
// with a few thousand values produces a URL long enough that the request
// fails outright ("fetch failed") rather than returning an error row. A
// whole-category import is exactly that many slugs, so slug lookups are
// chunked.
const SLUG_CHUNK = 200;

async function fetchPagedSelect(sb, applyFilters) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await applyFilters(sb.from("products").select("*"))
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Read failed: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

export async function fetchAll(sb, { category = null, brand = null, slugs = null } = {}) {
  const base = (query) => {
    let q = query;
    if (category) q = q.eq("category", category);
    if (brand) q = q.eq("brand", brand);
    return q;
  };

  if (!slugs?.length) return fetchPagedSelect(sb, base);

  const rows = [];
  for (let i = 0; i < slugs.length; i += SLUG_CHUNK) {
    const chunk = slugs.slice(i, i + SLUG_CHUNK);
    rows.push(...(await fetchPagedSelect(sb, (query) => base(query).in("slug", chunk))));
  }
  return rows;
}

/**
 * Apply per-slug patches one row at a time.
 *
 * Deliberately not an upsert: upsert on a partial object nulls every column
 * absent from the payload, which on this table would wipe images, specs and
 * pricing for any product whose CSV only carried a description. An update
 * keyed on slug touches exactly the columns in the patch and nothing else.
 */
export async function applyPatches(sb, patches, { onProgress } = {}) {
  const results = { updated: 0, failed: [] };
  for (const [i, { slug, patch }] of patches.entries()) {
    const { error } = await sb.from("products").update(patch).eq("slug", slug);
    if (error) results.failed.push({ slug, message: error.message });
    else results.updated++;
    onProgress?.(i + 1, patches.length);
  }
  return results;
}
