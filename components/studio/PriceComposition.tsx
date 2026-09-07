"use client";

import { useMemo, useState } from "react";
import { CARCASS_MATERIALS } from "@/lib/studio/estimator/config";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";
import { inr } from "@/lib/studio/format";

/**
 * Why the price is what it is.
 *
 * Runs the real estimator on one worked wardrobe and lets the reader swap the
 * board. The point is not the number — it is that swapping the board moves one
 * group and leaves the rest alone. A quotation that behaves like that is a
 * quotation you can argue with, which is the whole proposition.
 */

const WORKED_EXAMPLE: WardrobeEstimateInput = {
  widthFt: 8,
  heightFt: 8,
  depthFt: 2,
  buildMethod: "factory",
  carcassMaterialId: "bwr-ply",
  carcassFinishId: "laminate",
  shutterSystem: "board",
  shutterCoreId: "hdhmr",
  shutterFinishId: "laminate",
  aluProfileId: "natural",
  glassTypeId: "clear",
  hardwarePackageId: "standard",
};

export function PriceComposition() {
  const [carcassId, setCarcassId] = useState("bwr-ply");

  const estimate = useMemo(
    () => estimateWardrobe({ ...WORKED_EXAMPLE, carcassMaterialId: carcassId }),
    [carcassId]
  );
  const baseline = useMemo(() => estimateWardrobe(WORKED_EXAMPLE), []);
  const diff = estimate.finalTotal - baseline.finalTotal;

  const ladder = [...CARCASS_MATERIALS].sort((a, b) => a.ratePerSqft - b.ratePerSqft);
  const maxGroup = Math.max(...estimate.publicGroups.map((g) => g.total));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-10">
      <div>
        <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Change the board, watch one group move
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ladder.map((m) => {
            const active = m.id === carcassId;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCarcassId(m.id)}
                className="min-h-11 rounded-[3px] border px-3 text-[12.5px] transition-colors"
                style={{
                  borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                  color: active ? "var(--burgundy)" : "var(--ink-soft)",
                  fontWeight: active ? 600 : 400,
                  background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-2.5" role="status" aria-live="polite">
          {estimate.publicGroups.map((g) => (
            <div key={g.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium">{g.label}</span>
                <span className="metric text-[13px]">{inr(g.total)}</span>
              </div>
              <span className="mt-1 block h-[5px] w-full rounded-full" style={{ background: "var(--stone-deep)" }}>
                <span
                  className="block h-full rounded-full transition-[width] duration-500 [transition-timing-function:var(--ease-out-soft)]"
                  style={{ width: `${Math.round((g.total / maxGroup) * 100)}%`, background: "var(--burgundy)" }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="self-start rounded-[3px] p-5 shadow-[var(--shadow-sm)]"
        style={{ background: "var(--paper)" }}
      >
        <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Worked example · 8′ × 8′ × 2′ wardrobe
        </p>
        <p className="metric mt-1.5 text-[34px] leading-none">{inr(estimate.finalTotal)}</p>
        <p className="metric mt-1 text-[12px]" style={{ color: "var(--ink-soft)" }}>
          {inr(estimate.finalRatePerSqft)} per sq ft of elevation
        </p>

        {diff !== 0 ? (
          <p
            className="metric mt-2.5 inline-block rounded-[2px] px-2 py-1 text-[12px] font-semibold"
            style={{
              background: diff > 0 ? "color-mix(in srgb, var(--burgundy) 10%, transparent)" : "color-mix(in srgb, var(--positive) 14%, transparent)",
              color: diff > 0 ? "var(--burgundy)" : "var(--positive)",
            }}
          >
            {diff > 0 ? "+" : "−"}
            {inr(Math.abs(diff))} against BWR plywood
          </p>
        ) : null}

        {estimate.carcassFinish.includedBecausePrelaminated ? (
          <p
            className="mt-3 rounded-[2px] px-2.5 py-2 text-[11.5px] leading-snug"
            style={{ background: "var(--stone-deep)", color: "var(--ink-soft)" }}
          >
            This board arrives already finished, so there is no separate laminate cost. That is most of the saving.
          </p>
        ) : null}

        <p className="mt-3 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
          Indicative from these selections. Final dimensions and live material rates are confirmed before production.
        </p>
      </div>
    </div>
  );
}
