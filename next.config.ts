import type { NextConfig } from "next";

const SUPABASE_ORIGIN = "https://svjlalgrcuwyvwpxriwd.supabase.co";

// Report-only for now — the app leans on inline `style` props throughout
// (Tailwind + arbitrary values), so a style-src without 'unsafe-inline'
// would need a broader nonce/hash rollout to enforce safely. Report-only
// still surfaces violations (via a browser's console/reporting) without any
// risk of breaking the live site.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${SUPABASE_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_ORIGIN} wss://${new URL(SUPABASE_ORIGIN).host}`,
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
  images: {
    // Vercel's free-tier image optimization quota (1000 src/month) got
    // exhausted, so /_next/image started returning 402 for every request —
    // breaking every <Image> on the site. unoptimized:true bypasses the
    // Vercel optimizer entirely; images load straight from Supabase.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "svjlalgrcuwyvwpxriwd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
