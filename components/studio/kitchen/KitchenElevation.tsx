"use client";

import { useMemo } from "react";
import { getCabinetType } from "@/lib/studio/kitchen/cabinets";
import { placements } from "@/lib/studio/kitchen/geometry";
import { K, WALL_LABEL, type KitchenProject, type WallId } from "@/lib/studio/kitchen/types";
import { formatLength, type LengthUnit } from "@/lib/studio/units";

/**
 * Elevation of one wall.
 *
 * This is the drawing an installer actually works from: heights, cabinet
 * widths and where the counter sits. Generated from the same placements as the
 * plan and the 3D, so a cabinet resized anywhere shows up here at true width.
 */

const INK = "var(--ink)";
const FAINT = "var(--ink-faint)";
const LINE = "var(--studio-line-strong)";

export function KitchenElevation({
  project,
  wall,
  unit,
  selectedId,
  onSelect,
}: {
  project: KitchenProject;
  wall: WallId;
  unit: LengthUnit;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const all = useMemo(() => placements(project), [project]);
  const onWall = all.filter((p) => p.wall === wall);
  const wallLen = wall === "N" || wall === "S" ? project.room.widthMm : project.room.depthMm;
  const ceil = project.room.ceilingMm;

  const marginL = 420;
  const marginR = 260;
  const marginT = 220;
  const marginB = 420;
  const totalW = wallLen + marginL + marginR;
  const totalH = ceil + marginT + marginB;

  const X = (v: number) => marginL + v;
  const Y = (v: number) => marginT + ceil - v;

  const hair = Math.max(4, wallLen / 800);
  const font = Math.max(64, wallLen / 34);
  const fontS = font * 0.78;

  const openings = project.room.openings.filter((o) => o.wall === wall);

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="h-full w-full" role="img" aria-label={`${WALL_LABEL[wall]} elevation`}>
      {/* floor and ceiling */}
      <line x1={X(-120)} y1={Y(0)} x2={X(wallLen + 120)} y2={Y(0)} stroke={INK} strokeWidth={hair * 1.6} />
      <line x1={X(-120)} y1={Y(ceil)} x2={X(wallLen + 120)} y2={Y(ceil)} stroke={LINE} strokeWidth={hair} strokeDasharray={`${hair * 6} ${hair * 4}`} />

      {/* openings on this wall */}
      {openings.map((o) => (
        <g key={o.id}>
          <rect
            x={X(o.offsetMm)}
            y={Y(o.sillMm + o.heightMm)}
            width={o.widthMm}
            height={o.heightMm}
            fill="color-mix(in srgb, var(--service-water) 8%, var(--paper))"
            stroke={o.kind === "door" ? "var(--burgundy)" : "var(--service-water)"}
            strokeWidth={hair * 1.3}
          />
          <text x={X(o.offsetMm + o.widthMm / 2)} y={Y(o.sillMm + o.heightMm / 2)} textAnchor="middle" fontSize={fontS * 0.85} fill="var(--service-water-ink)" className="metric">
            {o.kind === "door" ? "Door" : "Window"}
          </text>
        </g>
      ))}

      {/* cabinets */}
      {onWall.map((p) => {
        const type = getCabinetType(p.cabinet.typeId);
        const bottom = p.tier === "wall" ? K.wallSillMm : K.plinthMm;
        const sel = p.cabinet.id === selectedId;
        const drawers = p.cabinet.internals.filter((i) => i.kind === "drawer").length;
        return (
          <g key={p.cabinet.id} className="cursor-pointer" onClick={() => onSelect(sel ? null : p.cabinet.id)}>
            <rect
              x={X(p.alongMm)}
              y={Y(bottom + type.heightMm)}
              width={p.cabinet.widthMm}
              height={type.heightMm}
              fill={sel ? "color-mix(in srgb, var(--burgundy) 12%, var(--paper))" : "var(--paper)"}
              stroke={sel ? "var(--burgundy)" : INK}
              strokeWidth={sel ? hair * 2 : hair}
            />
            {/* Drawer fronts, or shutter divisions — what the front looks like. */}
            {drawers > 0
              ? Array.from({ length: drawers }).map((_, i) => (
                  <line
                    key={i}
                    x1={X(p.alongMm)}
                    y1={Y(bottom + (type.heightMm / drawers) * (i + 1))}
                    x2={X(p.alongMm + p.cabinet.widthMm)}
                    y2={Y(bottom + (type.heightMm / drawers) * (i + 1))}
                    stroke={FAINT}
                    strokeWidth={hair * 0.8}
                  />
                ))
              : Array.from({ length: Math.max(0, type.shutters - 1) }).map((_, i) => (
                  <line
                    key={i}
                    x1={X(p.alongMm + (p.cabinet.widthMm / type.shutters) * (i + 1))}
                    y1={Y(bottom + type.heightMm)}
                    x2={X(p.alongMm + (p.cabinet.widthMm / type.shutters) * (i + 1))}
                    y2={Y(bottom)}
                    stroke={FAINT}
                    strokeWidth={hair * 0.8}
                  />
                ))}
            <text
              x={X(p.alongMm + p.cabinet.widthMm / 2)}
              y={Y(bottom + type.heightMm / 2)}
              textAnchor="middle"
              fontSize={fontS * 0.82}
              fill={sel ? "var(--burgundy)" : FAINT}
              className="metric"
            >
              {Math.round(p.cabinet.widthMm)}
            </text>
          </g>
        );
      })}

      {/* plinth line and countertop band */}
      {onWall.some((p) => p.tier === "base") ? (
        <rect
          x={X(0)}
          y={Y(K.counterTopMm)}
          width={wallLen}
          height={project.countertop.thicknessMm}
          fill="var(--ink)"
          opacity={0.75}
        />
      ) : null}

      {/* key heights — the numbers an installer sets out from */}
      <HeightMark y={Y(K.counterTopMm)} x={X(wallLen) + 60} label={formatLength(K.counterTopMm, unit)} note="Counter" hair={hair} font={fontS} />
      <HeightMark y={Y(K.wallSillMm)} x={X(wallLen) + 60} label={formatLength(K.wallSillMm, unit)} note="Wall units" hair={hair} font={fontS} />
      <HeightMark y={Y(ceil)} x={X(wallLen) + 60} label={formatLength(ceil, unit)} note="Ceiling" hair={hair} font={fontS} />

      {/* overall width */}
      <g>
        <line x1={X(0)} y1={Y(0) + 260} x2={X(wallLen)} y2={Y(0) + 260} stroke={INK} strokeWidth={hair} />
        <rect x={X(wallLen / 2) - font * 3} y={Y(0) + 260 - font * 0.7} width={font * 6} height={font * 1.4} fill="var(--paper)" />
        <text x={X(wallLen / 2)} y={Y(0) + 260 + font * 0.34} textAnchor="middle" fontSize={font} fill={INK} className="metric">
          {formatLength(wallLen, unit)}
        </text>
      </g>

      <text x={X(0)} y={Y(ceil) - 80} fontSize={fontS * 0.8} fill={FAINT} letterSpacing={fontS * 0.11}>
        {WALL_LABEL[wall].toUpperCase()} — ELEVATION
      </text>
    </svg>
  );
}

function HeightMark({ y, x, label, note, hair, font }: { y: number; x: number; label: string; note: string; hair: number; font: number }) {
  return (
    <g>
      <line x1={x - 90} y1={y} x2={x + 30} y2={y} stroke={LINE} strokeWidth={hair * 0.8} strokeDasharray={`${hair * 3} ${hair * 2}`} />
      <text x={x + 45} y={y - font * 0.15} fontSize={font * 0.8} fill={INK} className="metric">
        {label}
      </text>
      <text x={x + 45} y={y + font * 0.75} fontSize={font * 0.7} fill={FAINT}>
        {note}
      </text>
    </g>
  );
}
