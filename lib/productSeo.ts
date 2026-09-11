import type { ProductRow } from "@/lib/supabase/types";
import type { PriceInfo } from "./pricing.ts";
import { categorySingularName } from "./categories.ts";
import { productDisplayName } from "./productDisplay.ts";
import { displayPrice, resolvePrice } from "./pricing.ts";
import { finishLabel } from "./finishGlossary.ts";
import { seoTierForSlug } from "./seoProtection.ts";

// Product metadata rules — the <title>, H1 and meta description of every
// product page. These ~3,100 pages are the site's main organic channel, so
// every rule here is deterministic, reads only fields that are on the row
// (never inventing a spec, finish, price or stock level), and is pinned by
// lib/productSeo.test.ts. Relative `.ts` imports keep it loadable by
// `node --test` without the Next toolchain.
//
//   Identity  "Merino 22153 Saga Green"                             brand + code + shade (+ per-SKU finish)
//   Heading   "Merino 22153 Saga Green Laminate"                    identity + product type — H1, schema name
//   Title     "Merino 22153 Saga Green Laminate — Price & Finishes" heading + one intent qualifier, if it fits
//
// Token order matches how these SKUs are searched — "merino 22153 saga
// green", "3245 lu century laminates" — and every token the previous title
// format carried is still there in the same order, so pages already ranking
// in the top three keep their matching terms. The full rulebook lives in
// docs/SEO-SEARCH-GROWTH.md.

type SeoProduct = Pick<
  ProductRow,
  "slug" | "brand" | "name" | "category" | "sd_code" | "collection" | "finish" | "finishes" | "price_table" | "size" | "thicknesses" | "description"
>;

// Board categories where the dominant search for a named SKU is a price
// query ("century sainik 710 price") and the catalogue is small enough that
// the title has room for it. Priced boards keep this exact pre-existing
// format so their live titles don't churn.
const PRICE_QUALIFIER = "Price in Hyderabad";
const PRICE_INTENT_CATEGORIES = new Set(["Plywood", "Birch Plywood", "Boil Boards", "MDF and HDHMR", "Blockboard", "NFC Boards"]);
// Mirrors TITLE_HARD_MAX in lib/seo.ts — past this, buildMetadata truncates.
const TITLE_HARD_MAX = 78;
// Longest title that still gets an intent qualifier. Google shows roughly the
// first 60–65 characters; a qualifier pushed past ~70 would be cut from the
// snippet and only add length, so past this the plain heading is the title.
const QUALIFIED_TITLE_MAX = 70;
const MAX_DESCRIPTION_LENGTH = 155;

// The noun a buyer puts after the product name. Mostly the singular category,
// but "Corian - Acrylic Solid Surface" and "MDF and HDHMR" are catalogue
// labels, not words anyone types after a shade name.
const PRODUCT_TYPE_WORD: Record<string, string> = {
  Laminates: "Laminate",
  Veneers: "Veneer",
  Plywood: "Plywood",
  "Birch Plywood": "Birch Plywood",
  "Boil Boards": "Boil Board",
  "MDF and HDHMR": "Board",
  "Corian - Acrylic Solid Surface": "Solid Surface",
  Adhesive: "Adhesive",
  "NFC Boards": "NFC Board",
  Blockboard: "Blockboard",
  "Cement Board": "Cement Board",
};

const PRICED_CLOSES = ["Get project pricing for bulk orders and Hyderabad delivery.", "Project pricing and Hyderabad delivery."] as const;
const UNPRICED_CLOSES = [
  "Price on request — get today's rate and project pricing with Hyderabad delivery.",
  "Price on request — get today's rate and Hyderabad delivery.",
] as const;

export function productTypeWord(product: Pick<ProductRow, "category">): string {
  return PRODUCT_TYPE_WORD[product.category] ?? categorySingularName(product.category);
}

/** Lowercased word stream for containment checks — "Century Laminates (1mm)" → "century laminates 1mm". */
function words(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .trim();
}

/** Whether `text` already says `phrase`, as whole words, singular or plural. */
function mentions(text: string, phrase: string): boolean {
  const needle = words(phrase);
  if (!needle) return true;
  const haystack = ` ${words(text)} `;
  return haystack.includes(` ${needle} `) || haystack.includes(` ${needle}s `) || haystack.includes(` ${needle}es `);
}

/**
 * Join name parts, skipping any part the text before it already says — so
 * "Natural Veneer 11" + collection "Natural Veneer" + type "Veneer" stays
 * "Natural Veneer 11", and "Century Laminates …" never ends "… Laminate".
 */
function joinParts(parts: (string | null | undefined)[]): string {
  let out = "";
  for (const raw of parts) {
    const part = raw?.replace(/\s+/g, " ").trim();
    if (!part) continue;
    if (out && mentions(out, part)) continue;
    out = out ? `${out} ${part}` : part;
  }
  return out;
}

/** `name` with a leading brand token removed, if present ("Wigwam Excel MR" → "MR"). */
function stripBrand(name: string, brand: string): string {
  if (!brand) return name;
  return name.toLowerCase().startsWith(brand.toLowerCase()) ? name.slice(brand.length).trim() || name : name;
}

/** `text` minus any whitespace-separated token equal to `token` — keeps a code already in the name from printing twice. */
function withoutToken(text: string, token: string): string {
  const target = words(token);
  return text
    .split(/\s+/)
    .filter((t) => words(t) !== target)
    .join(" ");
}

/**
 * The product's finish code, but only when it's a real per-SKU
 * differentiator rather than one of several finishes the same design ships
 * in (`finishes[]` populated — e.g. Greenlam/Merino, where a design like
 * "163 Bay" is one product page covering multiple finishes, so a single
 * finish code in the title/H1 would be misleading). Virgo-style catalogues
 * have exactly one finish per SKU/slug and an empty `finishes[]`.
 */
export function finishCode(product: Pick<ProductRow, "finish" | "finishes">): string | null {
  return product.finishes?.length ? null : product.finish?.trim() || null;
}

/**
 * "Merino 22153 Saga Green", "Virgo 1987 Coined SHG", "Century Cenboil Plus".
 * With a real shade code: brand + code + shade name (+ per-SKU finish).
 * Without one: the display name, disambiguated by collection — several
 * code-less SKUs share a bare name ("K Black", "Copper"), and without it
 * their pages would render byte-identical titles.
 */
export function productIdentity(product: Pick<SeoProduct, "brand" | "name" | "sd_code" | "collection" | "finish" | "finishes">): string {
  const brand = product.brand?.trim() ?? "";
  const code = product.sd_code?.trim();
  if (code) {
    const shade = withoutToken(stripBrand(product.name.trim(), brand), code);
    return joinParts([brand, code, shade, finishCode(product)]);
  }
  return joinParts([productDisplayName({ brand, name: product.name.trim() }), product.collection, finishCode(product)]);
}

/** Identity + product type — "Merino 22153 Saga Green Laminate". Used as the H1 and the schema name. */
export function buildProductHeading(product: Pick<SeoProduct, "brand" | "name" | "category" | "sd_code" | "collection" | "finish" | "finishes">): string {
  return joinParts([productIdentity(product), productTypeWord(product)]);
}

function titleQualifiers(product: Pick<SeoProduct, "finishes">, price: PriceInfo | null): string[] {
  // Unpriced SKUs keep the bare identity+type title — no "Price on Request"
  // qualifier. ~1,994 SKUs (two-thirds of the catalogue) have no rate on
  // file; appending the same four words to every one of their titles reads
  // as thin, near-duplicate boilerplate to a crawler and adds nothing a
  // buyer couldn't already tell from "no ₹ in the snippet". Price language
  // stays in the description, the page and the CTA — see docs/SEO-SEARCH-GROWTH.md.
  if (!price) return [];
  if ((product.finishes?.length ?? 0) > 1) return ["Price & Finishes", "Price"];
  if (price.unit === "sheet") return ["Sheet Price", "Price"];
  if (price.unit === "pack") return ["Price & Pack Sizes", "Price"];
  return ["Price & Specs", "Price"];
}

/**
 * Reproduces the title algorithm this replaces, exactly — brand + code +
 * shade + finish + category (no dedup, no defect fixes), with the legacy
 * "Price in Hyderabad" suffix on priced board categories. Used only to
 * preserve a "protect"-tier page's pre-existing title (see buildProductTitle
 * and lib/seoProtection.ts) so a page already converting well never sees its
 * snippet change as a side effect of this pass.
 */
export function legacyProductTitle(product: SeoProduct): string {
  const category = categorySingularName(product.category);
  const code = product.sd_code || product.collection;
  const base = product.sd_code
    ? [product.brand, product.sd_code, stripBrand(product.name, product.brand), finishCode(product), category].filter(Boolean).join(" ")
    : [productDisplayName(product), code, finishCode(product), category].filter(Boolean).join(" ");
  const priced = PRICE_INTENT_CATEGORIES.has(product.category) && resolvePrice(product) !== null;
  const withPrice = `${base} ${PRICE_QUALIFIER}`;
  return priced && withPrice.length <= TITLE_HARD_MAX ? withPrice : base;
}

/**
 * A real defect in the pre-session title algorithm, not a stylistic
 * difference — a whole word repeated (ignoring a trailing "s", so
 * "Laminates … Laminate" counts), or a raw dbCategory label with its
 * internal " - " separator leaking straight into the title (e.g.
 * "Corian - Acrylic Solid Surface"). Used only to decide whether a
 * "protect"-tier page's legacy title is safe to keep as-is.
 */
export function hasTitleDefect(title: string): boolean {
  if (/ - /.test(title)) return true; // an internal label's separator, not the "—" this session's qualifiers use
  const seen = new Map<string, number>();
  for (const token of words(title).split(" ")) {
    if (token.length <= 3) continue; // skip finish/edge codes ("SF", "LN") and short words
    const stem = token.endsWith("s") ? token.slice(0, -1) : token;
    seen.set(stem, (seen.get(stem) ?? 0) + 1);
  }
  return [...seen.values()].some((count) => count > 1);
}

/**
 * The page <title>, before the " | Eight x Four" suffix buildMetadata adds
 * when it fits.
 *
 * "protect"-tier pages (already top-3 with healthy CTR, per the Search
 * Console opportunity snapshot — lib/seoProtection.ts) keep their
 * pre-session title unless it has a genuine defect, in which case they fall
 * back to the plain heading. A high-performing snippet never changes just to
 * fit the new template.
 *
 * "optimise"/"discover"-tier pages get heading + one qualifier chosen from
 * what the row can back up:
 *   priced, several finishes  → "— Price & Finishes"
 *   priced per sheet          → "— Sheet Price"
 *   priced per pack           → "— Price & Pack Sizes"
 *   priced otherwise          → "— Price & Specs"
 *   no rate on file           → no qualifier — the bare heading
 *   priced board categories   → " Price in Hyderabad" (unchanged legacy format)
 * A qualifier that would push the title past QUALIFIED_TITLE_MAX falls back
 * to a shorter one, then to the bare heading.
 */
export function buildProductTitle(product: SeoProduct): string {
  const heading = buildProductHeading(product);

  if (seoTierForSlug(product.slug) === "protect") {
    const legacy = legacyProductTitle(product);
    return hasTitleDefect(legacy) ? heading : legacy;
  }

  const price = resolvePrice(product);
  if (price && PRICE_INTENT_CATEGORIES.has(product.category)) {
    const withPrice = `${heading} ${PRICE_QUALIFIER}`;
    return withPrice.length <= TITLE_HARD_MAX ? withPrice : heading;
  }
  for (const qualifier of titleQualifiers(product, price)) {
    const title = `${heading} — ${qualifier}`;
    if (title.length <= QUALIFIED_TITLE_MAX) return title;
  }
  return heading;
}

/** Finish labels a buyer can read — "Feather Touch (FT)" where the code is defined, the raw value otherwise. */
export function productFinishLabels(product: Pick<ProductRow, "brand" | "finish" | "finishes">): string[] {
  const values = product.finishes?.length ? product.finishes : product.finish ? [product.finish] : [];
  const labels = values.map((v) => v.trim()).filter(Boolean).map((v) => finishLabel(product.brand, v));
  return [...new Set(labels)];
}

/** A collection value worth naming on the page — not a placeholder like "other" or the category's own name ("Laminates"). */
export function isNamedCollection(product: Pick<ProductRow, "collection" | "category">): boolean {
  const collection = product.collection?.trim();
  if (!collection || collection.toLowerCase() === "other") return false;
  return words(collection) !== words(product.category);
}

/** "8×4 ft (2440×1220mm)" → "8×4 ft" — the short form keeps a spec clause compact. */
function shortSize(size: string | null): string | null {
  if (!size) return null;
  return size.replace(/\s*\(.*\)\s*$/, "").trim() || null;
}

/** "8mm" for one thickness; "8–18mm" across a range when every value is a plain mm figure; else the first entry. */
export function thicknessSummary(thicknesses: string[] | null): string | null {
  const values = (thicknesses ?? []).map((t) => t.trim()).filter(Boolean);
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  const mm = values.map((t) => {
    const match = t.match(/^(\d+(?:\.\d+)?)\s*mm$/i);
    return match ? Number(match[1]) : null;
  });
  if (mm.every((n): n is number => n !== null)) {
    const min = Math.min(...mm);
    const max = Math.max(...mm);
    return min === max ? `${min}mm` : `${min}–${max}mm`;
  }
  return values[0];
}

function firstSentence(text: string): string {
  const match = text.trim().match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text.trim()).trim();
}

function squash(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** First candidate that fits Google's ~155-char snippet, so the description ends on a whole sentence, not an ellipsis. */
function firstThatFits(candidates: string[]): string {
  const clean = candidates.map(squash);
  return clean.find((c) => c.length <= MAX_DESCRIPTION_LENGTH) ?? clean[clean.length - 1];
}

function listJoin(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Finish clauses, most informative first: named ("in Standard, Feather Touch (FT) and MR+ finishes"), then counted ("in 5 finishes"). */
function finishClauses(product: SeoProduct, identity: string): string[] {
  const labels = productFinishLabels(product);
  if (labels.length > 1) {
    const shown = labels.slice(0, 3);
    const more = labels.length - shown.length;
    const named = more > 0 ? `in ${shown.join(", ")} and ${more} more finishes` : `in ${listJoin(shown)} finishes`;
    return [named, `in ${labels.length} finishes`];
  }
  // A bare code the identity already carries ("… French Cambric LN") adds nothing.
  if (labels.length === 1 && !mentions(identity, labels[0])) return [`in ${labels[0]} finish`];
  return [];
}

/** "Marine-grade BWP HDF for kitchens — 100% hardwood…" → "Marine-grade BWP HDF for kitchens." — for when the whole sentence won't fit. */
function firstClause(sentence: string): string {
  const cut = sentence.split(/\s[—–]\s|;\s/)[0].trim();
  return cut === sentence ? sentence : `${cut.replace(/[,:]$/, "")}.`;
}

/**
 * Shade-code catalogues (laminates, solid surface): identity, then the facts
 * a code-searcher checks — finish, price, thickness, sheet size — then the
 * commercial close. Built from structured fields rather than the row's
 * `description`, which for these ranges is near-identical boilerplate across
 * hundreds of SKUs.
 */
function shadeDescription(product: SeoProduct): string {
  const identity = productIdentity(product);
  const subject = joinParts([identity, productTypeWord(product).toLowerCase()]);
  const price = resolvePrice(product);
  const facts = [price ? displayPrice(price).netLabel : null, thicknessSummary(product.thicknesses), shortSize(product.size)].filter(Boolean);
  const factText = facts.length ? ` — ${facts.join(", ")}` : "";
  const clauses = finishClauses(product, identity);
  const leadFor = (clause?: string) => `${subject}${clause ? ` ${clause}` : ""}${factText}.`;
  const collection = product.collection?.trim() ?? "";
  const [long, short] = price ? PRICED_CLOSES : UNPRICED_CLOSES;
  const candidates: string[] = [];
  for (const clause of clauses) {
    const lead = leadFor(clause);
    // Virgo's collections are its finish names — don't say it twice.
    const range = isNamedCollection(product) && !mentions(clause, collection) ? ` From the ${collection} range.` : "";
    candidates.push(`${lead}${range} ${long}`, `${lead}${range} ${short}`, `${lead} ${long}`, `${lead} ${short}`);
  }
  const bareRange = clauses.length === 0 && isNamedCollection(product) ? ` From the ${collection} range.` : "";
  candidates.push(`${leadFor()}${bareRange} ${long}`, `${leadFor()}${bareRange} ${short}`, `${leadFor()} ${long}`, `${leadFor()} ${short}`, leadFor(clauses[0]));
  return firstThatFits(candidates);
}

/**
 * Boards, adhesives and other code-less SKUs, where the hand-written
 * `description` is the useful part: its first sentence (the full field runs
 * 2–3 sentences and used to get cut mid-word), led by the product's name if
 * the sentence doesn't already say it, then specs and the commercial close.
 */
function boardDescription(product: SeoProduct): string {
  const displayName = productDisplayName(product);
  const label = joinParts([displayName, product.collection]);
  const type = productTypeWord(product).toLowerCase();
  let sentence = product.description ? firstSentence(product.description) : `${joinParts([label, type])} is available through Eight x Four.`;
  if (!mentions(sentence, label)) {
    sentence = sentence.toLowerCase().startsWith(displayName.toLowerCase())
      ? `${label}${sentence.slice(displayName.length)}`
      : `${label}: ${sentence}`;
  }

  const price = resolvePrice(product);
  const specs = [thicknessSummary(product.thicknesses), shortSize(product.size)].filter(Boolean).join(", ");

  if (price) {
    const specHead = [`${joinParts([label, type])} — ${displayPrice(price).netLabel}`, specs].filter(Boolean).join(", ");
    const detail = product.description ? firstSentence(product.description) : "";
    const [long, short] = PRICED_CLOSES;
    return firstThatFits([
      `${specHead}. ${detail} ${long}`,
      `${specHead}. ${detail} ${short}`,
      `${specHead}. ${detail}`,
      `${specHead}. ${long}`,
      `${specHead}. ${short}`,
      `${specHead}.`,
    ]);
  }

  const withSpec = specs ? `${sentence} ${specs}.` : sentence;
  const clause = firstClause(sentence);
  const clauseWithSpec = specs ? `${clause} ${specs}.` : clause;
  const [long, short] = UNPRICED_CLOSES;
  return firstThatFits([
    `${withSpec} ${long}`,
    `${withSpec} ${short}`,
    `${sentence} ${long}`,
    `${sentence} ${short}`,
    `${clauseWithSpec} ${short}`,
    `${clause} ${long}`,
    `${clause} ${short}`,
    withSpec,
    sentence,
  ]);
}

/**
 * Meta description, ≤155 chars, ending on a complete sentence. Identity +
 * useful facts + a pricing/delivery close, grounded only in real fields.
 */
export function buildProductDescription(product: SeoProduct): string {
  return product.sd_code?.trim() ? shadeDescription(product) : boardDescription(product);
}

export interface ProductImage {
  src: string;
  alt: string;
  /** True when this is a real lifestyle/installed shot rather than a flat texture swatch. */
  isLifestyle: boolean;
  /**
   * True for the brand-logo stand-in used where a manufacturer's swatch
   * hasn't been imported yet (most Century Laminates / Virgo rows). Shown on
   * the page, but never described as the product or offered to Google as a
   * product photo.
   */
  isPlaceholder: boolean;
}

const PLACEHOLDER_IMAGE_PREFIX = "/brand-logos/";

/** Finish a gallery image shows, from its filename ("…/22153-ft.png" + finishes ["Standard","FT"] → "FT"). */
function finishFromImageUrl(url: string, finishes: string[] | null): string | null {
  if (!finishes?.length) return null;
  const file = url.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "";
  const suffix = file.split("-").pop()?.toLowerCase() ?? "";
  if (!suffix) return null;
  return finishes.find((f) => f.toLowerCase().replace(/[^a-z0-9]/g, "") === suffix) ?? null;
}

/**
 * All available images for a product, tagged with descriptive alt text and
 * ordered lifestyle-photo-first — `app_img_url` is the installed/application
 * shot, when a product has one, and reads far better as a search thumbnail
 * than the `main_img_url` texture swatch every product has instead today.
 */
export function productImages(
  product: Pick<ProductRow, "brand" | "name" | "category" | "sd_code" | "collection" | "finish" | "finishes" | "applications" | "app_img_url" | "main_img_url" | "edge_img_url" | "gallery_img_urls">
): ProductImage[] {
  const heading = buildProductHeading(product);
  const images: ProductImage[] = [];
  if (product.app_img_url) {
    const useCase = product.applications?.[0]?.toLowerCase() || "an interior space";
    images.push({ src: product.app_img_url, alt: `${heading} installed in ${useCase}`, isLifestyle: true, isPlaceholder: false });
  }
  if (product.main_img_url) {
    const placeholder = product.main_img_url.startsWith(PLACEHOLDER_IMAGE_PREFIX);
    const finish = placeholder ? null : finishFromImageUrl(product.main_img_url, product.finishes);
    images.push({
      src: product.main_img_url,
      alt: placeholder
        ? `${product.brand} logo`
        : finish
          ? `${heading} in ${finishLabel(product.brand, finish)} finish`
          : `${heading} — texture close-up`,
      isLifestyle: false,
      isPlaceholder: placeholder,
    });
  }
  if (product.edge_img_url) {
    images.push({ src: product.edge_img_url, alt: `${heading} edge band detail`, isLifestyle: false, isPlaceholder: false });
  }
  for (const [i, url] of (product.gallery_img_urls || []).entries()) {
    if (url === product.app_img_url || url === product.main_img_url || url === product.edge_img_url) continue;
    const finish = finishFromImageUrl(url, product.finishes);
    images.push({
      src: url,
      alt: finish ? `${heading} in ${finishLabel(product.brand, finish)} finish` : `${heading} — additional view ${i + 1}`,
      isLifestyle: false,
      isPlaceholder: false,
    });
  }
  return images;
}

/** Best single image for og:image / twitter:image — a real photo first, the brand-logo stand-in only as a last resort. */
export function bestProductImage(product: Parameters<typeof productImages>[0]): ProductImage | undefined {
  const images = productImages(product);
  return images.find((img) => !img.isPlaceholder) ?? images[0];
}
