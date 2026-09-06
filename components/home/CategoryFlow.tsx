import Link from "next/link";
import { AutoScrollRow } from "@/components/AutoScrollRow";
import { CyclingImage } from "@/components/home/CyclingImage";
import type { DiscoveryTile } from "@/components/home/MaterialDiscovery";

// A showroom-card size, not an icon — visitors need to recognise a material
// from across the "aisle" (i.e. without leaning in), which is the whole
// point of a runway over a static logo-style grid.
const CARD_WIDTH = "w-[45vw] sm:w-[200px] lg:w-[220px]";

export function CategoryCard({ tile, priority = false }: { tile: DiscoveryTile; priority?: boolean }) {
  return (
    <Link
      href={`/products/${tile.slug}`}
      className={`group relative block shrink-0 overflow-hidden rounded-sm transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:z-10 hover:scale-[1.04] hover:shadow-[var(--shadow-lg)] ${CARD_WIDTH}`}
      style={{ background: "var(--card)" }}
    >
      <span className="relative block aspect-[4/5] w-full overflow-hidden">
        <CyclingImage
          images={tile.images}
          alt={tile.name}
          priority={priority}
          sizes="(max-width: 640px) 45vw, 220px"
          imageClassName={
            tile.treatment === "surface"
              ? "object-cover transition-transform duration-500 group-hover:scale-105"
              : "object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          }
        />
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(18,18,18,0.72) 0%, rgba(18,18,18,0.08) 42%, transparent 65%)" }}
        />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
          <span className="serif text-white" style={{ fontSize: "17px", lineHeight: "var(--lh-tight)" }}>
            {tile.name}
          </span>
          {tile.count > 0 ? (
            <span className="metric shrink-0 text-[11px] text-white/75">{tile.count.toLocaleString("en-IN")}</span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

export function CategoryFlow({ tiles }: { tiles: DiscoveryTile[] }) {
  const shown = tiles.filter((t) => t.images.length > 0);
  if (shown.length === 0) return null;

  function renderItems(keyPrefix: string) {
    return shown.map((tile, i) => <CategoryCard key={`${keyPrefix}-${tile.slug}`} tile={tile} priority={keyPrefix === "a" && i < 2} />);
  }

  return (
    <AutoScrollRow label="category runway" className="edge-fade-mask" trackClassName="flex items-stretch gap-4 px-7" speed={34}>
      {renderItems("a")}
      {/* Loop-seam duplicate — hidden from assistive tech and out of the tab
          order so each category is only announced and tabbed once. */}
      <div aria-hidden="true" inert style={{ display: "contents" }}>
        {renderItems("b")}
      </div>
    </AutoScrollRow>
  );
}
