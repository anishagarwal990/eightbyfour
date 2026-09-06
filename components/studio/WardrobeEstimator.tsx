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
import { Segmented, StepHeading, Stepper } from "./primitives";

/**
 * The instant wardrobe estimator.
 *
 * Component-based, not a price table: each control writes one field of
 * `WardrobeEstimateInput`, the pure engine turns that into seven buckets, and
 * the headline number and the breakdown both read the SAME result object —
 * there is no second display maths anywhere in this file.
 *
 * Layout, type scale, spacing and the burgundy accent are unchanged from the
 * previous estimator. What changed is the pricing model and the shutter
 * section, which is now its own assembly with a system switch.
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

export function WardrobeEstimator() {
  const [input, setInput] = useState<WardrobeEstimateInput>(DEFAULT_INPUT);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lastChange, setLastChange] = useState<{ label: string; amount: number } | null>(null);

  const estimate = useMemo(() => estimateWardrobe(input), [input]);

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
  const prelamCarcass = carcass.prelaminated;
  const core = SHUTTER_CORES.find((c) => c.id === input.shutterCoreId)!;

  const continueHref = `/studio/custom-furniture/wardrobe/design`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      {/* ------------------------------------------------------- controls -- */}
      <div className="min-w-0">
        {/* What are you building — wardrobe is priced by this engine; the
            others still open their own configurator. */}
        <section className="mb-8">
          <StepHeading step="Start" title="What are you building?" />
          <div className="flex flex-wrap gap-1.5">
            {["wardrobe", "kitchen", "tv-unit", "vanity"].map((id) => {
              const t = FURNITURE_TYPES.find((x) => x.id === id)!;
              const active = id === "wardrobe";
              return active ? (
                <span
                  key={id}
                  aria-current="true"
                  className="rounded-[2px] border px-3 py-2 text-[13px] font-semibold"
                  style={{
                    borderColor: "var(--burgundy)",
                    background: "color-mix(in srgb, var(--burgundy) 8%, var(--paper))",
                    color: "var(--burgundy)",
                  }}
                >
                  {t.label}
                </span>
              ) : (
                <Link
                  key={id}
                  href={`/studio/custom-furniture/${t.slug}`}
                  className="rounded-[2px] border px-3 py-2 text-[13px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                  style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Dimensions — depth is kept because it matters to the product; V1
            does not price against it. */}
        <section className="mb-8">
          <StepHeading step="Size" title="Dimensions" right={
            <span className="metric shrink-0 text-[13px]" style={{ color: "var(--ink-soft)" }}>
              {estimate.elevationAreaSqft} sq ft elevation
            </span>
          } />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Stepper label="Width" value={input.widthFt} min={DIMENSIONS.widthRangeFt[0]} max={DIMENSIONS.widthRangeFt[1]} onChange={(v) => apply({ widthFt: v }, "Width")} />
            <Stepper label="Height" value={input.heightFt} min={DIMENSIONS.heightRangeFt[0]} max={DIMENSIONS.heightRangeFt[1]} onChange={(v) => apply({ heightFt: v }, "Height")} />
            <Stepper label="Depth" value={input.depthFt} min={DIMENSIONS.depthRangeFt[0]} max={DIMENSIONS.depthRangeFt[1]} onChange={(v) => apply({ depthFt: v }, "Depth")} />
          </div>
          <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
            The estimate is driven by the front elevation ({input.widthFt}′ × {input.heightFt}′). Depth is recorded for
            the spec but does not change the rate in this version.
          </p>
        </section>

        <section className="mb-8">
          <StepHeading step="Build" title="Build method" />
          <div className="max-w-[280px]">
            <Segmented
              value={input.buildMethod}
              onChange={(v) => apply({ buildMethod: v }, BUILD_METHODS.find((m) => m.id === v)!.label)}
              size="sm"
              label="Build method"
              options={BUILD_METHODS.map((m) => ({ id: m.id, label: m.label, sub: m.sub }))}
            />
          </div>
        </section>

        {/* 01 — carcass */}
        <section className="mb-8">
          <StepHeading step="01" title="Carcass" hint="The box behind the doors. What it is made of decides how long it lasts." />
          <ChipGrid
            options={CARCASS_MATERIALS.map((m) => ({ id: m.id, label: m.label, sub: m.note }))}
            value={input.carcassMaterialId}
            onChange={(id) => apply({ carcassMaterialId: id }, CARCASS_MATERIALS.find((m) => m.id === id)!.label)}
          />
        </section>

        {/* 02 — carcass finish, conditional on prelaminated */}
        <section className="mb-8">
          <StepHeading step="02" title="Carcass finish" />
          {prelamCarcass ? (
            <div
              className="flex items-start gap-2.5 rounded-[3px] border p-3.5"
              style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--positive)" }}
                aria-hidden="true"
              >
                <svg width="9" height="9" viewBox="0 0 12 12">
                  <path d="M1.5 6.4 4.3 9.2 10.5 3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-[13px] font-semibold">Pre-finished board</p>
                <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                  {carcass.label} ships already decorated. No additional carcass laminate is priced.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="rounded-[3px] border p-3.5"
              style={{ borderColor: "var(--burgundy)", background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))" }}
            >
              <p className="text-[13px] font-semibold">Laminate — internal & external faces</p>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                Balancing laminate on the hidden faces (₹{CARCASS_FINISH.internalLaminateRatePerSheet}/sheet) and
                decorative laminate on the visible faces (₹{CARCASS_FINISH.externalLaminateRatePerSheet}/sheet), across{" "}
                {estimate.carcass.sheets} carcass sheets.
              </p>
              <p className="metric mt-2 text-[12px]" style={{ color: "var(--ink-faint)" }}>
                {inr(estimate.carcassFinish.total)} · {inr(estimate.carcassFinish.ratePerSqft)}/sq ft
              </p>
            </div>
          )}
        </section>

        {/* 03 — shutters, its own assembly */}
        <section className="mb-8">
          <StepHeading step="03" title="Shutters" hint="A separate assembly from the carcass — the fronts can be a different material entirely." />
          <div className="max-w-[320px]">
            <Segmented
              value={input.shutterSystem}
              onChange={(v: ShutterSystemId) => apply({ shutterSystem: v }, SHUTTER_SYSTEMS.find((s) => s.id === v)!.label)}
              size="sm"
              label="Shutter system"
              options={SHUTTER_SYSTEMS.map((s) => ({ id: s.id, label: s.label }))}
            />
          </div>

          {input.shutterSystem === "board" ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  Shutter core
                </p>
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
              </div>
              <div>
                <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  Shutter finish
                </p>
                <ChipGrid
                  options={SHUTTER_FINISHES.filter((f) => !f.isPrelam || core.prelaminated).map((f) => ({
                    id: f.id,
                    label: f.label,
                  }))}
                  value={input.shutterFinishId}
                  onChange={(id) => apply({ shutterFinishId: id }, SHUTTER_FINISHES.find((f) => f.id === id)!.label)}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  Profile finish
                </p>
                <ChipGrid
                  options={ALU_PROFILES.map((p) => ({ id: p.id, label: p.label }))}
                  value={input.aluProfileId}
                  onChange={(id) => apply({ aluProfileId: id }, ALU_PROFILES.find((p) => p.id === id)!.label)}
                />
              </div>
              <div>
                <p className="tracked-caps mb-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  Glass type
                </p>
                <ChipGrid
                  options={GLASS_TYPES.map((g) => ({ id: g.id, label: g.label }))}
                  value={input.glassTypeId}
                  onChange={(id) => apply({ glassTypeId: id }, GLASS_TYPES.find((g) => g.id === id)!.label)}
                />
              </div>
            </div>
          )}

          <p className="metric mt-3 text-[12px]" style={{ color: "var(--ink-faint)" }}>
            {inr(estimate.shutters.ratePerSqft)}/sq ft ={" "}
            {estimate.shutters.components.map((c) => `${c.label} ₹${c.ratePerSqft}`).join(" + ")}
          </p>
        </section>

        {/* 04 — hardware */}
        <section className="mb-8">
          <StepHeading step="04" title="Hardware" hint="Hinges, runners and handles, as a package." />
          <ChipGrid
            options={HARDWARE_PACKAGES.map((h) => ({ id: h.id, label: h.label, sub: `${h.note} · ₹${h.ratePerSqft}/sq ft` }))}
            value={input.hardwarePackageId}
            onChange={(id) => apply({ hardwarePackageId: id }, HARDWARE_PACKAGES.find((h) => h.id === id)!.label)}
          />
        </section>
      </div>

      {/* --------------------------------------------------------- estimate -- */}
      <aside className="lg:sticky lg:top-[128px] self-start rounded-[3px] border" style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}>
        <div className="border-b p-4" style={{ borderColor: "var(--studio-line)" }}>
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Indicative estimate
          </p>
          <div role="status" aria-live="polite">
            <p className="metric mt-1 text-[38px] leading-none">{inr(estimate.finalTotal)}</p>
            <p className="metric mt-1 text-[12px]" style={{ color: "var(--ink-soft)" }}>
              {inr(estimate.finalRatePerSqft)} per sq ft · {estimate.elevationAreaSqft} sq ft elevation
            </p>
          </div>
          {lastChange ? (
            <p
              className="metric mt-2 inline-block rounded-[2px] px-2 py-1 text-[12px] font-semibold"
              style={{
                background: lastChange.amount > 0 ? "color-mix(in srgb, var(--burgundy) 10%, transparent)" : "color-mix(in srgb, var(--positive) 14%, transparent)",
                color: lastChange.amount > 0 ? "var(--burgundy)" : "var(--positive)",
              }}
            >
              {lastChange.label} {delta(lastChange.amount)}
            </p>
          ) : null}
        </div>

        {/* View price breakdown — reads the exact same estimate object. */}
        <div className="border-b" style={{ borderColor: "var(--studio-line)" }}>
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            aria-expanded={showBreakdown}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-[12.5px] font-semibold transition-colors hover:bg-[var(--stone-deep)]"
          >
            View price breakdown
            <span className="text-[11px] transition-transform" style={{ color: "var(--ink-faint)", transform: showBreakdown ? "rotate(180deg)" : undefined }} aria-hidden="true">
              ▾
            </span>
          </button>
          {showBreakdown ? (
            <div className="px-4 pb-3">
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {estimate.buckets.map((b) => (
                    <tr key={b.key} className="border-t" style={{ borderColor: "var(--studio-line)" }}>
                      <td className="py-1.5 pr-2 align-top">
                        <span className="block font-medium leading-tight">{b.label}</span>
                        {b.detail ? (
                          <span className="mt-0.5 block text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                            {b.detail}
                          </span>
                        ) : null}
                      </td>
                      <td className="metric whitespace-nowrap py-1.5 text-right align-top" style={{ color: "var(--ink-soft)" }}>
                        {inr(b.ratePerSqft)}/sq ft
                      </td>
                      <td className="metric whitespace-nowrap py-1.5 pl-2 text-right align-top">{inr(b.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2" style={{ borderColor: "var(--studio-line-strong)" }}>
                    <td className="py-2 pr-2 font-semibold">Estimated rate</td>
                    <td className="metric py-2 text-right font-semibold">{inr(estimate.finalRatePerSqft)}/sq ft</td>
                    <td className="metric py-2 pl-2 text-right font-semibold">{inr(estimate.finalTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[10.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                Every rate above comes from one editable configuration file. This is a V1 estimate on assumed rates —
                not a quotation.
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <Link
            href={continueHref}
            className="flex w-full items-center justify-center gap-1.5 rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white transition-colors"
            style={{ background: "var(--burgundy)" }}
          >
            Continue configuration <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-3 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
            Materials, fabrication, hardware, labour, miscellaneous and margin, composed from your selections. Final
            pricing is confirmed after a site measurement.
          </p>
        </div>
      </aside>
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
            <span className="block text-[12.5px] font-semibold leading-tight" style={{ color: active ? "var(--burgundy)" : "var(--ink)" }}>
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
