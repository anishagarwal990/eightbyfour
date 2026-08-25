// Same shape as lib/categoryPagination.ts, for /brands/[slug] instead of
// /products/[slug] — brand pages have no collection filter, just pages.
import { parsePageParam } from "@/lib/categoryPagination";

export function brandPagePath(slug: string, page: number, category?: string): string {
  const base = page <= 1 ? `/brands/${slug}` : `/brands/${slug}/page/${page}`;
  return category ? `${base}?category=${category}` : base;
}

export { parsePageParam };
