"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CARCASS_OPTIONS, FINISH_OPTIONS } from "@/lib/studio/catalogue";
import { DEFAULT_CONFIG, FURNITURE_TYPES, priceFurniture, type BuildMethod, type FurnitureConfig } from "@/lib/studio/furniture";
import { delta, inr } from "@/lib/studio/format";
import { Segmented, Stepper, Swatch } from "./primitives";

const QUICK_TYPES = ["wardrobe", "kitchen", "tv-unit", "vanity"];
const QUICK_CARCASS = ["mdf", "hdhmr", "commercial-ply", "bwp-ply"];
const QUICK_FINISH = ["lam-08", "lam-1", "lam-woodgrain", "acrylic-matt"];

/**
 * The hero configurator. It exists to answer the ten-second question — "what
 * is this site?" — before any copy has been read, so it runs the real pricing
 * engine on a reduced set of decisions and hands the state to the full
 * configurator via the URL.
 */
export function MiniConfigurator() {
  const [config, setConfig] = useState<FurnitureConfig>(DEFAULT_CONFIG);
  const [last, setLast] = useState<{ label: string; amount: number } | null>(null);

  const quote = useMemo(() => priceFurniture(config), [config]);

  function apply(patch: Partial<FurnitureConfig>, label: string) {
    const next = { ...config, ...patch };
    const diff = priceFurniture(next).total - quote.total;
    setConfig(next);
    setLast(diff === 0 ? null : { label, amount: diff });
  }

  const continueHref = `/studio/custom-furniture/${FURNITURE_TYPES.find((t) => t.id === config.typeId)!.slug}`;

  return (
    <div
      className="rounded-[4px] border shadow-[var(--shadow-lg)]"
      style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
    >
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--studio-line)" }}>
        <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Live estimate
        </span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-faint)" }}>
          <span className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--positive)" }} aria-hidden="true" />
          Updates as you choose
        </span>
      </div>

      <div className="grid gap-4 p-4">
        <Field label="What are you building?">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TYPES.map((id) => {
              const t = FURNITURE_TYPES.find((x) => x.id === id)!;
              const active = config.typeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => apply({ typeId: id, ...t.defaults }, t.label)}
                  aria-pressed={active}
                  className="rounded-[2px] border px-2.5 py-1.5 text-[12.5px] transition-colors"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    background: active ? "color-mix(in srgb, var(--burgundy) 8%, var(--paper))" : "var(--paper)",
                    color: active ? "var(--burgundy)" : "var(--ink)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Stepper label="Width" value={config.width} min={3} max={20} onChange={(v) => apply({ width: v }, "Width")} />
          <Stepper label="Height" value={config.height} min={4} max={10} onChange={(v) => apply({ height: v }, "Height")} />
        </div>

        <Field label="Build method">
          <Segmented<BuildMethod>
            value={config.method}
            onChange={(m) => apply({ method: m }, m === "carpenter" ? "Carpenter made" : "Factory modular")}
            size="sm"
            label="Build method"
            options={[
              { id: "carpenter", label: "Carpenter", sub: "Made at site" },
              { id: "factory", label: "Factory", sub: "Machined, then fitted" },
            ]}
          />
        </Field>

        <Field label="Carcass">
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_CARCASS.map((id) => {
              const o = CARCASS_OPTIONS.find((x) => x.id === id)!;
              const active = config.carcassId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => apply({ carcassId: id }, o.label)}
                  aria-pressed={active}
                  className="rounded-[2px] border p-1.5 text-left transition-colors"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                  }}
                >
                  <Swatch from={o.swatch} to={o.swatchTo} className="h-7 w-full" />
                  <span className="mt-1 block text-[10.5px] font-medium leading-tight">{o.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Finish">
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_FINISH.map((id) => {
              const o = FINISH_OPTIONS.find((x) => x.id === id)!;
              const active = config.finishId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => apply({ finishId: id }, o.label)}
                  aria-pressed={active}
                  className="rounded-[2px] border p-1.5 text-left transition-colors"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                  }}
                >
                  <Swatch from={o.swatch} to={o.swatchTo} className="h-7 w-full" />
                  <span className="mt-1 block text-[10.5px] font-medium leading-tight">{o.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="border-t px-4 py-3.5" style={{ borderColor: "var(--studio-line)", background: "var(--stone)" }}>
        <div className="flex items-end justify-between gap-3">
          <div role="status" aria-live="polite">
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Indicative estimate
            </p>
            <p className="metric text-[32px] leading-none">{inr(quote.total)}</p>
            <p className="metric mt-1 text-[11px]" style={{ color: "var(--ink-faint)" }}>
              {inr(quote.rate!.amount)} per sq ft · materials, fabrication, installation and delivery
            </p>
          </div>
          {last ? (
            <p
              className="metric shrink-0 rounded-[2px] px-2 py-1 text-[12px] font-semibold"
              style={{
                background: last.amount > 0 ? "color-mix(in srgb, var(--burgundy) 10%, transparent)" : "rgba(47,107,70,0.12)",
                color: last.amount > 0 ? "var(--burgundy)" : "var(--positive)",
              }}
            >
              {last.label} {delta(last.amount)}
            </p>
          ) : null}
        </div>
        <Link
          href={continueHref}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[3px] px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors"
          style={{ background: "var(--burgundy)" }}
        >
          Continue configuration <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}
