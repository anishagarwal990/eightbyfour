import { CATEGORIES } from "@/lib/categories";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import type { LinkListEntry } from "@/components/HyderabadLinkList";
import type { BrandWithCount } from "@/lib/data/brands";

// Hand-picked, high-intent searches — resolved to the real page that answers them.
// Anything we don't stock or have a page for yet (e.g. REHAU) opens the quote modal instead.
export const POPULAR_SEARCHES: LinkListEntry[] = [
  { label: "REHAU Edge Bands in Hyderabad", quotePrefill: "REHAU edge bands / laminates" },
  { label: "Corian / Acrylic Solid Surface in Hyderabad", href: "/products/corian-acrylic-solid-surface" },
  { label: "HDHMR in Hyderabad", href: "/products/mdf-and-hdhmr" },
  { label: "MDF in Hyderabad", href: "/products/mdf-and-hdhmr" },
  { label: "Teak Veneer in Hyderabad", href: "/products/veneers" },
  { label: "Hybrid Veneer in Hyderabad", href: "/products/veneers" },
  { label: "EBCO Hardware in Hyderabad", href: "/brands/ebco" },
  { label: "Century Plywood in Hyderabad", href: "/brands/century" },
  { label: "Century Sainik 710 in Hyderabad", href: "/products/century-sainik-710-ply" },
];

export const CATEGORY_LINKS: LinkListEntry[] = CATEGORIES.map((c) => ({
  label: `${c.name} in Hyderabad`,
  href: `/products/${c.slug}`,
}));

export const SOURCE_ONLY_BRAND_LINKS: LinkListEntry[] = SOURCE_ONLY_BRANDS.map((b) => ({
  label: `${b.name} in Hyderabad`,
  href: `/brands/${b.slug}`,
}));

export function stockedBrandLinks(brands: Pick<BrandWithCount, "name" | "slug">[]): LinkListEntry[] {
  return brands.map((b) => ({ label: `${b.name} in Hyderabad`, href: `/brands/${b.slug}` }));
}
