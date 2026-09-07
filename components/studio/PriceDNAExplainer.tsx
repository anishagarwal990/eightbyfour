"use client";

import { useMemo, useState } from "react";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";
import { REFERENCE_WARDROBE } from "@/lib/studio/estimator/reference";
import { inr } from "@/lib/studio/format";
import { PriceDNA } from "./PriceDNA";
import { ScrollRail } from "./primitives";

/**
 * Change → visual response → price response → explanation.
 *
 * The four swaps are chosen so each one lands on a DIFFERENT commercial group.
 * That is the point of the section: a customer toggles hardware and watches
 * the hardware bar alone move, which teaches that the price is composed far
 * faster than any paragraph does.
 *
 * The build-method swap deliberately moves nothing. We have no factory
 * quotations, both routes carry the same labour rate, and manufacturing a
 * difference would fabricate the exact number a customer would ask us to
 * justify. It stays in the list because "this does not change the price" is
 * itself information, and hiding it would be the dishonest choice.
 */

const BASE = REFERENCE_WARDROBE;

interface Swap {
  id: string;
  group: string;
  from: string;
  to: string;
  patch: Partial<WardrobeEstimateInput>;
  /** Why the number moved — or why it did not. */
  because: string;
}

const SWAPS: Swap[] = [
  {
    id: "carcass",
    group: "Carcass & finish",
    from: "BWR Plywood box",
    to: "Prelaminated Particle Board box",
    patch: { carcassMaterialId: "prelam-pb" },
    because:
      "Prelaminated board already includes its surface finish, so the separate carcass laminate cost disappears entirely — and the board itself is cheaper.",
  },
  {
    id: "shutters",
    group: "Shutters",
    from: "Laminate fronts",
    to: "Acrylic fronts",
    patch: { shutterFinishId: "acrylic" },
    because:
      "Acrylic is a pressed sheet, not a laminate — deeper in colour, anti-fingerprint, and roughly two and a half times the rate per sq ft of front.",
  },
  {
    id: "hardware",
    group: "Hardware",
    from: "Standard hinges and runners",
    to: "Premium hinges and runners",
    patch: { hardwarePackageId: "premium" },
    because:
      "Nothing visible changes. Every hinge and every runner does — which is why only the hardware group moves and the rest of the wardrobe holds still.",
  },
  {
    id: "method",
    group: "Fabrication & installation",
    from: "Factory, then fitted",
    to: "Carpenter, at your site",
    patch: { buildMethod: "carpenter" },
    because:
      "Priced the same today. What changes is the lead time, how many weeks of work happen inside your home, and how the panel edges are finished.",
  },
];

export function PriceDNAExplainer() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = SWAPS.find((s) => s.id === activeId) ?? null;
  const input = useMemo<WardrobeEstimateInput>(() => (active ? { ...BASE, ...active.patch } : BASE), [active]);

  const estimate = useMemo(() => estimateWardrobe(input), [input]);
  const baseTotal = useMemo(() => estimateWardrobe(BASE).finalTotal, []);
  const diff = estimate.finalTotal - baseTotal;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-12">
      {/* --- the composition ------------------------------------------- */}
      <div>
        <div role="status" aria-live="polite">
          <p className="metric text-[clamp(34px,4.6vw,52px)] leading-none">{inr(estimate.finalTotal)}</p>
          <p className="metric mt-1.5 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
            Indicative · an 8′ × 8′ wardrobe · {inr(estimate.finalRatePerSqft)} per sq ft
          </p>
        </div>

        <PriceDNA estimate={estimate} className="mt-6" />

        <p className="mt-4 max-w-[62ch] text-[12.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
          Overheads and margin sit inside fabrication and installation rather than being charged as a separate line.
          Board rates come from the current EightByFour catalogue; fabrication and service rates are Studio&rsquo;s working
          figures and are verified before a quotation is issued.
        </p>
      </div>

      {/* --- the swaps --------------------------------------------------- */}
      <div>
        <p className="tracked-caps mb-2.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Change one thing
        </p>
        <ScrollRail ariaLabel="Try a change">
          {SWAPS.map((s) => {
            const on = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveId(on ? null : s.id)}
                className="min-h-11 shrink-0 rounded-[3px] border px-3.5 text-[13px] transition-colors"
                style={{
                  borderColor: on ? "var(--burgundy)" : "var(--studio-line)",
                  boxShadow: on ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                  background: on ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  color: on ? "var(--burgundy)" : "var(--ink)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {s.group}
              </button>
            );
          })}
        </ScrollRail>

        <div
          className="mt-4 rounded-[3px] border p-4"
          style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
        >
          {active ? (
            <>
              <p className="text-[13.5px] leading-snug">
                <span style={{ color: "var(--ink-faint)" }}>{active.from}</span>
                <span aria-hidden="true" style={{ color: "var(--ink-faint)" }}>
                  {" → "}
                </span>
                <span className="font-semibold">{active.to}</span>
              </p>
              <p
                className="metric mt-2 inline-block rounded-[2px] px-2 py-1 text-[15px] font-semibold"
                style={{
                  background:
                    diff === 0
                      ? "var(--stone-deep)"
                      : diff > 0
                        ? "color-mix(in srgb, var(--burgundy) 10%, transparent)"
                        : "color-mix(in srgb, var(--positive) 14%, transparent)",
                  color: diff === 0 ? "var(--ink-soft)" : diff > 0 ? "var(--burgundy)" : "var(--positive)",
                }}
              >
                {diff === 0 ? "No change in price" : `${diff > 0 ? "+" : "−"}${inr(Math.abs(diff))}`}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {active.because}
              </p>
              <p className="mt-3 text-[12px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                {diff === 0
                  ? "Every group holds still, because nothing in the costed model moved."
                  : `Only ${active.group.toLowerCase()} moved. Every other group is unchanged.`}
              </p>
            </>
          ) : (
            <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Pick any change above. The wardrobe is re-priced by the same engine the configurator runs, and only the
              group that actually moved is highlighted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
