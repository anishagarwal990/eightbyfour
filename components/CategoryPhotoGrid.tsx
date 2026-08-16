import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export interface CategoryPhotoItem {
  slug: string;
  name: string;
  total: number;
  /** null for "coming soon" categories with no live products yet. */
  image: string | null;
}

/** One consolidated "here's the real stock we carry" moment — replaces what
    used to be two separate, overlapping sections (a 4-photo strip right
    after the hero, then a pinned-scroll list further down showing mostly
    the same categories again). A scannable grid gets every category's real
    photo in front of the visitor at once, instead of gating it behind a
    long forced scroll. */
export function CategoryPhotoGrid({ items }: { items: CategoryPhotoItem[] }) {
  if (items.length === 0) return null;

  return (
    <Reveal as="section" className="px-7 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b pb-8" style={{ borderColor: "var(--line)" }}>
          <div>
            <h2 className="serif" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-tight)" }}>
              Explore Our Categories
            </h2>
          </div>
          <Link href="/products" className="group flex items-center gap-3 text-sm">
            Browse the full catalogue
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-x-1"
              style={{ borderColor: "var(--line)", color: "var(--burgundy)" }}
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>

        <Reveal stagger className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <Link key={item.slug} href={`/products/${item.slug}`} className="group flex flex-col gap-2.5">
              <span className="relative block aspect-square w-full overflow-hidden rounded-sm" style={{ background: "var(--paper-dim)" }}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                    className="object-cover transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <span className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
                      Coming Soon
                    </span>
                  </span>
                )}
              </span>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm transition-colors duration-200 group-hover:text-[var(--burgundy)]">{item.name}</span>
                {item.total > 0 ? (
                  <span className="tracked-caps shrink-0 text-[10px]" style={{ color: "var(--line-strong)" }}>
                    {item.total}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </Reveal>
  );
}
