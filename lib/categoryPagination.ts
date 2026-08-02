// Shared URL-building for paginated/filtered category pages, so the route
// files (canonical/rel=next/prev/redirects) and the view components
// (filter chips, pager links) can't drift out of sync on the URL shape.
//
// Canonical page-1 URL:            /products/{slug}
// Canonical page-N URL (N > 1):    /products/{slug}/page/{N}
// With a collection filter:        …?collection={name|"other"}

export function categoryPagePath(slug: string, page: number): string {
  return page <= 1 ? `/products/${slug}` : `/products/${slug}/page/${page}`;
}

export function categoryPageUrl(slug: string, page: number, collection?: string | null): string {
  const path = categoryPagePath(slug, page);
  return collection ? `${path}?collection=${encodeURIComponent(collection)}` : path;
}

export function parsePageParam(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (n < 1) return null;
  return n;
}
