// The site header's mark, per the brand identity doc's "H3 — Numeral leads"
// header spec: numeral first (it's already the favicon/app icon, so it's
// the one thing that has to survive down to a phone-width header), a
// hairline rule, then the wordmark as caption — no tagline, per the doc's
// own recommendation ("H3, and drop the tagline"). The wordmark and rule
// drop below `sm` so a cramped header falls back to the numeral alone
// instead of squeezing everything down further.
import { markTimesStyle } from "@/components/CategoryMark";

export function SiteBrandMark({ scrolled }: { scrolled: boolean }) {
  const digit = scrolled ? 23 : 34;
  const ruleHeight = scrolled ? 20 : 34;
  const word = scrolled ? 14 : 19;

  return (
    <span className="inline-flex items-center" style={{ gap: 13 }}>
      <span
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
        <span style={markTimesStyle(digit, "var(--burgundy)")}>×</span>
        <span style={{ fontSize: digit }}>4</span>
      </span>
      <span className="hidden items-center md:inline-flex" style={{ gap: 13 }}>
        <span aria-hidden="true" style={{ width: 1, height: ruleHeight, background: "rgba(18,18,18,0.18)" }} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: word }}>EIGHT</span>
          {/* Wordmark "×" sits between caps, not digits — it keeps its own
              optical ratio rather than the numeral mark's stepped one. */}
          <span style={{ fontWeight: 500, fontSize: word * 0.53, margin: "0 0.13em", transform: "translateY(-0.14em)", color: "var(--burgundy)" }}>×</span>
          <span style={{ fontSize: word }}>FOUR</span>
        </span>
      </span>
    </span>
  );
}
