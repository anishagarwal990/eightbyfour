import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SkuRibbon } from "@/components/SkuRibbon";
import { MobileStickyCTA } from "@/components/MobileStickyCTA";
import { OrganizationSchema } from "@/components/schema/OrganizationSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";
import { QuoteModalProvider } from "@/context/QuoteModalContext";
import { MarketingTracking } from "@/components/MarketingTracking";
import { getCategoryCounts } from "@/lib/data/products";
import { getBrandsMenuData } from "@/lib/data/brands";
import { BRAND_SHORT } from "@/lib/seo";

// Two faces, no exceptions.
//   Instrument Sans — the 8x4 mark, headings, numerals, stat figures, labels
//   General Sans    — body copy, UI, buttons, form fields, tables, specs
//
// Both were placeholders before this: --font-plex and --font-canela were the
// same Geist instance under two names, so the whole site rendered in one face
// and the display/body distinction existed only in the token names. The
// aliases are kept pointing at the new faces in globals.css so ~24 files that
// already say `font-serif` or `.serif` pick up the display face untouched.
//
// Instrument Sans is a slightly narrow grotesque with flat terminals and
// tabular-friendly figures — it holds a large headline and an 11px spec label
// in the same architectural voice, and its numerals carry the catalogue counts.
const instrumentSans = Instrument_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Self-hosted rather than pulled from the Fontshare CDN at runtime: General
// Sans is the body face, so a third-party round-trip on every page load is
// the difference between text painting immediately and a flash of fallback.
const generalSans = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "./fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eightbyfour.com"),
  title: {
    default: "EightxFour — Procurement Platform for Interior & Construction Materials in Hyderabad",
    template: `%s | ${BRAND_SHORT}`,
  },
  description:
    "EightxFour simplifies procurement of plywood, laminates, MDF, veneers, hardware and more directly from trusted manufacturers in Hyderabad — for contractors, architects, interior designers and builders.",
  manifest: "/manifest.webmanifest",
  // favicon.svg dropped from this list — same reason as before (old abstract
  // glyph reads as a blob at favicon size). icon.png/apple-icon.png/favicon.ico
  // are the "Black on white — print" variant from the Brand Identity design doc:
  // Georgia Bold "8 x 4" monogram, black on a warm-white rounded tile.
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6e1f2e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [counts, brandsMenu] = await Promise.all([getCategoryCounts(), getBrandsMenuData()]);

  return (
    <html lang="en" className={`${instrumentSans.variable} ${generalSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Suspense fallback={null}>
          <MarketingTracking />
        </Suspense>
        <OrganizationSchema />
        <WebSiteSchema />
        <QuoteModalProvider>
          <SkuRibbon counts={counts} />
          <SiteHeader categoryCounts={counts} brandsMenu={brandsMenu} />
          {children}
          <SiteFooter />
          <MobileStickyCTA />
        </QuoteModalProvider>
      </body>
    </html>
  );
}
