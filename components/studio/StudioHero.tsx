"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DIMENSIONS } from "@/lib/studio/estimator/config";
import { REFERENCE_WARDROBE } from "@/lib/studio/estimator/reference";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";
import { inr } from "@/lib/studio/format";
import { WardrobeSilhouette } from "./WardrobeSilhouette";
import { Stepper } from "./primitives";

/**
 * The hero demonstrates Studio rather than describing it.
 *
 * Three constraints shaped this:
 *
 * 1. No three.js on the landing page. The drawing is the same lightweight SVG
 *    the wardrobe summary uses, so the hero costs nothing to render and looks
 *    like the product the visitor is about to open.
 * 2. Two decisions only — what, and how big. Every further control belongs on
 *    the product page; a hero that asks for five is a form, not a storefront.
 * 3. Kitchen and storage do NOT get an invented number. Kitchen has its own
 *    engine and its own room-first journey; storage is priced by the general
 *    estimator. Showing a wardrobe price under a kitchen heading would be the
 *    fastest possible way to lose the trust this whole page is built on.
 */


type Kind = "wardrobe" | "kitchen" | "storage";

const KINDS: { id: Kind; label: string }[] = [
  { id: "wardrobe", label: "Wardrobe" },
  { id: "kitchen", label: "Kitchen" },
  { id: "storage", label: "Storage" },
];

export function StudioHero() {
  const [kind, setKind] = useState<Kind>("wardrobe");
  const [dims, setDims] = useState({ widthFt: REFERENCE_WARDROBE.widthFt, heightFt: REFERENCE_WARDROBE.heightFt });

  const input = useMemo<WardrobeEstimateInput>(() => ({ ...REFERENCE_WARDROBE, ...dims }), [dims]);
  const estimate = useMemo(() => estimateWardrobe(input), [input]);

  return (
    <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-7 lg:grid-cols-[1.02fr_minmax(0,480px)] lg:items-center lg:py-16">
      {/* ------------------------------------------------------------ left -- */}
      <div>
        <p className="tracked-caps text-[11px]" style={{ color: "var(--burgundy)" }}>
          Studio EightxFour
        </p>
        <h1 className="serif mt-4 text-[clamp(34px,4.8vw,60px)] leading-[1.04] tracking-[-0.02em]">
          Furniture built around
          <br />
          your space, material
          <br />
          and budget.
        </h1>
        <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Start with rough dimensions here. Try materials, see exactly what each one does to the price, and commit only once it makes sense.
        </p>

        <div className="mt-8">
          <p className="tracked-caps mb-2 text-[10px]" style={{ color: "var(--ink-faint)" }}>
            What are you building?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => {
              const active = k.id === kind;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(k.id)}
                  className="min-h-11 rounded-[3px] border px-4 text-[13.5px] transition-colors"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line-strong)",
                    boxShadow: active ? "inset 0 0 0 1px var(--burgundy)" : undefined,
                    background: active ? "color-mix(in srgb, var(--burgundy) 6%, var(--paper))" : "var(--paper)",
                    color: active ? "var(--burgundy)" : "var(--ink)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        {kind === "wardrobe" ? (
          <div className="mt-5 grid max-w-[340px] grid-cols-2 gap-2.5">
            <Stepper
              label="Width"
              value={dims.widthFt}
              min={DIMENSIONS.widthRangeFt[0]}
              max={DIMENSIONS.widthRangeFt[1]}
              onChange={(v) => setDims((d) => ({ ...d, widthFt: v }))}
            />
            <Stepper
              label="Height"
              value={dims.heightFt}
              min={DIMENSIONS.heightRangeFt[0]}
              max={DIMENSIONS.heightRangeFt[1]}
              onChange={(v) => setDims((d) => ({ ...d, heightFt: v }))}
            />
          </div>
        ) : (
          <p className="mt-5 max-w-[46ch] text-[13.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
            {kind === "kitchen"
              ? "A kitchen is planned from the room, not from a single elevation — so it starts with your walls and where the sink and hob go."
              : "Utility and general storage, shutters throughout. Configured the same way as a wardrobe."}
          </p>
        )}
      </div>

      {/* ----------------------------------------------------------- right -- */}
      <div
        className="rounded-[4px] border shadow-[var(--shadow-lg)]"
        style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
      >
        {kind === "wardrobe" ? (
          <>
            <div className="p-4 pb-0">
              <WardrobeSilhouette input={input} />
            </div>
            <dl className="mt-3 border-t px-4 py-3" style={{ borderColor: "var(--studio-line)" }}>
              {[
                ["Carcass", "BWR Plywood"],
                ["Shutters", "HDHMR + laminate"],
                ["Hardware", "Standard, soft-close"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 py-0.5">
                  <dt className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    {k}
                  </dt>
                  <dd className="text-[12.5px]">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t px-4 py-3.5" style={{ borderColor: "var(--studio-line)", background: "var(--stone)" }}>
              <div role="status" aria-live="polite">
                <p className="metric text-[32px] leading-none">{inr(estimate.finalTotal)}</p>
                <p className="metric mt-1 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                  Indicative · {inr(estimate.finalRatePerSqft)} per sq ft · materials, fabrication and installation
                </p>
              </div>
              <Link
                href="/studio/custom-furniture/wardrobe/design"
                className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Start designing <span aria-hidden="true">→</span>
              </Link>
              {/* The secondary action is quieter than the button, but it is
                  still an action — so it gets a real hit area rather than the
                  16px of an inline link inside a sentence. */}
              <Link
                href="/studio/custom-furniture/wardrobe"
                className="mt-1 flex min-h-11 w-full items-center justify-center text-[12.5px]"
                style={{ color: "var(--ink-soft)" }}
              >
                or&nbsp;
                <span
                  className="font-semibold underline decoration-[var(--studio-line-strong)] underline-offset-2"
                  style={{ color: "var(--burgundy)" }}
                >
                  get a quick estimate
                </span>
              </Link>
            </div>
          </>
        ) : (
          <PathCard kind={kind} />
        )}
      </div>
    </div>
  );
}

/**
 * The non-wardrobe paths. Deliberately no number: a kitchen is priced by its
 * own engine from the room, and quoting a wardrobe rate here would be a lie
 * dressed as a feature.
 */
function PathCard({ kind }: { kind: Exclude<Kind, "wardrobe"> }) {
  const copy =
    kind === "kitchen"
      ? {
          title: "Plan from the room",
          steps: ["Draw the walls and the door", "Place the sink, hob and fridge", "Studio suggests the layout and prices the runs"],
          href: "/studio/kitchen",
          cta: "Plan a kitchen",
        }
      : {
          title: "Configure a storage unit",
          steps: ["Give the opening you want filled", "Choose the board and the fronts", "See the estimate move with each choice"],
          href: "/studio/custom-furniture/storage",
          cta: "Configure storage",
        };

  return (
    <div className="p-5">
      <p className="serif text-[22px] leading-tight">{copy.title}</p>
      <ol className="mt-4 flex flex-col gap-2.5">
        {copy.steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-[13.5px] leading-snug">
            <span className="metric shrink-0 text-[11px]" style={{ color: "var(--burgundy)" }}>
              0{i + 1}
            </span>
            <span style={{ color: "var(--ink-soft)" }}>{s}</span>
          </li>
        ))}
      </ol>
      <Link
        href={copy.href}
        className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white transition-colors"
        style={{ background: "var(--burgundy)" }}
      >
        {copy.cta} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
