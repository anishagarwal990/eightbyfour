import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SkuRibbon } from "@/components/SkuRibbon";
import { OrganizationSchema } from "@/components/schema/OrganizationSchema";
import { QuoteModalProvider } from "@/context/QuoteModalContext";
import { getCategoryCounts } from "@/lib/data/products";
import { getBrandsMenuData } from "@/lib/data/brands";

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
    template: "%s | EightByFour",
  },
  description:
    "EightByFour simplifies procurement of plywood, laminates, MDF, veneers, hardware and more directly from trusted manufacturers in Hyderabad — for contractors, architects, interior designers and builders.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/eightbyfour-logo.png",
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
      <body className="min-h-full flex flex-col">
        <OrganizationSchema />
        <QuoteModalProvider>
          <SkuRibbon counts={counts} />
          <SiteHeader categoryCounts={counts} brandsMenu={brandsMenu} />
          {children}
          <SiteFooter />
        </QuoteModalProvider>
      </body>
    </html>
  );
}
