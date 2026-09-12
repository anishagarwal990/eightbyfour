// Manufacturers EightByFour sources from but doesn't yet stock as SKUs —
// shown for trust/reach. Each still gets a lightweight /brands/[slug] page
// (see BrandPage) with a "source on request" CTA instead of a product grid.
//
// `category` is the CATEGORIES slug (lib/categories.ts) this brand's product
// line belongs to — it's what lets the homepage material fan (MaterialFan)
// say "sourced on request: Hettich, Blum, …" under the hardware blade instead
// of leaving every on-request brand unattributed. It's a manual, reviewable
// mapping (these brands have no rows in Supabase by definition, so it isn't
// derived from data) — double-check it before trusting it beyond that credit
// line.
export const SOURCE_ONLY_BRANDS = [
  { name: "Hafele", slug: "hafele", file: "hafele.png", category: "hardware" },
  { name: "Hettich", slug: "hettich", file: "hettich.png", category: "hardware" },
  { name: "Blum", slug: "blum", file: "blum.png", category: "hardware" },
  { name: "EBCO", slug: "ebco", file: "ebco.png", category: "hardware" },
  { name: "Godrej", slug: "godrej", file: "godrej.webp", category: "hardware" },
  { name: "Action Tesa", slug: "action-tesa", file: "action-tesa.png", category: "mdf-and-hdhmr" },
  { name: "Ozone", slug: "ozone", file: "ozone.png", category: "hardware" },
  { name: "Dorset", slug: "dorset", file: "dorset.webp", category: "hardware" },
  { name: "Europa", slug: "europa", file: "europa.webp", category: "hardware" },
  { name: "Saburi Ply", slug: "saburi-ply", file: "saburi-ply.png", category: "plywood" },
  { name: "LX Hausys", slug: "lx-hausys", file: "lx-hausys.jpeg", category: "corian-acrylic-solid-surface" },
  { name: "Staron", slug: "staron", file: "staron.png", category: "corian-acrylic-solid-surface" },
  { name: "PTA Fastener", slug: "pta-fastener", file: "pta-fastener.jpeg", category: "hardware" },
  { name: "Archidply", slug: "archidply", file: "archidply.webp", category: "plywood" },
  { name: "Durian", slug: "durian", file: "durian.webp", category: "laminates" },
  { name: "Abro", slug: "abro", file: "abro.webp", category: "adhesive" },
  { name: "Durlax", slug: "durlax", file: "durlax.png", category: "corian-acrylic-solid-surface" },
  { name: "Glo Panels", slug: "glo-panels", file: "glo-panels.jpeg", category: "wall-panels" },
  { name: "Vivre Panels", slug: "vivre-panels", file: "vivre.png", category: "wall-panels" },
] as const satisfies readonly { name: string; slug: string; file: string; category: string }[];

export function getSourceOnlyBrandBySlug(slug: string) {
  return SOURCE_ONLY_BRANDS.find((b) => b.slug === slug) || null;
}

export function getSourceOnlyBrandsByCategory(categorySlug: string) {
  return SOURCE_ONLY_BRANDS.filter((b) => b.category === categorySlug);
}
