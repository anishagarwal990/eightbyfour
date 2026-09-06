"use client";

import { useId } from "react";
import type { Dimensions } from "@/lib/studio/geometry";
import {
  clampMm,
  formatLength,
  fromMm,
  joinFeetInches,
  speakLength,
  splitFeetInches,
  toMm,
  type LengthUnit,
} from "@/lib/studio/units";

/**
 * Rough size entry.
 *
 * The whole opening interaction is three numbers, and the copy says out loud
 * that they do not need to be right. Feet-and-inches is the default because
 * that is how a site is measured in India — being made to convert 8'4" into
 * either 8.33 ft or 2540 mm before you can see anything is the friction this
 * screen exists to remove.
 */

const UNITS: { id: LengthUnit; label: string; short: string }[] = [
  { id: "ft", label: "Feet and inches", short: "ft + in" },
  { id: "in", label: "Inches", short: "in" },
  { id: "mm", label: "Millimetres", short: "mm" },
];

/**
 * Measurement unit for the whole configurator.
 *
 * Lives in the viewer toolbar rather than inside the Size tab: it governs the
 * dimension strings on the drawing, the compartment widths, the loft band and
 * the component inspector, not only the three entry fields — so it has to be
 * reachable while looking at any of them.
 */
export function UnitSwitcher({
  unit,
  onChange,
  compact,
}: {
  unit: LengthUnit;
  onChange: (u: LengthUnit) => void;
  /** Toolbar variant — shorter, to sit beside the dimension readout. */
  compact?: boolean;
}) {
  return (
    <div
      className="inline-flex rounded-[3px] border p-[2px]"
      style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
      role="radiogroup"
      aria-label="Measurement unit"
    >
      {UNITS.map((u) => {
        const active = u.id === unit;
        return (
          <button
            key={u.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={u.label}
            onClick={() => onChange(u.id)}
            className={`flex items-center rounded-[2px] font-medium transition-colors ${
              compact ? "min-h-8 px-2 text-[11px]" : "min-h-11 px-3 text-[11.5px]"
            }`}
            style={{
              background: active ? "var(--paper)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : undefined,
              color: active ? "var(--ink)" : "var(--ink-faint)",
            }}
          >
            {u.short}
          </button>
        );
      })}
    </div>
  );
}

export interface DimensionBounds {
  width: [number, number];
  height: [number, number];
  depth: [number, number];
}

export function DimensionEntry({
  dims,
  bounds,
  unit,
  onChange,
}: {
  dims: Dimensions;
  /** Min/max in millimetres, derived from the furniture type's limits. */
  bounds: DimensionBounds;
  /** Display and entry unit. Owned by the configurator, set in the toolbar. */
  unit: LengthUnit;
  onChange: (next: Dimensions) => void;
}) {
  const fields = [
    { key: "widthMm" as const, label: "Width", bound: bounds.width },
    { key: "heightMm" as const, label: "Height", bound: bounds.height },
    { key: "depthMm" as const, label: "Depth", bound: bounds.depth },
  ];

  return (
    <div className="@container">
      <p className="mb-3 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
        Rough measurements are enough for now. Entering in{" "}
        <span className="font-semibold">{UNITS.find((u) => u.id === unit)?.label.toLowerCase()}</span> — change the unit
        above the drawing.
      </p>

      <div className="grid gap-2.5 @[400px]:grid-cols-3">
        {fields.map((f) => (
          <DimensionField
            key={f.key}
            label={f.label}
            valueMm={dims[f.key]}
            min={f.bound[0]}
            max={f.bound[1]}
            unit={unit}
            onChange={(mm) => onChange({ ...dims, [f.key]: mm })}
          />
        ))}
      </div>

      <p className="mt-2.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
        We use these to create an indicative layout and estimate. Final dimensions are verified on site before anything
        is cut.
      </p>
    </div>
  );
}

function DimensionField({
  label,
  valueMm,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  valueMm: number;
  min: number;
  max: number;
  unit: LengthUnit;
  onChange: (mm: number) => void;
}) {
  const id = useId();
  const { feet, inches } = splitFeetInches(valueMm);
  const set = (mm: number) => onChange(clampMm(mm, min, max));

  const inputClass =
    "min-w-0 flex-1 rounded-[2px] border bg-transparent px-2 py-2 text-[15px] tabular-nums outline-none transition-colors focus:border-[var(--burgundy)]";

  return (
    <div className="rounded-[3px] border p-3" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
      <label htmlFor={`${id}-a`} className="tracked-caps block text-[10px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </label>

      {unit === "ft" ? (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1">
            <input
              id={`${id}-a`}
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={feet}
              onChange={(e) => set(joinFeetInches(Number(e.target.value) || 0, inches))}
              className={inputClass}
              style={{ borderColor: "var(--studio-line)" }}
              aria-label={`${label} in feet`}
            />
            <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
              ft
            </span>
          </div>
          <div className="flex flex-1 items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              value={inches}
              onChange={(e) => set(joinFeetInches(feet, Math.min(11, Math.max(0, Number(e.target.value) || 0))))}
              className={inputClass}
              style={{ borderColor: "var(--studio-line)" }}
              aria-label={`${label} in inches`}
            />
            <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
              in
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            id={`${id}-a`}
            type="number"
            inputMode="decimal"
            step={unit === "mm" ? 10 : 0.5}
            value={unit === "mm" ? Math.round(valueMm) : Math.round(fromMm(valueMm, unit) * 10) / 10}
            onChange={(e) => set(toMm(Number(e.target.value) || 0, unit))}
            className={inputClass}
            style={{ borderColor: "var(--studio-line)" }}
            aria-label={`${label} in ${unit === "mm" ? "millimetres" : "inches"}`}
          />
          <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
            {unit}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => set(valueMm - 152.4)}
          disabled={valueMm <= min}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border text-lg leading-none disabled:opacity-40"
          style={{ borderColor: "var(--studio-line)" }}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={25.4}
          value={valueMm}
          onChange={(e) => set(Number(e.target.value))}
          aria-label={`${label}, currently ${speakLength(valueMm, unit)}`}
          className="min-w-0 flex-1 accent-[var(--burgundy)]"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => set(valueMm + 152.4)}
          disabled={valueMm >= max}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border text-lg leading-none disabled:opacity-40"
          style={{ borderColor: "var(--studio-line)" }}
        >
          +
        </button>
      </div>

      {/* Skipped in millimetres, where it would repeat the field exactly. */}
      {unit === "mm" ? null : (
        <p className="metric mt-1.5 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
          {formatLength(valueMm, unit)}
        </p>
      )}
    </div>
  );
}
