import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SkuRibbon } from "@/components/SkuRibbon";
import { MobileStickyCTA } from "@/components/MobileStickyCTA";
import { OrganizationSchema } from "@/components/schema/OrganizationSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";
import { QuoteModalProvider } from "@/context/QuoteModalContext";
import { getCategoryCounts } from "@/lib/data/products";
import { getBrandsMenuData } from "@/lib/data/brands";
import { BRAND_SHORT } from "@/lib/seo";

const plexSans = Geist({
  variable: "--font-plex",
  subsets: ["latin"],
  display: "swap",
});

const canelaText = Geist({
  variable: "--font-canela",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eightbyfour.com"),
  title: {
    default: "EightByFour — Procurement Platform for Interior & Construction Materials in Hyderabad",
    template: `%s | ${BRAND_SHORT}`,
  },
  description:
    "EightByFour simplifies procurement of plywood, laminates, MDF, veneers, hardware and more directly from trusted manufacturers in Hyderabad — for contractors, architects, interior designers and builders.",
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
    <html lang="en" className={`${plexSans.variable} ${canelaText.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-14 lg:pb-0">
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
