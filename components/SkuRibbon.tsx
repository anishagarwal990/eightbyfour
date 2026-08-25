import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { AutoScrollRow } from "@/components/AutoScrollRow";

interface RibbonCategory {
  slug: string;
  name: string;
  count: number;
}

function CategoryItem({ category }: { category: RibbonCategory }) {
  return (
    <Link
      href={`/products/${category.slug}`}
      className="flex shrink-0 items-center gap-2 text-xs font-medium transition-colors duration-200 hover:text-[var(--burgundy)]"
      style={{ color: "var(--text-primary)" }}
    >
      <span className="whitespace-nowrap">{category.name}</span>
      <span className="metric whitespace-nowrap text-[10px]" style={{ color: "var(--text-muted)" }}>
        {category.count}
      </span>
    </Link>
  );
}

export function SkuRibbon({ counts }: { counts: Record<string, number> }) {
  // Sorted by depth, not by the CATEGORIES declaration order. Unsorted, the
  // very first thing a mobile visitor saw on the site was "Birch Plywood 1 ·
  // Boil Boards 2 · MDF and HDHMR 4" — the three thinnest rows in a 3,184-SKU
  // catalogue, which reads as an empty shop.
  const categories: RibbonCategory[] = CATEGORIES.filter((c) => (counts[c.dbCategory] || 0) > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: counts[c.dbCategory] || 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (categories.length === 0) return null;
  const items = [...categories, ...categories];

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        height: "var(--sku-ribbon-h)",
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(10px) saturate(1.4)",
        WebkitBackdropFilter: "blur(10px) saturate(1.4)",
      }}
      aria-label="Browse by category"
    >
      <AutoScrollRow className="sku-ribbon-mask h-full" trackClassName="flex h-full items-center gap-6 px-4" speed={45}>
        {items.map((c, i) => (
          <CategoryItem key={`${c.slug}-${i}`} category={c} />
        ))}
      </AutoScrollRow>
    </div>
  );
}
