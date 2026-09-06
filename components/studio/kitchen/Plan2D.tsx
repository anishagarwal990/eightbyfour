"use client";

import { useMemo } from "react";
import { getCabinetType } from "@/lib/studio/kitchen/cabinets";
import { placements, wallFrame } from "@/lib/studio/kitchen/geometry";
import { WALL_LABEL, type KitchenProject } from "@/lib/studio/kitchen/types";
import type { ServicePoint } from "@/lib/studio/kitchen/validate";
import { formatLength, type LengthUnit } from "@/lib/studio/units";

/**
 * The plan.
 *
 * Drawn from the same placements the 3D scene uses, at true scale in
 * millimetres — the SVG viewBox does the scaling, so a 900 mm sink cabinet is
 * exactly one and a half times a 600 mm one on screen. Cabinets are clickable
 * because selecting a unit here is the fastest way into its configuration.
 */

const INK = "var(--ink)";
const FAINT = "var(--ink-faint)";
const LINE = "var(--studio-line-strong)";

export function Plan2D({
  project,
  unit,
  selectedId,
  onSelect,
  services,
  serviceFilter,
}: {
  project: KitchenProject;
  unit: LengthUnit;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Shown only in the services views. */
  services?: ServicePoint[];
  serviceFilter?: "power" | "plumbing";
}) {
  const { room } = project;
  const places = useMemo(() => placements(project), [project]);

  const margin = 700;
  const totalW = room.widthMm + margin * 2;
  const totalH = room.depthMm + margin * 2;
  const X = (x: number) => margin + x;
  const Z = (z: number) => margin + z;

  const hair = Math.max(4, room.widthMm / 700);
  const font = Math.max(70, room.widthMm / 32);
  const fontS = font * 0.78;

  const wallThickness = 115;

  // Wall cabinets drawn as a dashed outline over the base run — the plan
  // convention for something above the cutting plane.
  const base = places.filter((p) => p.tier !== "wall");
  const above = places.filter((p) => p.tier === "wall");

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="h-full w-full" role="img" aria-label="Kitchen plan">
      {/* ------------------------------------------------------------ walls */}
      <rect
        x={X(0) - wallThickness}
        y={Z(0) - wallThickness}
        width={room.widthMm + wallThickness * 2}
        height={room.depthMm + wallThickness * 2}
        fill="var(--stone-deep)"
        stroke={INK}
        strokeWidth={hair}
      />
      <rect x={X(0)} y={Z(0)} width={room.widthMm} height={room.depthMm} fill="var(--paper)" stroke={INK} strokeWidth={hair} />

      {/* --------------------------------------------------------- openings */}
      {room.openings.map((o) => {
        const f = wallFrame(o.wall, room);
        const x1 = f.origin[0] + f.dir[0] * o.offsetMm;
        const z1 = f.origin[1] + f.dir[1] * o.offsetMm;
        const x2 = f.origin[0] + f.dir[0] * (o.offsetMm + o.widthMm);
        const z2 = f.origin[1] + f.dir[1] * (o.offsetMm + o.widthMm);
        const isDoor = o.kind === "door";
        return (
          <g key={o.id}>
            {/* White out the wall, then draw the leaf or the glazing line. */}
            <line
              x1={X(x1)}
              y1={Z(z1)}
              x2={X(x2)}
              y2={Z(z2)}
              stroke="var(--paper)"
              strokeWidth={wallThickness * 2}
              strokeLinecap="butt"
            />
            <line
              x1={X(x1)}
              y1={Z(z1)}
              x2={X(x2)}
              y2={Z(z2)}
              stroke={isDoor ? "var(--burgundy)" : "var(--service-water)"}
              strokeWidth={hair * 1.6}
              strokeDasharray={isDoor ? undefined : `${hair * 5} ${hair * 3}`}
            />
            <text
              x={X((x1 + x2) / 2)}
              y={Z((z1 + z2) / 2) + (o.wall === "N" ? -fontS * 0.8 : o.wall === "S" ? fontS * 1.6 : 0)}
              textAnchor="middle"
              fontSize={fontS * 0.85}
              fill={isDoor ? "var(--burgundy)" : "var(--service-water)"}
              className="metric"
            >
              {o.kind === "door" ? "Door" : o.kind === "window" ? "Window" : o.kind} {formatLength(o.widthMm, unit)}
            </text>
          </g>
        );
      })}

      {/* --------------------------------------------------- base + tall run */}
      {base.map((p) => {
        const isX = p.wall === "N" || p.wall === "S";
        const w = isX ? p.size[0] : p.size[2];
        const d = isX ? p.size[2] : p.size[0];
        const type = getCabinetType(p.cabinet.typeId);
        const sel = p.cabinet.id === selectedId;
        const isTall = p.tier === "tall";
        return (
          <g key={p.cabinet.id} className="cursor-pointer" onClick={() => onSelect(sel ? null : p.cabinet.id)}>
            <rect
              x={X(p.center[0]) - w / 2}
              y={Z(p.center[2]) - d / 2}
              width={w}
              height={d}
              fill={
                sel
                  ? "color-mix(in srgb, var(--burgundy) 18%, var(--paper))"
                  : isTall
                    ? "var(--stone-deep)"
                    : "var(--paper)"
              }
              stroke={sel ? "var(--burgundy)" : INK}
              strokeWidth={sel ? hair * 2 : hair}
            />
            {/* Door swing arc, so the plan shows how the unit opens. */}
            {type.shutters > 0 && !isTall ? (
              <path
                d={swingPath(X(p.center[0]), Z(p.center[2]), w, d, p.wall)}
                fill="none"
                stroke={LINE}
                strokeWidth={hair * 0.6}
                opacity={0.55}
              />
            ) : null}
            <text
              x={X(p.center[0])}
              y={Z(p.center[2]) + fontS * 0.32}
              textAnchor="middle"
              fontSize={fontS * 0.8}
              fill={sel ? "var(--burgundy)" : FAINT}
              className="metric"
            >
              {Math.round(p.cabinet.widthMm)}
            </text>
          </g>
        );
      })}

      {/* ------------------------------------------- wall units, dashed over */}
      {above.map((p) => {
        const isX = p.wall === "N" || p.wall === "S";
        const w = isX ? p.size[0] : p.size[2];
        const d = isX ? p.size[2] : p.size[0];
        const sel = p.cabinet.id === selectedId;
        return (
          <rect
            key={p.cabinet.id}
            x={X(p.center[0]) - w / 2}
            y={Z(p.center[2]) - d / 2}
            width={w}
            height={d}
            fill="none"
            stroke={sel ? "var(--burgundy)" : FAINT}
            strokeWidth={sel ? hair * 1.6 : hair * 0.9}
            strokeDasharray={`${hair * 4} ${hair * 3}`}
            className="cursor-pointer"
            onClick={() => onSelect(sel ? null : p.cabinet.id)}
          />
        );
      })}

      {/* ----------------------------------------------- sink and hob marks */}
      {places.map((p) => {
        const role = getCabinetType(p.cabinet.typeId).role;
        if (role !== "sink" && role !== "hob") return null;
        const isX = p.wall === "N" || p.wall === "S";
        const w = (isX ? p.size[0] : p.size[2]) * 0.62;
        const d = (isX ? p.size[2] : p.size[0]) * 0.6;
        const cx = X(p.center[0]);
        const cy = Z(p.center[2]);
        return (
          <g key={`${p.cabinet.id}-mark`} pointerEvents="none">
            <rect
              x={cx - w / 2}
              y={cy - d / 2}
              width={w}
              height={d}
              rx={role === "sink" ? hair * 3 : hair}
              fill="none"
              stroke="var(--burgundy)"
              strokeWidth={hair * 1.1}
            />
            {role === "hob"
              ? [
                  [-0.22, -0.2],
                  [0.22, -0.2],
                  [-0.22, 0.2],
                  [0.22, 0.2],
                ].map(([fx, fy], i) => (
                  <circle key={i} cx={cx + w * fx} cy={cy + d * fy} r={Math.min(w, d) * 0.13} fill="none" stroke="var(--burgundy)" strokeWidth={hair * 0.8} />
                ))
              : (
                  <circle cx={cx} cy={cy} r={Math.min(w, d) * 0.22} fill="none" stroke="var(--burgundy)" strokeWidth={hair * 0.8} />
                )}
          </g>
        );
      })}

      {/* ---------------------------------------------------- service points */}
      {services
        ?.filter((s) => (serviceFilter === "power" ? s.kind === "power" : s.kind !== "power"))
        .map((s) => (
          <g key={s.id} pointerEvents="none">
            <circle cx={X(s.at[0])} cy={Z(s.at[2])} r={font * 0.34} fill="var(--paper)" stroke={s.kind === "power" ? "var(--service-power)" : "var(--service-water)"} strokeWidth={hair * 1.4} />
            <text
              x={X(s.at[0])}
              y={Z(s.at[2]) + font * 0.13}
              textAnchor="middle"
              fontSize={font * 0.36}
              fill={s.kind === "power" ? "var(--service-power-ink)" : "var(--service-water-ink)"}
              fontWeight={700}
            >
              {s.kind === "power" ? "E" : s.kind === "gas" ? "G" : s.kind === "drain" ? "D" : "W"}
            </text>
          </g>
        ))}

      {/* -------------------------------------------------------- dimensions */}
      <DimH x1={X(0)} x2={X(room.widthMm)} y={Z(room.depthMm) + 380} label={formatLength(room.widthMm, unit)} hair={hair} font={font} />
      <DimV y1={Z(0)} y2={Z(room.depthMm)} x={X(0) - 380} label={formatLength(room.depthMm, unit)} hair={hair} font={font} />

      {/* Wall names, so "back wall" in the controls maps to something. */}
      {(["N", "S", "E", "W"] as const).map((w) => {
        const pos =
          w === "N"
            ? [X(room.widthMm / 2), Z(0) - 210]
            : w === "S"
              ? [X(room.widthMm / 2), Z(room.depthMm) + 260]
              : w === "E"
                ? [X(room.widthMm) + 250, Z(room.depthMm / 2)]
                : [X(0) - 250, Z(room.depthMm / 2)];
        return (
          <text
            key={w}
            x={pos[0]}
            y={pos[1]}
            textAnchor="middle"
            fontSize={fontS * 0.78}
            fill={FAINT}
            letterSpacing={fontS * 0.1}
          >
            {WALL_LABEL[w].toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

/** Quarter-circle showing which way a shutter opens into the room. */
function swingPath(cx: number, cy: number, w: number, d: number, wall: string): string {
  const r = Math.min(w, d) * 0.9;
  if (wall === "N") return `M ${cx - w / 2} ${cy + d / 2} a ${r} ${r} 0 0 0 ${r} ${r}`;
  if (wall === "S") return `M ${cx + w / 2} ${cy - d / 2} a ${r} ${r} 0 0 0 ${-r} ${-r}`;
  if (wall === "E") return `M ${cx - w / 2} ${cy - d / 2} a ${r} ${r} 0 0 1 ${-r} ${r}`;
  return `M ${cx + w / 2} ${cy + d / 2} a ${r} ${r} 0 0 1 ${r} ${-r}`;
}

function DimH({ x1, x2, y, label, hair, font }: { x1: number; x2: number; y: number; label: string; hair: number; font: number }) {
  const t = font * 0.3;
  return (
    <g>
      <line x1={x1} y1={y - t * 2} x2={x1} y2={y + t} stroke={LINE} strokeWidth={hair * 0.7} />
      <line x1={x2} y1={y - t * 2} x2={x2} y2={y + t} stroke={LINE} strokeWidth={hair * 0.7} />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={INK} strokeWidth={hair} />
      <path d={`M ${x1} ${y} l ${t} ${-t * 0.5} v ${t} z`} fill={INK} />
      <path d={`M ${x2} ${y} l ${-t} ${-t * 0.5} v ${t} z`} fill={INK} />
      <rect x={(x1 + x2) / 2 - font * label.length * 0.3} y={y - font * 0.7} width={font * label.length * 0.6} height={font * 1.4} fill="var(--paper)" />
      <text x={(x1 + x2) / 2} y={y + font * 0.34} textAnchor="middle" fontSize={font} fill={INK} className="metric">
        {label}
      </text>
    </g>
  );
}

function DimV({ y1, y2, x, label, hair, font }: { y1: number; y2: number; x: number; label: string; hair: number; font: number }) {
  const t = font * 0.3;
  return (
    <g>
      <line x1={x} y1={y1} x2={x + t * 2} y2={y1} stroke={LINE} strokeWidth={hair * 0.7} />
      <line x1={x} y1={y2} x2={x + t * 2} y2={y2} stroke={LINE} strokeWidth={hair * 0.7} />
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={INK} strokeWidth={hair} />
      <path d={`M ${x} ${y1} l ${-t * 0.5} ${t} h ${t} z`} fill={INK} />
      <path d={`M ${x} ${y2} l ${-t * 0.5} ${-t} h ${t} z`} fill={INK} />
      <rect x={x - font * label.length * 0.3} y={(y1 + y2) / 2 - font * 0.7} width={font * label.length * 0.6} height={font * 1.4} fill="var(--paper)" />
      <text x={x} y={(y1 + y2) / 2 + font * 0.34} textAnchor="middle" fontSize={font} fill={INK} className="metric">
        {label}
      </text>
    </g>
  );
}
