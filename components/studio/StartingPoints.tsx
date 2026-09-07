"use client";

import Link from "next/link";
import { useState } from "react";
import { CARCASS_MATERIALS, HARDWARE_PACKAGES, SHUTTER_CORES } from "@/lib/studio/estimator/config";
import { estimateWardrobe } from "@/lib/studio/estimator/engine";
import { inr } from "@/lib/studio/format";

/**
 * Starting points, not packages.
 *
 * Four common priorities, each mapped to a real material combination with the
 * reason stated. Every claim below is drawn from the material data itself —
 * prelam boards genuinely have no separate finishing cost, BWP genuinely is the
 * most water-tolerant board we stock. Nothing here asserts anything the data
 * does not already say.
 *
 * The price is the real engine on an 8′ × 8′ wardrobe, so the four options are
 * comparable. Every one of them is fully editable once the customer is in the
 * estimator — that is the difference between a starting point and a package.
 */

interface StartingPoint {
  id: string;
  intent: string;
  sub: string;
  carcassId: string;
  shutterCoreId: string;
  shutterFinishId: string;
  hardwareId: string;
  /** Why this combination, in the customer's terms. Facts only. */
  because: string;
}

const POINTS: StartingPoint[] = [
  {
    id: "value",
    intent: "Lowest practical cost",
    sub: "Dry rooms, tight budget",
    carcassId: "prelam-pb",
    shutterCoreId: "prelam-pb",
    shutterFinishId: "prelam",
    hardwareId: "basic",
    because:
      "Both the box and the fronts arrive already finished, so there is no separate laminate cost at all. Keep it out of kitchens and bathrooms.",
  },
  {
    id: "balanced",
    intent: "Balanced",
    sub: "The usual bedroom wardrobe",
    carcassId: "bwr-ply",
    shutterCoreId: "hdhmr",
    shutterFinishId: "laminate",
    hardwareId: "standard",
    because:
      "Water-resistant plywood for the box, a dense board for the fronts, soft-close hardware. Repairable years later.",
  },
  {
    id: "durability",
    intent: "Maximum durability",
    sub: "Kitchens, bathrooms, damp walls",
    carcassId: "bwp-ply",
    shutterCoreId: "hdhmr",
    shutterFinishId: "laminate",
    hardwareId: "standard",
    because:
      "Boiling-waterproof plywood is the most water-tolerant board we stock. Worth it where the wall or the room gets damp.",
  },
  {
    id: "finish",
    intent: "Finish-led",
    sub: "When the fronts are the point",
    carcassId: "bwr-ply",
    shutterCoreId: "mdf",
    shutterFinishId: "acrylic",
    hardwareId: "premium",
    because:
      "MDF gives the flattest face for a high-gloss acrylic front. The box stays water-resistant plywood underneath.",
  },
];

export function StartingPoints() {
  const [openId, setOpenId] = useState<string>("balanced");

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p) => {
          const estimate = estimateWardrobe({
            widthFt: 8,
            heightFt: 8,
            depthFt: 2,
            buildMethod: "factory",
            carcassMaterialId: p.carcassId,
            carcassFinishId: "laminate",
            shutterSystem: "board",
            shutterCoreId: p.shutterCoreId,
            shutterFinishId: p.shutterFinishId,
            aluProfileId: "natural",
            glassTypeId: "clear",
            hardwarePackageId: p.hardwareId,
          });
          const carcass = CARCASS_MATERIALS.find((m) => m.id === p.carcassId)!;
          const core = SHUTTER_CORES.find((c) => c.id === p.shutterCoreId)!;
          const hardware = HARDWARE_PACKAGES.find((h) => h.id === p.hardwareId)!;
          const open = openId === p.id;

          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={open}
              onClick={() => setOpenId(p.id)}
              className="flex flex-col rounded-[3px] p-3.5 text-left shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              style={{
                background: "var(--paper)",
                boxShadow: open ? "0 0 0 1px var(--burgundy), var(--shadow-md)" : undefined,
              }}
            >
              <span className="text-[14px] font-semibold leading-tight" style={{ color: open ? "var(--burgundy)" : "var(--ink)" }}>
                {p.intent}
              </span>
              <span className="mt-0.5 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                {p.sub}
              </span>

              <span className="metric mt-2.5 text-[20px] leading-none">{inr(estimate.finalTotal)}</span>
              <span className="mt-1 text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                indicative · 8′ × 8′ wardrobe
              </span>

              <span className="mt-2.5 space-y-0.5 border-t pt-2 text-[11px]" style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}>
                <span className="block">{carcass.label} box</span>
                <span className="block">
                  {core.label} fronts{core.prelaminated ? "" : p.shutterFinishId === "acrylic" ? " + acrylic" : " + laminate"}
                </span>
                <span className="block">{hardware.label} hardware</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* The reason, for whichever is selected. */}
      <div
        className="mt-3 rounded-[3px] p-3.5"
        style={{ background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))" }}
      >
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          <span className="font-semibold" style={{ color: "var(--burgundy)" }}>
            Why{" "}
          </span>
          {POINTS.find((p) => p.id === openId)!.because}
        </p>
        <p className="mt-2 text-[12px]" style={{ color: "var(--ink-faint)" }}>
          A starting point, not a package — every board, front and fitting is yours to change.{" "}
          <Link
            href="/studio/custom-furniture/wardrobe"
            className="font-semibold underline decoration-[var(--studio-line-strong)] underline-offset-2"
            style={{ color: "var(--burgundy)" }}
          >
            Open the estimator
          </Link>
        </p>
      </div>
    </div>
  );
}
