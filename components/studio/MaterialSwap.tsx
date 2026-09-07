"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CARCASS_MATERIALS, SHUTTER_CORES } from "@/lib/studio/estimator/config";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import { boardSwatch } from "@/lib/studio/estimator/swatches";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";
import { inr } from "@/lib/studio/format";

/**
 * This wardrobe in another board.
 *
 * The material ladder on /studio teaches boards in the abstract — ₹80 per sq
 * ft means very little to someone who has never bought plywood. This does the
 * same job personally: every board priced against THIS wardrobe, with the
 * difference from what is currently selected.
 *
 * Two decisions worth stating, because neither is obvious:
 *
 * 1. A prelaminated board also changes the fronts. Boards that ship decorated
 *    remove the entire carcass-finish bucket, and a customer picking "Prelam
 *    PB" means the wardrobe, not just the box behind the doors. Doing this
 *    silently would be wrong, so the affected rows say so and the applied
 *    change is spelled out. For every other board the two readings are the
 *    same number, so nothing is lost.
 *
 * 2. The list is sorted by TOTAL, not by board rate. Those two orders are not
 *    the same — a dearer prelaminated board finishes cheaper than a cheaper
 *    raw board, because the raw board still has to be laminated. Sorting by a
 *    rate the customer never actually pays would make the list look wrong.
 *
 * Each row re-runs the real engine. No lookup table, no cached deltas — swap a
 * rate in config and these move.
 */

/** The full change a board implies, so the UI and the price never disagree. */
function patchFor(m: (typeof CARCASS_MATERIALS)[number]): Partial<WardrobeEstimateInput> {
  if (!m.prelaminated) return { carcassMaterialId: m.id };
  // Only apply a prelam front if that board exists as a shutter core.
  const core = SHUTTER_CORES.find((c) => c.id === m.id && c.prelaminated);
  return core
    ? { carcassMaterialId: m.id, shutterCoreId: core.id, shutterFinishId: "prelam" }
    : { carcassMaterialId: m.id };
}

export function MaterialSwap({
  input,
  onChange,
  className = "",
}: {
  input: WardrobeEstimateInput;
  onChange: (patch: Partial<WardrobeEstimateInput>, label: string) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const current = estimateWardrobe(input).finalTotal;
    return CARCASS_MATERIALS.map((m) => {
      const patch = patchFor(m);
      const total = estimateWardrobe({ ...input, ...patch }).finalTotal;
      const changesFronts = patch.shutterCoreId !== undefined && patch.shutterCoreId !== input.shutterCoreId;
      return { material: m, patch, total, delta: total - current, changesFronts };
    }).sort((a, b) => a.total - b.total);
  }, [input]);

  return (
    <div className={className}>
      <p className="tracked-caps mb-2.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
        This wardrobe in another board
      </p>

      <ul>
        {rows.map(({ material: m, patch, total, delta, changesFronts }) => {
          const isCurrent = m.id === input.carcassMaterialId;
          const isOpen = expanded === m.id;
          return (
            <li key={m.id} style={{ borderColor: "var(--studio-line)" }} className="border-t first:border-t-0">
              <button
                type="button"
                onClick={() => (isCurrent ? setExpanded(isOpen ? null : m.id) : onChange(patch, m.short))}
                aria-pressed={isCurrent}
                className="flex min-h-11 w-full items-center gap-3 py-2.5 text-left transition-colors"
              >
                <span
                  className="block h-7 w-7 shrink-0 rounded-[2px]"
                  style={{
                    background: `linear-gradient(135deg, ${boardSwatch(m.id).from}, ${boardSwatch(m.id).to})`,
                    boxShadow: isCurrent ? "0 0 0 2px var(--burgundy)" : "inset 0 0 0 1px var(--studio-line)",
                  }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] leading-tight"
                    style={{ color: isCurrent ? "var(--burgundy)" : "var(--ink)", fontWeight: isCurrent ? 600 : 400 }}
                  >
                    {m.short}
                  </span>
                  <span className="block text-[10px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                    {changesFronts ? "Pre-finished — fronts change too" : null}
                    {changesFronts && m.source === "assumption" ? " · " : null}
                    {m.source === "assumption" ? "Rate confirmed before quotation" : null}
                  </span>
                </span>

                <span className="metric shrink-0 text-[13px] tabular-nums">{inr(total)}</span>

                <span
                  className="metric w-[76px] shrink-0 text-right text-[12px] tabular-nums"
                  style={{
                    color: isCurrent ? "var(--ink-faint)" : delta > 0 ? "var(--burgundy)" : "var(--positive)",
                    fontWeight: isCurrent ? 400 : 600,
                  }}
                >
                  {isCurrent ? "Current" : `${delta > 0 ? "+" : "−"}${inr(Math.abs(delta))}`}
                </span>
              </button>

              {/* The reason, only for the board in use — the rest are one tap
                  away and do not need explaining before they are chosen. */}
              {isCurrent && isOpen ? (
                <div className="pb-3 pl-10 pr-1">
                  <p className="text-[12px] font-semibold leading-tight">{m.label}</p>
                  <p className="mt-1 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                    {m.plain}
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                    <span className="font-semibold">Best for </span>
                    {m.bestFor}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                    <span className="font-semibold" style={{ color: "var(--burgundy)" }}>
                      Watch for{" "}
                    </span>
                    {m.watchFor}
                  </p>
                  <Link
                    href={m.catalogueHref}
                    className="mt-2 inline-block text-[11.5px] font-semibold"
                    style={{ color: "var(--burgundy)" }}
                  >
                    See the products <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
        Priced for this wardrobe at its current size, hardware and fronts. Cheapest first — which is not the same order
        as the board rates, because a pre-finished board needs no laminating. Tap the selected board to read what it is
        for.
      </p>
    </div>
  );
}
