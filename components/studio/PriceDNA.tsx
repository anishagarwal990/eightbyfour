"use client";

import { useEffect, useRef, useState } from "react";
import { inr } from "@/lib/studio/format";
import type { WardrobeEstimate } from "@/lib/studio/estimator/types";

/**
 * Price DNA — the quote as a set of proportioned bars.
 *
 * The job is to teach one thing: the number is COMPOSED. Four segments, each
 * a real commercial group, sized against the largest. Change the board and
 * only the carcass bar moves; change the hardware and only hardware moves.
 * That is the whole lesson, and it is carried by the motion rather than by
 * a paragraph explaining it.
 *
 * Deliberately not a chart. No pie, no legend, no axis — bars read as a
 * specification sheet, which is what this is.
 */

/** Remembers the previous totals so a change can be attributed to one segment. */
function usePrevious(groups: WardrobeEstimate["publicGroups"]) {
  const ref = useRef<Record<string, number>>({});
  const [changed, setChanged] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const g of groups) next[g.key] = g.total;

    const prev = ref.current;
    const moved = Object.keys(next).filter((k) => prev[k] !== undefined && prev[k] !== next[k]);
    ref.current = next;

    // Exactly one segment moving is the interesting case — that is the product
    // working. Two or more means a dimension changed, which moves everything,
    // and highlighting all of them says nothing.
    if (moved.length === 1) {
      setChanged(moved[0]);
      const t = setTimeout(() => setChanged(null), 1400);
      return () => clearTimeout(t);
    }
    setChanged(null);
  }, [groups]);

  return changed;
}

export function PriceDNA({
  estimate,
  className = "",
}: {
  estimate: WardrobeEstimate;
  className?: string;
}) {
  const groups = estimate.publicGroups;
  const changedKey = usePrevious(groups);
  const max = Math.max(...groups.map((g) => g.total), 1);

  return (
    <div className={className}>
      <p className="tracked-caps mb-3 text-[10px]" style={{ color: "var(--ink-faint)" }}>
        What makes up the price
      </p>

      <ul className="space-y-2.5">
        {groups.map((g) => {
          const isChanged = g.key === changedKey;
          const pct = Math.round((g.total / max) * 100);
          return (
            <li key={g.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="text-[13px] leading-tight transition-colors duration-300"
                  style={{ color: isChanged ? "var(--burgundy)" : "var(--ink)", fontWeight: isChanged ? 600 : 400 }}
                >
                  {g.label}
                </span>
                <span
                  className="metric shrink-0 text-[13px] transition-colors duration-300"
                  style={{ color: isChanged ? "var(--burgundy)" : "var(--ink)" }}
                >
                  {inr(g.total)}
                </span>
              </div>
              <span
                className="mt-1 block h-[6px] w-full overflow-hidden rounded-[1px]"
                style={{ background: "var(--stone-deep)" }}
              >
                <span
                  className="block h-full rounded-[1px]"
                  style={{
                    width: `${pct}%`,
                    background: "var(--burgundy)",
                    opacity: isChanged ? 1 : 0.62,
                    // Width is the whole point, so it has to animate. The bars
                    // are 6px tall and never reflow anything around them, so
                    // this cannot cause layout shift elsewhere.
                    transition: "width 420ms var(--ease-out-soft), opacity 300ms linear",
                  }}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-3.5 flex items-baseline justify-between gap-3 border-t pt-3"
        style={{ borderColor: "var(--studio-line)" }}
      >
        <span className="text-[13px] font-semibold">Indicative total</span>
        <span className="metric text-[16px] font-semibold">{inr(estimate.finalTotal)}</span>
      </div>
    </div>
  );
}
