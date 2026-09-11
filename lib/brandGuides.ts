// Brand pages have no MDX frontmatter of their own (they're rendered from the
// `brands` DB table, not content/), so there's no relatedGuideSlugs field to
// reuse — this is the equivalent static map for the handful of brands that
// have a guide written specifically about them.
export const BRAND_GUIDE_SLUGS: Record<string, string[]> = {
  greenlam: ["greenlam-laminate-finishes-guide", "laminate-care-and-maintenance"],
  merino: ["merino-laminate-finishes-guide", "laminate-care-and-maintenance"],
  eightbyfour: ["veneer-buying-guide", "laminate-care-and-maintenance"],
  "wigwam-excel": ["why-calibrated-plywood-matters"],
};

// The buying guides a product page links to for its category, keyed by the
// `products.category` value — alongside its brand's own guide above. These
// used to be hand-placed links on a few brands' product pages; keyed by
// category, every product page gets the guide that answers its buyer's next
// question (grade, moisture, finish care).
export const CATEGORY_GUIDE_SLUGS: Record<string, string[]> = {
  Laminates: ["laminate-care-and-maintenance"],
  Plywood: ["plywood-grades-explained", "best-plywood-for-kitchen"],
  "Birch Plywood": ["plywood-grades-explained"],
  "Boil Boards": ["best-plywood-for-kitchen", "plywood-grades-explained"],
  "MDF and HDHMR": ["mdf-vs-hdhmr", "hdhmr-for-bathroom-kitchen"],
  Blockboard: ["blockboard-vs-plywood"],
  Veneers: ["veneer-buying-guide"],
};

export const CATEGORY_COMPARISON_SLUGS: Record<string, string[]> = {
  "Birch Plywood": ["birch-ply-vs-standard-plywood"],
  Laminates: ["laminate-vs-veneer"],
  Veneers: ["laminate-vs-veneer"],
};
