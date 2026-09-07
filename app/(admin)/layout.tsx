import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";

// A SECOND ROOT LAYOUT. `app/(site)` and `app/(admin)` are sibling route
// groups, each owning its own <html>/<body>, so the admin console renders a
// separate document from the storefront rather than nesting inside it.
//
// Why not nest: layouts in the App Router only compose downwards, so while the
// public chrome lived in the single root layout, every admin page inherited the
// SKU marquee, the mega-menu header, the public product search and the
// marketing footer — roughly 180px of storefront above an operations table, plus
// the two catalogue queries (getCategoryCounts / getBrandsMenuData) and the
// marquee's client bundle on every admin request. None of that is fetched or
// shipped here now.
//
// Route groups do not appear in the URL: /admin/enquiries is still
// /admin/enquiries, and every public path is unchanged.
//
// Fonts are re-declared rather than imported from the site layout because
// next/font must be initialised at module scope in the file that uses it; both
// calls resolve to the same cached font files.

const instrumentSans = Instrument_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const generalSans = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
});

// Belt and braces with robots.ts — a noindex header on the area itself means an
// admin URL pasted into a chat or a referrer log can never be indexed.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${generalSans.variable} h-full antialiased`}>
      {/* No bottom padding for the storefront's sticky CTA bar, and no
          QuoteModalProvider — neither exists in here. */}
      <body className="min-h-full" style={{ background: "var(--paper-dim)" }}>
        {children}
      </body>
    </html>
  );
}
