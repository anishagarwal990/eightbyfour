"use client";

import Image from "next/image";
import type { ReactNode } from "react";

/* Shared building blocks for every Studio configurator. Kept in one file
   because they are only meaningful together — an option card without the
   swatch and the rail around it is just a button. */

export function Swatch({
  from,
  to,
  className = "",
  logo,
}: {
  from: string;
  to?: string;
  className?: string;
  logo?: string;
}) {
  return (
    <span
      className={`swatch block rounded-[2px] ${className}`}
      style={{ ["--sw-from" as string]: from, ["--sw-to" as string]: to ?? from }}
    >
      {logo ? (
        <span className="absolute bottom-1 right-1 z-10 flex h-4 items-center rounded-[2px] bg-white/90 px-1">
          <Image src={`/brand-logos/${logo}`} alt="" width={28} height={12} className="h-2.5 w-auto object-contain" />
        </span>
      ) : null}
    </span>
  );
}

/** Section heading inside a configurator: step number + question. */
export function StepHeading({
  step,
  title,
  hint,
  right,
}: {
  step: string;
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          {step}
        </p>
        <h2 className="serif mt-1 text-[19px] leading-tight">{title}</h2>
        {hint ? (
          <p className="mt-1 text-[13px] leading-snug" style={{ color: "var(--ink-soft)" }}>
            {hint}
          </p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

/** A selectable material card. Swatch, name, spec, delta — in that order. */
export function OptionCard({
  active,
  onClick,
  label,
  sub,
  meta,
  swatch,
  swatchTo,
  logo,
  note,
  deltaLabel,
  deltaTone = "neutral",
  compact,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  meta?: string;
  swatch?: string;
  swatchTo?: string;
  logo?: string;
  note?: string;
  deltaLabel?: string;
  deltaTone?: "up" | "down" | "neutral";
  compact?: boolean;
}) {
  const deltaColor =
    deltaTone === "up" ? "var(--burgundy)" : deltaTone === "down" ? "var(--positive)" : "var(--ink-faint)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex ${compact ? "w-[128px] sm:w-auto" : "w-full"} flex-col gap-2 rounded-[3px] border p-2.5 text-left transition-[border-color,box-shadow,transform] duration-200 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]`}
      style={{
        borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
        boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
        background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
      }}
    >
      {swatch ? <Swatch from={swatch} to={swatchTo} logo={logo} className={compact ? "h-12 w-full" : "h-11 w-full"} /> : null}
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold leading-tight">{label}</span>
        {sub ? (
          <span className="text-[11px] leading-tight" style={{ color: "var(--ink-faint)" }}>
            {sub}
          </span>
        ) : null}
        {meta ? (
          <span className="metric text-[11px] leading-tight" style={{ color: "var(--ink-soft)" }}>
            {meta}
          </span>
        ) : null}
      </span>
      {deltaLabel ? (
        <span className="metric mt-auto text-[11px] font-semibold" style={{ color: deltaColor }}>
          {deltaLabel}
        </span>
      ) : null}
      {note && !compact ? (
        <span
          className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-full rounded-[3px] border p-2 text-[11px] leading-snug shadow-[var(--shadow-md)] group-hover:block lg:block lg:static lg:mt-0 lg:border-0 lg:p-0 lg:shadow-none"
          style={{ background: "var(--paper)", borderColor: "var(--studio-line)", color: "var(--ink-faint)" }}
        >
          {note}
        </span>
      ) : null}
    </button>
  );
}

/** Two-or-three way segmented control — build method, mode, pressing sides. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  label = "Choose an option",
}: {
  value: T;
  options: { id: T; label: string; sub?: string }[];
  onChange: (id: T) => void;
  size?: "md" | "sm";
  /** Names the group for screen readers — a radiogroup needs one. */
  label?: string;
}) {
  return (
    <div
      className="inline-flex w-full rounded-[3px] border p-[3px]"
      style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
      /* Not role="tablist": the tab pattern owes the user arrow-key navigation
         and an aria-controls'd panel, and neither exists here. These are
         mutually-exclusive choices, which is what a radiogroup is for. */
      role="radiogroup"
      aria-label={label}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`flex-1 rounded-[2px] ${size === "sm" ? "px-2.5 py-1.5" : "px-3 py-2"} text-center transition-[background-color,color,box-shadow] duration-200`}
            style={{
              background: active ? "var(--paper)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : undefined,
              color: active ? "var(--ink)" : "var(--ink-soft)",
            }}
          >
            <span className={`block ${size === "sm" ? "text-[12px]" : "text-[13px]"} font-semibold leading-tight`}>{o.label}</span>
            {o.sub ? (
              <span className="mt-0.5 block text-[10.5px] leading-tight" style={{ color: "var(--ink-faint)" }}>
                {o.sub}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Dimension stepper. Big targets — this is the control people use on a phone. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 0.5,
  unit = "ft",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="rounded-[3px] border p-2.5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
      <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border text-lg leading-none transition-colors disabled:opacity-40"
          style={{ borderColor: "var(--studio-line)" }}
        >
          −
        </button>
        <span className="metric text-[17px]">
          {Number.isInteger(value) ? value : value.toFixed(1)}
          <span className="ml-0.5 text-[12px] font-normal" style={{ color: "var(--ink-faint)" }}>
            {unit}
          </span>
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border text-lg leading-none transition-colors disabled:opacity-40"
          style={{ borderColor: "var(--studio-line)" }}
        >
          +
        </button>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--burgundy)]"
      />
    </div>
  );
}

/**
 * Horizontal rail on touch, grid of `cols` from `sm` up — one set of children,
 * one set of buttons in the accessibility tree. The breakpoint behaviour is in
 * `.option-rail--grid` (see globals.css); only the column count comes from here.
 */
export function OptionRail({ children, cols = 4 }: { children: ReactNode; cols?: number }) {
  return (
    <div
      className="option-rail option-rail--grid -mx-4 px-4"
      style={{ ["--rail-cols" as string]: cols }}
    >
      {children}
    </div>
  );
}

/** The indicative-price disclaimer. Used everywhere a number is shown. */
export function IndicativeNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-snug ${className}`} style={{ color: "var(--ink-faint)" }}>
      Indicative estimate — demo rates, not a quotation. Final pricing is confirmed after site measurement and live
      material rates.
    </p>
  );
}
