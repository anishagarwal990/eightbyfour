// Manufacturers EightByFour sources from but doesn't yet stock as SKUs —
// shown for trust/reach. Each still gets a lightweight /brands/[slug] page
// (see BrandPage) with a "source on request" CTA instead of a product grid.
export const SOURCE_ONLY_BRANDS = [
  { name: "Hafele", slug: "hafele", file: "hafele.png" },
  { name: "Hettich", slug: "hettich", file: "hettich.png" },
  { name: "Blum", slug: "blum", file: "blum.png" },
  { name: "EBCO", slug: "ebco", file: "ebco.png" },
  { name: "Godrej", slug: "godrej", file: "godrej.webp" },
  { name: "Action Tesa", slug: "action-tesa", file: "action-tesa.png" },
  { name: "BisonPanel", slug: "bisonpanel", file: "bisonpanel.webp" },
  { name: "Ozone", slug: "ozone", file: "ozone.png" },
  { name: "Dorset", slug: "dorset", file: "dorset.webp" },
  { name: "Europa", slug: "europa", file: "europa.webp" },
  { name: "Saburi Ply", slug: "saburi-ply", file: "saburi-ply.png" },
  { name: "Vivanta Solid Surfaces", slug: "vivanta-solid-surfaces", file: "vivanta.jpeg" },
  { name: "LX Hausys", slug: "lx-hausys", file: "lx-hausys.jpeg" },
  { name: "Staron", slug: "staron", file: "staron.png" },
  { name: "PTA Fastener", slug: "pta-fastener", file: "pta-fastener.jpeg" },
];

export function getSourceOnlyBrandBySlug(slug: string) {
  return SOURCE_ONLY_BRANDS.find((b) => b.slug === slug) || null;
}
