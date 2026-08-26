import type { Metadata } from "next";
import { getAllContent, type ContentEntry } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { ContentIndexView } from "@/components/ContentIndexView";
import { HyderabadLinkList } from "@/components/HyderabadLinkList";
import { BESPOKE_HYDERABAD_PAGES, POPULAR_SEARCHES, CATEGORY_LINKS, PRICE_PAGE_LINKS, SOURCE_ONLY_BRAND_LINKS, stockedBrandLinks } from "@/lib/hyderabadLinks";
import { PRICE_PAGES } from "@/lib/pricePages";

export const metadata: Metadata = buildMetadata({
  title: "Material Procurement in Hyderabad",
  description:
    "EightxFour is Hyderabad's procurement platform for interior and construction materials — plywood, laminates, veneers and hardware sourced directly from trusted manufacturers, city-wide.",
  path: "/hyderabad",
});

// Bespoke /hyderabad pages (their own page.tsx rather than MDX) come from the
// shared registry in lib/hyderabadLinks.ts, so this listing can't drift out of
// sync with what those routes actually are.
const BESPOKE_ENTRIES: ContentEntry[] = BESPOKE_HYDERABAD_PAGES.map((page) => ({
  slug: page.slug,
  frontmatter: { title: page.title, description: page.description },
  body: "",
}));

// Price pages live in lib/pricePages.ts rather than in content/hyderabad, so
// they need adapting to the same shape the index cards render from.
const PRICE_PAGE_ENTRIES: ContentEntry[] = PRICE_PAGES.map((page) => ({
  slug: page.slug,
  frontmatter: { title: page.h1, description: page.metaDescription },
  body: "",
}));

export default async function HyderabadIndexPage() {
  const entries = [...BESPOKE_ENTRIES, ...PRICE_PAGE_ENTRIES, ...getAllContent("hyderabad")];
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
          <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <HyderabadLinkList title="Price Guides" entries={PRICE_PAGE_LINKS} />
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
