"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { FurnitureLayout, Metrics, Panel } from "@/lib/studio/geometry";
import { buildHotspots, type SpecIds } from "@/lib/studio/partMaterials";
import { buildPanels } from "@/lib/studio/geometry";
import { inr } from "@/lib/studio/format";
import { formatLength, formatTriple, type LengthUnit } from "@/lib/studio/units";
import { UnitSwitcher } from "./DimensionEntry";
import { Elevation2D } from "./Elevation2D";

/**
 * The visualisation area: view switcher, canvas and the controls that belong to
 * whatever is being shown.
 *
 * three.js is dynamic-imported and never loads for a visitor who only looks at
 * the elevation. The 2D view is the default for exactly that reason — it is
 * instant, it is the view that carries the dimensions, and it costs nothing.
 */

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => <CanvasFallback label="Preparing the 3D view…" />,
});

export type ViewMode = "2d" | "3d" | "exploded";

const VIEWS: { id: ViewMode; label: string; hint: string }[] = [
  { id: "2d", label: "Elevation", hint: "Dimensioned front and side view" },
  { id: "3d", label: "3D", hint: "Rotate and look inside" },
  { id: "exploded", label: "Exploded", hint: "See how it is built" },
];

function CanvasFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--stone-deep)" }}>
      <div className="text-center">
        <div
          className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--studio-line-strong)", borderTopColor: "transparent" }}
        />
        <p className="mt-3 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function FurnitureViewer({
  metrics,
  layout,
  spec,
  view,
  onViewChange,
  selectedSectionId,
  onSelectSection,
  selectedFittingId,
  onSelectFitting,
  typeLabel,
  unit,
  onUnitChange,
}: {
  metrics: Metrics;
  layout: FurnitureLayout;
  spec: SpecIds;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  selectedFittingId: string | null;
  onSelectFitting: (id: string | null) => void;
  typeLabel: string;
  unit: LengthUnit;
  onUnitChange: (u: LengthUnit) => void;
}) {
  const [showShutters, setShowShutters] = useState(true);
  const [explode, setExplode] = useState(0.45);
  const [resetKey, setResetKey] = useState(0);
  const [inspected, setInspected] = useState<Panel | null>(null);
  const [doorOpen, setDoorOpen] = useState(0);
  // Material pins default ON in 3D: naming the board in each place is the point
  // of the view, not a power-user extra.
  const [showMaterials, setShowMaterials] = useState(true);
  const [openHotspot, setOpenHotspot] = useState<string | null>(null);

  const is3D = view === "3d" || view === "exploded";
  const exploded = view === "exploded";

  const handleSelectPanel = (panel: Panel) => {
    setInspected(panel);
    if (panel.sectionId) onSelectSection(panel.sectionId);
    onSelectFitting(panel.fittingId ?? null);
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[3px] border"
      style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
    >
      {/* ------------------------------------------------ view switcher -- */}
      <div
        className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--studio-line)" }}
      >
        <div
          className="inline-flex rounded-[3px] border p-[3px]"
          style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
          role="radiogroup"
          aria-label="Visualisation mode"
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
                onClick={() => {
                  onViewChange(v.id);
                  setInspected(null);
                }}
                className="flex min-h-11 items-center rounded-[2px] px-3.5 text-[12.5px] font-semibold transition-[background-color,color,box-shadow] duration-200"
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

        <div className="ml-auto flex items-center gap-2">
          <span className="metric text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
            {formatTriple(metrics.dims.widthMm, metrics.dims.heightMm, metrics.dims.depthMm, unit)}
          </span>
          <UnitSwitcher unit={unit} onChange={onUnitChange} compact />
        </div>
      </div>

      {/* -------------------------------------------------------- canvas -- */}
      <div className="relative min-h-[200px] flex-1" style={{ background: view === "2d" ? "var(--paper)" : "#fff" }}>
        {view === "2d" ? (
          <div className="absolute inset-0 p-3 sm:p-5">
            <Elevation2D
              metrics={metrics}
              layout={layout}
              selectedSectionId={selectedSectionId}
              onSelectSection={onSelectSection}
              selectedFittingId={selectedFittingId}
              unit={unit}
              spec={spec}
              showMaterials={showMaterials}
              openHotspot={openHotspot}
              onToggleHotspot={(id) => setOpenHotspot((cur) => (cur === id ? null : id))}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <Scene3D
              metrics={metrics}
              layout={layout}
              spec={spec}
              explode={exploded ? explode : 0}
              showShutters={exploded ? true : showShutters}
              selectedPanelId={inspected?.id ?? null}
              onSelectPanel={handleSelectPanel}
              resetKey={resetKey}
              showBoardColours={exploded}
              doorOpen={doorOpen}
              showMaterials={showMaterials}
              openHotspot={openHotspot}
              onToggleHotspot={(id) => setOpenHotspot((cur) => (cur === id ? null : id))}
            />
          </div>
        )}

        {/* Component inspector — the bridge from a shape on screen to the
            material it is made of, and eventually to a catalogue SKU. */}
        {inspected && is3D ? (
          <div
            className="absolute bottom-3 left-3 max-w-[240px] rounded-[3px] border p-3 shadow-[var(--shadow-md)]"
            style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="tracked-caps text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                Component
              </p>
              <button
                type="button"
                onClick={() => setInspected(null)}
                aria-label="Close component details"
                className="-mr-2 -mt-2 flex h-8 w-8 items-center justify-center text-[15px] leading-none"
                style={{ color: "var(--ink-faint)" }}
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-[13.5px] font-semibold leading-tight">{inspected.label}</p>
            <dl className="mt-2 space-y-1 text-[11.5px]" style={{ color: "var(--ink-soft)" }}>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-faint)" }}>Approx size</dt>
                <dd className="metric">
                  {formatLength(inspected.size[0], unit)} × {formatLength(inspected.size[1], unit)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-faint)" }}>Thickness</dt>
                <dd className="metric">{formatLength(inspected.size[2], unit)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-faint)" }}>Made from</dt>
                <dd>{surfaceNoun(inspected.surface)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {view === "2d" ? (
          <p
            className="pointer-events-none absolute left-3 top-2 text-[10.5px]"
            style={{ color: "var(--ink-faint)" }}
          >
            Concept visual — not a shop drawing
          </p>
        ) : null}
      </div>

      {view === "2d" && showMaterials ? (
        <MaterialKey
          metrics={metrics}
          layout={layout}
          spec={spec}
          openHotspot={openHotspot}
          onToggleHotspot={(id) => setOpenHotspot((cur) => (cur === id ? null : id))}
        />
      ) : null}

      {/* ------------------------------------------------------ controls -- */}
      <div className="border-t px-3 py-2.5" style={{ borderColor: "var(--studio-line)" }}>
        {view === "3d" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShutters((s) => !s)}
              aria-pressed={!showShutters}
              className="rounded-[3px] border px-3 py-2 text-[12.5px] transition-colors"
              style={{
                borderColor: showShutters ? "var(--studio-line)" : "var(--burgundy)",
                color: showShutters ? "var(--ink-soft)" : "var(--burgundy)",
                background: showShutters ? "transparent" : "color-mix(in srgb, var(--burgundy) 6%, transparent)",
                fontWeight: showShutters ? 400 : 600,
              }}
            >
              {showShutters ? "Look inside" : "Doors on"}
            </button>
            {showShutters && layout.doors.type !== "open" ? (
              <Toggle on={doorOpen > 0.5} onClick={() => setDoorOpen((d) => (d > 0.5 ? 0 : 1))}>
                {doorOpen > 0.5 ? "Close doors" : "Open doors"}
              </Toggle>
            ) : null}
            <Toggle on={showMaterials} onClick={() => setShowMaterials((m) => !m)}>
              {showMaterials ? "Hide materials" : "Show materials"}
            </Toggle>
            <button
              type="button"
              onClick={() => setResetKey((k) => k + 1)}
              className="rounded-[3px] border px-3 py-2 text-[12.5px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
            >
              Reset view
            </button>
            <span className="ml-auto text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
              Drag to rotate · tap a dot for the material
            </span>
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
              className="min-w-[120px] flex-1 accent-[var(--burgundy)]"
            />
            <span className="tracked-caps shrink-0 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
              Exploded
            </span>
            <Toggle on={showMaterials} onClick={() => setShowMaterials((m) => !m)}>
              {showMaterials ? "Hide materials" : "Show materials"}
            </Toggle>
            <button
              type="button"
              onClick={() => setResetKey((k) => k + 1)}
              className="rounded-[3px] border px-3 py-2 text-[12.5px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
            >
              Reset view
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={showMaterials} onClick={() => setShowMaterials((m) => !m)}>
              {showMaterials ? "Hide materials" : "Show materials"}
            </Toggle>
            <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
              Tap a compartment to fit it out, or a callout for the material.{" "}
              <span className="hidden sm:inline">
                {typeLabel} shown at {formatLength(metrics.dims.widthMm, unit)} wide.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The material key that sits under the elevation.
 *
 * Balloons on a drawing are numbers; the key is where the numbers get their
 * meaning. Rendered as HTML rather than as SVG text so the type is crisp at
 * real font sizes, the catalogue link is a real link, and none of it costs the
 * drawing any room — putting this text in the SVG margin shrank the object by
 * nearly half.
 */
function MaterialKey({
  metrics,
  layout,
  spec,
  openHotspot,
  onToggleHotspot,
}: {
  metrics: Metrics;
  layout: FurnitureLayout;
  spec: SpecIds;
  openHotspot: string | null;
  onToggleHotspot: (id: string) => void;
}) {
  // The same anchors the drawing balloons and the 3D pins use, in the same
  // order — so balloon 2 and key entry 2 are always the same panel.
  const hotspots = buildHotspots(buildPanels(metrics, layout), spec);

  return (
    <div
      className="grid gap-1.5 border-t px-3 py-2.5 sm:grid-cols-2 lg:grid-cols-4"
      style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
    >
      {hotspots.map((h, i) => {
        const m = h.material;
        const open = openHotspot === h.id;
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onToggleHotspot(h.id)}
            aria-expanded={open}
            className="flex items-start gap-2 rounded-[3px] p-2 text-left transition-colors"
            style={{ background: open ? "var(--paper)" : "transparent" }}
          >
            <span
              className="metric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold"
              style={{
                borderColor: open ? "var(--burgundy)" : "var(--ink)",
                background: open ? "var(--burgundy)" : "var(--paper)",
                color: open ? "#fff" : "var(--ink)",
              }}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="tracked-caps block text-[9px]" style={{ color: "var(--ink-faint)" }}>
                {m.role}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <span
                  className="block h-3 w-3 shrink-0 rounded-[2px]"
                  style={{ background: `linear-gradient(135deg, ${m.swatch}, ${m.swatchTo ?? m.swatch})` }}
                />
                <span className="text-[12px] font-semibold leading-tight">
                  {m.brand} {m.material}
                </span>
              </span>
              <span className="metric mt-0.5 block text-[10.5px]" style={{ color: "var(--ink-soft)" }}>
                {m.spec}
              </span>
              {open ? (
                <>
                  {m.facing ? (
                    <span className="mt-1 block text-[10.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                      Faced in <span className="font-semibold">{m.facing}</span>
                    </span>
                  ) : null}
                  <span className="mt-1 block text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                    {m.why}
                  </span>
                  {m.rate ? (
                    <span className="metric mt-1 block text-[10.5px]">
                      {inr(m.rate.amount)}{" "}
                      <span className="font-normal" style={{ color: "var(--ink-faint)" }}>
                        {m.rate.unit}
                      </span>
                    </span>
                  ) : null}
                  {m.catalogue ? (
                    <a
                      href={m.catalogue}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 block text-[10.5px] font-semibold"
                      style={{ color: "var(--burgundy)" }}
                    >
                      See it in the catalogue →
                    </a>
                  ) : null}
                </>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Two-state control used by the viewer toolbar. On reads burgundy. */
function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="rounded-[3px] border px-3 py-2 text-[12.5px] transition-colors"
      style={{
        borderColor: on ? "var(--burgundy)" : "var(--studio-line)",
        color: on ? "var(--burgundy)" : "var(--ink-soft)",
        background: on ? "color-mix(in srgb, var(--burgundy) 6%, transparent)" : "transparent",
        fontWeight: on ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

function surfaceNoun(surface: string): string {
  if (surface === "shutter") return "Shutter board + external finish";
  if (surface === "carcass") return "Carcass board";
  if (surface === "internal") return "Carcass board + internal finish";
  return "Hardware";
}
