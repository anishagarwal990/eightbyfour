import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { ImageTreatment } from "@/lib/categoryArt";

export interface DiscoveryTile {
  slug: string;
  name: string;
  count: number;
  image: string | null;
  treatment: ImageTreatment;
  blurb: string;
}

export interface SourcedCategory {
  slug: string;
  name: string;
}

/**
 * Catalogue depth, presented honestly.
 *
 * Only categories that actually hold stock get a photograph and a count, and
 * the two deepest get twice the area — 2,464 laminates and a category with one
 * SKU were previously the same size tile, which is a credibility problem
 * dressed up as a grid. Everything we can source but don't list becomes a
 * plain text row underneath: still linked (the routes and their SEO stay
 * intact), but never presented as equivalent stock.
 */
export function MaterialDiscovery({ tiles, sourced }: { tiles: DiscoveryTile[]; sourced: SourcedCategory[] }) {
  const [first, second, ...others] = tiles;

  return (
    <Reveal as="section" className="px-7 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          {/* Keeps the category-and-place phrasing the site ranks on in a real
              heading, now that the h1 carries the positioning rather than the
              keyword. */}
          <h2 className="max-w-lg" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            Interior &amp; construction materials we stock in Hyderabad
          </h2>
          <Link href="/products" className="text-sm underline underline-offset-4" style={{ color: "var(--brand-primary)" }}>
            Browse the full catalogue
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 lg:grid-cols-4">
          {[first, second].filter(Boolean).map((tile) => (
            <FeatureTile key={tile.slug} tile={tile} />
          ))}
          {others.map((tile) => (
            <SmallTile key={tile.slug} tile={tile} />
          ))}
        </div>

        {sourced.length > 0 ? (
          <div className="mt-14 border-t pt-8" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[0.55fr_1fr]">
              <div>
                <h3 style={{ fontSize: "var(--fs-h3)", lineHeight: "var(--lh-snug)" }}>Also sourced</h3>
                <p className="mt-2 max-w-xs" style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
                  Thinly listed or not listed at all, but on the requirements we handle every week. Put them on your
                  list and they get quoted with everything else.
                </p>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2.5 self-start pt-1">
                {sourced.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/products/${c.slug}`}
                      className="text-[14px] transition-colors hover:text-[var(--brand-primary)]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </Reveal>
  );
}

/* Every image sits on the same neutral ground with the same cover crop and
   hairline, which is the only thing holding a catalogue of texture photos,
   product PNGs and packaging shots to one art direction. */
const FRAME_STYLE = {
  background: "var(--surface-secondary)",
  borderRadius: "var(--radius-xs)",
  boxShadow: "inset 0 0 0 1px var(--border-subtle)",
} as const;

/* Surfaces bleed to the frame edge; packshots (a tin of adhesive, a branded
   board tile) sit contained with padding on the same neutral ground. Same
   frame, two honest crops — see lib/categoryArt.ts. */
function imageClass(treatment: ImageTreatment): string {
  return treatment === "surface"
    ? "object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.04]"
    : "object-contain p-5 md:p-7";
}

function FeatureTile({ tile }: { tile: DiscoveryTile }) {
  return (
    <Link href={`/products/${tile.slug}`} className="group col-span-2 flex flex-col gap-3">
      <span className="relative block aspect-[4/3] w-full overflow-hidden" style={FRAME_STYLE}>
        {tile.image ? (
          <Image src={tile.image} alt={tile.name} fill sizes="(max-width: 1024px) 92vw, 560px" className={imageClass(tile.treatment)} />
        ) : null}
      </span>
      <span>
        <span className="flex items-baseline gap-3">
          <span className="font-display text-[19px] font-semibold transition-colors group-hover:text-[var(--brand-primary)]">
            {tile.name}
          </span>
          <span className="metric text-[15px]" style={{ color: "var(--brand-primary)" }}>
            {tile.count.toLocaleString("en-IN")}
          </span>
        </span>
        <span className="mt-1 block max-w-sm" style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
          {tile.blurb}
        </span>
      </span>
    </Link>
  );
}

function SmallTile({ tile }: { tile: DiscoveryTile }) {
  return (
    <Link href={`/products/${tile.slug}`} className="group flex flex-col gap-2.5">
      <span className="relative block aspect-square w-full overflow-hidden" style={FRAME_STYLE}>
        {tile.image ? (
          <Image src={tile.image} alt={tile.name} fill sizes="(max-width: 1024px) 45vw, 270px" className={imageClass(tile.treatment)} />
        ) : null}
      </span>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-medium transition-colors group-hover:text-[var(--brand-primary)]">{tile.name}</span>
        <span className="metric text-[13px]" style={{ color: "var(--text-muted)" }}>
          {tile.count.toLocaleString("en-IN")}
        </span>
      </span>
    </Link>
  );
}
