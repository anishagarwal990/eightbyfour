// Category logos from the brand identity system's "SUB-BRANDS" section:
// the numeral lockup (unchanged mark + hairline rule + descriptor) paired
// with each vertical's on-tone tile — the numeral in white on a category-tone
// background, with a contrasting "x". Plywood Shop, Laminates and Veneers
// are verticals inside the platform, not separate companies, so every mark
// here borrows the parent numeral unchanged.
export type CategoryMarkSlug = "plywood" | "laminates" | "veneers";

export const CATEGORY_MARK_SLUGS: CategoryMarkSlug[] = ["plywood", "laminates", "veneers"];

export function isCategoryMarkSlug(slug: string): slug is CategoryMarkSlug {
  return (CATEGORY_MARK_SLUGS as string[]).includes(slug);
}

// The descriptor spelled out in the brand identity doc — "Shop" is doing
// real work for Plywood (it's where sheets are bought, not just compared);
// Laminates and Veneers stand alone since the category name is the product.
export const CATEGORY_MARK_LABEL: Record<CategoryMarkSlug, string> = {
  plywood: "Plywood Shop",
  laminates: "Laminates",
  veneers: "Veneers",
};

// The dbCategory values each sub-brand actually covers — Plywood Shop's tile
// says "PLY & BOARDS" because Blockboard is sold under it too, so filtering
// a brand page by this mark has to pull both categories, not just Plywood.
export const CATEGORY_MARK_DB_CATEGORIES: Record<CategoryMarkSlug, string[]> = {
  plywood: ["Plywood", "Blockboard"],
  laminates: ["Laminates"],
  veneers: ["Veneers"],
};

// Reverse lookup for grouping a mixed product list back into its sub-brand
// sections — e.g. a Blockboard row groups under Plywood Shop, not its own
// "Blockboard" heading, since there's no separate blockboard mark.
const DB_CATEGORY_TO_MARK: Record<string, CategoryMarkSlug> = Object.fromEntries(
  CATEGORY_MARK_SLUGS.flatMap((slug) => CATEGORY_MARK_DB_CATEGORIES[slug].map((dbCategory) => [dbCategory, slug]))
);

export function categoryMarkForDbCategory(dbCategory: string): CategoryMarkSlug | undefined {
  return DB_CATEGORY_TO_MARK[dbCategory];
}

// Tile background (one shared lightness/chroma across all three, only hue
// changes), the tile's "x" tint (a light contrast color pulled against that
// tone rather than the parent's burgundy), and the short tag set under the
// numeral inside the tile.
const CATEGORY_TILE: Record<CategoryMarkSlug, { bg: string; x: string; tag: string; tagSize: number; tagTracking: string }> = {
  plywood: { bg: "oklch(0.62 0.09 145)", x: "var(--burgundy)", tag: "PLY & BOARDS", tagSize: 7, tagTracking: "0.12em" },
  laminates: { bg: "oklch(0.62 0.09 250)", x: "oklch(0.88 0.12 80)", tag: "LAM", tagSize: 8.5, tagTracking: "0.22em" },
  veneers: { bg: "oklch(0.62 0.09 25)", x: "oklch(0.88 0.10 125)", tag: "VENEER", tagSize: 8.5, tagTracking: "0.22em" },
};

// Base sizes the proportions below were designed against.
const TILE_BASE = 80;
const NUMERAL_BASE = 46;

// The on-tone tile — a small colored rounded-square icon with the numeral in
// white and a PLY/LAM/VENEER tag underneath, sized off `size` (tile side
// length in px). Below ~48px the tag gets unreadable, so it drops and the
// numeral stands alone.
export function CategoryTile({ slug, size = 80, className = "" }: { slug: CategoryMarkSlug; size?: number; className?: string }) {
  const tone = CATEGORY_TILE[slug];
  const scale = size / TILE_BASE;
  const digit = 32 * scale;
  const radius = 18 * scale;
  const gap = 4 * scale;
  const showTag = size >= 48;
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: tone.bg,
        borderRadius: radius,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "#FFFFFF",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: digit }}>8</span>
        <span style={{ fontSize: digit * 0.31, fontWeight: 500, margin: "0 0.15em", transform: "translateY(-0.05em)", color: tone.x }}>×</span>
        <span style={{ fontSize: digit }}>4</span>
      </div>
      {showTag ? (
        <div
          style={{
            fontFamily: "'General Sans', Inter, sans-serif",
            fontSize: tone.tagSize * scale,
            fontWeight: 600,
            letterSpacing: tone.tagTracking,
            color: "rgba(255,255,255,0.9)",
            textIndent: tone.tagTracking,
            whiteSpace: "nowrap",
          }}
        >
          {tone.tag}
        </div>
      ) : null}
    </div>
  );
}

function Numeral({ size }: { size: number }) {
  const digit = size;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-display), sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: "var(--ink)",
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: digit }}>8</span>
      <span style={{ fontSize: digit * 0.31, fontWeight: 500, margin: "0 0.15em", transform: "translateY(-0.05em)", color: "var(--burgundy)" }}>×</span>
      <span style={{ fontSize: digit }}>4</span>
    </div>
  );
}

// The numeral + hairline rule + descriptor lockup, with the category's
// on-tone tile at the end — the same composition as each SUB-BRANDS row in
// the brand identity doc, sized for a page header.
export function CategoryLockup({ slug, size = 40 }: { slug: CategoryMarkSlug; size?: number }) {
  const ruleHeight = size * (44 / NUMERAL_BASE);
  const tileSize = size * (56 / NUMERAL_BASE);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-4">
        <Numeral size={size} />
        <div style={{ width: 1, height: ruleHeight, background: "rgba(18,18,18,0.18)" }} />
        <span className="serif" style={{ fontSize: size * (23 / NUMERAL_BASE) + 6, color: "var(--ink)", letterSpacing: "0.01em" }}>
          {CATEGORY_MARK_LABEL[slug]}
        </span>
      </div>
      <CategoryTile slug={slug} size={tileSize} />
    </div>
  );
}
