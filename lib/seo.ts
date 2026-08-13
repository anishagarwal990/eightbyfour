import type { Metadata } from "next";

export const SITE_URL = "https://www.eightbyfour.com";
export const SITE_NAME = "EightByFour";
const DEFAULT_OG_IMAGE = "/og-image.jpg";

// `app/layout.tsx` wraps every page title in the "%s | EightByFour" template,
// so the rendered <title> is always opts.title + this suffix. Budget for it
// here so the *final* title (not just opts.title) stays under the ~60-char
// length crawlers/Google flag as "too long".
const TITLE_TEMPLATE_SUFFIX = " | EightByFour";
const MAX_TITLE_LENGTH = 60 - TITLE_TEMPLATE_SUFFIX.length;
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
  const title = truncate(opts.title, MAX_TITLE_LENGTH);
  const description = truncate(padDescription(opts.description.trim()), MAX_DESCRIPTION_LENGTH);
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
