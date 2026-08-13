import Link from "next/link";
import type { ScrollSpyItem } from "@/components/CategoryScrollSpy";

/** Static title card ahead of the category scroll list — sets up "explore the catalogue" before the list itself starts scrubbing. */
export function CategoryExploreIntro({ items }: { items: ScrollSpyItem[] }) {
  if (items.length === 0) return null;
  const featured = items.slice(0, 3);

  return (
    <section className="relative overflow-hidden px-7 pb-4 pt-16 sm:pb-6 sm:pt-20">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-10 sm:min-h-[60vh] sm:flex-row">
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="serif" style={{ fontSize: "var(--fs-hero)", lineHeight: "var(--lh-tight)" }}>
              Explore
              <br />
              Our Categories
            </h2>
          </div>
          <Link href="/products" className="group mt-10 flex max-w-xs items-center justify-between gap-4 border-t pt-4 sm:mt-0" style={{ borderColor: "var(--line)" }}>
            <span className="text-sm">Browse the full catalogue</span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-x-1"
              style={{ borderColor: "var(--line)", color: "var(--burgundy)" }}
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>

        <div className="flex items-start justify-between gap-6 sm:flex-col sm:items-end sm:justify-start sm:text-right">
          <p className="tracked-caps shrink-0 text-xs" style={{ color: "var(--accent)" }}>
            [{String(items.length).padStart(2, "0")}] Featured
          </p>
          <div className="flex flex-col gap-1">
            {featured.map((item) => (
              <span key={item.slug} className="serif" style={{ fontSize: "18px", color: "var(--line-strong)" }}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
