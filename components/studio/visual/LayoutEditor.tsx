"use client";

import type { Accessory } from "@/lib/studio/catalogue";
import type { FurnitureArchetype } from "@/lib/studio/archetypes";
import {
  compartmentName,
  newFittingId,
  redistributeShelves,
  type Fitting,
  type FurnitureLayout,
  type Metrics,
} from "@/lib/studio/geometry";
import { formatLength, type LengthUnit } from "@/lib/studio/units";

/**
 * The internal layout editor.
 *
 * Selection first, then act on the selection: pick a compartment, then add to
 * it. That ordering is what keeps one control set working for two compartments
 * or six, and it is also what makes the whole thing operable without ever
 * dragging anything — the 3D view is feedback, and every change here is a
 * button or a stepper.
 */

export function LayoutEditor({
  layout,
  metrics,
  archetype,
  selectedSectionId,
  onSelectSection,
  selectedFittingId,
  onSelectFitting,
  onChange,
  onApplyPreset,
  onSectionCount,
  accessories,
  unit,
}: {
  layout: FurnitureLayout;
  metrics: Metrics;
  archetype: FurnitureArchetype;
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  selectedFittingId: string | null;
  onSelectFitting: (id: string | null) => void;
  onChange: (next: FurnitureLayout) => void;
  /** Rebuilds every compartment from a preset, keeping loft and door choices. */
  onApplyPreset: (presetId: string) => void;
  /** Re-splits the width into n compartments, keeping the current preset. */
  onSectionCount: (n: number) => void;
  accessories: Accessory[];
  /** Reads compartment widths and shelf heights in the customer's unit. */
  unit: LengthUnit;
}) {
  const index = layout.sections.findIndex((s) => s.id === selectedSectionId);
  const section = index >= 0 ? layout.sections[index] : null;
  const metric = index >= 0 ? metrics.sections[index] : null;

  const patchSection = (id: string, fittings: Fitting[]) =>
    onChange({
      ...layout,
      sections: layout.sections.map((s) => (s.id === id ? { ...s, fittings: redistributeShelves(fittings) } : s)),
      presetId: "custom",
    });

  const countOf = (kind: Fitting["kind"]) => section?.fittings.filter((f) => f.kind === kind).length ?? 0;

  const setCount = (kind: Fitting["kind"], next: number, accessoryId?: string) => {
    if (!section) return;
    const matches = (f: Fitting) => f.kind === kind && (accessoryId ? f.accessoryId === accessoryId : true);
    const current = section.fittings.filter(matches);
    let fittings = section.fittings;
    if (next > current.length) {
      const add: Fitting[] = Array.from({ length: next - current.length }, () => ({
        id: newFittingId(),
        kind,
        at: kind === "rail" ? 0.72 : kind === "accessory" ? 0.3 : 0,
        accessoryId,
      }));
      fittings = [...fittings, ...add];
    } else if (next < current.length) {
      const drop = new Set(current.slice(next).map((f) => f.id));
      fittings = fittings.filter((f) => !drop.has(f.id));
    }
    patchSection(section.id, fittings);
  };

  /** How many shelves/drawers physically fit, given the compartment height. */
  const maxShelves = Math.max(1, Math.floor(metrics.innerHeight / 220));
  const maxDrawers = Math.max(0, Math.floor(metrics.innerHeight / archetype.drawerMm) - 1);

  return (
    <div>
      {/* ------------------------------------------------ preset gallery -- */}
      <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
        Suggested layouts
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {archetype.presets.map((p) => {
          const active = p.id === layout.presetId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onApplyPreset(p.id)}
              className="rounded-[3px] border p-2.5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
              style={{
                borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
              }}
            >
              <PresetThumb preset={p} />
              <span className="mt-1.5 block text-[12.5px] font-semibold leading-tight">{p.label}</span>
              <span className="mt-0.5 block text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                {p.blurb}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
        A starting point, not an engineered design. Start here or change anything below.
      </p>

      {/* -------------------------------------------- compartment count -- */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Compartments
        </span>
        <div className="flex flex-wrap gap-1.5">
          {countOptions(archetype).map((n) => {
            const active = layout.sections.length === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                onClick={() => onSectionCount(n)}
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
        </div>
        <span className="metric text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
          {metrics.sections.map((s) => formatLength(s.widthMm, unit)).join(" · ")}
        </span>
      </div>

      {/* ------------------------------------------------ pick a section -- */}
      <p className="tracked-caps mb-2 mt-5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
        Which compartment?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {layout.sections.map((s, i) => {
          const active = s.id === selectedSectionId;
          const m = metrics.sections[i];
          const fitted = s.fittings.length;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectSection(s.id)}
              className="min-h-11 rounded-[3px] border px-3 py-2 text-left transition-colors"
              style={{
                borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
              }}
            >
              <span className="block text-[12.5px] font-semibold leading-tight">
                {compartmentName(i, layout.sections.length)}
              </span>
              <span className="metric mt-0.5 block text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                {m ? formatLength(m.widthMm, unit) : ""} · {fitted} {fitted === 1 ? "item" : "items"}
              </span>
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------- fit out selection -- */}
      {section && metric ? (
        <div
          className="mt-3 rounded-[3px] border p-3.5"
          style={{ borderColor: "var(--burgundy)", background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))" }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[13.5px] font-semibold">
              Add to {compartmentName(index, layout.sections.length).toLowerCase()}
            </p>
            <p className="metric text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
              {formatLength(metric.widthMm, unit)} wide × {formatLength(metrics.innerHeight, unit)} clear
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {archetype.fittings.includes("shelf") ? (
              <CountControl label="Shelves" value={countOf("shelf")} max={maxShelves} onChange={(n) => setCount("shelf", n)} />
            ) : null}
            {archetype.fittings.includes("drawer") ? (
              <CountControl label="Drawers" value={countOf("drawer")} max={maxDrawers} onChange={(n) => setCount("drawer", n)} />
            ) : null}
            {archetype.fittings.includes("rail") ? (
              <CountControl label="Hanging rails" value={countOf("rail")} max={2} onChange={(n) => setCount("rail", n)} />
            ) : null}
          </div>

          {accessories.length > 0 ? (
            <>
              <p className="tracked-caps mb-1.5 mt-3.5 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                Accessories in this compartment
              </p>
              <div className="flex flex-wrap gap-1.5">
                {accessories.map((a) => {
                  const on = section.fittings.some((f) => f.kind === "accessory" && f.accessoryId === a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={on}
                      title={a.note}
                      onClick={() => setCount("accessory", on ? 0 : 1, a.id)}
                      className="flex min-h-11 items-center gap-1.5 rounded-[3px] border px-2.5 text-[12px] transition-colors"
                      style={{
                        borderColor: on ? "var(--burgundy)" : "var(--studio-line)",
                        color: on ? "var(--burgundy)" : "var(--ink-soft)",
                        fontWeight: on ? 600 : 400,
                        background: on ? "color-mix(in srgb, var(--burgundy) 7%, var(--paper))" : "var(--paper)",
                      }}
                    >
                      {on ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M1.5 6.4 4.3 9.2 10.5 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span aria-hidden="true" style={{ color: "var(--ink-faint)" }}>
                          +
                        </span>
                      )}
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {/* Fitted items, so a shelf can be nudged without hunting in 3D. */}
          {section.fittings.filter((f) => f.kind === "shelf").length > 0 ? (
            <>
              <p className="tracked-caps mb-1.5 mt-3.5 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                Shelf positions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {section.fittings
                  .filter((f) => f.kind === "shelf")
                  .sort((a, b) => a.at - b.at)
                  .map((f, i) => {
                    const heightMm = metrics.innerBottomY + metrics.innerHeight * f.at;
                    const active = f.id === selectedFittingId;
                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-1 rounded-[3px] border px-1.5 py-1"
                        style={{
                          borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                          background: "var(--paper)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectFitting(active ? null : f.id)}
                          className="metric px-1 text-[11.5px]"
                          style={{ color: active ? "var(--burgundy)" : "var(--ink-soft)" }}
                          aria-pressed={active}
                        >
                          Shelf {i + 1} · {formatLength(heightMm, unit)}
                        </button>
                        <button
                          type="button"
                          aria-label={`Move shelf ${i + 1} down`}
                          onClick={() =>
                            onChange({
                              ...layout,
                              presetId: "custom",
                              sections: layout.sections.map((s) =>
                                s.id === section.id
                                  ? { ...s, fittings: s.fittings.map((x) => (x.id === f.id ? { ...x, at: Math.max(0.04, x.at - 0.05) } : x)) }
                                  : s
                              ),
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center text-[13px]"
                          style={{ color: "var(--ink-faint)" }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Move shelf ${i + 1} up`}
                          onClick={() =>
                            onChange({
                              ...layout,
                              presetId: "custom",
                              sections: layout.sections.map((s) =>
                                s.id === section.id
                                  ? { ...s, fittings: s.fittings.map((x) => (x.id === f.id ? { ...x, at: Math.min(0.97, x.at + 0.05) } : x)) }
                                  : s
                              ),
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center text-[13px]"
                          style={{ color: "var(--ink-faint)" }}
                        >
                          ↑
                        </button>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : null}

          {section.fittings.length > 0 ? (
            <button
              type="button"
              onClick={() => patchSection(section.id, [])}
              className="mt-3 text-[12px] underline decoration-[var(--studio-line-strong)] underline-offset-2 transition-colors hover:text-[var(--burgundy)]"
              style={{ color: "var(--ink-faint)" }}
            >
              Empty this compartment
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CountControl({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-[3px] border p-2" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
      <p className="tracked-caps text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={`One fewer ${label.toLowerCase()}`}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border text-lg leading-none disabled:opacity-40"
          style={{ borderColor: "var(--studio-line)" }}
        >
          −
        </button>
        <span className="metric text-[17px]">{value}</span>
        <button
          type="button"
          aria-label={`One more ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border text-lg leading-none disabled:opacity-40"
          style={{ borderColor: "var(--studio-line)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function countOptions(archetype: FurnitureArchetype): number[] {
  const [min, max] = archetype.sectionRange;
  const out: number[] = [];
  for (let n = min; n <= Math.min(max, min + 5); n += 1) out.push(n);
  return out;
}

/** A four-line sketch of what a preset does to a compartment. */
function PresetThumb({ preset }: { preset: FurnitureArchetype["presets"][number] }) {
  const spec = preset.pattern[0];
  const rows = Math.min(6, Math.max(1, spec.shelves + spec.drawers + spec.rails));
  return (
    <span
      className="flex h-11 w-full flex-col justify-end gap-[2px] rounded-[2px] border p-[3px]"
      style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, i) => {
        const isDrawer = i < spec.drawers;
        const isRail = spec.rails > 0 && i === rows - 1;
        return (
          <span
            key={i}
            className="block w-full rounded-[1px]"
            style={{
              height: isDrawer ? 7 : isRail ? 3 : 2,
              background: isRail ? "var(--burgundy)" : isDrawer ? "var(--ink-faint)" : "var(--ink-soft)",
              opacity: isDrawer ? 0.5 : 0.8,
            }}
          />
        );
      })}
    </span>
  );
}
