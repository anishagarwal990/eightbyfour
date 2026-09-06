"use client";

import { useMemo, useState } from "react";
import { SURFACE_OPTIONS } from "@/lib/studio/catalogue";
import { delta, inr } from "@/lib/studio/format";
import {
  BACKSPLASH,
  CUTOUTS,
  DEFAULT_SURFACE_CONFIG,
  EDGE_PROFILES,
  SURFACE_APPLICATIONS,
  THICKNESSES,
  priceSurface,
  type SurfaceConfig,
} from "@/lib/studio/solidSurface";
import { MobileQuoteBar, QuotePanel } from "./QuotePanel";
import { OptionCard, OptionRail, Segmented, StepHeading, Stepper } from "./primitives";

/**
 * Solid surface is a different decision shape from furniture: fewer material
 * choices, far more fabrication choices. The configurator reflects that — the
 * sheet picker is one row, and the cut-outs and edge profile get the space,
 * because that is where the money actually goes.
 */
export function SurfaceConfigurator() {
  const [config, setConfig] = useState<SurfaceConfig>(DEFAULT_SURFACE_CONFIG);
  const quote = useMemo(() => priceSurface(config), [config]);

  const set = <K extends keyof SurfaceConfig>(k: K, v: SurfaceConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));
  const deltaFor = (patch: Partial<SurfaceConfig>) => priceSurface({ ...config, ...patch }).total - quote.total;
  const deltaProps = (patch: Partial<SurfaceConfig>, active: boolean) => {
    if (active) return { deltaLabel: "Selected", deltaTone: "neutral" as const };
    const d = deltaFor(patch);
    return { deltaLabel: delta(d), deltaTone: (d > 0 ? "up" : d < 0 ? "down" : "neutral") as "up" | "down" | "neutral" };
  };

  const app = SURFACE_APPLICATIONS.find((a) => a.id === config.applicationId)!;
  const material = quote.groups.find((g) => g.key === "materials")!.subtotal;
  const work = quote.total - material;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      <div className="min-w-0">
        <section className="mb-8">
          <StepHeading step="01" title="What are you surfacing?" />
          <OptionRail cols={3}>
            {SURFACE_APPLICATIONS.map((a) => {
              const active = a.id === config.applicationId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({ ...c, applicationId: a.id, runFt: a.defaults.runFt, cutoutIds: a.suggestedCutouts }))
                  }
                  aria-pressed={active}
                  className="w-[190px] shrink-0 rounded-[3px] border p-3.5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] sm:w-full"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                    background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span className="block text-[14px] font-semibold leading-tight">{a.label}</span>
                  <span className="mt-1 block text-[12px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                    {a.blurb}
                  </span>
                  <span className="metric mt-2 block text-[11px]" style={{ color: "var(--ink-soft)" }}>
                    {a.depthIn}″ deep
                  </span>
                </button>
              );
            })}
          </OptionRail>
        </section>

        <section className="mb-8">
          <StepHeading
            step="02"
            title="Run length"
            hint="Total length of finished surface, including returns. An L-shaped counter is the sum of both legs."
            right={
              <span className="metric shrink-0 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                {Math.round(config.runFt * (app.depthIn / 12))} sq ft
              </span>
            }
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Stepper label="Run length" value={config.runFt} min={2} max={60} step={0.5} onChange={(v) => set("runFt", v)} />
            <div className="rounded-[3px] border p-2.5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Thickness
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {THICKNESSES.map((t) => {
                  const active = t.id === config.thicknessId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("thicknessId", t.id)}
                      aria-pressed={active}
                      className="rounded-[2px] border px-2 py-1.5 text-left text-[12px] transition-colors"
                      style={{
                        borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                        color: active ? "var(--burgundy)" : "var(--ink)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {t.label}
                      <span className="block text-[10.5px] font-normal" style={{ color: "var(--ink-faint)" }}>
                        {t.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[3px] border p-2.5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Scope
              </p>
              <div className="mt-2">
                <Segmented
                  value={config.installation ? "installed" : "supply"}
                  onChange={(v) => set("installation", v === "installed")}
                  size="sm"
                  label="Scope"
                  options={[
                    { id: "installed", label: "Installed" },
                    { id: "supply", label: "Supply only" },
                  ]}
                />
              </div>
              <p className="mt-2 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                {config.installation
                  ? "Fabricated, delivered, seamed and levelled in place."
                  : "Fabricated top only. Site seaming and fitting by others."}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <StepHeading step="03" title="Surface" hint="Sheet from the EightByFour catalogue — brand, shade code and all." />
          <OptionRail cols={5}>
            {SURFACE_OPTIONS.map((s) => (
              <OptionCard
                key={s.id}
                compact
                active={s.id === config.surfaceId}
                onClick={() => set("surfaceId", s.id)}
                label={s.label}
                sub={`${s.brand} · ${s.shade}`}
                swatch={s.swatch}
                swatchTo={s.swatchTo}
                logo={s.logo}
                {...deltaProps({ surfaceId: s.id }, s.id === config.surfaceId)}
              />
            ))}
          </OptionRail>
          <p className="mt-2.5 flex gap-2 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
            <span className="tracked-caps shrink-0 text-[9px]" style={{ color: "var(--ink-faint)" }}>
              Why
            </span>
            {SURFACE_OPTIONS.find((s) => s.id === config.surfaceId)!.note}
          </p>
        </section>

        <section className="mb-8">
          <StepHeading step="04" title="Edge profile" hint="What the front edge looks like — and how thick the counter appears." />
          <OptionRail cols={5}>
            {EDGE_PROFILES.map((e) => (
              <OptionCard
                key={e.id}
                compact
                active={e.id === config.edgeId}
                onClick={() => set("edgeId", e.id)}
                label={e.label}
                sub={e.detail}
                meta={`₹${e.rate}/run ft`}
                {...deltaProps({ edgeId: e.id }, e.id === config.edgeId)}
              />
            ))}
          </OptionRail>
        </section>

        <section className="mb-8">
          <StepHeading step="05" title="Cut-outs" hint="Each one is cut, polished and reinforced. This is the honest reason two counters of the same size differ." />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CUTOUTS.map((c) => {
              const active = config.cutoutIds.includes(c.id);
              const next = active ? config.cutoutIds.filter((x) => x !== c.id) : [...config.cutoutIds, c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set("cutoutIds", next)}
                  aria-pressed={active}
                  className="flex items-start gap-2.5 rounded-[3px] border p-2.5 text-left transition-colors"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border text-[10px] leading-none text-white"
                    style={{
                      borderColor: active ? "var(--burgundy)" : "var(--studio-line-strong)",
                      background: active ? "var(--burgundy)" : "transparent",
                    }}
                    aria-hidden="true"
                  >
                    {active ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-medium leading-tight">{c.label}</span>
                    <span className="block text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="metric shrink-0 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                    {inr(c.rate)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <StepHeading step="06" title="Backsplash" hint="A coved upstand removes the silicone joint where the counter meets the wall." />
          <OptionRail cols={3}>
            {BACKSPLASH.map((b) => (
              <OptionCard
                key={b.id}
                compact
                active={b.id === config.backsplashId}
                onClick={() => set("backsplashId", b.id)}
                label={b.label}
                sub={b.detail}
                {...deltaProps({ backsplashId: b.id }, b.id === config.backsplashId)}
              />
            ))}
          </OptionRail>
        </section>

        <div className="rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
          <p className="text-[13.5px] font-semibold">
            On this counter, {Math.round((work / quote.total) * 100)}% of the cost is work, not sheet.
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Material is {inr(material)} of {inr(quote.total)}. Everything else is cutting, edge build-up, seaming,
            cut-outs and fitting — which is why a counter quote that only names a brand tells you almost nothing.
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="hidden lg:block">
          <QuotePanel quote={quote} contextLabel="Your surface quote" />
        </div>
      </div>

      <MobileQuoteBar quote={quote} contextLabel="Your surface quote" />
    </div>
  );
}
