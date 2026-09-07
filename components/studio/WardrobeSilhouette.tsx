"use client";

import { ARCHETYPES } from "@/lib/studio/archetypes";
import { boardSwatch, shutterSwatch } from "@/lib/studio/estimator/swatches";
import type { WardrobeEstimateInput } from "@/lib/studio/estimator/types";

/**
 * The wardrobe as a proportioned drawing.
 *
 * This is NOT the dimensioned elevation from the visual designer — no witness
 * lines, no hotspots, nothing selectable. It is here to answer one question at
 * a glance: what shape is the thing I am pricing, and what colour are the
 * boards I just picked. Making the summary render the CAD-grade elevation
 * would be heavier and, at this size, less readable.
 *
 * The two things that could drift from the designer are the compartment count
 * and the door type, so both are read from the same wardrobe archetype the
 * designer builds its layout from rather than being written down again.
 */

const ARCHETYPE = ARCHETYPES.wardrobe;

export function WardrobeSilhouette({
  input,
  className = "",
}: {
  input: WardrobeEstimateInput;
  className?: string;
}) {
  const doors = ARCHETYPE.defaultSections;
  const carcass = boardSwatch(input.carcassMaterialId);
  const isAlu = input.shutterSystem === "aluminium-glass";
  const shutter = shutterSwatch(input.shutterCoreId);

  // Drawing space is feet × 100, so the SVG is always at true proportion and
  // an 8′ × 10′ wardrobe visibly grows against an 8′ × 6′ one.
  const w = input.widthFt * 100;
  const h = input.heightFt * 100;
  const pad = 34;
  const plinth = 14;

  const doorW = w / doors;
  const gap = 3;

  return (
    <figure className={className}>
      <div
        className="flex items-center justify-center rounded-[3px] border p-5"
        style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}
      >
        <svg
          viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2 + plinth}`}
          className="h-auto w-full"
          style={{ maxHeight: 340 }}
          role="img"
          aria-label={`${input.widthFt} foot by ${input.heightFt} foot wardrobe with ${doors} shutters`}
        >
          <defs>
            <linearGradient id="ws-carcass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={carcass.from} />
              <stop offset="100%" stopColor={carcass.to} />
            </linearGradient>
            <linearGradient id="ws-shutter" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor={isAlu ? "#e8edf1" : shutter.from} />
              <stop offset="100%" stopColor={isAlu ? "#c6d2da" : shutter.to} />
            </linearGradient>
          </defs>

          {/* Carcass, visible as a reveal around and between the shutters. */}
          <rect x={0} y={0} width={w} height={h} fill="url(#ws-carcass)" />

          {Array.from({ length: doors }, (_, i) => {
            const x = i * doorW + gap;
            const dw = doorW - gap * 2;
            // An even number of doors meets in the middle, so the right half
            // mirrors. An odd number is hung the same way throughout — putting
            // the last handle on its left edge would sit it on top of the one
            // beside it.
            const opensLeft = doors % 2 === 0 && i >= doors / 2;
            const handleX = opensLeft ? x + gap * 2 : x + dw - gap * 2;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={gap}
                  width={dw}
                  height={h - gap * 2}
                  fill="url(#ws-shutter)"
                  stroke={isAlu ? "#7f8c96" : "rgba(0,0,0,0.16)"}
                  strokeWidth={isAlu ? 6 : 1.5}
                  opacity={isAlu ? 0.85 : 1}
                />
                {/* Handle — a vertical bar, on the opening edge. */}
                <rect
                  x={handleX - 3}
                  y={h * 0.44}
                  width={6}
                  height={h * 0.14}
                  rx={3}
                  fill="#8d9299"
                />
              </g>
            );
          })}

          {/* Plinth — the wardrobe stands on it, and it is why the box never
              touches a wet floor. */}
          <rect x={w * 0.02} y={h} width={w * 0.96} height={plinth} fill={carcass.to} opacity={0.55} />

          {/* Floor line, to seat the drawing. */}
          <line
            x1={-pad * 0.5}
            y1={h + plinth}
            x2={w + pad * 0.5}
            y2={h + plinth}
            stroke="var(--studio-line-strong)"
            strokeWidth={2}
          />

          {/* Dimensions, as plain text rather than an architect's string. */}
          <text
            x={w / 2}
            y={-pad * 0.35}
            textAnchor="middle"
            fontSize={Math.max(30, w * 0.045)}
            fill="var(--ink-faint)"
          >
            {input.widthFt}′
          </text>
          {/* Upright, not rotated. A sideways numeral is an architect's
              convention; at this size it just reads as a smudge. */}
          <text
            x={w + pad * 0.5}
            y={h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(30, w * 0.045)}
            fill="var(--ink-faint)"
          >
            {input.heightFt}′
          </text>
        </svg>
      </div>
      <figcaption className="mt-2 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
        Drawn to your proportions with the boards you picked. Shutter splits and internal layout are set in the full
        designer.
      </figcaption>
    </figure>
  );
}
