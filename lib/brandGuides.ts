// Brand pages have no MDX frontmatter of their own (they're rendered from the
// `brands` DB table, not content/), so there's no relatedGuideSlugs field to
// reuse — this is the equivalent static map for the handful of brands that
// have a guide written specifically about them.
export const BRAND_GUIDE_SLUGS: Record<string, string[]> = {
  greenlam: ["greenlam-laminate-finishes-guide", "laminate-care-and-maintenance"],
  merino: ["merino-laminate-finishes-guide", "laminate-care-and-maintenance"],
  eightbyfour: ["veneer-buying-guide", "laminate-care-and-maintenance"],
};
