"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CARCASS_MATERIALS,
  HARDWARE_PACKAGES,
  SHEET_SQFT_NOTE,
  SHUTTER_CORES,
  type CarcassMaterial,
} from "@/lib/studio/estimator/config";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import { boardSwatch } from "@/lib/studio/estimator/swatches";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";
import { REFERENCE_WARDROBE } from "@/lib/studio/estimator/reference";
import { inr } from "@/lib/studio/format";
import { ScrollRail } from "./primitives";

/**
 * One tool where there used to be three.
 *
 * The material ladder taught boards in the abstract (₹80 per sq ft), the price
 * composition demo taught price behaviour, and the starting points offered
 * budget anchors. All three were answering the same customer question from
 * different angles: WHAT WOULD THIS MATERIAL DO TO MY FURNITURE?
 *
 * Two deliberate refusals:
 *
 * 1. This is not a quality ladder. The boards are not ordered best-to-worst,
 *    because they are not — FR ply is not "better" than prelam MDF, it is for
 *    a different job. The bars below rate cost, moisture, durability and
 *    finish flexibility SEPARATELY, so a customer can see that the cheapest
 *    board wins on nothing except cost and the dearest wins on nothing except
 *    water.
 * 2. The board rate is not the headline. What a board does to the wardrobe is
 *    the headline; the ₹/sq ft sits behind "See specifications", where someone
 *    who wants it can find it.
 */


/** Common priorities, each a real combination rather than a package tier. */
const PRESETS = [
  {
    id: "value",
    label: "Lowest cost",
    sub: "Dry rooms",
    patch: { carcassMaterialId: "prelam-pb", shutterCoreId: "prelam-pb", shutterFinishId: "prelam", hardwarePackageId: "basic" },
  },
  {
    id: "balanced",
    label: "Balanced",
    sub: "Usual bedroom wardrobe",
    patch: { carcassMaterialId: "bwr-ply", shutterCoreId: "hdhmr", shutterFinishId: "laminate", hardwarePackageId: "standard" },
  },
  {
    id: "durable",
    label: "Most durable",
    sub: "Damp walls, bathrooms",
    patch: { carcassMaterialId: "bwp-ply", shutterCoreId: "hdhmr", shutterFinishId: "laminate", hardwarePackageId: "standard" },
  },
  {
    id: "finish",
    label: "Finish-led",
    sub: "When fronts are the point",
    patch: { carcassMaterialId: "bwr-ply", shutterCoreId: "mdf", shutterFinishId: "acrylic", hardwarePackageId: "premium" },
  },
] satisfies { id: string; label: string; sub: string; patch: Partial<WardrobeEstimateInput> }[];

export function MaterialPriceExplorer() {
  const [input, setInput] = useState<WardrobeEstimateInput>(REFERENCE_WARDROBE);
  const [selectedId, setSelectedId] = useState<string>(REFERENCE_WARDROBE.carcassMaterialId);
  const [showSpecs, setShowSpecs] = useState(false);

  const current = useMemo(() => estimateWardrobe(input), [input]);
  const selected = CARCASS_MATERIALS.find((m) => m.id === selectedId)!;

  /**
   * What the selected board would do to this wardrobe. When the board IS the
   * one in use the delta is zero by construction — no special case needed.
   */
  const preview = useMemo(() => {
    const patch = boardPatch(selected);
    const e = estimateWardrobe({ ...input, ...patch });
    return {
      estimate: e,
      delta: e.finalTotal - current.finalTotal,
      changesFronts: patch.shutterCoreId !== undefined && patch.shutterCoreId !== input.shutterCoreId,
    };
  }, [selected, input, current]);

  const isApplied = selected.id === input.carcassMaterialId;
  const reference = CARCASS_MATERIALS.find((m) => m.id === input.carcassMaterialId)!;

  function apply() {
    setInput((prev) => ({ ...prev, ...boardPatch(selected) }));
  }

  return (
    <div>
      {/* --- the wardrobe being talked about ---------------------------- */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[3px] border px-4 py-3"
        style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
      >
        <div>
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Priced against
          </p>
          <p className="mt-0.5 text-[13.5px]">
            An 8′ × 8′ wardrobe · {reference.short} box ·{" "}
            {SHUTTER_CORES.find((c) => c.id === input.shutterCoreId)!.short} fronts ·{" "}
            {HARDWARE_PACKAGES.find((h) => h.id === input.hardwarePackageId)!.label.toLowerCase()} hardware
          </p>
        </div>
        <p className="metric text-[24px] leading-none">{inr(current.finalTotal)}</p>
      </div>

      {/* --- common starting points ------------------------------------- */}
      <div className="mt-3">
        <ScrollRail ariaLabel="Common starting points">
          {PRESETS.map((p) => {
            const total = estimateWardrobe({ ...input, ...p.patch }).finalTotal;
            const active = Object.entries(p.patch).every(
              ([k, v]) => input[k as keyof WardrobeEstimateInput] === v
            );
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setInput((prev) => ({ ...prev, ...p.patch }));
                  setSelectedId(p.patch.carcassMaterialId!);
                }}
                className="min-h-11 shrink-0 rounded-[3px] border px-3.5 py-2 text-left transition-colors"
                style={{
                  borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                  boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                  background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                }}
              >
                <span
                  className="block text-[13px] font-semibold leading-tight"
                  style={{ color: active ? "var(--burgundy)" : "var(--ink)" }}
                >
                  {p.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                  {p.sub} · {inr(total)}
                </span>
              </button>
            );
          })}
        </ScrollRail>
      </div>

      {/* --- the boards -------------------------------------------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
        <div>
          <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Carcass board
          </p>
          <ul className="flex flex-col">
            {CARCASS_MATERIALS.map((m) => {
              const active = m.id === selectedId;
              const inUse = m.id === input.carcassMaterialId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedId(m.id);
                      setShowSpecs(false);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 border-t px-1 py-2 text-left transition-colors"
                    style={{
                      borderColor: "var(--studio-line)",
                      background: active ? "color-mix(in srgb, var(--burgundy) 5%, transparent)" : undefined,
                    }}
                  >
                    <span
                      className="block h-7 w-7 shrink-0 rounded-[2px]"
                      style={{
                        background: `linear-gradient(135deg, ${boardSwatch(m.id).from}, ${boardSwatch(m.id).to})`,
                        boxShadow: active ? "0 0 0 2px var(--burgundy)" : "inset 0 0 0 1px var(--studio-line)",
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-[13px]"
                      style={{ color: active ? "var(--burgundy)" : "var(--ink)", fontWeight: active ? 600 : 400 }}
                    >
                      {m.label}
                    </span>
                    {inUse ? (
                      <span className="tracked-caps shrink-0 text-[9px]" style={{ color: "var(--ink-faint)" }}>
                        In use
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* --- what it would do ----------------------------------------- */}
        <div
          className="rounded-[3px] border p-5"
          style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
        >
          <h3 className="serif text-[24px] leading-tight">{selected.label}</h3>
          <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {selected.plain}
          </p>

          {/* This configuration */}
          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--studio-line)" }}>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              This configuration
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="metric text-[30px] leading-none">{inr(preview.estimate.finalTotal)}</p>
              {isApplied ? (
                <span className="text-[13px]" style={{ color: "var(--ink-faint)" }}>
                  Currently selected
                </span>
              ) : (
                <span
                  className="metric text-[15px] font-semibold"
                  style={{ color: preview.delta > 0 ? "var(--burgundy)" : "var(--positive)" }}
                >
                  {preview.delta > 0 ? "+" : "−"}
                  {inr(Math.abs(preview.delta))} vs {reference.short}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-[56ch] text-[13px] leading-snug" style={{ color: "var(--ink-soft)" }}>
              <span className="font-semibold">Why. </span>
              {whyItChanges(selected, reference, preview.changesFronts)}
            </p>
            {!isApplied ? (
              <button
                type="button"
                onClick={apply}
                className="mt-3.5 inline-flex min-h-11 items-center rounded-[3px] px-4 text-[13.5px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Price the wardrobe in {selected.short}
              </button>
            ) : null}
          </div>

          {/* Four independent ratings — NOT a single score */}
          <div className="mt-5 grid gap-x-8 gap-y-3 border-t pt-4 sm:grid-cols-2" style={{ borderColor: "var(--studio-line)" }}>
            <Rating label="Initial cost" value={costRating(selected)} caption={costRating(selected) === 1 ? "Least" : costRating(selected) === 5 ? "Most" : undefined} />
            <Rating label="Moisture resistance" value={selected.moisture} />
            <Rating label="Durability" value={selected.durability} />
            <Rating label="Finish flexibility" value={selected.finishFlex} />
          </div>

          <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2" style={{ borderColor: "var(--studio-line)" }}>
            <p className="text-[13px] leading-snug">
              <span className="tracked-caps block text-[9px]" style={{ color: "var(--ink-faint)" }}>
                Best for
              </span>
              <span style={{ color: "var(--ink-soft)" }}>{selected.bestFor}</span>
            </p>
            <p className="text-[13px] leading-snug">
              <span className="tracked-caps block text-[9px]" style={{ color: "var(--burgundy)" }}>
                Watch for
              </span>
              <span style={{ color: "var(--ink-soft)" }}>{selected.watchFor}</span>
            </p>
          </div>

          {/* Progressive disclosure — the trade detail, for whoever wants it */}
          <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--studio-line)" }}>
            <button
              type="button"
              onClick={() => setShowSpecs((v) => !v)}
              aria-expanded={showSpecs}
              className="inline-flex min-h-11 items-center text-[13px] font-semibold"
              style={{ color: "var(--burgundy)" }}
            >
              {showSpecs ? "Hide specifications" : "See specifications"}{" "}
              <span aria-hidden="true">&nbsp;{showSpecs ? "▴" : "→"}</span>
            </button>
            {showSpecs ? (
              <dl className="mt-1 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                <Spec k="Board rate" v={`${inr(selected.ratePerSqft)} per sq ft`} />
                <Spec k="Carcass thickness" v="19 mm" />
                <Spec
                  k="Rate source"
                  v={
                    selected.source === "catalogue"
                      ? "Current EightByFour catalogue"
                      : "Studio working figure, verified before quotation"
                  }
                />
                <Spec k="Sheet basis" v={SHEET_SQFT_NOTE} />
                <div className="sm:col-span-2">
                  <Link href={selected.catalogueHref} className="text-[13px] font-semibold" style={{ color: "var(--burgundy)" }}>
                    Open this board in the catalogue <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Applying a board is not always one field.
 *
 * A prelaminated board arrives decorated, so choosing it for the box and then
 * laminating the fronts separately is a combination nobody actually orders.
 * The preview and the applied change use the same function, so the number
 * shown is exactly the number applied.
 */
function boardPatch(m: CarcassMaterial): Partial<WardrobeEstimateInput> {
  if (!m.prelaminated) return { carcassMaterialId: m.id };
  const core = SHUTTER_CORES.find((c) => c.id === m.id && c.prelaminated);
  return core ? { carcassMaterialId: m.id, shutterCoreId: core.id, shutterFinishId: "prelam" } : { carcassMaterialId: m.id };
}

/** 1–5, derived from where the board sits in the real rate spread. */
function costRating(m: CarcassMaterial): number {
  const rates = CARCASS_MATERIALS.map((x) => x.ratePerSqft);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  return Math.max(1, Math.round(((m.ratePerSqft - min) / (max - min)) * 4) + 1);
}

/**
 * The sentence that matters more than the rate.
 *
 * Assembled from what the model actually did, not written per board — so it
 * cannot drift from the arithmetic it is explaining.
 */
function whyItChanges(selected: CarcassMaterial, reference: CarcassMaterial, changesFronts: boolean): string {
  if (selected.id === reference.id) {
    return selected.prelaminated
      ? "The board arrives already decorated, so no separate carcass laminate is priced on this wardrobe."
      : "The box is laminated on both faces after it is built, which is priced separately from the board itself.";
  }

  const parts: string[] = [];
  if (selected.prelaminated && !reference.prelaminated) {
    parts.push(
      "the decorative surface is already factory-applied, so Studio does not add a separate laminate finishing cost"
    );
  }
  if (!selected.prelaminated && reference.prelaminated) {
    parts.push("this board arrives raw, so the box has to be laminated on both faces after it is built");
  }
  const rateGap = Math.round((selected.ratePerSqft - reference.ratePerSqft) * 10) / 10;
  if (rateGap !== 0) {
    parts.push(
      `the board itself is ₹${Math.abs(rateGap)} per sq ft ${rateGap > 0 ? "dearer" : "cheaper"} than ${reference.short}`
    );
  }
  if (changesFronts) {
    parts.push("and the fronts move to the same pre-finished board");
  }
  return parts.length ? `${parts.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()) : "Nothing in the costed model changes.";
}

function Rating({ label, value, caption }: { label: string; value: number; caption?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
          {label}
        </p>
        {caption ? (
          <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
            {caption}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex gap-1" role="img" aria-label={`${label}: ${value} of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="block h-1.5 flex-1 rounded-[1px]"
            style={{ background: i <= value ? "var(--burgundy)" : "var(--studio-line)" }}
          />
        ))}
      </div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-t pt-1.5" style={{ borderColor: "var(--studio-line)" }}>
      <dt className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
        {k}
      </dt>
      <dd className="text-[13px]">{v}</dd>
    </div>
  );
}
