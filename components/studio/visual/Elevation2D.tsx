"use client";

import { useMemo } from "react";
import type { FurnitureLayout, Metrics, Panel } from "@/lib/studio/geometry";
import { buildPanels, compartmentName } from "@/lib/studio/geometry";
import { buildHotspots, type SpecIds } from "@/lib/studio/partMaterials";
import { formatLength, speakLength, type LengthUnit } from "@/lib/studio/units";

/**
 * The front elevation, drawn from the same panel list the 3D scene uses.
 *
 * It reads as an architect's elevation — witness lines, arrowed dimension
 * strings, a thin side view — but everything on it is generated from the
 * millimetre model, so a dimension label can never disagree with the drawing.
 * Compartments are buttons, because selecting one here is the primary way into
 * the layout editor on desktop.
 */

const INK = "var(--ink)";
const FAINT = "var(--ink-faint)";
const LINE = "var(--studio-line-strong)";

export function Elevation2D({
  metrics,
  layout,
  selectedSectionId,
  onSelectSection,
  selectedFittingId,
  unit,
  spec,
  showMaterials,
  openHotspot,
  onToggleHotspot,
}: {
  metrics: Metrics;
  layout: FurnitureLayout;
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  selectedFittingId: string | null;
  /** Which unit every dimension string on the drawing is written in. */
  unit: LengthUnit;
  /** The chosen materials, for the callouts. */
  spec: SpecIds;
  showMaterials: boolean;
  openHotspot: string | null;
  onToggleHotspot: (id: string) => void;
}) {
  const panels = useMemo(() => buildPanels(metrics, layout), [metrics, layout]);
  const { dims } = metrics;

  // Drawing space is millimetres; the SVG viewBox does the scaling, so nothing
  // here needs a pixels-per-mm constant. Margins leave room for the dimension
  // strings outside the object.
  const marginL = 300;
  const marginT = 180;
  const marginB = 300;
  const sideGap = 260;
  const sideW = dims.depthMm;
  const marginR = 200;

  const totalW = dims.widthMm + marginL + marginR + sideGap + sideW;
  const totalH = dims.heightMm + marginT + marginB;

  // SVG y grows downward; the model's y grows upward from the floor.
  const flip = (y: number) => marginT + dims.heightMm - y;
  const x0 = marginL;
  const toX = (x: number) => x0 + dims.widthMm / 2 + x;

  // Line weights are specified in mm of drawing space so they stay visually
  // constant as the furniture scales — a 20 ft run and a 3 ft vanity get the
  // same apparent hairline.
  const hair = Math.max(3, dims.widthMm / 900);
  const heavy = hair * 2.1;
  const fontS = Math.max(52, dims.widthMm / 34);
  const fontXS = fontS * 0.82;

  // Same anchors the 3D pins use, so both views point at the same panels.
  const hotspots = useMemo(
    () => (showMaterials ? buildHotspots(panels, spec) : []),
    [showMaterials, panels, spec]
  );

  const front = panels.filter((p) => p.role !== "back" && p.role !== "loft-shutter");
  const shutters = front.filter((p) => p.role === "shutter");
  const showInternals = layout.doors.type === "open" || true; // internals always drawn in 2D

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="h-full w-full"
      role="img"
      aria-label={`Front elevation, ${speakLength(dims.widthMm, unit)} wide by ${speakLength(
        dims.heightMm,
        unit
      )} high, ${layout.sections.length} compartments`}
    >
      {/* ---------------------------------------------------- floor line -- */}
      <line
        x1={x0 - 160}
        y1={flip(0)}
        x2={toX(dims.widthMm / 2) + 120}
        y2={flip(0)}
        stroke={LINE}
        strokeWidth={hair}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const sx = x0 - 150 + (i * (dims.widthMm + 260)) / 13;
        return (
          <line
            key={i}
            x1={sx}
            y1={flip(0)}
            x2={sx - 45}
            y2={flip(0) + 45}
            stroke={LINE}
            strokeWidth={hair * 0.7}
            opacity={0.5}
          />
        );
      })}

      {/* --------------------------------------------- loft, if enabled --- */}
      {metrics.loftMm > 0 ? (
        <g>
          <rect
            x={toX(-dims.widthMm / 2)}
            y={flip(dims.heightMm)}
            width={dims.widthMm}
            height={metrics.loftMm}
            fill="var(--stone-deep)"
            stroke={INK}
            strokeWidth={heavy}
          />
          <text
            x={toX(0)}
            y={flip(metrics.carcassTopY + metrics.loftMm / 2) + fontXS * 0.36}
            textAnchor="middle"
            fontSize={fontXS}
            fill={FAINT}
            letterSpacing={fontXS * 0.1}
          >
            LOFT
          </text>
        </g>
      ) : null}

      {/* ------------------------------------------------- carcass shell -- */}
      <rect
        x={toX(-dims.widthMm / 2)}
        y={flip(metrics.carcassTopY)}
        width={dims.widthMm}
        height={metrics.carcassHeight}
        fill="var(--paper)"
        stroke={INK}
        strokeWidth={heavy}
      />
      {metrics.archetype.plinthMm > 0 ? (
        <rect
          x={toX(-dims.widthMm / 2) + metrics.archetype.panelMm}
          y={flip(metrics.archetype.plinthMm)}
          width={dims.widthMm - metrics.archetype.panelMm * 2}
          height={metrics.archetype.plinthMm}
          fill="var(--stone-deep)"
          stroke={INK}
          strokeWidth={hair}
        />
      ) : null}

      {/* ------------------------------------------- compartment hit area - */}
      {metrics.sections.map((m, i) => {
        const selected = m.id === selectedSectionId;
        return (
          <g key={m.id}>
            <rect
              x={toX(m.xStart)}
              y={flip(metrics.innerTopY)}
              width={m.widthMm}
              height={metrics.innerHeight}
              fill={selected ? "color-mix(in srgb, var(--burgundy) 9%, transparent)" : "transparent"}
              stroke={selected ? "var(--burgundy)" : "transparent"}
              strokeWidth={heavy}
            />
            <rect
              x={toX(m.xStart)}
              y={flip(metrics.innerTopY)}
              width={m.widthMm}
              height={metrics.innerHeight}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onSelectSection(m.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSection(m.id);
                }
              }}
              aria-label={`Select ${compartmentName(i, metrics.sections.length)}, ${speakLength(m.widthMm, unit)} wide`}
            />
          </g>
        );
      })}

      {/* ------------------------------------------------------ fittings -- */}
      {showInternals
        ? front
            .filter((p) => ["partition", "shelf", "drawer", "rail", "accessory"].includes(p.role))
            .map((p) => (
              <FittingMark
                key={p.id}
                panel={p}
                toX={toX}
                flip={flip}
                hair={hair}
                selected={p.fittingId != null && p.fittingId === selectedFittingId}
              />
            ))
        : null}

      {/* ------------------------------------------------------ shutters -- */}
      {shutters.map((p) => {
        const w = p.size[0];
        const h = p.size[1];
        const cx = toX(p.center[0]);
        const cy = flip(p.center[1]);
        return (
          <g key={p.id} opacity={0.5}>
            <rect
              x={cx - w / 2}
              y={cy - h / 2}
              width={w}
              height={h}
              fill="none"
              stroke="var(--burgundy)"
              strokeWidth={hair}
              strokeDasharray={`${hair * 6} ${hair * 4}`}
            />
            {/* Handle position — the one detail that makes a rectangle read as
                a door rather than as a panel. */}
            <circle cx={cx + w * 0.36} cy={cy} r={hair * 3} fill="var(--burgundy)" />
          </g>
        );
      })}

      {/* --------------------------------------------------- dimensions --- */}
      {/* Compartment widths get their own string under the object. Written
          inside the openings they collided with whatever was fitted there. */}
      {metrics.sections.length > 1
        ? metrics.sections.map((m) => (
            <DimensionH
              key={`dim-${m.id}`}
              x1={toX(m.xStart)}
              x2={toX(m.xEnd)}
              y={flip(0) + 92}
              label={formatLength(m.widthMm, unit)}
              hair={hair}
              fontSize={fontXS}
              tone={m.id === selectedSectionId ? "accent" : "muted"}
            />
          ))
        : null}
      <DimensionH
        x1={toX(-dims.widthMm / 2)}
        x2={toX(dims.widthMm / 2)}
        y={flip(0) + 200}
        label={formatLength(dims.widthMm, unit)}
        hair={hair}
        fontSize={fontS}
      />
      <DimensionV
        y1={flip(dims.heightMm)}
        y2={flip(0)}
        x={x0 - 190}
        label={formatLength(dims.heightMm, unit)}
        hair={hair}
        fontSize={fontS}
      />
      {metrics.loftMm > 0 ? (
        <>
          <DimensionV
            y1={flip(dims.heightMm)}
            y2={flip(metrics.carcassTopY)}
            x={toX(dims.widthMm / 2) + 110}
            label={formatLength(metrics.loftMm, unit)}
            hair={hair}
            fontSize={fontXS}
            side="right"
          />
          <DimensionV
            y1={flip(metrics.carcassTopY)}
            y2={flip(0)}
            x={toX(dims.widthMm / 2) + 110}
            label={formatLength(metrics.carcassTopY, unit)}
            hair={hair}
            fontSize={fontXS}
            side="right"
          />
        </>
      ) : null}

      {/* ------------------------------------------------- side elevation - */}
      <g>
        <rect
          x={toX(dims.widthMm / 2) + sideGap}
          y={flip(dims.heightMm)}
          width={sideW}
          height={dims.heightMm}
          fill="var(--paper)"
          stroke={INK}
          strokeWidth={hair * 1.4}
        />
        <rect
          x={toX(dims.widthMm / 2) + sideGap}
          y={flip(metrics.carcassTopY)}
          width={sideW * 0.1}
          height={metrics.carcassHeight}
          fill="var(--stone-deep)"
          stroke="none"
        />
        <DimensionH
          x1={toX(dims.widthMm / 2) + sideGap}
          x2={toX(dims.widthMm / 2) + sideGap + sideW}
          y={flip(0) + 200}
          label={formatLength(dims.depthMm, unit)}
          hair={hair}
          fontSize={fontXS}
        />
        <text
          x={toX(dims.widthMm / 2) + sideGap + sideW / 2}
          y={flip(dims.heightMm) - 70}
          textAnchor="middle"
          fontSize={fontXS * 0.9}
          fill={FAINT}
          letterSpacing={fontXS * 0.11}
        >
          SIDE
        </text>
      </g>

      <text
        x={x0}
        y={flip(dims.heightMm) - 70}
        fontSize={fontXS * 0.9}
        fill={FAINT}
        letterSpacing={fontXS * 0.11}
      >
        FRONT ELEVATION
      </text>

      {/* ------------------------------------------------- material notes -- */}
      {/* Numbered balloons, keyed to the list under the drawing. Putting the
          text in the margin instead cost nearly half the object's size on
          screen, and a drawing that is too small to read is a worse annotation
          than no annotation. */}
      {hotspots.map((h, i) => {
        const open = openHotspot === h.id;
        const ax = toX(h.at[0]);
        const ay = flip(h.at[1]);
        const r = fontXS * 0.86;
        return (
          <g
            key={h.id}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label={`${h.material.role}: ${h.material.brand} ${h.material.material}`}
            className="cursor-pointer"
            onClick={() => onToggleHotspot(h.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleHotspot(h.id);
              }
            }}
          >
            {/* A short stalk lifts the balloon off the panel it marks, so the
                number is never sitting on top of a shelf line. */}
            <line
              x1={ax}
              y1={ay}
              x2={ax}
              y2={ay - r * 2.6}
              stroke={open ? "var(--burgundy)" : LINE}
              strokeWidth={hair}
            />
            <circle
              cx={ax}
              cy={ay - r * 3.5}
              r={r}
              fill={open ? "var(--burgundy)" : "var(--paper)"}
              stroke={open ? "var(--burgundy)" : INK}
              strokeWidth={hair * 1.3}
            />
            <text
              x={ax}
              y={ay - r * 3.5 + r * 0.38}
              textAnchor="middle"
              fontSize={r * 1.1}
              fill={open ? "#fff" : INK}
              fontWeight={600}
              className="metric"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** One internal component, drawn in the elevation. */
function FittingMark({
  panel,
  toX,
  flip,
  hair,
  selected,
}: {
  panel: Panel;
  toX: (x: number) => number;
  flip: (y: number) => number;
  hair: number;
  selected: boolean;
}) {
  const w = panel.size[0];
  const h = panel.size[1];
  const cx = toX(panel.center[0]);
  const cy = flip(panel.center[1]);
  const stroke = selected ? "var(--burgundy)" : INK;
  const weight = selected ? hair * 2.4 : hair;

  if (panel.role === "rail") {
    // A rail reads as a rail because of what hangs off it, not its own outline.
    return (
      <g>
        <line x1={cx - w / 2} y1={cy} x2={cx + w / 2} y2={cy} stroke={stroke} strokeWidth={weight * 1.6} />
        {[-0.22, 0, 0.22].map((f) => (
          <path
            key={f}
            d={`M ${cx + w * f} ${cy} v ${h * 3.2} m ${-w * 0.07} 0 h ${w * 0.14}`}
            stroke={stroke}
            strokeWidth={weight * 0.8}
            fill="none"
            opacity={0.55}
          />
        ))}
      </g>
    );
  }

  if (panel.role === "drawer") {
    return (
      <g>
        <rect
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          fill={selected ? "color-mix(in srgb, var(--burgundy) 10%, transparent)" : "var(--stone-deep)"}
          stroke={stroke}
          strokeWidth={weight}
        />
        <line
          x1={cx - w * 0.16}
          y1={cy}
          x2={cx + w * 0.16}
          y2={cy}
          stroke={stroke}
          strokeWidth={weight * 1.5}
          opacity={0.7}
        />
      </g>
    );
  }

  if (panel.role === "accessory") {
    return (
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        fill="none"
        stroke={stroke}
        strokeWidth={weight}
        strokeDasharray={`${hair * 4} ${hair * 3}`}
      />
    );
  }

  // Shelves and partitions are simply the board, filled.
  return (
    <rect
      x={cx - w / 2}
      y={cy - h / 2}
      width={w}
      height={h}
      fill={selected ? "var(--burgundy)" : INK}
      stroke="none"
      opacity={panel.role === "partition" ? 0.85 : 1}
    />
  );
}

/** Horizontal dimension string with witness lines and arrow ticks. */
function DimensionH({
  x1,
  x2,
  y,
  label,
  hair,
  fontSize,
  tone = "ink",
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  hair: number;
  fontSize: number;
  tone?: "ink" | "muted" | "accent";
}) {
  const tick = fontSize * 0.34;
  const stroke = tone === "accent" ? "var(--burgundy)" : tone === "muted" ? FAINT : INK;
  return (
    <g>
      <line x1={x1} y1={y - tick * 2.2} x2={x1} y2={y + tick} stroke={LINE} strokeWidth={hair * 0.8} />
      <line x1={x2} y1={y - tick * 2.2} x2={x2} y2={y + tick} stroke={LINE} strokeWidth={hair * 0.8} />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={hair} />
      <path d={`M ${x1} ${y} l ${tick} ${-tick * 0.5} v ${tick} z`} fill={stroke} />
      <path d={`M ${x2} ${y} l ${-tick} ${-tick * 0.5} v ${tick} z`} fill={stroke} />
      <rect
        x={(x1 + x2) / 2 - fontSize * label.length * 0.3}
        y={y - fontSize * 0.72}
        width={fontSize * label.length * 0.6}
        height={fontSize * 1.4}
        fill="var(--paper)"
      />
      <text
        x={(x1 + x2) / 2}
        y={y + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fill={stroke}
        className="metric"
      >
        {label}
      </text>
    </g>
  );
}

/** Vertical dimension string. The label stays upright — rotated numerals in a
 *  consumer tool cost more in legibility than they buy in drawing convention. */
function DimensionV({
  y1,
  y2,
  x,
  label,
  hair,
  fontSize,
  side = "left",
}: {
  y1: number;
  y2: number;
  x: number;
  label: string;
  hair: number;
  fontSize: number;
  side?: "left" | "right";
}) {
  const tick = fontSize * 0.34;
  const dir = side === "left" ? 1 : -1;
  return (
    <g>
      <line x1={x} y1={y1} x2={x + tick * 2.2 * dir} y2={y1} stroke={LINE} strokeWidth={hair * 0.8} />
      <line x1={x} y1={y2} x2={x + tick * 2.2 * dir} y2={y2} stroke={LINE} strokeWidth={hair * 0.8} />
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={INK} strokeWidth={hair} />
      <path d={`M ${x} ${y1} l ${-tick * 0.5} ${tick} h ${tick} z`} fill={INK} />
      <path d={`M ${x} ${y2} l ${-tick * 0.5} ${-tick} h ${tick} z`} fill={INK} />
      <rect
        x={x - fontSize * label.length * 0.3}
        y={(y1 + y2) / 2 - fontSize * 0.72}
        width={fontSize * label.length * 0.6}
        height={fontSize * 1.4}
        fill="var(--paper)"
      />
      <text
        x={x}
        y={(y1 + y2) / 2 + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fill={INK}
        className="metric"
      >
        {label}
      </text>
    </g>
  );
}
