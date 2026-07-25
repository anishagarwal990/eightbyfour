/**
 * Shared class builder for bordered, hover-lift surfaces (product cards, tiles).
 * Doesn't set `display` — pass "block" or "flex ..." in `extra` (avoids two
 * conflicting display utilities fighting over CSS source-order precedence).
 */
export function cardClasses(extra?: string): string {
  return [
    "group relative overflow-hidden rounded-sm border transition-[transform,box-shadow,border-color] duration-300 [transition-timing-function:var(--ease-out-soft)]",
    "hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] hover:border-[rgba(110,31,46,0.35)]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export const CARD_BASE_STYLE = { borderColor: "var(--line)", background: "var(--card)" } as const;
