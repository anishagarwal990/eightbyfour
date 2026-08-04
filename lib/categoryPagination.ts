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

// encodeURIComponent leaves !'()* unescaped (a legacy JS quirk — RFC 3986
// treats these as reserved sub-delims). Collection names like "The Master's
// Wood Grains — Exclusive Collection" contain an apostrophe, so the raw
// encodeURIComponent output could round-trip differently across tools that
// normalize strictly to RFC 3986 vs. those that don't — e.g. a crawler
// re-encoding the apostrophe as %27 while the <link rel="canonical"> tag
// left it literal, making the two look like different URLs even though
// they're the same page. Escaping those characters ourselves keeps every
// href/canonical built from this helper byte-identical everywhere.
function encodeURIComponentStrict(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function categoryPageUrl(slug: string, page: number, collection?: string | null): string {
  const path = categoryPagePath(slug, page);
  return collection ? `${path}?collection=${encodeURIComponentStrict(collection)}` : path;
}

export function parsePageParam(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (n < 1) return null;
  return n;
}
