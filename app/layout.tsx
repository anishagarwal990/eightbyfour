import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SkuRibbon } from "@/components/SkuRibbon";
import { OrganizationSchema } from "@/components/schema/OrganizationSchema";
import { QuoteModalProvider } from "@/context/QuoteModalContext";
import { getCategoryCounts } from "@/lib/data/products";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const counts = await getCategoryCounts();

  return (
    <html lang="en" className={`${plexSans.variable} ${canelaText.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <OrganizationSchema />
        <QuoteModalProvider>
          <SkuRibbon counts={counts} />
          <SiteHeader />
          {children}
          <SiteFooter />
        </QuoteModalProvider>
      </body>
    </html>
  );
}
