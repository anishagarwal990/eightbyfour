import type { Metadata } from "next";

export const SITE_URL = "https://www.eightbyfour.com";
export const SITE_NAME = "EightByFour";
const DEFAULT_OG_IMAGE = "/og-image.jpg";

// `app/layout.tsx` wraps every page title in the "%s | EightByFour" template,
// so the rendered <title> is always opts.title + this suffix.
const TITLE_TEMPLATE_SUFFIX = " | EightByFour";
// Prefer the full title over a mid-word ellipsis: if it fits the classic
// ~60-char SERP budget with the suffix, keep the suffix; if it's longer but
// still reasonable on its own, drop the suffix rather than chop live copy;
// only truncate (with an ellipsis) past this hard ceiling as a last resort,
// since Google/Bing already truncate visually in the SERP on their own.
const TITLE_SOFT_MAX = 60 - TITLE_TEMPLATE_SUFFIX.length;
const TITLE_HARD_MAX = 78;
// Google typically truncates meta descriptions around 155-160 characters,
// and treats anything under roughly 110-120 as too thin to show a useful
// snippet — pad short-but-true fallback copy (e.g. products with no
// database description) rather than leave it terse.
const MAX_DESCRIPTION_LENGTH = 155;
const MIN_DESCRIPTION_LENGTH = 120;
// Generic, always-true, and doesn't repeat "request trade pricing/delivery"
// wording the product/brand fallback copy already ends most sentences with.
const DESCRIPTION_PAD = " See specs, pricing and availability on this page.";

/** Truncate to `max` chars on a word boundary, appending an ellipsis. */
function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const clipped = trimmed.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const safe = lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${safe.trimEnd()}…`;
}

/**
 * Resolve a page's raw title into (a) the value for Next's `Metadata.title`
 * and (b) a plain string for OG/Twitter, which don't go through Next's
 * title-template mechanism. Three tiers, cheapest-to-worst:
 *  1. Fits the classic ~60-char SERP budget with " | EightByFour" — let
 *     `app/layout.tsx`'s title template add the suffix as normal.
 *  2. Longer than that but still a reasonable on-page title on its own —
 *     return `{ absolute }` to suppress the template (no suffix) rather
 *     than chop live, keyword-bearing copy.
 *  3. Longer than even the hard ceiling — truncate at a word boundary as a
 *     last resort. Google/Bing already truncate visually in the SERP; this
 *     ceiling only exists to stop pathologically long titles from bloating
 *     the HTML <title> tag itself.
 */
function resolveTitle(rawTitle: string): { metaTitle: Metadata["title"]; plainTitle: string } {
  const trimmed = rawTitle.trim();
  if (trimmed.length + TITLE_TEMPLATE_SUFFIX.length <= TITLE_SOFT_MAX) {
    return { metaTitle: trimmed, plainTitle: `${trimmed}${TITLE_TEMPLATE_SUFFIX}` };
  }
  if (trimmed.length <= TITLE_HARD_MAX) {
    return { metaTitle: { absolute: trimmed }, plainTitle: trimmed };
  }
  const clipped = truncate(trimmed, TITLE_HARD_MAX);
  return { metaTitle: { absolute: clipped }, plainTitle: clipped };
}

/**
 * Pad short descriptions (thin fallback copy, e.g. a product with no
 * database description) with a generic, always-true sentence instead of
 * fabricating specifics. Doesn't guarantee reaching MIN_DESCRIPTION_LENGTH
 * exactly — just extends anything under it as far as MAX_DESCRIPTION_LENGTH
 * allows, which in practice comfortably clears crawlers' "too short" bar.
 */
function padDescription(text: string): string {
  if (text.length >= MIN_DESCRIPTION_LENGTH) return text;
  const padded = `${text.trimEnd()}${DESCRIPTION_PAD}`;
  return padded.length <= MAX_DESCRIPTION_LENGTH ? padded : text;
}

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Category pages with zero live products — keep them out of the index until real inventory exists. */
  noindex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const image = opts.image || DEFAULT_OG_IMAGE;
  const { metaTitle, plainTitle } = resolveTitle(opts.title);
  const description = truncate(padDescription(opts.description.trim()), MAX_DESCRIPTION_LENGTH);
  return {
    title: metaTitle,
    description,
    alternates: { canonical: url },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: plainTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: plainTitle,
      description,
      images: [image],
    },
  };
}
