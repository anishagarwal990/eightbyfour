// Collection landing pages — which `?collection=` filters are real,
// search-worthy manufacturer ranges that get their own clean, indexable URL,
// and which stay UX filters.
//
// Search Console was indexing ~70 `/products/{category}?collection=X` URLs,
// every one serving the category's own description and H1 with a different
// product grid. Now each filter value is one of two things:
//
//   A. Landing page — /products/{category}/collections/{slug}. Self-canonical,
//      its own title/H1/intro built from the range's real inventory, in the
//      sitemap, linked from the category and brand hubs. The old
//      `?collection=` URL 308s here.
//
//   B. UX filter — the chip keeps working for shoppers, but the filtered URL
//      canonicalises to the category page and never enters the sitemap.
//
// A range gets the clean URL and its own page only when ALL of these hold
// (docs/SEO-SEARCH-GROWTH.md § Collections):
//   1. It's a real range name — not a placeholder ("other", the category's own
//      name such as Merino's "Laminates", a generic "HPL") and not a bare
//      2–4 letter internal code ("GL", "UC", "ZMT").
//   2. It has ≥ MIN_LANDING_SKUS live SKUs, enough to stand on its own.
//   3. It isn't the brand's entire catalogue in that category — that page
//      already exists as /brands/{brand} (e.g. Sky Decor "Liner Laminates").
//   4. Its slug is unique within the category. Laminate ranges belong to one
//      manufacturer each, so their slugs lead with the brand.
//
// Clearing 1-4 only earns the URL and the page — a quality gate on TOP of
// that decides whether the page is actually indexed:
//   5. It has to be a real, externally recognised customer/search concept —
//      a manufacturer's own named range or an established category-wide
//      grouping people search by name (confirmed for several of these by
//      real Search Console queries — "designer veneers" among them). A
//      SKU-count threshold alone doesn't establish that on its own, so
//      `indexable: false` marks the two ranges here that are EightxFour's
//      own internal merchandising labels for its house brand rather than a
//      name a customer would search — see the two entries below. The page
//      still exists and still works for on-site navigation; it just carries
//      `noindex` and drops out of the sitemap until there's real demand
//      evidence for it (docs/SEO-SEARCH-GROWTH.md § Collections).
//
// `seoTitle` / `seoDescription` / `intro` let a specific range override the
// computed defaults (lib/rangeSummary.ts) when the generic count/finish/price
// summary undersells it — unused today, wired for when one needs it.
//
// SKU counts in the comments are from the live catalogue on 2026-09-11. The
// route 404s a landing whose collection has emptied, so a stale entry fails
// safe rather than serving a thin page.
//
// Pure data, no imports — lib/categoryPagination.ts builds every category URL
// through it, and `node --test` loads both directly.

export interface CollectionLanding {
  categorySlug: string;
  /** Exact `products.collection` value this page serves. */
  collection: string;
  slug: string;
  /** `products.brand` value — every range here belongs to one manufacturer. */
  brand: string;
  brandSlug: string;
  /** Display name for the H1 and default title. */
  name: string;
  /**
   * Whether this range represents a real, externally recognised
   * customer/search concept worth its own indexed URL — see rule 5 above.
   * Omitted (or true) = indexed once it clears MIN_LANDING_SKUS. `false` =
   * the clean URL still exists and still works for navigation, but the page
   * is `noindex` and left out of the sitemap.
   */
  indexable?: boolean;
  /** Overrides the computed title (lib/rangeSummary.ts) when set. */
  seoTitle?: string;
  /** Overrides the computed meta description when set. */
  seoDescription?: string;
  /** Overrides the computed intro paragraph when set. */
  intro?: string;
}

export const MIN_LANDING_SKUS = 20;

/** Whether a landing should be indexed — the entry opted out, or (default) yes. Route files still combine this with the live SKU count. */
export function isLandingIndexable(landing: Pick<CollectionLanding, "indexable">): boolean {
  return landing.indexable !== false;
}

export const COLLECTION_LANDINGS: readonly CollectionLanding[] = [
  // ---- Laminates ----
  { categorySlug: "laminates", collection: "Luvih", slug: "merino-luvih", brand: "Merino", brandSlug: "merino", name: "Merino Luvih Laminates" }, // 48
  { categorySlug: "laminates", collection: "Special Laminates", slug: "merino-special-laminates", brand: "Merino", brandSlug: "merino", name: "Merino Special Laminates" }, // 82
  { categorySlug: "laminates", collection: "Digital-Custom", slug: "greenlam-digital-custom", brand: "Greenlam", brandSlug: "greenlam", name: "Greenlam Digital Custom Laminates" }, // 224
  { categorySlug: "laminates", collection: "Door Laminates", slug: "greenlam-door-laminates", brand: "Greenlam", brandSlug: "greenlam", name: "Greenlam Door Laminates" }, // 51
  { categorySlug: "laminates", collection: "Standard Compacts", slug: "greenlam-standard-compacts", brand: "Greenlam", brandSlug: "greenlam", name: "Greenlam Standard Compact Laminates" }, // 41
  { categorySlug: "laminates", collection: "Lexus Collection", slug: "greenlam-lexus-collection", brand: "Greenlam", brandSlug: "greenlam", name: "Greenlam Lexus Collection Laminates" }, // 39
  { categorySlug: "laminates", collection: "Veneer Laminates", slug: "greenlam-veneer-laminates", brand: "Greenlam", brandSlug: "greenlam", name: "Greenlam Veneer Laminates" }, // 23
  { categorySlug: "laminates", collection: "Superlative High Gloss", slug: "virgo-superlative-high-gloss", brand: "Virgo", brandSlug: "virgo", name: "Virgo Superlative High Gloss Laminates" }, // 155
  { categorySlug: "laminates", collection: "Suede Finish", slug: "virgo-suede-finish", brand: "Virgo", brandSlug: "virgo", name: "Virgo Suede Finish Laminates" }, // 84
  { categorySlug: "laminates", collection: "Super Matt", slug: "virgo-super-matt", brand: "Virgo", brandSlug: "virgo", name: "Virgo Super Matt Laminates" }, // 39
  { categorySlug: "laminates", collection: "Sparkle High Gloss", slug: "virgo-sparkle-high-gloss", brand: "Virgo", brandSlug: "virgo", name: "Virgo Sparkle High Gloss Laminates" }, // 22
  { categorySlug: "laminates", collection: "Solid Trendz", slug: "century-laminates-solid-trendz", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates Solid Trendz" }, // 111
  { categorySlug: "laminates", collection: "Solids", slug: "century-laminates-solids", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates Solids" }, // 86
  { categorySlug: "laminates", collection: "High Gloss", slug: "century-laminates-high-gloss", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates High Gloss" }, // 33
  { categorySlug: "laminates", collection: "Scandinavian Wood", slug: "century-laminates-scandinavian-wood", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates Scandinavian Wood" }, // 26
  { categorySlug: "laminates", collection: "Woodgrains", slug: "century-laminates-woodgrains", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates Woodgrains" }, // 25
  { categorySlug: "laminates", collection: "Stones", slug: "century-laminates-stones", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates Stones" }, // 23
  { categorySlug: "laminates", collection: "Wallpaper Collection", slug: "century-laminates-wallpaper-collection", brand: "Century Laminates", brandSlug: "century-laminates", name: "Century Laminates Wallpaper Collection" }, // 20
  // Not indexed (rule 5): EightxFour's own merchandising labels for its
  // house brand, not a manufacturer/category range name a customer searches
  // by — unlike "Merino Luvih" or "Designer Veneer" (a real query, per GSC).
  { categorySlug: "laminates", collection: "Acrylic Collection", slug: "eightbyfour-acrylic", brand: "EightByFour", brandSlug: "eightbyfour", name: "EightxFour Acrylic Laminates", indexable: false }, // 35
  { categorySlug: "laminates", collection: "The Master's Wood Grains — Exclusive Collection", slug: "eightbyfour-masters-wood-grains", brand: "EightByFour", brandSlug: "eightbyfour", name: "EightxFour Master's Wood Grains Laminates", indexable: false }, // 29

  // ---- Veneers — EightxFour's own ranges, one per veneer type ----
  { categorySlug: "veneers", collection: "Natural Veneer", slug: "natural-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Natural Veneers" }, // 135
  { categorySlug: "veneers", collection: "Burma Teak Veneer", slug: "burma-teak-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Burma Teak Veneers" }, // 65
  { categorySlug: "veneers", collection: "Designer Veneer", slug: "designer-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Designer Veneers" }, // 61
  { categorySlug: "veneers", collection: "Embossed Veneer", slug: "embossed-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Embossed Veneers" }, // 61
  { categorySlug: "veneers", collection: "Engineered Veneer", slug: "engineered-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Engineered Veneers" }, // 50
  { categorySlug: "veneers", collection: "Natural Smoke Veneer", slug: "natural-smoke-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Natural Smoke Veneers" }, // 46
  { categorySlug: "veneers", collection: "Hybrid Veneer", slug: "hybrid-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Hybrid Veneers" }, // 31
  { categorySlug: "veneers", collection: "Texture Veneer", slug: "texture-veneer", brand: "EightByFour", brandSlug: "eightbyfour", name: "Texture Veneers" }, // 29

  // ---- Solid surface ----
  { categorySlug: "corian-acrylic-solid-surface", collection: "Premium", slug: "vivanta-premium", brand: "Vivanta", brandSlug: "vivanta", name: "Vivanta Premium Solid Surface" }, // 21
];

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/** The landing page for a category + raw `?collection=` value, matched case-insensitively. */
export function getCollectionLanding(categorySlug: string, collection: string | null | undefined): CollectionLanding | undefined {
  if (!collection) return undefined;
  const wanted = normalise(collection);
  return COLLECTION_LANDINGS.find((l) => l.categorySlug === categorySlug && normalise(l.collection) === wanted);
}

export function getCollectionLandingBySlug(categorySlug: string, slug: string): CollectionLanding | undefined {
  return COLLECTION_LANDINGS.find((l) => l.categorySlug === categorySlug && l.slug === slug);
}

export function collectionLandingsForCategory(categorySlug: string): CollectionLanding[] {
  return COLLECTION_LANDINGS.filter((l) => l.categorySlug === categorySlug);
}

export function collectionLandingsForBrand(brandSlug: string): CollectionLanding[] {
  return COLLECTION_LANDINGS.filter((l) => l.brandSlug === brandSlug);
}

/** Canonical URL of a landing page: /products/{category}/collections/{slug}[/page/{N}]. */
export function collectionLandingPath(landing: Pick<CollectionLanding, "categorySlug" | "slug">, page = 1): string {
  const base = `/products/${landing.categorySlug}/collections/${landing.slug}`;
  return page > 1 ? `${base}/page/${page}` : base;
}
