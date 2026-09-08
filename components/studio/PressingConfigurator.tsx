"use client";

import { useMemo, useState } from "react";
import { inr } from "@/lib/studio/format";
import {
  selectionLabel,
  selectionPriceNote,
  type MaterialSelection,
} from "@/lib/studio/materialSelection";
import {
  DEFAULT_PRESS_CONFIG,
  boardOnlyTotal,
  pricePressing,
  type PressConfig,
  type PressMaterialSource,
  type PressSides,
} from "@/lib/studio/pressing";
import { MaterialPicker } from "./MaterialPicker";
import { MobileQuoteBar, QuotePanel } from "./QuotePanel";
import { Segmented, StepHeading, Stepper } from "./primitives";

/**
 * Laminate pressing: board + laminate + laminate + pressing = a finished
 * panel. The board and both laminates are picked from the real catalogue
 * (MaterialPicker) rather than a five-item shortlist — the whole point of the
 * service is that it runs on the same stock the shop sells.
 */
export function PressingConfigurator() {
  const [config, setConfig] = useState<PressConfig>(DEFAULT_PRESS_CONFIG);
  const quote = useMemo(() => pricePressing(config), [config]);
  const boardOnly = boardOnlyTotal(config);

  const set = <K extends keyof PressConfig>(k: K, v: PressConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const perSheet = quote.rate!.amount;
  const own = config.materialSource === "own";
  const backSel: MaterialSelection =
    config.backLaminate.kind === "same-as-front" ? config.frontLaminate : config.backLaminate;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      <div className="min-w-0">
        {/* Whose board and laminate. The pressing charge is identical either
            way — only the material lines on the quote change. */}
        <div className="mb-6 max-w-[420px]">
          <Segmented<PressMaterialSource>
            value={config.materialSource}
            onChange={(v) => set("materialSource", v)}
            label="Board and laminate"
            options={[
              { id: "eightbyfour", label: "Buy here" },
              { id: "own", label: "I'll supply my own" },
            ]}
          />
          {own ? (
            <p className="mt-2 text-[12px] leading-snug" style={{ color: "var(--ink-faint)" }}>
              Bring the board and laminate sheets (8′ × 4′) to the workshop, or we collect them. You are charged for the
              press work, the press-grade adhesive, any trimming and delivery — nothing for material.
            </p>
          ) : null}
        </div>

        {/* The bundle line — board + front + back + press = panel. */}
        <div
          className="mb-8 grid items-center gap-3 rounded-[3px] border p-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]"
          style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
        >
          <BundleCell caption="Board" title={own ? "Yours" : selectionLabel(config.board)} muted={own} />
          <Operator symbol="+" />
          <BundleCell caption="Front laminate" title={own ? "Yours" : selectionLabel(config.frontLaminate)} muted={own} />
          <Operator symbol="+" />
          <BundleCell
            caption={config.sides === "double" ? "Back laminate" : "Back"}
            title={
              config.sides === "double"
                ? own
                  ? "Yours"
                  : selectionLabel(backSel)
                : "Unpressed"
            }
            muted={own || config.sides !== "double"}
          />
          <Operator symbol="=" />
          <div
            className="rounded-[3px] p-2.5"
            style={{ background: "color-mix(in srgb, var(--burgundy) 7%, transparent)" }}
            role="status"
            aria-live="polite"
          >
            <p className="tracked-caps text-[9px]" style={{ color: "var(--burgundy)" }}>
              {quote.pendingNote ? "From" : "Finished panel"}
            </p>
            <p className="metric mt-1 text-[22px] leading-none">{inr(perSheet)}</p>
            <p className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
              per 8′ × 4′ sheet, delivered
            </p>
          </div>
        </div>

        {/* 01 — board */}
        <section className="mb-8">
          <StepHeading
            step="01"
            title="Board"
            hint={
              own
                ? "Pick the thickness you are sending so the press is set to the right gap. Not charged."
                : "Search the full catalogue — every plywood, MDF and HDHMR board we stock. Filter by brand, grade and thickness."
            }
          />
          <MaterialPicker
            kind="board"
            needsThickness
            title="Board"
            value={config.board}
            onChange={(b) => set("board", b)}
          />
        </section>

        {/* 02 — front laminate */}
        {own ? (
          <section className="mb-8">
            <StepHeading step="02" title="Laminate" hint="You bring it — front and back." />
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
              <p className="text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                Send your front and back laminate sheets (8′ × 4′) with the boards. Mark which face is which, or tell us
                at drop-off. If a face is short, we can supply a balancing laminate — priced then, not now.
              </p>
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <StepHeading
              step="02"
              title="Front laminate"
              hint="The visible face. Search 2,400+ shades by name or code, or enter one that only exists in a sample book."
            />
            <MaterialPicker
              kind="laminate"
              title="Front laminate"
              value={config.frontLaminate}
              onChange={(l) => set("frontLaminate", l)}
            />
          </section>
        )}

        {/* 03 — pressing sides + back laminate */}
        <section className="mb-8">
          <StepHeading
            step="03"
            title="Pressing"
            hint="Pressing one face only pulls the panel towards that side as it cures. A balancing laminate on the reverse is what keeps it flat."
          />
          <div className="max-w-[240px]">
            <Segmented<PressSides>
              value={config.sides}
              onChange={(v) => set("sides", v)}
              label="Pressing sides"
              options={[
                { id: "single", label: "Single side" },
                { id: "double", label: "Double side" },
              ]}
            />
          </div>

          {config.sides === "double" && own ? (
            <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
              Send a back laminate for every board. A plain balancing laminate is enough — its only job is to keep the
              panel flat as it cures.
            </p>
          ) : config.sides === "double" ? (
            <div className="mt-3">
              <MaterialPicker
                kind="laminate"
                title="Back laminate"
                allowSameAsFront
                value={config.backLaminate}
                onChange={(l) => set("backLaminate", l)}
              />
            </div>
          ) : (
            <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
              Single-side pressing is fine for panels fixed flat against a wall or a carcass. For shutters and any
              free-standing panel, press both sides.
            </p>
          )}
        </section>

        {/* 04 — quantity & finishing */}
        <section className="mb-8">
          <StepHeading step="04" title="Quantity & finishing" />
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Stepper label="Sheets" value={config.quantity} min={1} max={200} step={1} unit="nos" onChange={(v) => set("quantity", v)} />
            {[
              { key: "cutToSize" as const, label: "Cut to panel sizes", detail: "Send a cutting list after ordering." },
              { key: "edgeBand" as const, label: "Edge banding", detail: "Matching band on the cut panels." },
            ].map((opt) => {
              const active = config[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => set(opt.key, !active)}
                  aria-pressed={active}
                  className="rounded-[3px] border p-3 text-left transition-colors"
                  style={{
                    borderColor: active ? "var(--burgundy)" : "var(--studio-line)",
                    background: active ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border text-[10px] leading-none text-white"
                      style={{
                        borderColor: active ? "var(--burgundy)" : "var(--studio-line-strong)",
                        background: active ? "var(--burgundy)" : "transparent",
                      }}
                      aria-hidden="true"
                    >
                      {active ? "✓" : ""}
                    </span>
                    <span className="text-[13px] font-medium">{opt.label}</span>
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                    {opt.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
          {own ? (
            <>
              <p className="text-[13.5px] font-semibold">
                Pressing only: {inr(quote.total)} for {config.quantity} sheets — {inr(perSheet)} per sheet.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                You supply the board and laminate. This covers the hot press, press-grade adhesive,
                {config.cutToSize || config.edgeBand ? " trimming," : ""} and delivery within Hyderabad. Against
                pressing on site: a flat panel, no curing time, no adhesive on your floor.
              </p>
            </>
          ) : boardOnly > 0 ? (
            <>
              <p className="text-[13.5px] font-semibold">
                The boards alone would be {inr(boardOnly)}. Pressed, finished and delivered: {inr(quote.total)}
                {quote.pendingNote ? "+" : ""}.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                The difference is the laminate you were going to buy anyway, plus{" "}
                {inr(quote.groups.find((g) => g.key === "fabrication")!.subtotal)} of pressing. Against site pressing,
                what you are buying is a flat panel, no curing time on site, and no adhesive on your floor.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13.5px] font-semibold">
                Pressing, finished and delivered: {inr(quote.total)}
                {quote.pendingNote ? "+" : ""}.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {quote.pendingNote
                  ? "The board or a laminate you picked has no published rate — those are confirmed on your order and added to this."
                  : "A hot press applies even pressure and even glue across the whole sheet at once. A site press applies neither."}
              </p>
            </>
          )}
          {selectionPriceNote(config.board) && !own ? (
            <p className="mt-2 text-[11px]" style={{ color: "var(--ink-faint)" }}>
              Board: {selectionPriceNote(config.board)}. Exact rate confirmed for your thickness on order.
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <div className="hidden lg:block">
          <QuotePanel quote={quote} contextLabel="Your pressing order" />
        </div>
      </div>

      <MobileQuoteBar quote={quote} contextLabel="Your pressing order" />
    </div>
  );
}

function BundleCell({ caption, title, muted }: { caption: string; title: string; muted?: boolean }) {
  return (
    <div style={{ opacity: muted ? 0.5 : 1 }}>
      <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
        {caption}
      </p>
      <p className="mt-1.5 text-[12.5px] font-semibold leading-tight">{title}</p>
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span className="metric hidden text-center text-[18px] sm:block" style={{ color: "var(--ink-faint)" }} aria-hidden="true">
      {symbol}
    </span>
  );
}
