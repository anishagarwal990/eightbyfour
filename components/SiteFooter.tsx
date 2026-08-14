import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { BrandWordmark } from "@/components/BrandWordmark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t px-7 py-10 text-sm" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10">
        <div>
          <BrandWordmark size={22} />
          <p className="mt-2 max-w-xs" style={{ color: "var(--line-strong)" }}>
            EightByFour is Hyderabad&apos;s procurement platform for interior and construction materials — plywood,
            MDF, laminates, veneers and hardware, sourced directly from trusted manufacturers.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            ↗ Chat with us on WhatsApp
          </a>
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Products">
          <span className="tracked-caps text-xs">Products</span>
          <Link href="/products" className="hover:opacity-70">
            All Categories
          </Link>
          <Link href="/brands" className="hover:opacity-70">
            All Brands
          </Link>
        </nav>
        <nav className="flex flex-col gap-1.5" aria-label="Resources">
          <span className="tracked-caps text-xs">Resources</span>
          <Link href="/guides" className="hover:opacity-70">
            Buying Guides
          </Link>
          <Link href="/comparisons" className="hover:opacity-70">
            Comparisons
          </Link>
          <Link href="/applications" className="hover:opacity-70">
            Applications
          </Link>
        </nav>
        <nav className="flex flex-col gap-1.5" aria-label="Hyderabad">
          <span className="tracked-caps text-xs">Hyderabad</span>
          <Link href="/hyderabad" className="hover:opacity-70">
            Procurement in Hyderabad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
