// Vercel's Image Optimization free-tier quota (1000 src/month) was getting
// exhausted, forcing images.unoptimized:true — see next.config.ts history.
// This replaces it with Cloudflare Images instead: every Supabase-hosted
// product/brand image was copied into Cloudflare Images (see
// scripts/migrate-images.mjs) under a deterministic ID derived from its
// Supabase path, and this loader derives the *same* ID at request time to
// build the imagedelivery.net URL — no DB changes, no ID-mapping table.
//
// cfImageId() must stay byte-identical to the one in
// scripts/migrate-images.mjs. It's plain string manipulation (no crypto)
// because Next.js can invoke a custom loader in the browser too (to build
// srcset candidates), where node:crypto isn't available.

const ACCOUNT_HASH = "73dwZlgXVDC33BEcQTxpKw";
const SUPABASE_PREFIX = "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/";

export function cfImageId(url: string): string {
  const path = url.startsWith(SUPABASE_PREFIX) ? url.slice(SUPABASE_PREFIX.length) : url;
  const noExt = path.replace(/\.[a-zA-Z0-9]+$/, "");
  const slug = noExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `ebf-${slug}`;
}

export default function cloudflareImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith(SUPABASE_PREFIX)) {
    // Local /public assets (brand-logo fallbacks, og-image, etc.) and any
    // other non-Supabase source aren't in Cloudflare Images — serve as-is.
    return src;
  }
  const id = cfImageId(src);
  const q = quality ?? 75;
  return `https://imagedelivery.net/${ACCOUNT_HASH}/${id}/w=${width},quality=${q},format=auto`;
}
