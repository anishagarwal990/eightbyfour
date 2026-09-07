"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { delta, inr } from "@/lib/studio/format";
import {
  ALU_PROFILES,
  BUILD_METHODS,
  CARCASS_FINISH,
  CARCASS_MATERIALS,
  DIMENSIONS,
  GLASS_TYPES,
  HARDWARE_PACKAGES,
  SHUTTER_CORES,
  SHUTTER_FINISHES,
  SHUTTER_SYSTEMS,
  type ShutterSystemId,
} from "@/lib/studio/estimator/config";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";
import { FURNITURE_TYPES } from "@/lib/studio/furniture";
import { toQuote } from "@/lib/studio/estimator/toQuote";
import { MaterialSwap } from "./MaterialSwap";
import { MobileQuoteBar } from "./QuotePanel";
import { PriceDNA } from "./PriceDNA";
import { WardrobeSilhouette } from "./WardrobeSilhouette";
import { Segmented, Stepper } from "./primitives";

/**
 * The instant wardrobe estimator.
 *
 * Shape of the screen, and why:
 *
 * The earlier version was a form with a price attached — six open sections of
 * controls on the left, a sticky number on the right. That asks a customer to
 * make six decisions before they are shown anything, and most of them do not
 * yet know enough to make the first one.
 *
 * This version leads with the object and its price, states the specification
 * in three plain rows, and keeps every control one tap behind "Change". The
 * two things that teach — where the money actually goes, and what a different
 * board would cost for THIS wardrobe — are on the first screen rather than
 * buried in an expander.
 *
 * The pricing contract is unchanged: each control writes one field of
 * `WardrobeEstimateInput`, the pure engine turns that into seven buckets, and
 * every number on screen reads the SAME result object. There is no second
 * display maths anywhere in this file.
 */

const DEFAULT_INPUT: WardrobeEstimateInput = {
  widthFt: DIMENSIONS.defaultWidthFt,
  heightFt: DIMENSIONS.defaultHeightFt,
  depthFt: DIMENSIONS.defaultDepthFt,
  buildMethod: "factory",
  carcassMaterialId: "bwr-ply",
  carcassFinishId: "laminate",
  shutterSystem: "board",
  shutterCoreId: "hdhmr",
  shutterFinishId: "laminate",
  aluProfileId: "natural",
  glassTypeId: "clear",
  hardwarePackageId: "standard",
};

type RowId = "size" | "carcass" | "shutters" | "hardware" | "build";

export function WardrobeEstimator() {
  const [input, setInput] = useState<WardrobeEstimateInput>(DEFAULT_INPUT);
  const [open, setOpen] = useState<RowId | null>(null);
  const [lastChange, setLastChange] = useState<{ label: string; amount: number } | null>(null);

  const estimate = useMemo(() => estimateWardrobe(input), [input]);
  // The mobile bar reuses the shared quote panel, so the phone and the desktop
  // panel are the same numbers rendered by the same component.
  const quote = useMemo(
    () => toQuote(estimate, input, `Wardrobe — ${input.widthFt}′ × ${input.heightFt}′ × ${input.depthFt}′`),
    [estimate, input]
  );

  /** Apply a patch and record what it did to the headline, for the delta chip. */
  function apply(patch: Partial<WardrobeEstimateInput>, label: string) {
    setInput((prev) => {
      const next = { ...prev, ...patch };
      const diff = estimateWardrobe(next).finalTotal - estimateWardrobe(prev).finalTotal;
      setLastChange(diff === 0 ? null : { label, amount: diff });
      return next;
    });
  }

  const carcass = CARCASS_MATERIALS.find((m) => m.id === input.carcassMaterialId)!;
  const core = SHUTTER_CORES.find((c) => c.id === input.shutterCoreId)!;
  const finish = SHUTTER_FINISHES.find((f) => f.id === input.shutterFinishId)!;
  const hardware = HARDWARE_PACKAGES.find((h) => h.id === input.hardwarePackageId)!;
  const method = BUILD_METHODS.find((m) => m.id === input.buildMethod)!;
  const profile = ALU_PROFILES.find((p) => p.id === input.aluProfileId)!;
  const glass = GLASS_TYPES.find((g) => g.id === input.glassTypeId)!;

  const shutterSummary =
    input.shutterSystem === "aluminium-glass"
      ? `${profile.label} + ${glass.label.toLowerCase()} glass`
      : finish.isPrelam
        ? `${core.label}, pre-finished`
        : `${core.short} + ${finish.label.toLowerCase()}`;

  const toggle = (id: RowId) => setOpen((cur) => (cur === id ? null : id));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] lg:gap-10">
      {/* ----------------------------------------------------- the object -- */}
      <div className="min-w-0">
        <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Your wardrobe
        </p>
        <p className="metric mt-1 text-[20px] leading-none">
          {input.widthFt}′ × {input.heightFt}′ × {input.depthFt}′
        </p>

        <WardrobeSilhouette input={input} className="mt-4" />

        {/* Other furniture types still open their own configurator. Demoted to
            the foot of the drawing: it is a way out, not a first decision. */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
            Estimating something else?
          </span>
          {["kitchen", "tv-unit", "vanity"].map((id) => {
            const t = FURNITURE_TYPES.find((x) => x.id === id)!;
            return (
              <Link
                key={id}
                href={`/studio/custom-furniture/${t.slug}`}
                className="rounded-[2px] border px-2.5 py-1.5 text-[12px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------- price, spec, evidence -- */}
      <aside className="min-w-0">
        <div
          className="rounded-[3px] border"
          style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
        >
          {/* --- the number ------------------------------------------------ */}
          <div className="border-b p-4" style={{ borderColor: "var(--studio-line)" }}>
            <div role="status" aria-live="polite">
              <p className="metric text-[38px] leading-none">{inr(estimate.finalTotal)}</p>
              <p className="metric mt-1 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                Indicative · {inr(estimate.finalRatePerSqft)} per sq ft · {estimate.elevationAreaSqft} sq ft elevation
              </p>
            </div>
            {lastChange ? (
              <p
                className="metric mt-2 inline-block rounded-[2px] px-2 py-1 text-[12px] font-semibold"
                style={{
                  background:
                    lastChange.amount > 0
                      ? "color-mix(in srgb, var(--burgundy) 10%, transparent)"
                      : "color-mix(in srgb, var(--positive) 14%, transparent)",
                  color: lastChange.amount > 0 ? "var(--burgundy)" : "var(--positive)",
                }}
              >
                {lastChange.label} {delta(lastChange.amount)}
              </p>
            ) : null}
          </div>

          {/* --- the specification, three plain rows ----------------------- */}
          <div>
            <SpecRow
              id="size"
              label="Size"
              value={`${input.widthFt}′ × ${input.heightFt}′ × ${input.depthFt}′`}
              open={open === "size"}
              onToggle={toggle}
            >
              <div className="@container">
                <div className="grid grid-cols-2 gap-2.5 @[380px]:grid-cols-3">
                  <Stepper
                    label="Width"
                    value={input.widthFt}
                    min={DIMENSIONS.widthRangeFt[0]}
                    max={DIMENSIONS.widthRangeFt[1]}
                    onChange={(v) => apply({ widthFt: v }, "Width")}
                  />
                  <Stepper
                    label="Height"
                    value={input.heightFt}
                    min={DIMENSIONS.heightRangeFt[0]}
                    max={DIMENSIONS.heightRangeFt[1]}
                    onChange={(v) => apply({ heightFt: v }, "Height")}
                  />
                  <Stepper
                    label="Depth"
                    value={input.depthFt}
                    min={DIMENSIONS.depthRangeFt[0]}
                    max={DIMENSIONS.depthRangeFt[1]}
                    onChange={(v) => apply({ depthFt: v }, "Depth")}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                The estimate is driven by the front elevation ({input.widthFt}′ × {input.heightFt}′). Depth is recorded
                for the spec but does not change the rate in this version.
              </p>
            </SpecRow>

            <SpecRow
              id="carcass"
              label="Carcass"
              value={carcass.short}
              hint="The box behind the doors."
              open={open === "carcass"}
              onToggle={toggle}
            >
              <ChipGrid
                options={CARCASS_MATERIALS.map((m) => ({ id: m.id, label: m.label, sub: m.plain }))}
                value={input.carcassMaterialId}
                onChange={(id) => apply({ carcassMaterialId: id }, CARCASS_MATERIALS.find((m) => m.id === id)!.label)}
              />
              {/* Carcass finish is a consequence of the board, not a separate
                  decision — so it is stated here rather than made a step. */}
              <div className="mt-3">
                {carcass.prelaminated ? (
                  <div
                    className="flex items-start gap-2.5 rounded-[3px] border p-3"
                    style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "var(--positive)" }}
                      aria-hidden="true"
                    >
                      <svg width="9" height="9" viewBox="0 0 12 12">
                        <path
                          d="M1.5 6.4 4.3 9.2 10.5 3"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold">Pre-finished board</p>
                      <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                        {carcass.label} ships already decorated. No additional carcass laminate is priced.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-[3px] border p-3"
                    style={{
                      borderColor: "var(--burgundy)",
                      background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))",
                    }}
                  >
                    <p className="text-[12.5px] font-semibold">Laminate — internal & external faces</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                      Balancing laminate on the hidden faces (₹{CARCASS_FINISH.internalLaminateRatePerSheet}/sheet) and
                      decorative laminate on the visible faces (₹{CARCASS_FINISH.externalLaminateRatePerSheet}/sheet),
                      across {estimate.carcass.sheets} carcass sheets.
                    </p>
                    <p className="metric mt-1.5 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                      {inr(estimate.carcassFinish.total)} · {inr(estimate.carcassFinish.ratePerSqft)}/sq ft
                    </p>
                  </div>
                )}
              </div>
            </SpecRow>

            <SpecRow
              id="shutters"
              label="Shutters"
              value={shutterSummary}
              hint="A separate assembly — the fronts can be a different material entirely."
              open={open === "shutters"}
              onToggle={toggle}
            >
              <div className="max-w-[320px]">
                <Segmented
                  value={input.shutterSystem}
                  onChange={(v: ShutterSystemId) =>
                    apply({ shutterSystem: v }, SHUTTER_SYSTEMS.find((s) => s.id === v)!.label)
                  }
                  size="sm"
                  label="Shutter system"
                  options={SHUTTER_SYSTEMS.map((s) => ({ id: s.id, label: s.label }))}
                />
              </div>

              {input.shutterSystem === "board" ? (
                <div className="mt-4 space-y-4">
                  <Field label="Shutter core">
                    <ChipGrid
                      options={SHUTTER_CORES.map((c) => ({ id: c.id, label: c.label }))}
                      value={input.shutterCoreId}
                      onChange={(id) => {
                        const nextCore = SHUTTER_CORES.find((c) => c.id === id)!;
                        // Prelam core → default the finish to "prelam / none".
                        apply(
                          { shutterCoreId: id, ...(nextCore.prelaminated ? { shutterFinishId: "prelam" } : {}) },
                          nextCore.label
                        );
                      }}
                    />
                  </Field>
                  <Field label="Shutter finish">
                    <ChipGrid
                      options={SHUTTER_FINISHES.filter((f) => !f.isPrelam || core.prelaminated).map((f) => ({
                        id: f.id,
                        label: f.label,
                      }))}
                      value={input.shutterFinishId}
                      onChange={(id) => apply({ shutterFinishId: id }, SHUTTER_FINISHES.find((f) => f.id === id)!.label)}
                    />
                  </Field>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <Field label="Profile finish">
                    <ChipGrid
                      options={ALU_PROFILES.map((p) => ({ id: p.id, label: p.label }))}
                      value={input.aluProfileId}
                      onChange={(id) => apply({ aluProfileId: id }, ALU_PROFILES.find((p) => p.id === id)!.label)}
                    />
                  </Field>
                  <Field label="Glass type">
                    <ChipGrid
                      options={GLASS_TYPES.map((g) => ({ id: g.id, label: g.label }))}
                      value={input.glassTypeId}
                      onChange={(id) => apply({ glassTypeId: id }, GLASS_TYPES.find((g) => g.id === id)!.label)}
                    />
                  </Field>
                </div>
              )}

              <p className="metric mt-3 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                {inr(estimate.shutters.ratePerSqft)}/sq ft ={" "}
                {estimate.shutters.components.map((c) => `${c.label} ₹${c.ratePerSqft}`).join(" + ")}
              </p>
            </SpecRow>

            <SpecRow
              id="hardware"
              label="Hardware"
              value={hardware.label}
              hint="Hinges, runners and handles, as a package."
              open={open === "hardware"}
              onToggle={toggle}
            >
              <ChipGrid
                options={HARDWARE_PACKAGES.map((h) => ({
                  id: h.id,
                  label: h.label,
                  sub: `${h.note} · ₹${h.ratePerSqft}/sq ft`,
                }))}
                value={input.hardwarePackageId}
                onChange={(id) => apply({ hardwarePackageId: id }, HARDWARE_PACKAGES.find((h) => h.id === id)!.label)}
              />
            </SpecRow>

            <SpecRow
              id="build"
              label="Built"
              value={method.sub}
              hint="Both routes are priced the same today. What differs is the lead time, how much work happens in your home, and how the panel edges are finished."
              open={open === "build"}
              onToggle={toggle}
            >
              <div className="max-w-[280px]">
                <Segmented
                  value={input.buildMethod}
                  onChange={(v) => apply({ buildMethod: v }, BUILD_METHODS.find((m) => m.id === v)!.label)}
                  size="sm"
                  label="Build method"
                  options={BUILD_METHODS.map((m) => ({ id: m.id, label: m.label, sub: m.sub }))}
                />
              </div>
            </SpecRow>
          </div>

          {/* --- where the money goes -------------------------------------- */}
          <div className="border-t p-4" style={{ borderColor: "var(--studio-line)" }}>
            <PriceDNA estimate={estimate} />
            <p className="mt-2.5 text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
              Board rates come from the EightByFour catalogue. Fabrication and service rates are our current working
              figures and are confirmed before production.
            </p>
          </div>

          {/* --- what a different board would cost, for THIS wardrobe ------ */}
          <div className="border-t p-4" style={{ borderColor: "var(--studio-line)" }}>
            <MaterialSwap input={input} onChange={apply} />
          </div>

          <div className="border-t p-4" style={{ borderColor: "var(--studio-line)" }}>
            <Link
              href="/studio/custom-furniture/wardrobe/design"
              className="flex w-full items-center justify-center gap-1.5 rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white transition-colors"
              style={{ background: "var(--burgundy)" }}
            >
              Continue configuration <span aria-hidden="true">→</span>
            </Link>
            <p className="mt-3 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
              Indicative from your current selections. Final dimensions and live material rates are confirmed before
              production.
            </p>
          </div>
        </div>
      </aside>

      <MobileQuoteBar quote={quote} contextLabel="Your indicative estimate" />
    </div>
  );
}

/**
 * One line of the specification, with its controls folded behind it.
 *
 * The value is the point of the row — it is what the customer reads to check
 * we understood them — so it gets the weight, and "Change" is the quiet half.
 */
function SpecRow({
  id,
  label,
  value,
  hint,
  open,
  onToggle,
  children,
}: {
  id: RowId;
  label: string;
  value: string;
  hint?: string;
  open: boolean;
  onToggle: (id: RowId) => void;
  children: React.ReactNode;
}) {
  const panelId = `spec-${id}`;
  return (
    <div className="border-t" style={{ borderColor: "var(--studio-line)" }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--stone-deep)]"
      >
        <span
          className="tracked-caps w-[74px] shrink-0 text-[10px]"
          style={{ color: "var(--ink-faint)" }}
        >
          {label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{value}</span>
        <span className="shrink-0 text-[12px] font-semibold" style={{ color: "var(--burgundy)" }}>
          {open ? "Done" : "Change"} <span aria-hidden="true">{open ? "▴" : "→"}</span>
        </span>
      </button>
      <div id={panelId} hidden={!open} className="px-4 pb-4">
        {hint ? (
          <p className="mb-3 text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
            {hint}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

/** Compact wrap-and-reflow chips. Not giant cards — see brief §18. */
function ChipGrid({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; sub?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className="min-h-11 rounded-[3px] border px-3 py-2 text-left transition-colors"
            style={{
              borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
              boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
              background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
              maxWidth: o.sub ? "220px" : undefined,
            }}
          >
            <span
              className="block text-[12.5px] font-semibold leading-tight"
              style={{ color: active ? "var(--burgundy)" : "var(--ink)" }}
            >
              {o.label}
            </span>
            {o.sub ? (
              <span className="mt-0.5 block text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                {o.sub}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
