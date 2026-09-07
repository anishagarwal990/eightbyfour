"use client";

import Link from "next/link";
import { useState } from "react";
import { CARCASS_MATERIALS, type CarcassMaterial } from "@/lib/studio/estimator/config";

/**
 * The material ladder.
 *
 * The single most useful thing Studio can show someone who does not know what
 * BWR means. Every board we build with, cheapest first, with what it costs,
 * what it is for and — the part most sites leave out — what to watch for.
 *
 * Ordered by real rate, not by a hand-written ranking, so it stays honest when
 * the catalogue moves. No board is presented as "the good one": the right
 * board is the cheapest one that survives where it is going.
 */

const RUPEE_STEPS = 5;

function CostBar({ rate, max }: { rate: number; max: number }) {
  const filled = Math.max(1, Math.round((rate / max) * RUPEE_STEPS));
  return (
    <span className="flex items-center gap-[3px]" aria-label={`Approximately ₹${rate} per square foot`}>
      {Array.from({ length: RUPEE_STEPS }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="block h-3 w-[5px] rounded-[1px]"
          style={{ background: i < filled ? "var(--burgundy)" : "var(--studio-line)" }}
        />
      ))}
    </span>
  );
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </span>
      <span className="flex gap-[2px]" aria-label={`${label}: ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="block h-[6px] w-[6px] rounded-full"
            style={{ background: i < value ? "var(--ink-soft)" : "var(--studio-line)" }}
          />
        ))}
      </span>
    </div>
  );
}

export function MaterialLadder() {
  const [open, setOpen] = useState<string | null>(null);
  const sorted = [...CARCASS_MATERIALS].sort((a, b) => a.ratePerSqft - b.ratePerSqft);
  const max = sorted[sorted.length - 1].ratePerSqft;

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((m) => (
          <MaterialCard
            key={m.id}
            material={m}
            max={max}
            open={open === m.id}
            onToggle={() => setOpen(open === m.id ? null : m.id)}
          />
        ))}
      </div>
      <p className="mt-4 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        There is no single best board. A bedroom wardrobe that never sees water does not need boiling-waterproof
        plywood, and a sink cabinet should not be built from particle board. Studio prices whichever you choose, and
        shows you what the choice did.
      </p>
    </div>
  );
}

function MaterialCard({
  material: m,
  max,
  open,
  onToggle,
}: {
  material: CarcassMaterial;
  max: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-[3px] p-3.5 shadow-[var(--shadow-sm)]"
      style={{ background: "var(--paper)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold leading-tight">{m.label}</h3>
        <CostBar rate={m.ratePerSqft} max={max} />
      </div>

      <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
        {m.plain}
      </p>

      <p className="metric mt-2 text-[12px]">
        ₹{m.ratePerSqft}
        <span className="font-normal" style={{ color: "var(--ink-faint)" }}>
          {" "}
          per sq ft of board
        </span>
      </p>
      <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
        {m.source === "catalogue" ? "From the EightByFour catalogue" : "Working figure, not yet a live rate"}
      </p>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-2.5 flex min-h-11 items-center gap-1 self-start text-[12px] font-semibold transition-colors"
        style={{ color: "var(--burgundy)" }}
      >
        {open ? "Less" : "Why this board?"}
        <span
          aria-hidden="true"
          className="text-[10px] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div className="mt-2 border-t pt-2.5" style={{ borderColor: "var(--studio-line)" }}>
          <div className="space-y-1">
            <Rating label="Moisture" value={m.moisture} />
            <Rating label="Durability" value={m.durability} />
            <Rating label="Takes a finish" value={m.finishFlex} />
          </div>
          <p className="mt-2.5 text-[11.5px] leading-snug">
            <span className="font-semibold">Best for </span>
            <span style={{ color: "var(--ink-soft)" }}>{m.bestFor}</span>
          </p>
          <p className="mt-1.5 text-[11.5px] leading-snug">
            <span className="font-semibold" style={{ color: "var(--burgundy)" }}>
              Watch for{" "}
            </span>
            <span style={{ color: "var(--ink-soft)" }}>{m.watchFor}</span>
          </p>
          <Link
            href={m.catalogueHref}
            className="mt-2.5 inline-block text-[11.5px] font-semibold"
            style={{ color: "var(--burgundy)" }}
          >
            See the products <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
