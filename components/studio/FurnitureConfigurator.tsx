"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CARCASS_OPTIONS,
  FINISH_OPTIONS,
  HARDWARE_TIERS,
  INTERNAL_FINISH_OPTIONS,
  SHUTTER_OPTIONS,
} from "@/lib/studio/catalogue";
import {
  BUILD_METHODS,
  DEFAULT_CONFIG,
  FURNITURE_TYPES,
  accessoriesFor,
  getFurnitureType,
  priceBothMethods,
  priceFurniture,
  type BuildMethod,
  type FurnitureConfig,
} from "@/lib/studio/furniture";
import { delta, inr } from "@/lib/studio/format";
import { MobileQuoteBar, QuotePanel } from "./QuotePanel";
import { OptionCard, OptionRail, Segmented, StepHeading, Stepper } from "./primitives";

type Mode = "simple" | "pro";

/**
 * The flagship. Two rules govern everything here:
 *
 *  1. A number is on screen before the first decision, and it moves on every
 *     decision after that. Nobody completes fifteen steps to see a price.
 *  2. Every option shows what choosing it would do to the total, computed by
 *     actually re-running the pricing engine with that option substituted —
 *     not by displaying a static "+₹12,000" written into the copy.
 */
export function FurnitureConfigurator({ initialTypeId }: { initialTypeId?: string }) {
  const [mode, setMode] = useState<Mode>("simple");
  const [config, setConfig] = useState<FurnitureConfig>(() => {
    if (!initialTypeId) return DEFAULT_CONFIG;
    const type = getFurnitureType(initialTypeId);
    return { ...DEFAULT_CONFIG, typeId: type.id, ...type.defaults };
  });
  const [showCompare, setShowCompare] = useState(false);

  const type = getFurnitureType(config.typeId);
  const quote = useMemo(() => priceFurniture(config), [config]);
  const both = useMemo(() => priceBothMethods(config), [config]);

  const set = <K extends keyof FurnitureConfig>(key: K, value: FurnitureConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  /** What the total would become if this one field changed — the real engine. */
  const deltaFor = useMemo(
    () => (patch: Partial<FurnitureConfig>) => priceFurniture({ ...config, ...patch }).total - quote.total,
    [config, quote.total]
  );

  const deltaProps = (patch: Partial<FurnitureConfig>, isActive: boolean) => {
    if (isActive) return { deltaLabel: "Selected", deltaTone: "neutral" as const };
    const d = deltaFor(patch);
    return {
      deltaLabel: delta(d),
      deltaTone: (d > 0 ? "up" : d < 0 ? "down" : "neutral") as "up" | "down" | "neutral",
    };
  };

  const accessories = accessoriesFor(config.typeId);
  const methodDiff = both.factory.total - both.carpenter.total;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      {/* ------------------------------------------------------- controls -- */}
      <div className="min-w-0">
        {/* Mode switch. Simple hides brand and thickness; Pro shows the spec. */}
        <div
          className="mb-6 flex flex-col gap-3 rounded-[3px] border p-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
        >
          <div>
            <p className="text-[13px] font-semibold">
              {mode === "simple" ? "Guided" : "Full specification"}
            </p>
            <p className="text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
              {mode === "simple"
                ? "Choices described by what they do. Brands and thicknesses stay on the quote."
                : "Brand, grade and thickness on every option — pick the exact material."}
            </p>
          </div>
          <div className="w-full sm:w-[240px]">
            <Segmented<Mode>
              value={mode}
              onChange={setMode}
              size="sm"
              label="Specification detail"
              options={[
                { id: "simple", label: "Simple", sub: "Guide me" },
                { id: "pro", label: "Pro", sub: "I know my specs" },
              ]}
            />
          </div>
        </div>

        <section className="mb-8">
          <StepHeading step="01" title="What are you building?" />
          <OptionRail cols={5}>
            {FURNITURE_TYPES.map((t) => {
              const active = t.id === config.typeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, typeId: t.id, ...t.defaults, accessoryIds: [] }))}
                  aria-pressed={active}
                  className="w-[150px] shrink-0 rounded-[3px] border p-3 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] sm:w-full"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                    background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span className="block text-[13px] font-semibold leading-tight">{t.label}</span>
                  <span className="mt-1 block text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                    {t.blurb}
                  </span>
                </button>
              );
            })}
          </OptionRail>
        </section>

        {/* ------------------------------------------------ build method -- */}
        <section className="mb-8">
          <StepHeading
            step="02"
            title="How do you want it built?"
            hint="Neither is better everywhere. The same specification is priced both ways below."
            right={
              <button
                type="button"
                onClick={() => setShowCompare((v) => !v)}
                className="shrink-0 rounded-[3px] border px-3 py-1.5 text-[12px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line)" }}
              >
                {showCompare ? "Hide comparison" : "Compare both"}
              </button>
            }
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(Object.keys(BUILD_METHODS) as BuildMethod[]).map((m) => {
              const meta = BUILD_METHODS[m];
              const active = config.method === m;
              const methodTotal = m === "carpenter" ? both.carpenter.total : both.factory.total;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("method", m)}
                  aria-pressed={active}
                  className="rounded-[3px] border p-4 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                    background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="serif text-[17px]">{meta.label}</span>
                    <span className="metric text-[15px]">{inr(methodTotal)}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px]" style={{ color: "var(--ink-faint)" }}>
                    {meta.where} · {meta.lead}
                  </span>
                  <ul className="mt-3 flex flex-col gap-1">
                    {meta.benefits.slice(0, 3).map((b) => (
                      <li key={b} className="flex gap-1.5 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                        <span style={{ color: "var(--burgundy)" }}>—</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {showCompare ? <MethodComparison diff={methodDiff} /> : null}
        </section>

        {/* -------------------------------------------------- dimensions -- */}
        <section className="mb-8">
          <StepHeading
            step="03"
            title="Dimensions"
            hint="Approximate is fine here — the verified quote is measured on site."
            right={
              <span className="metric shrink-0 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                {Math.round(config.width * config.height)} sq ft elevation
              </span>
            }
          />
          <div className="grid grid-cols-3 gap-2.5">
            <Stepper label="Width" value={config.width} min={type.limits.width[0]} max={type.limits.width[1]} onChange={(v) => set("width", v)} />
            <Stepper label="Height" value={config.height} min={type.limits.height[0]} max={type.limits.height[1]} onChange={(v) => set("height", v)} />
            <Stepper label="Depth" value={config.depth} min={type.limits.depth[0]} max={type.limits.depth[1]} onChange={(v) => set("depth", v)} />
          </div>
        </section>

        {/* ----------------------------------------------------- carcass -- */}
        <section className="mb-8">
          <StepHeading
            step="04"
            title="Carcass"
            hint={
              mode === "simple"
                ? "The box behind the doors. This is what decides how long the furniture lasts."
                : "Board for sides, top, bottom, shelves and partitions."
            }
          />
          <OptionRail cols={5}>
            {CARCASS_OPTIONS.map((o) => (
              <OptionCard
                key={o.id}
                compact
                active={o.id === config.carcassId}
                onClick={() => set("carcassId", o.id)}
                label={mode === "simple" ? o.plain : o.label}
                sub={mode === "simple" ? o.label : `${o.brand} · ${o.spec}`}
                meta={mode === "pro" ? `₹${o.rate.toLocaleString("en-IN")}/sheet` : undefined}
                swatch={o.swatch}
                swatchTo={o.swatchTo}
                logo={mode === "pro" ? o.logo : undefined}
                {...deltaProps({ carcassId: o.id }, o.id === config.carcassId)}
              />
            ))}
          </OptionRail>
          <SelectedNote text={CARCASS_OPTIONS.find((o) => o.id === config.carcassId)?.note} />
        </section>

        {/* ---------------------------------------------------- shutters -- */}
        <section className="mb-8">
          <StepHeading
            step="05"
            title="Shutters"
            hint={mode === "simple" ? "The doors themselves — what you touch every day." : "Shutter substrate, before the finish goes on."}
          />
          <OptionRail cols={4}>
            {SHUTTER_OPTIONS.map((o) => (
              <OptionCard
                key={o.id}
                compact
                active={o.id === config.shutterId}
                onClick={() => set("shutterId", o.id)}
                label={mode === "simple" ? o.plain : o.label}
                sub={mode === "simple" ? o.label : `${o.brand} · ${o.spec}`}
                meta={mode === "pro" ? `₹${o.rate.toLocaleString("en-IN")}/sheet` : undefined}
                swatch={o.swatch}
                swatchTo={o.swatchTo}
                {...deltaProps({ shutterId: o.id }, o.id === config.shutterId)}
              />
            ))}
          </OptionRail>
          <SelectedNote text={SHUTTER_OPTIONS.find((o) => o.id === config.shutterId)?.note} />
        </section>

        {/* ------------------------------------------------------ finish -- */}
        <section className="mb-8">
          <StepHeading
            step="06"
            title="Finish"
            hint="The visible face. Usually the single biggest lever on the total."
          />
          <OptionRail cols={4}>
            {FINISH_OPTIONS.map((o) => (
              <OptionCard
                key={o.id}
                compact
                active={o.id === config.finishId}
                onClick={() => set("finishId", o.id)}
                label={mode === "simple" ? o.plain : o.label}
                sub={mode === "simple" ? o.label : `${o.brand} · ${o.spec}`}
                swatch={o.swatch}
                swatchTo={o.swatchTo}
                logo={mode === "pro" ? o.logo : undefined}
                {...deltaProps({ finishId: o.id }, o.id === config.finishId)}
              />
            ))}
          </OptionRail>
          <SelectedNote text={FINISH_OPTIONS.find((o) => o.id === config.finishId)?.note} />
        </section>

        {/* --------------------------------------------- internal finish -- */}
        <section className="mb-8">
          <StepHeading step="07" title="Internal finish" hint="What you see when the doors are open." />
          <OptionRail cols={4}>
            {INTERNAL_FINISH_OPTIONS.map((o) => (
              <OptionCard
                key={o.id}
                compact
                active={o.id === config.internalId}
                onClick={() => set("internalId", o.id)}
                label={mode === "simple" ? o.plain : o.label}
                sub={mode === "simple" ? o.label : `${o.brand} · ${o.spec}`}
                swatch={o.swatch}
                swatchTo={o.swatchTo}
                {...deltaProps({ internalId: o.id }, o.id === config.internalId)}
              />
            ))}
          </OptionRail>
        </section>

        {/* ---------------------------------------------------- hardware -- */}
        <section className="mb-8">
          <StepHeading step="08" title="Hardware" hint="Hinges, runners and handles. The part that either keeps working or starts sagging." />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {HARDWARE_TIERS.map((h) => {
              const active = h.id === config.hardwareId;
              const d = deltaFor({ hardwareId: h.id });
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => set("hardwareId", h.id)}
                  aria-pressed={active}
                  className="rounded-[3px] border p-3.5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                    background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold">{mode === "simple" ? h.plain : h.label}</span>
                    {h.logo ? (
                      <Image src={`/brand-logos/${h.logo}`} alt={h.brand} width={56} height={18} className="h-4 w-auto object-contain opacity-80" />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                    {mode === "simple" ? h.label : h.brand}
                  </span>
                  <span className="mt-2 block text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                    {h.note}
                  </span>
                  {mode === "pro" ? (
                    <span className="mt-2 block border-t pt-2" style={{ borderColor: "var(--studio-line)" }}>
                      {h.components.map((c) => (
                        <span key={c.label} className="flex justify-between text-[11px]" style={{ color: "var(--ink-faint)" }}>
                          <span>{c.label}</span>
                          <span className="metric">
                            ₹{c.rate.toLocaleString("en-IN")}/{c.unit}
                          </span>
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span
                    className="metric mt-2 block text-[12px] font-semibold"
                    style={{ color: active ? "var(--ink-faint)" : d > 0 ? "var(--burgundy)" : "var(--positive)" }}
                  >
                    {active ? "Selected" : delta(d)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------- accessories -- */}
        <section className="mb-8">
          <StepHeading step="09" title="Accessories" hint="Optional. Each one is a real product with its own price." />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {accessories.map((a) => {
              const active = config.accessoryIds.includes(a.id);
              const next = active
                ? config.accessoryIds.filter((id) => id !== a.id)
                : [...config.accessoryIds, a.id];
              const d = deltaFor({ accessoryIds: next });
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => set("accessoryIds", next)}
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
                    <span className="block text-[12.5px] font-medium leading-tight">{a.label}</span>
                    <span className="block text-[11px]" style={{ color: "var(--ink-faint)" }}>
                      {a.brand} · {a.note}
                    </span>
                  </span>
                  <span className="metric shrink-0 text-[12px]" style={{ color: active ? "var(--positive)" : "var(--ink-soft)" }}>
                    {delta(d)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <AlternativeSpecs config={config} baseTotal={quote.total} onApply={setConfig} />
      </div>

      {/* ---------------------------------------------------------- quote -- */}
      <div className="min-w-0">
        <div className="hidden lg:block">
          <QuotePanel
            quote={quote}
            compareNote={
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                Same specification {config.method === "carpenter" ? "factory modular" : "carpenter made"}:{" "}
                <button
                  type="button"
                  onClick={() => set("method", config.method === "carpenter" ? "factory" : "carpenter")}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: "var(--burgundy)" }}
                >
                  {inr(config.method === "carpenter" ? both.factory.total : both.carpenter.total)}
                </button>
              </p>
            }
          />
        </div>
      </div>

      <MobileQuoteBar quote={quote} />
    </div>
  );
}

function SelectedNote({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-2.5 flex gap-2 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
      <span className="tracked-caps shrink-0 text-[9px]" style={{ color: "var(--ink-faint)" }}>
        Why
      </span>
      {text}
    </p>
  );
}

function MethodComparison({ diff }: { diff: number }) {
  return (
    <div className="mt-3 rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
      <p className="text-[13px] font-semibold">
        On this specification, factory modular is {diff === 0 ? "the same price" : `${inr(Math.abs(diff))} ${diff > 0 ? "more" : "less"}`}.
      </p>
      <p className="mt-1 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
        Most of that difference is edge banding and machining, not margin: factory panels are banded on all four edges
        and drilled to a 32 mm system, which carpenter work does on visible edges only.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(["carpenter", "factory"] as BuildMethod[]).map((m) => (
          <div key={m}>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              {BUILD_METHODS[m].label}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {BUILD_METHODS[m].benefits.map((b) => (
                <li key={b} className="flex gap-2 text-[12px] leading-snug">
                  <span style={{ color: "var(--positive)" }}>+</span>
                  {b}
                </li>
              ))}
              {BUILD_METHODS[m].tradeoffs.map((b) => (
                <li key={b} className="flex gap-2 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                  <span style={{ color: "var(--burgundy)" }}>−</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Three one-click alternatives to the current specification, each priced by
 * the same engine. This is the "what changes the cost" idea made operable
 * rather than illustrated.
 */
function AlternativeSpecs({
  config,
  baseTotal,
  onApply,
}: {
  config: FurnitureConfig;
  baseTotal: number;
  onApply: (c: FurnitureConfig) => void;
}) {
  const candidates: { title: string; why: string; patch: Partial<FurnitureConfig> }[] = [
    {
      title: "Cut cost without losing durability",
      why: "HDHMR carcass instead of BWP ply, 0.8 mm laminate instead of 1 mm. Still moisture-tolerant.",
      patch: { carcassId: "hdhmr", finishId: "lam-08" },
    },
    {
      title: "Spend it on the finish",
      why: "Acrylic matt shutters on the same carcass — the part you see and touch.",
      patch: { finishId: "acrylic-matt", shutterId: "mdf" },
    },
    {
      title: "Spend it on the mechanism",
      why: "Blum hinges and runners. Nothing visible changes; everything you operate does.",
      patch: { hardwareId: "luxury" },
    },
  ];

  const priced = candidates
    .map((c) => {
      const next = { ...config, ...c.patch };
      return { ...c, next, total: priceFurniture(next).total };
    })
    .filter((c) => Math.abs(c.total - baseTotal) > 500);

  if (priced.length === 0) return null;

  return (
    <section className="mb-8">
      <StepHeading step="10" title="Alternative specifications" hint="Same furniture, different decisions — priced by the same engine." />
      <div className="grid gap-2.5 sm:grid-cols-3">
        {priced.map((c) => {
          const d = c.total - baseTotal;
          return (
            <button
              key={c.title}
              type="button"
              onClick={() => onApply(c.next)}
              className="rounded-[3px] border p-3.5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--burgundy)] hover:shadow-[var(--shadow-sm)]"
              style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
            >
              <span className="block text-[13px] font-semibold leading-tight">{c.title}</span>
              <span className="mt-1.5 block text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {c.why}
              </span>
              <span className="mt-3 flex items-baseline justify-between gap-2">
                <span className="metric text-[16px]">{inr(c.total)}</span>
                <span className="metric text-[12px] font-semibold" style={{ color: d > 0 ? "var(--burgundy)" : "var(--positive)" }}>
                  {delta(d)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
