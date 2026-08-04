import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
