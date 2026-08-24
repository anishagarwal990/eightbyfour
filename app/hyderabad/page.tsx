import type { Metadata } from "next";
import { getAllContent, type ContentEntry } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { ContentIndexView } from "@/components/ContentIndexView";
import { HyderabadLinkList } from "@/components/HyderabadLinkList";
import { POPULAR_SEARCHES, CATEGORY_LINKS, SOURCE_ONLY_BRAND_LINKS, stockedBrandLinks } from "@/lib/hyderabadLinks";

export const metadata: Metadata = buildMetadata({
  title: "Material Procurement in Hyderabad",
  description:
    "EightxFour is Hyderabad's procurement platform for interior and construction materials — plywood, laminates, veneers and hardware sourced directly from trusted manufacturers, city-wide.",
  path: "/hyderabad",
});

// These three have bespoke page templates (app/hyderabad/<slug>/page.tsx) instead
// of MDX content, so they're listed here by hand alongside the MDX-driven entries.
const PERSONA_ENTRIES: ContentEntry[] = [
  {
    slug: "contractor-procurement",
    frontmatter: {
      title: "Contractor Procurement in Hyderabad",
      description: "Every stocked category in one view, with live SKU counts and trade pricing — built for contractors running multiple sites.",
    },
    body: "",
  },
  {
    slug: "architect-material-sourcing",
    frontmatter: {
      title: "Architect Material Sourcing in Hyderabad",
      description: "Real photography from our veneer, stone and solid-surface catalogue — for specifying, not browsing.",
    },
    body: "",
  },
  {
    slug: "homeowner-materials",
    frontmatter: {
      title: "Materials for Your Home in Hyderabad",
      description: "Plain-language guidance by room — kitchen, wardrobe, TV unit — instead of a raw materials catalogue.",
    },
    body: "",
  },
];

export default async function HyderabadIndexPage() {
  const entries = [...PERSONA_ENTRIES, ...getAllContent("hyderabad")];
  const brands = await getAllBrandsWithCounts();

  return (
    <ContentIndexView
      type="hyderabad"
      title="Hyderabad"
      intro="EightxFour operates only in Hyderabad — every material we stock, and every process below, is built around this city's sites and delivery routes."
      entries={entries}
    >
      <section className="px-7 pb-16" style={{ background: "var(--paper-dim)" }}>
        <div className="py-10">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Serving Hyderabad
          </p>
          <h2 className="serif mt-1" style={{ fontSize: "var(--fs-h2)" }}>
            Shop Hyderabad by Material &amp; Brand
          </h2>
          <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            Every link below goes to a real, in-stock catalogue page or brand page. Can&apos;t find what you&apos;re
            looking for? Request a quote and we&apos;ll source it — we cover far more than what&apos;s listed here.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <HyderabadLinkList title="Popular Searches" entries={POPULAR_SEARCHES} />
            <HyderabadLinkList title="Shop by Category" entries={CATEGORY_LINKS} />
            <HyderabadLinkList title="Brands We Work With" entries={stockedBrandLinks(brands)} />
            <HyderabadLinkList title="More Brands — Ask Us" entries={SOURCE_ONLY_BRAND_LINKS} />
          </div>
        </div>
      </section>
    </ContentIndexView>
  );
}
