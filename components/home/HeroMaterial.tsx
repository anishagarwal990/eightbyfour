import Image from "next/image";
import Link from "next/link";
import type { ImageTreatment } from "@/lib/categoryArt";

export interface HeroMaterialTile {
  slug: string;
  name: string;
  count: number;
  image: string;
  treatment: ImageTreatment;
}

/**
 * The first material a visitor sees — the thing the old hero had none of.
 *
 * Composed rather than gridded: one tall surface holds the left column and two
 * stack beside it, so it reads as a sample board rather than three equal
 * thumbnails. On a phone it flattens into a short three-across band so the
 * hero's actions still fit on the first screen.
 */
export function HeroMaterial({ tiles }: { tiles: HeroMaterialTile[] }) {
  const [lead, ...rest] = tiles;
  if (!lead) return null;

  return (
    // Mobile is a short three-across band, not a stacked composition: at
    // 390px the tall-lead arrangement is ~430px of image and pushes the
    // hero's actions off the first screen. The composed version returns at
    // lg, where there is width to spend on it.
    <div
      className="grid grid-cols-3 gap-3 lg:grid-cols-2 lg:grid-rows-2 lg:gap-4"
      style={{ gridAutoRows: "1fr" }}
    >
      <MaterialTile
        tile={lead}
        className="lg:row-span-2 lg:h-full"
        priority
        sizes="(max-width: 1024px) 31vw, 300px"
        frame="aspect-[3/4] sm:aspect-[3/4] lg:aspect-auto lg:h-full lg:flex-1 lg:min-h-[400px]"
      />
      {rest.slice(0, 2).map((t) => (
        <MaterialTile
          key={t.slug}
          tile={t}
          className="lg:h-full"
          sizes="(max-width: 1024px) 31vw, 300px"
          frame="aspect-[3/4] sm:aspect-[3/4] lg:aspect-auto lg:h-full lg:flex-1 lg:min-h-[192px]"
        />
      ))}
    </div>
  );
}

function MaterialTile({
  tile,
  className,
  priority,
  sizes,
  frame,
}: {
  tile: HeroMaterialTile;
  className: string;
  priority?: boolean;
  sizes: string;
  /** Sizing classes for the image frame — see the note below. */
  frame: string;
}) {
  return (
    <Link href={`/products/${tile.slug}`} className={`group flex flex-col ${className}`}>
      {/* Fixed aspect on mobile, flex-filled at lg: with flex-1 alone a
          two-line caption ("Corian / Acrylic Solid Surface") stole height
          from its own image and the three tiles stopped lining up. */}
      <span
        className={`relative block w-full overflow-hidden ${frame}`}
        style={{
          background: "var(--surface-secondary)",
          borderRadius: "var(--radius-xs)",
          boxShadow: "inset 0 0 0 1px var(--border-subtle)",
        }}
      >
        <Image
          src={tile.image}
          alt={tile.name}
          fill
          priority={priority}
          sizes={sizes}
          className={
            tile.treatment === "surface"
              ? "object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.04]"
              : "object-contain p-6"
          }
        />
      </span>
      <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="text-[12px] font-medium leading-snug transition-colors group-hover:text-[var(--brand-primary)] lg:text-[13px]">
          {tile.name}
        </span>
        <span className="metric text-[12px]" style={{ color: "var(--text-muted)" }}>
          {tile.count.toLocaleString("en-IN")}
        </span>
      </span>
    </Link>
  );
}
