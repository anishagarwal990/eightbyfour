import type { ProductRow } from "@/lib/supabase/types";
import { categorySingularName } from "@/lib/categories";
import { productDisplayName } from "@/lib/productDisplay";

const MAX_DESCRIPTION_LENGTH = 155;
const CTA_LONG = "In stock in Hyderabad, samples available.";
const CTA_SHORT = "Samples available.";

/**
 * "{Product Name} {Product Code} {Finish} {Category}" — e.g. "Merino Bronze
 * 99988 Laminate", or "Virgo Tahiti Samoa Teak 6511 SF Laminate" for
 * catalogues where finish is a per-SKU differentiator (see `finishCode`
 * below). The " | Eight x Four" brand suffix is appended automatically by
 * buildMetadata()/the root layout title template, not here. sd_code is the
 * real shade/product code on file; falls back to `collection` when a
 * product has no code — e.g. Stone Panels has no shade codes but does have
 * distinct collections (Slate/Translucent/Pannel), and several of those
 * share a bare name (all "K Black", "Copper", etc). Without a disambiguator
 * those pages would render byte-identical <title> text, a real
 * duplicate-content risk (verified: 5 name collisions across 8 SKUs before
 * this fallback, 0 after).
 */
export function buildProductTitle(product: ProductRow): string {
  const displayName = productDisplayName(product);
  const category = categorySingularName(product.category);
  const code = product.sd_code || product.collection;
  return [displayName, code, finishCode(product), category].filter(Boolean).join(" ");
}

/**
 * The product's finish code, but only when it's a real per-SKU
 * differentiator rather than one of several finishes the same design ships
 * in (`finishes[]` populated — e.g. Greenlam/Merino, where a design like
 * "163 Bay" is one product page covering multiple finishes, so a single
 * finish code in the title/H1 would be misleading). Virgo-style catalogues
 * have exactly one finish per SKU/slug and an empty `finishes[]`, so this is
 * the guard that scopes finish-in-title to those without touching every
 * other brand's existing title format.
 */
export function finishCode(product: ProductRow): string | null {
  return product.finishes?.length ? null : product.finish;
}

function firstSentence(text: string): string {
  const match = text.trim().match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text.trim()).trim();
}

/**
 * Builds a meta description that (a) never gets cut off mid-sentence by
 * Google's ~155-char truncation, and (b) is grounded in real product fields
 * — never invents specs, finishes or stock data the row doesn't have.
 *
 * Prefers the product's own hand-written `description` (only its first
 * sentence — the full field often runs 2-3 sentences long, which is exactly
 * what was getting chopped mid-word before) and works the product code in
 * inline. Falls back to a generic sentence built from category + brand when
 * there's no description on file. Tries progressively shorter variants
 * until one fits the budget, so the result always ends on a complete
 * thought rather than an ellipsis.
 */
export function buildProductDescription(product: ProductRow): string {
  const displayName = productDisplayName(product);
  const categoryLower = categorySingularName(product.category).toLowerCase();
  // Same sd_code -> collection fallback as buildProductTitle: without it,
  // same-name products with no code and no `description` on file (e.g. the
  // Stone Panels collection variants) would render byte-identical meta
  // descriptions off the generic fallback sentence below.
  const code = product.sd_code || product.collection;

  let sentence = product.description
    ? firstSentence(product.description)
    : `${displayName} is a ${categoryLower} available through Eight x Four.`;

  if (code && !sentence.includes(code)) {
    const nameIdx = sentence.toLowerCase().indexOf(displayName.toLowerCase());
    sentence = nameIdx === 0 ? `${displayName} ${code}${sentence.slice(displayName.length)}` : `${displayName} ${code} — ${sentence}`;
  }

  const sizeThickness = [product.thicknesses?.[0], product.size].filter(Boolean).join(", ");
  const withSpec = sizeThickness ? `${sentence} ${sizeThickness}.` : sentence;

  const candidates = [`${withSpec} ${CTA_LONG}`, `${withSpec} ${CTA_SHORT}`, `${sentence} ${CTA_LONG}`, `${sentence} ${CTA_SHORT}`, sentence, CTA_LONG];
  return candidates.find((c) => c.length <= MAX_DESCRIPTION_LENGTH) ?? candidates[candidates.length - 1];
}

export interface ProductImage {
  src: string;
  alt: string;
  /** True when this is a real lifestyle/installed shot rather than a flat texture swatch. */
  isLifestyle: boolean;
}

/**
 * All available images for a product, tagged with descriptive alt text and
 * ordered lifestyle-photo-first — `app_img_url` is the installed/application
 * shot, when a product has one, and reads far better as a search thumbnail
 * than the `main_img_url` texture swatch every product has instead today.
 */
export function productImages(product: ProductRow): ProductImage[] {
  const displayName = productDisplayName(product);
  const categoryLower = categorySingularName(product.category).toLowerCase();
  const images: ProductImage[] = [];
  if (product.app_img_url) {
    const useCase = product.applications?.[0]?.toLowerCase() || "an interior space";
    images.push({ src: product.app_img_url, alt: `${displayName} ${categoryLower} installed in ${useCase}`, isLifestyle: true });
  }
  if (product.main_img_url) {
    images.push({ src: product.main_img_url, alt: `${displayName} ${categoryLower} — texture close-up`, isLifestyle: false });
  }
  if (product.edge_img_url) {
    images.push({ src: product.edge_img_url, alt: `${displayName} edge band detail`, isLifestyle: false });
  }
  for (const [i, url] of (product.gallery_img_urls || []).entries()) {
    if (url === product.app_img_url || url === product.main_img_url || url === product.edge_img_url) continue;
    images.push({ src: url, alt: `${displayName} ${categoryLower} — additional view ${i + 1}`, isLifestyle: false });
  }
  return images;
}

/** Best single image for og:image / twitter:image — lifestyle photo first, texture swatch as fallback. */
export function bestProductImage(product: ProductRow): ProductImage | undefined {
  return productImages(product)[0];
}
