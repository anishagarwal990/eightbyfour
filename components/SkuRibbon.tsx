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
      style={{ color: "var(--ink)" }}
    >
      <span className="whitespace-nowrap">{category.name}</span>
      <span className="whitespace-nowrap text-[10px]" style={{ color: "var(--line-strong)" }}>
        {category.count}
      </span>
    </Link>
  );
}

export function SkuRibbon({ counts }: { counts: Record<string, number> }) {
  const categories: RibbonCategory[] = CATEGORIES.filter((c) => (counts[c.dbCategory] || 0) > 0).map((c) => ({
    slug: c.slug,
    name: c.name,
    count: counts[c.dbCategory] || 0,
  }));

  if (categories.length === 0) return null;
  const items = [...categories, ...categories];

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        height: "var(--sku-ribbon-h)",
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(10px) saturate(1.4)",
        WebkitBackdropFilter: "blur(10px) saturate(1.4)",
      }}
      aria-label="Browse by category"
    >
      <AutoScrollRow className="sku-ribbon-mask h-full" trackClassName="flex h-full items-center gap-6 px-4" speed={20}>
        {items.map((c, i) => (
          <CategoryItem key={`${c.slug}-${i}`} category={c} />
        ))}
      </AutoScrollRow>
    </div>
  );
}
