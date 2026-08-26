import { CATEGORIES } from "@/lib/categories";
import { PRICE_PAGES } from "@/lib/pricePages";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import type { LinkListEntry } from "@/components/HyderabadLinkList";
import type { BrandWithCount } from "@/lib/data/brands";

// /hyderabad pages that have their own page.tsx template instead of an MDX
// file in content/hyderabad. Registered here so the index listing, the
// sitemap and cross-page "related" links can all resolve their titles —
// without which a relatedHyderabadSlugs entry pointing at one of them
// silently disappears from the rendered list.
export interface BespokeHyderabadPage {
  slug: string;
  title: string;
  description: string;
}

export const BESPOKE_HYDERABAD_PAGES: BespokeHyderabadPage[] = [
  {
    slug: "boq-procurement",
    title: "BOQ Procurement in Hyderabad",
    description:
      "Send your material list in any format — Excel, PDF, drawings or a photo — and get one itemised quotation across every category, for Hyderabad delivery.",
  },
  {
    slug: "contractor-procurement",
    title: "Contractor Procurement in Hyderabad",
    description: "Every stocked category in one view, with live SKU counts and trade pricing — built for contractors running multiple sites.",
  },
  {
    slug: "architect-material-sourcing",
    title: "Architect Material Sourcing in Hyderabad",
    description: "Real photography from our veneer, stone and solid-surface catalogue — for specifying, not browsing.",
  },
  {
    slug: "homeowner-materials",
    title: "Materials for Your Home in Hyderabad",
    description: "Plain-language guidance by room — kitchen, wardrobe, TV unit — instead of a raw materials catalogue.",
  },
];

export function getBespokeHyderabadPage(slug: string): BespokeHyderabadPage | undefined {
  return BESPOKE_HYDERABAD_PAGES.find((p) => p.slug === slug);
}

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

// Every Hyderabad price page, labelled with its own H1 — one hub link per
// page so the whole cluster is reachable from /hyderabad rather than only
// from whichever sibling page happens to list it.
export const PRICE_PAGE_LINKS: LinkListEntry[] = PRICE_PAGES.map((p) => ({
  label: p.h1,
  href: `/hyderabad/${p.slug}`,
}));

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
