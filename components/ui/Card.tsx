/**
 * Shared class builder for bordered surfaces (tiles, testimonial cards).
 * Doesn't set `display` — pass "block" or "flex ..." in `extra` (avoids two
 * conflicting display utilities fighting over CSS source-order precedence).
 *
 * The hover lift and drop shadow are gone: a tile that rises off the page
 * under the cursor is decoration, and it fought the near-square, drawn-flat
 * language the rest of the system now uses. Hover reads through the border
 * instead, which also survives prefers-reduced-motion untouched.
 */
export function cardClasses(extra?: string): string {
  return [
    "group relative overflow-hidden rounded-[var(--radius-xs)] border transition-colors duration-200 [transition-timing-function:var(--ease-out-soft)]",
    "hover:border-[var(--brand-primary)]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export const CARD_BASE_STYLE = { borderColor: "var(--border-subtle)", background: "var(--surface-primary)" } as const;
