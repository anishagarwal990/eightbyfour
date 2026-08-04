import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js Image Optimization is enabled (previously `unoptimized: true`,
    // which forced every <Image> — including the Supabase-hosted product
    // photos that make up most of the site's LCP elements — to skip resizing,
    // AVIF/WebP conversion and responsive srcset generation entirely. That is
    // the single biggest Core Web Vitals regression on this site; removing it
    // lets Next.js serve right-sized, modern-format images from cache.
    formats: ["image/avif", "image/webp"],
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
