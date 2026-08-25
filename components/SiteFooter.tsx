import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { BrandWordmark } from "@/components/BrandWordmark";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t px-7 py-10 text-sm" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10">
        <div>
          <BrandWordmark size={22} />
          <p className="mt-2 max-w-xs" style={{ color: "var(--line-strong)" }}>
            EightxFour is a material procurement partner for interior and construction projects in Hyderabad — one
            requirement across plywood, boards, laminates, veneers, solid surface, adhesives and hardware, sourced
            directly from manufacturers and quoted as one list.
          </p>
          <WhatsAppTrackedLink
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            source="footer"
            className="mt-3 inline-block hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            ↗ Chat with us on WhatsApp
          </WhatsAppTrackedLink>
          <Link href="/contact" className="mt-2 block hover:opacity-70" style={{ color: "var(--accent)" }}>
            Contact &amp; office details →
          </Link>
          <Link href="/about" className="mt-2 block hover:opacity-70" style={{ color: "var(--accent)" }}>
            About EightxFour →
          </Link>
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
      <div className="mx-auto mt-10 max-w-6xl border-t pt-6 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
        <p>EightxFour is a unit of DRG Group.</p>
        <p className="mt-1">Registered Office: 7-1-21/B 106 Sita Sarovar, Begumpet, Hyderabad, 500016, TG</p>
      </div>
    </footer>
  );
}
