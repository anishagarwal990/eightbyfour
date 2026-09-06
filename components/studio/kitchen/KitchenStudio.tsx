"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  CARCASS_OPTIONS,
  FINISH_OPTIONS,
  HARDWARE_TIERS,
  SHUTTER_OPTIONS,
} from "@/lib/studio/catalogue";
import { delta, inr } from "@/lib/studio/format";
import type { BuildMethod } from "@/lib/studio/furniture";
import { getCabinetType } from "@/lib/studio/kitchen/cabinets";
import { layoutOptions, runLength } from "@/lib/studio/kitchen/layout";
import { COUNTER_MATERIALS, HANDLE_OPTIONS, priceKitchen } from "@/lib/studio/kitchen/pricing";
import { SAMPLE_PROJECT, createProject, rebuildRuns } from "@/lib/studio/kitchen/project";
import {
  LAYOUT_LABEL,
  WALL_IDS,
  WALL_LABEL,
  type KitchenProject,
  type PlacedCabinet,
  type WallId,
} from "@/lib/studio/kitchen/types";
import { servicePoints, validateKitchen } from "@/lib/studio/kitchen/validate";
import type { LengthUnit } from "@/lib/studio/units";
import { MobileQuoteBar, QuotePanel } from "../QuotePanel";
import { OptionCard, OptionRail, Segmented, StepHeading } from "../primitives";
import { UnitSwitcher } from "../visual/DimensionEntry";
import { BoqView } from "./BoqView";
import { CabinetInspector } from "./CabinetInspector";
import { KitchenElevation } from "./KitchenElevation";
import { Plan2D } from "./Plan2D";
import { RoomSetup } from "./RoomSetup";

/**
 * Studio Kitchen.
 *
 * Holds the one canonical KitchenProject and hands slices of it to the views.
 * Nothing below this component owns geometry or money: the plan, the elevation,
 * the 3D scene, the BOQ and the quote are all derived from the same object on
 * every render, which is what stops them describing different kitchens.
 */

const Scene3D = dynamic(() => import("./KitchenScene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center" style={{ background: "var(--stone-deep)" }}>
      <div className="text-center">
        <div
          className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--studio-line-strong)", borderTopColor: "transparent" }}
        />
        <p className="mt-3 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
          Preparing the 3D kitchen…
        </p>
      </div>
    </div>
  ),
});

type View = "plan" | "3d" | "elevation" | "exploded" | "electrical" | "plumbing" | "boq";

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "plan", label: "Plan", hint: "Dimensioned floor plan" },
  { id: "3d", label: "3D", hint: "Rotate the kitchen" },
  { id: "elevation", label: "Elevation", hint: "One wall, with heights" },
  { id: "exploded", label: "Exploded", hint: "Take one cabinet apart" },
  { id: "electrical", label: "Electrical", hint: "Suggested power points" },
  { id: "plumbing", label: "Plumbing", hint: "Supply, waste and gas" },
  { id: "boq", label: "BOQ", hint: "Materials and quantities" },
];

type Panel = "room" | "layout" | "cabinet" | "materials" | "surfaces";

const PANELS: { id: Panel; label: string }[] = [
  { id: "room", label: "Room" },
  { id: "layout", label: "Layout" },
  { id: "cabinet", label: "Cabinet" },
  { id: "materials", label: "Materials" },
  { id: "surfaces", label: "Surfaces" },
];

export function KitchenStudio() {
  const [project, setProject] = useState<KitchenProject>(() => createProject());
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [view, setView] = useState<View>("plan");
  const [panel, setPanel] = useState<Panel>("layout");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [elevationWall, setElevationWall] = useState<WallId>("N");
  const [explode, setExplode] = useState(0.5);
  const [resetKey, setResetKey] = useState(0);

  // --- everything derived, on every render --------------------------------
  const costing = useMemo(() => priceKitchen(project), [project]);
  const issues = useMemo(() => validateKitchen(project), [project]);
  const services = useMemo(() => servicePoints(project), [project]);
  const options = useMemo(() => layoutOptions(project.room), [project.room]);

  const selected = useMemo(
    () =>
      project.runs
        .flatMap((run) => run.cabinets.map((cab) => ({ cab, run })))
        .find((x) => x.cab.id === selectedId) ?? null,
    [project.runs, selectedId]
  );

  const set = <K extends keyof KitchenProject>(k: K, v: KitchenProject[K]) =>
    setProject((p) => ({ ...p, [k]: v }));

  /** What one change would do to the total, from the real engine. */
  const deltaFor = useCallback(
    (patch: Partial<KitchenProject>) => priceKitchen({ ...project, ...patch }).quote.total - costing.quote.total,
    [project, costing.quote.total]
  );
  const deltaProps = (patch: Partial<KitchenProject>, active: boolean) => {
    if (active) return { deltaLabel: "Selected", deltaTone: "neutral" as const };
    const d = deltaFor(patch);
    return { deltaLabel: delta(d), deltaTone: (d > 0 ? "up" : d < 0 ? "down" : "neutral") as "up" | "down" | "neutral" };
  };

  const updateCabinet = (next: PlacedCabinet) =>
    setProject((p) => ({
      ...p,
      runs: p.runs.map((r) => ({ ...r, cabinets: r.cabinets.map((c) => (c.id === next.id ? next : c)) })),
    }));

  const removeCabinet = (id: string) =>
    setProject((p) => ({ ...p, runs: p.runs.map((r) => ({ ...r, cabinets: r.cabinets.filter((c) => c.id !== id) })) }));

  const cabinetDelta = (next: PlacedCabinet) => {
    const patched: KitchenProject = {
      ...project,
      runs: project.runs.map((r) => ({ ...r, cabinets: r.cabinets.map((c) => (c.id === next.id ? next : c)) })),
    };
    return priceKitchen(patched).quote.total - costing.quote.total;
  };

  const applyLayout = (kind: string, walls: WallId[]) =>
    setProject((p) => {
      const next = { ...p, layout: kind as KitchenProject["layout"] };
      return rebuildRuns(next, walls);
    });

  const budgetGap = project.brief.budget ? costing.quote.total - project.brief.budget : null;


  return (
    <div>
      {/* ------------------------------------------------------- headline -- */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Studio kitchen
          </p>
          <h2 className="serif mt-1 text-[clamp(22px,3vw,30px)] leading-tight">
            Give Studio the room. It designs the kitchen.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setProject(SAMPLE_PROJECT());
              setSelectedId(null);
            }}
            className="min-h-11 rounded-[3px] border px-3 text-[12.5px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
            style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
          >
            Load sample kitchen
          </button>
          <div className="w-[220px]">
            <Segmented<BuildMethod>
              value={project.method}
              onChange={(v) => set("method", v)}
              size="sm"
              label="Construction method"
              options={[
                { id: "factory", label: "Factory", sub: "Machined" },
                { id: "carpenter", label: "Carpenter", sub: "On site" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,320px)] lg:gap-6">
        {/* -------------------------------------------------- visualiser -- */}
        <div className="order-1 min-w-0 lg:order-2">
          <div
            className="flex h-[420px] flex-col overflow-hidden rounded-[3px] border sm:h-[520px] lg:sticky lg:top-[128px] lg:h-[calc(100vh-180px)] lg:max-h-[760px]"
            style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
          >
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--studio-line)" }}>
              <div
                className="flex flex-wrap rounded-[3px] border p-[3px]"
                style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
                role="radiogroup"
                aria-label="View"
              >
                {VIEWS.map((v) => {
                  const active = v.id === view;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={v.hint}
                      onClick={() => setView(v.id)}
                      className="flex min-h-9 items-center rounded-[2px] px-2.5 text-[12px] font-semibold transition-[background-color,color,box-shadow] duration-200"
                      style={{
                        background: active ? "var(--paper)" : "transparent",
                        boxShadow: active ? "var(--shadow-sm)" : undefined,
                        color: active ? "var(--ink)" : "var(--ink-soft)",
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto">
                <UnitSwitcher unit={unit} onChange={setUnit} compact />
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              {view === "plan" || view === "electrical" || view === "plumbing" ? (
                <div className="absolute inset-0 p-3 sm:p-4">
                  <Plan2D
                    project={project}
                    unit={unit}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      setSelectedId(id);
                      if (id) setPanel("cabinet");
                    }}
                    services={view === "plan" ? undefined : services}
                    serviceFilter={view === "electrical" ? "power" : "plumbing"}
                  />
                </div>
              ) : view === "elevation" ? (
                <div className="absolute inset-0 p-3 sm:p-4">
                  <KitchenElevation
                    project={project}
                    wall={elevationWall}
                    unit={unit}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      setSelectedId(id);
                      if (id) setPanel("cabinet");
                    }}
                  />
                </div>
              ) : view === "boq" ? (
                <BoqView
                  boq={costing.boq}
                  wastageNote={`Includes ${project.method === "factory" ? "6%" : "12%"} wastage — ${project.method === "factory" ? "factory nesting cuts closer than hand cutting does" : "hand cutting on site wastes more board"}.`}
                />
              ) : (
                <div className="absolute inset-0">
                  <Scene3D
                    project={project}
                    explode={view === "exploded" ? explode : 0}
                    focusCabinetId={view === "exploded" ? (selectedId ?? undefined) : undefined}
                    selectedCabinetId={selectedId}
                    onSelectCabinet={(id) => {
                      setSelectedId(id);
                      if (id) setPanel("cabinet");
                    }}
                    resetKey={resetKey}
                  />
                  {view === "exploded" && !selectedId ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                      <p
                        className="rounded-[3px] px-3 py-2 text-[12px] shadow-[var(--shadow-md)]"
                        style={{ background: "var(--paper)", color: "var(--ink-soft)" }}
                      >
                        Select a cabinet to take it apart — exploding the whole kitchen at once is unreadable.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ------------------------------------------- view controls -- */}
            <div className="border-t px-3 py-2.5" style={{ borderColor: "var(--studio-line)" }}>
              {view === "elevation" ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="tracked-caps mr-1 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                    Wall
                  </span>
                  {WALL_IDS.map((w) => {
                    const active = w === elevationWall;
                    return (
                      <button
                        key={w}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setElevationWall(w)}
                        className="min-h-9 rounded-[3px] border px-2.5 text-[12px] transition-colors"
                        style={{
                          borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                          color: active ? "var(--burgundy)" : "var(--ink-soft)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {WALL_LABEL[w]}
                      </button>
                    );
                  })}
                </div>
              ) : view === "exploded" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tracked-caps shrink-0 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                    Assembled
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={explode}
                    onChange={(e) => setExplode(Number(e.target.value))}
                    aria-label="Separation between components"
                    className="min-w-[100px] flex-1 accent-[var(--burgundy)]"
                  />
                  <span className="tracked-caps shrink-0 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                    Exploded
                  </span>
                  <button
                    type="button"
                    onClick={() => setResetKey((k) => k + 1)}
                    className="min-h-9 rounded-[3px] border px-2.5 text-[12px]"
                    style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
                  >
                    Reset view
                  </button>
                </div>
              ) : view === "electrical" || view === "plumbing" ? (
                <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                  {view === "electrical"
                    ? "Suggested power points, derived from the appliances and lighting you configured. Advisory — an electrician sets the final positions on site."
                    : "Supply, waste and gas implied by the sink, dishwasher and hob. Advisory — verify against the existing plumbing before work starts."}
                </p>
              ) : view === "3d" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResetKey((k) => k + 1)}
                    className="min-h-9 rounded-[3px] border px-2.5 text-[12px]"
                    style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
                  >
                    Reset view
                  </button>
                  <span className="text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                    Drag to rotate · tap a cabinet to configure it
                  </span>
                </div>
              ) : (
                <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                  Tap a cabinet to change what it is and what goes inside it. Concept design — not a shop drawing.
                </p>
              )}
            </div>
          </div>

          {/* ------------------------------------------------- warnings -- */}
          {issues.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {issues.slice(0, 3).map((i) => (
                <div
                  key={i.id}
                  className="rounded-[3px] p-2.5"
                  style={{
                    background:
                      i.level === "warning" ? "color-mix(in srgb, var(--burgundy) 7%, var(--paper))" : "var(--stone-deep)",
                  }}
                >
                  <p className="text-[12.5px] font-semibold" style={{ color: i.level === "warning" ? "var(--burgundy)" : "var(--ink)" }}>
                    {i.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                    {i.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* ---------------------------------------------------- controls -- */}
        <div className="order-2 min-w-0 lg:order-1">
          <div
            className="mb-4 flex w-full rounded-[3px] border p-[3px]"
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
                  className="min-h-11 flex-1 rounded-[2px] px-1 text-[11.5px] font-semibold transition-[background-color,color,box-shadow] duration-200"
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

          {panel === "room" ? (
            <RoomSetup
              room={project.room}
              brief={project.brief}
              appliances={project.appliances}
              unit={unit}
              onRoom={(room) => setProject((p) => rebuildRuns({ ...p, room }))}
              onBrief={(brief) => setProject((p) => rebuildRuns({ ...p, brief }))}
              onAppliances={(appliances) => setProject((p) => rebuildRuns({ ...p, appliances }))}
            />
          ) : null}

          {panel === "layout" ? (
            <div>
              <StepHeading step="Layout" title="What Studio suggests for this room" hint="Ranked by usable run and by how much room is left to stand in." />
              <div className="space-y-2.5">
                {options.map((o, i) => {
                  const active = o.kind === project.layout;
                  return (
                    <button
                      key={o.kind}
                      type="button"
                      aria-pressed={active}
                      disabled={!o.fits}
                      onClick={() => applyLayout(o.kind, o.walls)}
                      className="w-full rounded-[3px] border p-3 text-left transition-colors disabled:opacity-45"
                      style={{
                        borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                        boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                        background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                      }}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-semibold">
                          {LAYOUT_LABEL[o.kind]}
                          {i === 0 && o.fits ? (
                            <span className="tracked-caps ml-2 text-[9px]" style={{ color: "var(--burgundy)" }}>
                              Recommended
                            </span>
                          ) : null}
                        </span>
                        <span className="metric shrink-0 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                          {(o.runMm / 1000).toFixed(1)} m run
                        </span>
                      </span>
                      <ul className="mt-1.5 space-y-0.5">
                        {o.reasons.slice(0, 2).map((r) => (
                          <li key={r} className="flex gap-1.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                            <span aria-hidden="true" style={{ color: "var(--ink-faint)" }}>
                              —
                            </span>
                            {r}
                          </li>
                        ))}
                      </ul>
                      {o.warnings.map((w) => (
                        <p key={w} className="mt-1.5 text-[11px] leading-snug" style={{ color: "var(--burgundy)" }}>
                          {w}
                        </p>
                      ))}
                      {!o.fits ? (
                        <p className="mt-1.5 text-[11px]" style={{ color: "var(--ink-faint)" }}>
                          Does not fit this room.
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                Choosing a layout regenerates the cabinets. Materials, hardware and countertop choices are kept.
              </p>
            </div>
          ) : null}

          {panel === "cabinet" ? (
            selected ? (
              <CabinetInspector
                cabinet={selected.cab}
                run={selected.run}
                onChange={updateCabinet}
                onRemove={() => {
                  removeCabinet(selected.cab.id);
                  setSelectedId(null);
                }}
                onSwapType={(typeId) => {
                  const t = getCabinetType(typeId);
                  updateCabinet({
                    ...selected.cab,
                    typeId,
                    widthMm: t.widths.includes(selected.cab.widthMm) ? selected.cab.widthMm : t.defaultWidth,
                    reason: undefined,
                  });
                }}
                deltaFor={cabinetDelta}
              />
            ) : (
              <p className="rounded-[3px] border p-4 text-[13px] leading-relaxed" style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}>
                Select a cabinet in the plan, the elevation or the 3D view. You can change its width, what it is, what
                goes inside it, and the storage fitted to it — the price and the BOQ follow.
              </p>
            )
          ) : null}

          {panel === "materials" ? (
            <div className="space-y-6">
              <section>
                <StepHeading step="Carcass" title="The boxes behind the doors." />
                <OptionRail cols={3}>
                  {CARCASS_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === project.carcassId}
                      onClick={() => set("carcassId", o.id)}
                      label={o.label}
                      sub={`${o.brand} · ${o.spec}`}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      logo={o.logo}
                      note={o.note}
                      {...deltaProps({ carcassId: o.id }, o.id === project.carcassId)}
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
                      active={o.id === project.shutterId}
                      onClick={() => set("shutterId", o.id)}
                      label={o.label}
                      sub={`${o.brand} · ${o.spec}`}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      logo={o.logo}
                      {...deltaProps({ shutterId: o.id }, o.id === project.shutterId)}
                    />
                  ))}
                </OptionRail>
              </section>
              <section>
                <StepHeading step="Finish" title="What you see and touch." />
                <OptionRail cols={3}>
                  {FINISH_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      compact
                      active={o.id === project.finishId}
                      onClick={() => set("finishId", o.id)}
                      label={o.label}
                      sub={`${o.brand} · ${o.spec}`}
                      swatch={o.swatch}
                      swatchTo={o.swatchTo}
                      logo={o.logo}
                      {...deltaProps({ finishId: o.id }, o.id === project.finishId)}
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
                      active={o.id === project.hardwareId}
                      onClick={() => set("hardwareId", o.id)}
                      label={o.label}
                      sub={o.brand}
                      note={o.note}
                      {...deltaProps({ hardwareId: o.id }, o.id === project.hardwareId)}
                    />
                  ))}
                </OptionRail>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {HANDLE_OPTIONS.map((h) => {
                    const active = h.id === project.handleId;
                    const d = active ? 0 : deltaFor({ handleId: h.id });
                    return (
                      <button
                        key={h.id}
                        type="button"
                        aria-pressed={active}
                        title={h.note}
                        onClick={() => set("handleId", h.id)}
                        className="min-h-11 rounded-[3px] border px-2.5 text-[12px] transition-colors"
                        style={{
                          borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                          color: active ? "var(--burgundy)" : "var(--ink-soft)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {h.label}
                        <span className="ml-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                          {active ? "" : delta(d)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}

          {panel === "surfaces" ? (
            <div className="space-y-6">
              <section>
                <StepHeading step="Countertop" title="The surface you work on." hint={`${costing.runFt.toFixed(1)} running ft of counter in this layout.`} />
                <OptionRail cols={3}>
                  {COUNTER_MATERIALS.map((c) => (
                    <OptionCard
                      key={c.id}
                      compact
                      active={c.id === project.countertop.materialId}
                      onClick={() => set("countertop", { ...project.countertop, materialId: c.id })}
                      label={c.label}
                      sub={c.brand}
                      swatch={c.swatch}
                      swatchTo={c.swatchTo}
                      note={c.note}
                      {...deltaProps(
                        { countertop: { ...project.countertop, materialId: c.id } },
                        c.id === project.countertop.materialId
                      )}
                    />
                  ))}
                </OptionRail>
                <button
                  type="button"
                  aria-pressed={project.countertop.waterfall}
                  onClick={() => set("countertop", { ...project.countertop, waterfall: !project.countertop.waterfall })}
                  className="mt-3 min-h-11 rounded-[3px] border px-3 text-[12.5px] transition-colors"
                  style={{
                    borderColor: project.countertop.waterfall ? "var(--burgundy)" : "var(--studio-line)",
                    color: project.countertop.waterfall ? "var(--burgundy)" : "var(--ink-soft)",
                    fontWeight: project.countertop.waterfall ? 600 : 400,
                  }}
                >
                  Waterfall end panel{" "}
                  <span className="text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                    {project.countertop.waterfall ? "" : delta(deltaFor({ countertop: { ...project.countertop, waterfall: true } }))}
                  </span>
                </button>
              </section>
            </div>
          ) : null}
        </div>

        {/* ------------------------------------------------------- quote -- */}
        <div className="order-3 hidden min-w-0 lg:block">
          <QuotePanel
            quote={costing.quote}
            contextLabel="Your kitchen estimate"
            compareNote={
              <div className="mt-2 space-y-1">
                <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                  {runLength(project.runs, "base") > 0
                    ? `${costing.runFt.toFixed(1)} running ft of base run · ${project.runs.reduce((s, r) => s + r.cabinets.length, 0)} cabinets · ${costing.methodLead}`
                    : "No cabinets placed yet."}
                </p>
                {budgetGap !== null ? (
                  <p
                    className="text-[11.5px] font-semibold"
                    style={{ color: budgetGap > 0 ? "var(--burgundy)" : "var(--positive)" }}
                  >
                    {budgetGap > 0 ? `${inr(budgetGap)} above your target` : `${inr(-budgetGap)} under your target`}
                  </p>
                ) : null}
              </div>
            }
          />
        </div>
      </div>

      <MobileQuoteBar quote={costing.quote} contextLabel="Your kitchen estimate" />
    </div>
  );
}
