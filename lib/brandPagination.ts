// Same shape as lib/categoryPagination.ts, for /brands/[slug] instead of
// /products/[slug] — brand pages have no collection filter, just pages.
import { parsePageParam } from "@/lib/categoryPagination";

export function brandPagePath(slug: string, page: number): string {
  return page <= 1 ? `/brands/${slug}` : `/brands/${slug}/page/${page}`;
}

export { parsePageParam };
