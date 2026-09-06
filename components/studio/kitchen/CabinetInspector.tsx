"use client";

import {
  accessoriesFor,
  getCabinetType,
  makeInternals,
  newId,
  typesForTier,
  type KitchenAccessory,
} from "@/lib/studio/kitchen/cabinets";
import type { CabinetRun, Internal, PlacedCabinet } from "@/lib/studio/kitchen/types";
import { delta, inr } from "@/lib/studio/format";

/**
 * The selected cabinet.
 *
 * Every change here writes back to the one project object, so the plan, the
 * elevation, the 3D scene, the BOQ and the price all move together. Width is
 * offered as manufactured sizes rather than a free number — a 637 mm cabinet is
 * a cut panel and a custom price, not a product.
 */

export function CabinetInspector({
  cabinet,
  run,
  onChange,
  onRemove,
  onSwapType,
  deltaFor,
}: {
  cabinet: PlacedCabinet;
  run: CabinetRun;
  onChange: (next: PlacedCabinet) => void;
  onRemove: () => void;
  onSwapType: (typeId: string) => void;
  /** What one edit would do to the total, from the real pricing engine. */
  deltaFor: (next: PlacedCabinet) => number;
}) {
  const type = getCabinetType(cabinet.typeId);
  const shelves = cabinet.internals.filter((i) => i.kind === "shelf");
  const drawers = cabinet.internals.filter((i) => i.kind === "drawer");
  const fitted = cabinet.internals.filter((i) => i.accessoryId);

  const setInternals = (internals: Internal[]) => onChange({ ...cabinet, internals });

  const setCount = (kind: "shelf" | "drawer", n: number) => {
    const others = cabinet.internals.filter((i) => i.kind !== kind);
    setInternals([...others, ...makeInternals(kind, n)]);
  };

  const toggleAccessory = (acc: KitchenAccessory) => {
    const has = cabinet.internals.some((i) => i.accessoryId === acc.id);
    if (has) {
      setInternals(cabinet.internals.filter((i) => i.accessoryId !== acc.id));
    } else {
      const kind = acc.id.includes("pullout") || acc.id === "magic-corner" || acc.id === "carousel" ? "pullout" : acc.id === "waste-bin" ? "bin" : "shelf";
      setInternals([...cabinet.internals, { id: newId(`i-${acc.id}`), kind, accessoryId: acc.id }]);
    }
  };

  const accessories = accessoriesFor(type.role, run.tier);

  const widthDelta = (w: number) => deltaFor({ ...cabinet, widthMm: w });

  return (
    <div
      className="rounded-[3px] border p-3.5"
      style={{ borderColor: "var(--burgundy)", background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="tracked-caps text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
            {run.tier} cabinet
          </p>
          <p className="text-[15px] font-semibold leading-tight">
            {cabinet.widthMm} mm {type.label}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
            {type.blurb}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-[3px] border px-2.5 py-2 text-[11.5px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
          style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
        >
          Remove
        </button>
      </div>

      {cabinet.reason ? (
        <p
          className="mt-2.5 rounded-[2px] px-2 py-1.5 text-[11.5px] leading-snug"
          style={{ background: "var(--stone-deep)", color: "var(--ink-soft)" }}
        >
          <span className="font-semibold">Studio put this here.</span> {cabinet.reason}
        </p>
      ) : null}

      {/* ------------------------------------------------------------ width */}
      <p className="tracked-caps mb-1.5 mt-3 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
        Width
      </p>
      <div className="flex flex-wrap gap-1.5">
        {type.widths.map((w) => {
          const active = w === cabinet.widthMm;
          const d = active ? 0 : widthDelta(w);
          return (
            <button
              key={w}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...cabinet, widthMm: w })}
              className="min-h-11 rounded-[3px] border px-2.5 text-[12px] transition-colors"
              style={{
                borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                color: active ? "var(--burgundy)" : "var(--ink-soft)",
                fontWeight: active ? 600 : 400,
                background: active ? "color-mix(in srgb, var(--burgundy) 7%, var(--paper))" : "var(--paper)",
              }}
            >
              <span className="metric block">{w}</span>
              <span className="block text-[9.5px]" style={{ color: active ? "var(--burgundy)" : "var(--ink-faint)" }}>
                {active ? "fitted" : delta(d)}
              </span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------- internals */}
      {type.role !== "filler" ? (
        <>
          <p className="tracked-caps mb-1.5 mt-3.5 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
            Inside
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Counter label="Shelves" value={shelves.length} max={6} onChange={(n) => setCount("shelf", n)} />
            <Counter label="Drawers" value={drawers.length} max={5} onChange={(n) => setCount("drawer", n)} />
          </div>
          {shelves.length > 0 && drawers.length > 0 ? (
            <p className="mt-1.5 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
              Shelves and drawers in the same carcass means the shelves sit above the drawer stack.
            </p>
          ) : null}
        </>
      ) : null}

      {/* ------------------------------------------------------- swap type */}
      <p className="tracked-caps mb-1.5 mt-3.5 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
        Change what this is
      </p>
      <div className="flex flex-wrap gap-1.5">
        {typesForTier(run.tier)
          .filter((t) => t.id !== type.id)
          .slice(0, 6)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.blurb}
              onClick={() => onSwapType(t.id)}
              className="min-h-9 rounded-[3px] border px-2.5 text-[11.5px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)", background: "var(--paper)" }}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* ------------------------------------------------------ accessories */}
      {accessories.length > 0 ? (
        <>
          <p className="tracked-caps mb-1.5 mt-3.5 text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
            Fitted storage
          </p>
          <div className="space-y-1.5">
            {accessories.map((a) => {
              const on = fitted.some((i) => i.accessoryId === a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAccessory(a)}
                  className="flex w-full items-start gap-2 rounded-[3px] border p-2 text-left transition-colors"
                  style={{
                    borderColor: on ? "var(--burgundy)" : "var(--studio-line)",
                    background: on ? "color-mix(in srgb, var(--burgundy) 6%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border"
                    style={{ borderColor: on ? "var(--burgundy)" : "var(--studio-line-strong)", background: on ? "var(--burgundy)" : "transparent" }}
                  >
                    {on ? (
                      <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M1.5 6.4 4.3 9.2 10.5 3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] font-semibold">{a.label}</span>
                      <span className="metric shrink-0 text-[11.5px]" style={{ color: "var(--ink-soft)" }}>
                        +{inr(a.rate)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                      {a.what}
                    </span>
                    <Verdict acc={a} />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * "Should I spend here?" — the honest version. Only things that earn their keep
 * in daily use get "recommended"; the rest say plainly what they are.
 */
function Verdict({ acc }: { acc: KitchenAccessory }) {
  const tone =
    acc.verdict === "recommended"
      ? { label: "Studio recommends", color: "var(--positive)" }
      : acc.verdict === "nice-to-have"
        ? { label: "Nice to have", color: "var(--ink-soft)" }
        : { label: "Mostly aesthetic", color: "var(--ink-faint)" };
  return (
    <span className="mt-1 block">
      <span className="tracked-caps text-[9px]" style={{ color: tone.color }}>
        {tone.label}
      </span>
      <span className="mt-0.5 block text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
        {acc.why}
      </span>
    </span>
  );
}

function Counter({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
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
