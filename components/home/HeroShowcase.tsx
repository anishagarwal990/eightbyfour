import Link from "next/link";
import { BRAND_LOGOS } from "@/lib/brandLogos";
import { CyclingImage } from "@/components/home/CyclingImage";
import type { ImageTreatment } from "@/lib/categoryArt";

export interface ShowcaseTile {
  slug: string;
  /** Full category name, used for the alt text. */
  name: string;
  /** Shorter caption where the full name would truncate in a 2-up tile. */
  label?: string;
  count: number;
  /** Several real products from the category; the tile cycles through them. */
  images: string[];
  treatment: ImageTreatment;
}

export interface ShowcaseBrand {
  name: string;
  slug: string;
  /** Set for source-only brands, whose logos are files in /brand-logos. */
  file?: string;
}

/**
 * The hero's right column: what we hold, and who we source it from, in one
 * block — replacing the free-text quote-builder box that used to sit here.
 *
 * Deliberately a grid rather than a collage. Competitors arrange the same two
 * signals as a radial cluster of cut-out product shots, which reads as busy at
 * a glance and cannot survive a narrow screen. Here every material sits in an
 * identical square on the same neutral ground, every logo sits on one baseline
 * at one height, and the two zones are separated by a single hairline. The
 * organising principle is the grid; the variety comes from the materials.
 */
export function HeroShowcase({ tiles, brands, brandCount }: { tiles: ShowcaseTile[]; brands: ShowcaseBrand[]; brandCount: number }) {
  const shown = tiles.filter((t) => t.images.length > 0).slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <div className="w-full max-w-md text-left">
      <div className="grid grid-cols-2 gap-3">
        {shown.map((tile, i) => (
          <Link key={tile.slug} href={`/products/${tile.slug}`} className="group flex flex-col gap-2">
            <span
              className="relative block aspect-square w-full overflow-hidden"
              style={{ background: "var(--card)", borderRadius: "var(--radius-xs)" }}
            >
              <CyclingImage
                images={tile.images}
                alt={tile.name}
                // The first two are above the fold on every screen; the lower
                // pair can wait for the lazy pass.
                priority={i < 2}
                sizes="(max-width: 640px) 42vw, 200px"
                // Staggered so the four tiles don't all flip on one frame.
                delayMs={i * 900}
                // These sit inside the hero's horizontal scroll track, which
                // clips them out of intersection every time the carousel
                // advances. They're above the fold regardless, so the
                // visibility gate costs more than it saves here.
                gateOnVisibility={false}
                imageClassName={
                  tile.treatment === "surface"
                    ? "object-cover"
                    : "object-contain p-4"
                }
              />
            </span>
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12.5px] font-medium transition-colors group-hover:text-[var(--burgundy)]">
                {tile.label ?? tile.name}
              </span>
              <span className="metric shrink-0 text-[12px]" style={{ color: "var(--line-strong)" }}>
                {tile.count.toLocaleString("en-IN")}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--line-strong)" }}>
          Sourced from {brandCount}+ manufacturers
        </p>
        {/* One row, one box, one baseline. Logos arrive as wildly different
            crops and aspect ratios, so each gets an identical cell and is
            contained inside it rather than set to a fixed height — a fixed
            height makes a wide logo overflow its cell and a narrow one vanish,
            which is what makes a logo row look untidy. Four, not five: at this
            panel width five cells leave each logo too little room to read. */}
        <div className="mt-3 grid grid-cols-4 items-center gap-4">
          {brands.slice(0, 4).map((brand) => {
            const src = brand.file ? `/brand-logos/${brand.file}` : BRAND_LOGOS[brand.name];
            if (!src) return null;
            return (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="flex h-8 items-center justify-center opacity-80 grayscale transition-[opacity,filter] duration-200 hover:opacity-100 hover:grayscale-0"
                aria-label={brand.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${brand.name} logo`}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
