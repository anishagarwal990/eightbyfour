import type { Metadata } from "next";

export const SITE_URL = "https://www.eightbyfour.com";
export const SITE_NAME = "EightByFour";
const DEFAULT_OG_IMAGE = "/og-image.jpg";

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const image = opts.image || DEFAULT_OG_IMAGE;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}
