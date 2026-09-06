"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CARCASS_OPTIONS,
  FINISH_OPTIONS,
  HARDWARE_TIERS,
  INTERNAL_FINISH_OPTIONS,
  SHUTTER_OPTIONS,
} from "@/lib/studio/catalogue";
import { getArchetype } from "@/lib/studio/archetypes";
import {
  buildPanels,
  computeMetrics,
  countLayout,
  layoutFromPreset,
  type Dimensions,
  type FurnitureLayout,
} from "@/lib/studio/geometry";
import { delta } from "@/lib/studio/format";
import {
  BUILD_METHODS,
  accessoriesFor,
  getFurnitureType,
  priceFurniture,
  type BuildMethod,
  type FurnitureConfig,
} from "@/lib/studio/furniture";
import { feetToMm, formatLength, mmToFeet, type LengthUnit } from "@/lib/studio/units";
import { MobileQuoteBar, QuotePanel } from "./QuotePanel";
import { OptionCard, OptionRail, Segmented, StepHeading } from "./primitives";
import { DimensionEntry } from "./visual/DimensionEntry";
import { FurnitureViewer, type ViewMode } from "./visual/FurnitureViewer";
import { LayoutEditor } from "./visual/LayoutEditor";

/**
 * The visual configurator.
 *
 * Three things are true at once and the layout has to keep all three visible:
 * what you are building (controls, left), what it looks like (viewer, centre)
 * and what it costs (quote, right). Every control writes into one of two
 * pieces of state — dimensions/materials in `config`, internals in `layout` —
 * and both feed the same `computeMetrics` call, so the drawing, the model and
 * the price can never describe different furniture.
 */

type Panel = "size" | "layout" | "materials" | "fronts";

const PANELS: { id: Panel; label: string }[] = [
  { id: "size", label: "Size" },
  { id: "layout", label: "Layout" },
  { id: "fronts", label: "Fronts" },
  { id: "materials", label: "Materials" },
];

export function VisualFurnitureConfigurator({ typeId = "wardrobe" }: { typeId?: string }) {
  const type = getFurnitureType(typeId);
  const archetype = getArchetype(type.id);

  const [config, setConfig] = useState<FurnitureConfig>(() => ({
    typeId: type.id,
    method: "carpenter" as BuildMethod,
    ...type.defaults,
    carcassId: "bwp-ply",
    shutterId: "mdf",
    finishId: "lam-1",
    internalId: "white-lam",
    hardwareId: "premium",
    // Drawers and the loft are geometry here, not checkbox accessories — they
    // come from the layout, and pricing them twice is the obvious trap.
    accessoryIds: [],
  }));

  const [dims, setDims] = useState<Dimensions>(() => ({
    widthMm: feetToMm(type.defaults.width),
    heightMm: feetToMm(type.defaults.height),
    depthMm: feetToMm(type.defaults.depth),
  }));

  const [unit, setUnit] = useState<LengthUnit>("ft");
  const [layout, setLayout] = useState<FurnitureLayout>(() =>
    layoutFromPreset(archetype.presets[1] ?? archetype.presets[0], archetype.defaultSections, archetype)
  );
  const [view, setView] = useState<ViewMode>("2d");
  const [panel, setPanel] = useState<Panel>("layout");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedFittingId, setSelectedFittingId] = useState<string | null>(null);

  // --- the single geometry evaluation everything else reads ----------------
  const metrics = useMemo(() => computeMetrics(dims, layout, archetype), [dims, layout, archetype]);
  const counts = useMemo(() => countLayout(metrics, layout), [metrics, layout]);
  const panels = useMemo(() => buildPanels(metrics, layout), [metrics, layout]);

  // Feet are what the pricing engine speaks; millimetres are what the geometry
  // speaks. The conversion happens here, once, rather than in both directions.
  const pricedConfig = useMemo<FurnitureConfig>(
    () => ({
      ...config,
      width: mmToFeet(dims.widthMm),
      height: mmToFeet(dims.heightMm),
      depth: mmToFeet(dims.depthMm),
      layout: counts,
    }),
    [config, dims, counts]
  );

  const quote = useMemo(() => priceFurniture(pricedConfig), [pricedConfig]);

  const deltaFor = useCallback(
    (patch: Partial<FurnitureConfig>) => priceFurniture({ ...pricedConfig, ...patch }).total - quote.total,
    [pricedConfig, quote.total]
  );
  const deltaProps = (patch: Partial<FurnitureConfig>, active: boolean) => {
    if (active) return { deltaLabel: "Selected", deltaTone: "neutral" as const };
    const d = deltaFor(patch);
    return { deltaLabel: delta(d), deltaTone: (d > 0 ? "up" : d < 0 ? "down" : "neutral") as "up" | "down" | "neutral" };
  };

  const set = <K extends keyof FurnitureConfig>(k: K, v: FurnitureConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const applyPreset = (presetId: string) => {
    const preset = archetype.presets.find((p) => p.id === presetId) ?? archetype.presets[0];
    setLayout((l) => layoutFromPreset(preset, l.sections.length, archetype, l));
  };
  const setSectionCount = (n: number) => {
    const preset = archetype.presets.find((p) => p.id === layout.presetId) ?? archetype.presets[0];
    setLayout((l) => {
      const next = layoutFromPreset(preset, n, archetype, l);
      // Door count tracks compartment count until the customer overrides it.
      return { ...next, doors: { ...l.doors, count: Math.max(2, n) }, presetId: l.presetId };
    });
    setSelectedSectionId(null);
  };

  const bounds = useMemo(
    () => ({
      width: [feetToMm(type.limits.width[0]), feetToMm(type.limits.width[1])] as [number, number],
      height: [feetToMm(type.limits.height[0]), feetToMm(type.limits.height[1])] as [number, number],
      depth: [feetToMm(type.limits.depth[0]), feetToMm(type.limits.depth[1])] as [number, number],
    }),
    [type]
  );

  // Accessories that live inside a compartment. The flat ones the form
  // configurator offers (loft, drawer bank) are geometry here instead.
  const inCompartmentAccessories = accessoriesFor(type.id).filter(
    (a) => !["loft", "drawers", "led"].includes(a.id)
  );

  const selectSection = (id: string) => {
    setSelectedSectionId(id);
    setPanel("layout");
  };

  // The 3D material callouts name the hardware tier too, so it travels with
  // the rest of the specification rather than being looked up separately.
  const spec = {
    carcassId: config.carcassId,
    shutterId: config.shutterId,
    finishId: config.finishId,
    internalId: config.internalId,
    hardwareId: config.hardwareId,
  };

  return (
    <div>
      {/* ------------------------------------------------------ headline -- */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Visual configurator
          </p>
          <h2 className="serif mt-1 text-[clamp(22px,3vw,30px)] leading-tight">What size are we working with?</h2>
        </div>
        <div className="w-full sm:w-[260px]">
          <Segmented<BuildMethod>
            value={config.method}
            onChange={(v) => set("method", v)}
            size="sm"
            label="Build method"
            options={[
              { id: "carpenter", label: "Carpenter", sub: BUILD_METHODS.carpenter.where },
              { id: "factory", label: "Factory", sub: BUILD_METHODS.factory.where },
            ]}
          />
        </div>
      </div>

      {/* Viewer first on mobile — the point of the tool is the picture, and a
          phone should show it before a wall of controls. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,320px)] lg:gap-6">
        <div className="order-1 min-w-0 lg:order-2 lg:min-h-[560px]">
          <div className="h-[430px] sm:h-[480px] lg:sticky lg:top-[128px] lg:h-[calc(100vh-180px)] lg:max-h-[720px]">
            <FurnitureViewer
              metrics={metrics}
              layout={layout}
              spec={spec}
              view={view}
              onViewChange={setView}
              selectedSectionId={selectedSectionId}
              onSelectSection={selectSection}
              selectedFittingId={selectedFittingId}
              onSelectFitting={setSelectedFittingId}
              typeLabel={type.label}
              unit={unit}
              onUnitChange={setUnit}
            />
          </div>
        </div>

        {/* --------------------------------------------------- controls -- */}
        <div className="order-2 min-w-0 lg:order-1">
          <div
            className="mb-4 inline-flex w-full rounded-[3px] border p-[3px]"
            style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
            role="radiogroup"
            aria-label="Configuration section"
          >
            {PANELS.map((p) => {
              const active = p.id === panel;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPanel(p.id)}
                  className="min-h-11 flex-1 rounded-[2px] px-2 text-[12.5px] font-semibold transition-[background-color,color,box-shadow] duration-200"
                  style={{
                    background: active ? "var(--paper)" : "transparent",
                    boxShadow: active ? "var(--shadow-sm)" : undefined,
                    color: active ? "var(--ink)" : "var(--ink-soft)",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {panel === "size" ? (
            <DimensionEntry dims={dims} bounds={bounds} unit={unit} onChange={setDims} />
          ) : null}

          {panel === "layout" ? (
            <LayoutEditor
              layout={layout}
              metrics={metrics}
              archetype={archetype}
              selectedSectionId={selectedSectionId}
              onSelectSection={selectSection}
              selectedFittingId={selectedFittingId}
              onSelectFitting={setSelectedFittingId}
              onChange={setLayout}
              onApplyPreset={applyPreset}
              onSectionCount={setSectionCount}
              accessories={inCompartmentAccessories}
              unit={unit}
            />
          ) : null}

          {panel === "fronts" ? (
            <div>
              <StepHeading step="Fronts" title="How does it close?" />
              <Segmented
                value={layout.doors.type}
                onChange={(v) => setLayout((l) => ({ ...l, doors: { ...l.doors, type: v } }))}
                label="Front type"
                options={archetype.doorTypes.map((d) => ({
                  id: d,
                  label: d === "hinged" ? "Hinged" : d === "sliding" ? "Sliding" : "Open",
                  sub: d === "hinged" ? "Swing out" : d === "sliding" ? "Slide across" : "No shutters",
                }))}
              />
              {layout.doors.type !== "open" ? (
                <div className="mt-3">
                  <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    Shutters
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[2, 3, 4, 5, 6].map((n) => {
                      const active = layout.doors.count === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setLayout((l) => ({ ...l, doors: { ...l.doors, count: n } }))}
                          className="min-h-11 min-w-11 rounded-[3px] border px-3 text-[13px] transition-colors"
                          style={{
                            borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                            color: active ? "var(--burgundy)" : "var(--ink-soft)",
                            fontWeight: active ? 600 : 400,
                            background: active ? "color-mix(in srgb, var(--burgundy) 5%, transparent)" : "var(--paper)",
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <span className="metric self-center text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                      {formatLength(dims.widthMm / layout.doors.count, unit)} each
                    </span>
                  </div>
                </div>
              ) : null}

              {archetype.supportsLoft ? (
                <div className="mt-5">
                  <StepHeading step="Loft" title="Storage above?" hint="A second carcass over the main unit, priced as its own band." />
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      aria-pressed={layout.loft.enabled}
                      onClick={() => setLayout((l) => ({ ...l, loft: { ...l.loft, enabled: !l.loft.enabled } }))}
                      className="rounded-[3px] border px-3.5 py-2.5 text-[13px] transition-colors"
                      style={{
                        borderColor: layout.loft.enabled ? "var(--burgundy)" : "var(--studio-line)",
                        color: layout.loft.enabled ? "var(--burgundy)" : "var(--ink-soft)",
                        fontWeight: layout.loft.enabled ? 600 : 400,
                        background: layout.loft.enabled
                          ? "color-mix(in srgb, var(--burgundy) 6%, var(--paper))"
                          : "var(--paper)",
                      }}
                    >
                      {layout.loft.enabled ? "Loft added" : "Add loft"}
                    </button>
                    {layout.loft.enabled ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="Lower loft"
                            onClick={() =>
                              setLayout((l) => ({ ...l, loft: { ...l.loft, heightMm: Math.max(300, l.loft.heightMm - 152.4) } }))
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-[2px] border text-lg leading-none"
                            style={{ borderColor: "var(--studio-line)" }}
                          >
                            −
                          </button>
                          <span className="metric min-w-[64px] text-center text-[15px]">
                            {formatLength(layout.loft.heightMm, unit)}
                          </span>
                          <button
                            type="button"
                            aria-label="Raise loft"
                            onClick={() =>
                              setLayout((l) => ({
                                ...l,
                                loft: { ...l.loft, heightMm: Math.min(dims.heightMm * 0.4, l.loft.heightMm + 152.4) },
                              }))
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-[2px] border text-lg leading-none"
                            style={{ borderColor: "var(--studio-line)" }}
                          >
                            +
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                  {layout.loft.enabled ? (
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                      {[
                        { k: "Loft", v: formatLength(layout.loft.heightMm, unit) },
                        { k: "Main unit", v: formatLength(metrics.carcassTopY, unit) },
                        { k: "Total", v: formatLength(dims.heightMm, unit) },
                      ].map((r) => (
                        <div
                          key={r.k}
                          className="rounded-[3px] border p-2"
                          style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
                        >
                          <dt className="tracked-caps text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                            {r.k}
                          </dt>
                          <dd className="metric mt-0.5 text-[14px]">{r.v}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {panel === "materials" ? (
            <div className="space-y-6">
              <section>
                <StepHeading step="Carcass" title="The box behind the doors." />
                <OptionRail cols={3}>
                  {CARCASS_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === config.carcassId}
                      onClick={() => set("carcassId", o.id)}
                      label={o.label}
                      sub={`${o.brand} · ${o.spec}`}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      logo={o.logo}
                      {...deltaProps({ carcassId: o.id }, o.id === config.carcassId)}
                    />
                  ))}
                </OptionRail>
              </section>

              <section>
                <StepHeading step="Shutters" title="The board the fronts are made from." />
                <OptionRail cols={4}>
                  {SHUTTER_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === config.shutterId}
                      onClick={() => set("shutterId", o.id)}
                      label={o.label}
                      sub={`${o.brand} · ${o.spec}`}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      logo={o.logo}
                      {...deltaProps({ shutterId: o.id }, o.id === config.shutterId)}
                    />
                  ))}
                </OptionRail>
              </section>

              <section>
                <StepHeading step="Finish" title="What you actually see and touch." hint="Changes the model as you pick." />
                <OptionRail cols={3}>
                  {FINISH_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === config.finishId}
                      onClick={() => set("finishId", o.id)}
                      label={o.label}
                      sub={`${o.brand} · ${o.spec}`}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      logo={o.logo}
                      {...deltaProps({ finishId: o.id }, o.id === config.finishId)}
                    />
                  ))}
                </OptionRail>
              </section>

              <section>
                <StepHeading step="Interiors" title="Inside the compartments." />
                <OptionRail cols={4}>
                  {INTERNAL_FINISH_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === config.internalId}
                      onClick={() => set("internalId", o.id)}
                      label={o.label}
                      sub={o.spec}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      {...deltaProps({ internalId: o.id }, o.id === config.internalId)}
                    />
                  ))}
                </OptionRail>
              </section>

              <section>
                <StepHeading step="Hardware" title="Hinges, runners and handles." />
                <OptionRail cols={3}>
                  {HARDWARE_TIERS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === config.hardwareId}
                      onClick={() => set("hardwareId", o.id)}
                      label={o.label}
                      sub={o.brand}
                      {...deltaProps({ hardwareId: o.id }, o.id === config.hardwareId)}
                    />
                  ))}
                </OptionRail>
              </section>
            </div>
          ) : null}
        </div>

        {/* ------------------------------------------------------ quote -- */}
        <div className="order-3 hidden min-w-0 lg:block">
          <QuotePanel
            quote={quote}
            contextLabel="Your rough estimate"
            compareNote={
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {counts.shelves} shelves · {counts.drawers} drawers · {counts.rails} rails · {counts.partitions}{" "}
                partitions · {panels.length} components in the model
              </p>
            }
          />
        </div>
      </div>

      <MobileQuoteBar quote={quote} contextLabel="Your rough estimate" />
    </div>
  );
}
