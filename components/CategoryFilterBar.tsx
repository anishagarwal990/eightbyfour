import Link from "next/link";
import { chipStyle } from "@/components/ui/Button";
import { categoryPageUrl } from "@/lib/categoryPagination";
import type { CategoryFilterCounts } from "@/lib/data/products";

export const CHIP_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]";

// A filter change always jumps back to page 1 of that (sub)set — collection
// counts are small enough (tens to low hundreds) that re-paginating within
// the filtered subset is what "All (1349) / HPL (310) / ..." implies to a
// user, rather than resetting to the unfiltered list.
export function CategoryFilterBar({
  slug,
  filterCounts,
  active,
}: {
  slug: string;
  filterCounts: CategoryFilterCounts;
  active: string | null;
}) {
  if (filterCounts.collections.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link href={categoryPageUrl(slug, 1, null)} className={CHIP_CLASS} style={chipStyle(active === null)}>
        All ({filterCounts.total})
      </Link>
      {filterCounts.collections.map((c) => (
        <Link key={c.name} href={categoryPageUrl(slug, 1, c.name)} className={CHIP_CLASS} style={chipStyle(active === c.name)}>
          {c.name} ({c.count})
        </Link>
      ))}
      {filterCounts.otherCount > 0 ? (
        <Link href={categoryPageUrl(slug, 1, "other")} className={CHIP_CLASS} style={chipStyle(active === "other")}>
          Other ({filterCounts.otherCount})
        </Link>
      ) : null}
    </div>
  );
}
