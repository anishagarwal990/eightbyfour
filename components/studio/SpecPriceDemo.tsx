"use client";

import { useMemo, useState } from "react";
import { CARCASS_OPTIONS, FINISH_OPTIONS, HARDWARE_TIERS } from "@/lib/studio/catalogue";
import { DEFAULT_CONFIG, priceFurniture, type FurnitureConfig } from "@/lib/studio/furniture";
import { delta, inr } from "@/lib/studio/format";

/**
 * "Stop asking how much this costs. Start seeing what changes the cost."
 *
 * Four swaps against one fixed wardrobe, each priced live. The reference
 * specification never moves, so every number on screen is a comparison against
 * the same thing — which is what makes it legible.
 */

type Swap = {
  id: string;
  from: string;
  to: string;
  because: string;
  patch: Partial<FurnitureConfig>;
};

const BASE: FurnitureConfig = { ...DEFAULT_CONFIG };

const SWAPS: Swap[] = [
  {
    id: "carcass",
    from: `${CARCASS_OPTIONS.find((c) => c.id === "bwp-ply")!.label} carcass`,
    to: `${CARCASS_OPTIONS.find((c) => c.id === "hdhmr")!.label} carcass`,
    because: "HDHMR is moisture-resistant and machines flatter, but holds a screw slightly less well than BWP ply.",
    patch: { carcassId: "hdhmr" },
  },
  {
    id: "finish",
    from: "1 mm Laminate",
    to: "Acrylic Matt",
    because: "A different material, not a different grade — acrylic is pressed, anti-fingerprint and far deeper in colour.",
    patch: { finishId: "acrylic-matt" },
  },
  {
    id: "hardware",
    from: "Premium hardware",
    to: "Luxury hardware",
    because: "Blum mechanisms instead of Hettich. Nothing visible changes; every drawer you pull does.",
    patch: { hardwareId: "luxury" },
  },
  {
    id: "method",
    from: "Carpenter made",
    to: "Factory modular",
    because: "Four-side edge banding and CNC sizing cost more in the panel and less in the three weeks of site work.",
    patch: { method: "factory" },
  },
];

export function SpecPriceDemo() {
  const [applied, setApplied] = useState<string[]>([]);

  const baseTotal = useMemo(() => priceFurniture(BASE).total, []);
  const config = useMemo(
    () => SWAPS.filter((s) => applied.includes(s.id)).reduce<FurnitureConfig>((c, s) => ({ ...c, ...s.patch }), BASE),
    [applied]
  );
  const total = useMemo(() => priceFurniture(config).total, [config]);

  const finishLabel = FINISH_OPTIONS.find((f) => f.id === config.finishId)!.label;
  const hardwareLabel = HARDWARE_TIERS.find((h) => h.id === config.hardwareId)!.label;
  const carcassLabel = CARCASS_OPTIONS.find((c) => c.id === config.carcassId)!.label;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
      <div>
        <div className="flex flex-col gap-2">
          {SWAPS.map((swap) => {
            const on = applied.includes(swap.id);
            const next = on ? applied.filter((a) => a !== swap.id) : [...applied, swap.id];
            const nextConfig = SWAPS.filter((s) => next.includes(s.id)).reduce<FurnitureConfig>(
              (c, s) => ({ ...c, ...s.patch }),
              BASE
            );
            const d = priceFurniture(nextConfig).total - total;
            return (
              <button
                key={swap.id}
                type="button"
                onClick={() => setApplied(next)}
                aria-pressed={on}
                className="flex items-start gap-3 rounded-[3px] border p-3.5 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--burgundy)]"
                style={{
                  borderColor: on ? "var(--burgundy)" : "var(--studio-line)",
                  background: on ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                }}
              >
                <span
                  className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-[2px] transition-colors"
                  style={{ background: on ? "var(--burgundy)" : "var(--sand)" }}
                  aria-hidden="true"
                >
                  <span
                    className="block h-4 w-4 rounded-full bg-white transition-transform duration-200 [transition-timing-function:var(--ease-out-soft)]"
                    style={{ transform: on ? "translateX(16px)" : undefined }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold leading-tight">
                    <span style={{ color: "var(--ink-faint)", textDecoration: on ? "line-through" : undefined }}>{swap.from}</span>
                    <span className="mx-1.5" style={{ color: "var(--ink-faint)" }} aria-hidden="true">
                      to
                    </span>
                    {swap.to}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                    {swap.because}
                  </span>
                </span>
                <span
                  className="metric shrink-0 text-[13px] font-semibold"
                  style={{ color: d > 0 ? "var(--burgundy)" : d < 0 ? "var(--positive)" : "var(--ink-faint)" }}
                >
                  {delta(d)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12px]" style={{ color: "var(--ink-faint)" }}>
          Every figure here is produced by the same engine that prices a real configuration — not written into the copy.
        </p>
      </div>

      <div
        className="self-start rounded-[3px] border p-5"
        style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
      >
        <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Wardrobe · 8′ × 8′ × 2′
        </p>
        <dl className="mt-3 flex flex-col gap-1.5">
          {[
            ["Build", config.method === "carpenter" ? "Carpenter made" : "Factory modular"],
            ["Carcass", carcassLabel],
            ["Shutters", "MDF"],
            ["Finish", finishLabel],
            ["Hardware", hardwareLabel],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b pb-1.5 text-[13px]" style={{ borderColor: "var(--studio-line)" }}>
              <dt style={{ color: "var(--ink-faint)" }}>{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <p className="metric text-[40px] leading-none">{inr(total)}</p>
          <p className="metric mt-1.5 text-[12.5px]" style={{ color: total === baseTotal ? "var(--ink-faint)" : total > baseTotal ? "var(--burgundy)" : "var(--positive)" }}>
            {total === baseTotal ? "Reference specification" : `${delta(total - baseTotal)} against the reference specification`}
          </p>
        </div>
        {applied.length > 0 ? (
          <button
            type="button"
            onClick={() => setApplied([])}
            className="mt-4 w-full rounded-[3px] border px-3 py-2 text-[12.5px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
            style={{ borderColor: "var(--studio-line)" }}
          >
            Reset to reference
          </button>
        ) : null}
      </div>
    </div>
  );
}
