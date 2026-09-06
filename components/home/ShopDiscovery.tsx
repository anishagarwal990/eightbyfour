import { CategoryFlow } from "@/components/home/CategoryFlow";
import { ManufacturerStrip } from "@/components/ManufacturerStrip";
import type { DiscoveryTile } from "@/components/home/MaterialDiscovery";

interface RealBrand {
  slug: string;
  name: string;
  logo_url: string | null;
}

// The homepage's "walk into the showroom" beat — categories and brands as
// two opposing, continuously-flowing rails, immediately under the hero.
// Both rails are the same AutoScrollRow used elsewhere on the site (drag,
// swipe, hover-pause, prefers-reduced-motion already handled there); this
// component is just the heading scaffold and the direction/data wiring.
export function ShopDiscovery({ categories, brands }: { categories: DiscoveryTile[]; brands: RealBrand[] }) {
  return (
    <section aria-label="Shop materials and brands" className="border-t py-8 md:py-10" style={{ borderColor: "var(--line)" }}>
      <div className="px-7">
        <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
          Shop by Category
        </p>
      </div>
      <div className="mt-4">
        <CategoryFlow tiles={categories} />
      </div>

      <div className="mt-9 px-7">
        <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
          Shop by Brand
        </p>
      </div>
      <div className="mt-4">
        <ManufacturerStrip brands={brands} reverse />
      </div>
    </section>
  );
}
