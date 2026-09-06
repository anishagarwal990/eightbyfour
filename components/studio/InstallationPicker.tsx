"use client";

import { useMemo, useState } from "react";
import { inr } from "@/lib/studio/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Stepper } from "./primitives";

/**
 * Installation-only scope. The customer already owns the material, so there
 * is nothing to configure except what is being fitted and how much of it —
 * and the honest variables, which are surface condition and access.
 */

interface Scope {
  id: string;
  label: string;
  unit: "sq ft" | "unit" | "running ft";
  rate: number;
  min: number;
  note: string;
  defaultQty: number;
}

const SCOPES: Scope[] = [
  { id: "laminate", label: "Laminate installation", unit: "sq ft", rate: 78, min: 4500, defaultQty: 120, note: "Applied to existing carcasses or panelling, edges trimmed flush." },
  { id: "veneer", label: "Veneer installation", unit: "sq ft", rate: 145, min: 6500, defaultQty: 80, note: "Includes matching, laying and preparation. Polishing quoted separately." },
  { id: "wall-panel", label: "Wall panel installation", unit: "sq ft", rate: 95, min: 5500, defaultQty: 100, note: "Battened or direct-fixed, depending on wall condition." },
  { id: "louvers", label: "Louver installation", unit: "sq ft", rate: 110, min: 5500, defaultQty: 90, note: "Set out, levelled and fixed with a concealed grid." },
  { id: "solid-surface", label: "Solid surface installation", unit: "running ft", rate: 340, min: 6500, defaultQty: 10, note: "Seating, levelling and site seaming of a fabricated top." },
  { id: "hardware", label: "Hardware fitting", unit: "unit", rate: 240, min: 2500, defaultQty: 24, note: "Hinges, runners and handles fitted and adjusted, per piece." },
  { id: "furniture", label: "Furniture installation", unit: "sq ft", rate: 130, min: 6000, defaultQty: 64, note: "Assembly, levelling and fixing of factory or flat-pack modules." },
  { id: "doors", label: "Door installation", unit: "unit", rate: 2800, min: 5600, defaultQty: 3, note: "Frame check, hanging, hardware and alignment, per door." },
];

const CONDITIONS = [
  { id: "ready", label: "Site ready", factor: 1, detail: "Surfaces prepared, access clear, power available." },
  { id: "partial", label: "Partly ready", factor: 1.15, detail: "Some preparation or making-good needed before fitting." },
  { id: "occupied", label: "Occupied / live site", factor: 1.3, detail: "Working around residents or trading hours, with protection." },
];

export function InstallationPicker() {
  const [scopeId, setScopeId] = useState(SCOPES[0].id);
  const [qty, setQty] = useState(SCOPES[0].defaultQty);
  const [conditionId, setConditionId] = useState("ready");

  const scope = SCOPES.find((s) => s.id === scopeId)!;
  const condition = CONDITIONS.find((c) => c.id === conditionId)!;

  const total = useMemo(
    () => Math.max(scope.min, Math.round(qty * scope.rate * condition.factor)),
    [qty, scope, condition]
  );
  const atMinimum = qty * scope.rate * condition.factor < scope.min;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div className="min-w-0">
        <p className="tracked-caps mb-2.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
          What needs fitting
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SCOPES.map((s) => {
            const active = s.id === scopeId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setScopeId(s.id);
                  setQty(s.defaultQty);
                }}
                aria-pressed={active}
                className="rounded-[3px] border p-3.5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                style={{
                  borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                  boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                  background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                }}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[13.5px] font-semibold">{s.label}</span>
                  <span className="metric text-[12px]" style={{ color: "var(--ink-soft)" }}>
                    ₹{s.rate}/{s.unit}
                  </span>
                </span>
                <span className="mt-1 block text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                  {s.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[220px_1fr]">
          <Stepper
            label={`Quantity (${scope.unit})`}
            value={qty}
            min={1}
            max={scope.unit === "unit" ? 100 : 2000}
            step={scope.unit === "unit" ? 1 : 5}
            unit={scope.unit === "unit" ? "nos" : scope.unit}
            onChange={setQty}
          />
          <div>
            <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Site condition
            </p>
            <div className="flex flex-col gap-1.5">
              {CONDITIONS.map((c) => {
                const active = c.id === conditionId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConditionId(c.id)}
                    aria-pressed={active}
                    className="flex items-baseline justify-between gap-3 rounded-[3px] border px-3 py-2 text-left transition-colors"
                    style={{
                      borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                      background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                    }}
                  >
                    <span>
                      <span className="block text-[13px] font-medium">{c.label}</span>
                      <span className="block text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                        {c.detail}
                      </span>
                    </span>
                    <span className="metric shrink-0 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                      {c.factor === 1 ? "base" : `+${Math.round((c.factor - 1) * 100)}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="self-start rounded-[3px] border" style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}>
        <div className="p-4" role="status" aria-live="polite">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Installation estimate
          </p>
          <p className="metric mt-1 text-[32px] leading-none">{inr(total)}</p>
          <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
            {scope.label} · {qty} {scope.unit} · {condition.label}
          </p>
          {atMinimum ? (
            <p className="mt-2 rounded-[2px] px-2 py-1.5 text-[11.5px] leading-snug" style={{ background: "var(--stone-deep)", color: "var(--ink-soft)" }}>
              At the {inr(scope.min)} site minimum — below this quantity a crew visit costs more than the work.
            </p>
          ) : null}
        </div>
        <div className="border-t p-4" style={{ borderColor: "var(--studio-line)" }}>
          <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
            Not included
          </p>
          <p className="mt-1 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
            Material, adhesive, scaffolding, making-good of damaged substrates, and any electrical or plumbing work.
          </p>
          <a
            href={buildWhatsAppUrl(
              `Studio EightxFour — installation\n\n${scope.label}\nQuantity: ${qty} ${scope.unit}\nSite: ${condition.label}\nIndicative estimate: ${inr(total)}\n\nI'd like this checked against my site.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white"
            style={{ background: "var(--burgundy)" }}
          >
            Check this against my site
          </a>
        </div>
      </div>
    </div>
  );
}
