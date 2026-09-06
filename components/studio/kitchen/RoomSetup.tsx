"use client";

import { APPLIANCES } from "@/lib/studio/kitchen/appliances";
import { newOpening } from "@/lib/studio/kitchen/project";
import {
  WALL_IDS,
  WALL_LABEL,
  type ApplianceChoice,
  type Brief,
  type CookingIntensity,
  type Household,
  type Room,
  type StoragePriority,
  type WallId,
} from "@/lib/studio/kitchen/types";
import { clampMm, formatLength, fromMm, toMm, type LengthUnit } from "@/lib/studio/units";
import { Segmented } from "../primitives";

/**
 * Room, openings, appliances and the brief.
 *
 * All four feed the layout engine, which is why they sit together: changing any
 * of them regenerates the kitchen, and splitting them across steps would hide
 * that relationship.
 */

const PRIORITIES: { id: StoragePriority; label: string }[] = [
  { id: "pots", label: "Pots & pans" },
  { id: "pressure-cookers", label: "Pressure cookers" },
  { id: "groceries", label: "Bulk groceries" },
  { id: "spices", label: "Lots of spices" },
  { id: "oils", label: "Oils & bottles" },
  { id: "crockery", label: "Crockery" },
  { id: "appliances", label: "Countertop appliances" },
  { id: "cleaning", label: "Cleaning supplies" },
  { id: "baking", label: "Baking things" },
  { id: "waste", label: "Waste segregation" },
];

export function RoomSetup({
  room,
  brief,
  appliances,
  unit,
  onRoom,
  onBrief,
  onAppliances,
}: {
  room: Room;
  brief: Brief;
  appliances: ApplianceChoice[];
  unit: LengthUnit;
  onRoom: (r: Room) => void;
  onBrief: (b: Brief) => void;
  onAppliances: (a: ApplianceChoice[]) => void;
}) {
  const field =
    "min-w-0 flex-1 rounded-[2px] border bg-transparent px-2 py-2 text-[14px] tabular-nums outline-none transition-colors focus:border-[var(--burgundy)]";

  const setDim = (k: "widthMm" | "depthMm" | "ceilingMm", raw: number) =>
    onRoom({ ...room, [k]: clampMm(toMm(raw, unit), 1200, 12000) });

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- room -- */}
      <section>
        <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
          The room
        </p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {(
            [
              { k: "widthMm" as const, label: "Wall A (width)" },
              { k: "depthMm" as const, label: "Wall B (depth)" },
              { k: "ceilingMm" as const, label: "Ceiling height" },
            ]
          ).map((f) => (
            <div key={f.k} className="rounded-[3px] border p-2.5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <label className="tracked-caps block text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                {f.label}
              </label>
              <div className="mt-1.5 flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  step={unit === "mm" ? 50 : 0.5}
                  value={unit === "mm" ? Math.round(room[f.k]) : Math.round(fromMm(room[f.k], unit) * 10) / 10}
                  onChange={(e) => setDim(f.k, Number(e.target.value) || 0)}
                  className={field}
                  style={{ borderColor: "var(--studio-line)" }}
                  aria-label={f.label}
                />
                <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
                  {unit === "ft" ? "ft" : unit}
                </span>
              </div>
              <p className="metric mt-1 text-[11px]" style={{ color: "var(--ink-faint)" }}>
                {formatLength(room[f.k], unit)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
          Rough is fine. Final manufacturing dimensions are set from a site measurement.
        </p>
      </section>

      {/* ------------------------------------------------------ openings -- */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Doors & windows
          </p>
          <div className="flex gap-1.5">
            {(["door", "window"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onRoom({ ...room, openings: [...room.openings, newOpening("N", kind)] })}
                className="min-h-9 rounded-[3px] border px-2.5 text-[12px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line)" }}
              >
                + {kind}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {room.openings.map((o) => (
            <div key={o.id} className="rounded-[3px] border p-2.5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold capitalize">{o.kind}</span>
                <button
                  type="button"
                  onClick={() => onRoom({ ...room, openings: room.openings.filter((x) => x.id !== o.id) })}
                  aria-label={`Remove ${o.kind}`}
                  className="-my-1 flex h-9 w-9 items-center justify-center text-[15px]"
                  style={{ color: "var(--ink-faint)" }}
                >
                  ×
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <select
                  value={o.wall}
                  onChange={(e) =>
                    onRoom({ ...room, openings: room.openings.map((x) => (x.id === o.id ? { ...x, wall: e.target.value as WallId } : x)) })
                  }
                  aria-label="Wall"
                  className={`${field} col-span-2 sm:col-span-1`}
                  style={{ borderColor: "var(--studio-line)" }}
                >
                  {WALL_IDS.map((w) => (
                    <option key={w} value={w}>
                      {WALL_LABEL[w]}
                    </option>
                  ))}
                </select>
                {(
                  [
                    { k: "offsetMm" as const, label: "From corner" },
                    { k: "widthMm" as const, label: "Width" },
                    { k: "sillMm" as const, label: "Sill height" },
                  ]
                ).map((f) => (
                  <label key={f.k} className="flex flex-col gap-0.5">
                    <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                      {f.label}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      step={50}
                      value={Math.round(o[f.k])}
                      onChange={(e) =>
                        onRoom({
                          ...room,
                          openings: room.openings.map((x) => (x.id === o.id ? { ...x, [f.k]: Math.max(0, Number(e.target.value) || 0) } : x)),
                        })
                      }
                      className={field}
                      style={{ borderColor: "var(--studio-line)" }}
                      aria-label={`${o.kind} ${f.label}`}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          {room.openings.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
              No openings yet. Add the door at least — it decides where cabinets cannot go.
            </p>
          ) : null}
        </div>
      </section>

      {/* ----------------------------------------------------- appliances -- */}
      <section>
        <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Appliances
        </p>
        <div className="space-y-2">
          {APPLIANCES.map((spec) => {
            const current = appliances.find((a) => a.kind === spec.kind);
            return (
              <div key={spec.kind} className="flex flex-wrap items-center gap-2">
                <span className="w-[110px] shrink-0 text-[12.5px]">{spec.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {spec.variants.map((v) => {
                    const active = current?.variantId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={active}
                        title={v.note}
                        onClick={() =>
                          onAppliances(
                            appliances.some((a) => a.kind === spec.kind)
                              ? appliances.map((a) => (a.kind === spec.kind ? { ...a, variantId: v.id, widthMm: v.widthMm } : a))
                              : [...appliances, { kind: spec.kind, variantId: v.id, widthMm: v.widthMm }]
                          )
                        }
                        className="min-h-9 rounded-[3px] border px-2.5 text-[12px] transition-colors"
                        style={{
                          borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                          color: active ? "var(--burgundy)" : "var(--ink-soft)",
                          fontWeight: active ? 600 : 400,
                          background: active ? "color-mix(in srgb, var(--burgundy) 6%, var(--paper))" : "var(--paper)",
                        }}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------------- brief -- */}
      <section>
        <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
          How you cook
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11.5px]" style={{ color: "var(--ink-soft)" }}>
              Cooking
            </p>
            <Segmented<CookingIntensity>
              value={brief.cooking}
              onChange={(v) => onBrief({ ...brief, cooking: v })}
              size="sm"
              label="Cooking intensity"
              options={[
                { id: "light", label: "Light" },
                { id: "regular", label: "Regular" },
                { id: "heavy", label: "Heavy" },
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-[11.5px]" style={{ color: "var(--ink-soft)" }}>
              Household
            </p>
            <Segmented<Household>
              value={brief.household}
              onChange={(v) => onBrief({ ...brief, household: v })}
              size="sm"
              label="Household size"
              options={[
                { id: "1-2", label: "1–2" },
                { id: "3-4", label: "3–4" },
                { id: "5+", label: "5+" },
              ]}
            />
          </div>
        </div>

        <p className="mb-1.5 mt-3 text-[11.5px]" style={{ color: "var(--ink-soft)" }}>
          What needs storing? Studio uses this to choose the internals.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => {
            const on = brief.priorities.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onBrief({
                    ...brief,
                    priorities: on ? brief.priorities.filter((x) => x !== p.id) : [...brief.priorities, p.id],
                  })
                }
                className="min-h-9 rounded-[3px] border px-2.5 text-[12px] transition-colors"
                style={{
                  borderColor: on ? "var(--burgundy)" : "var(--studio-line)",
                  color: on ? "var(--burgundy)" : "var(--ink-soft)",
                  fontWeight: on ? 600 : 400,
                  background: on ? "color-mix(in srgb, var(--burgundy) 6%, var(--paper))" : "var(--paper)",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
