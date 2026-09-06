"use client";

import { useMemo, useState } from "react";
import { BALANCING_LAMINATES, PRESS_BOARDS, PRESS_LAMINATES } from "@/lib/studio/catalogue";
import { inr } from "@/lib/studio/format";
import { DEFAULT_PRESS_CONFIG, boardOnlyTotal, pricePressing, type PressConfig, type PressSides } from "@/lib/studio/pressing";
import { MobileQuoteBar, QuotePanel } from "./QuotePanel";
import { OptionCard, OptionRail, Segmented, StepHeading, Stepper, Swatch } from "./primitives";

/**
 * Laminate pressing reads as a bundle builder, not a services form: board plus
 * laminate plus laminate plus pressing equals a finished panel, laid out in
 * that order with a running product preview. It is the most direct expression
 * of the whole platform thesis, so it looks like commerce rather than like a
 * quotation request.
 */
export function PressingConfigurator() {
  const [config, setConfig] = useState<PressConfig>(DEFAULT_PRESS_CONFIG);
  const quote = useMemo(() => pricePressing(config), [config]);
  const boardOnly = boardOnlyTotal(config);

  const set = <K extends keyof PressConfig>(k: K, v: PressConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const board = PRESS_BOARDS.find((b) => b.id === config.boardId)!;
  const front = PRESS_LAMINATES.find((l) => l.id === config.frontLaminateId)!;
  const back = BALANCING_LAMINATES.find((l) => l.id === config.backLaminateId)!;
  const perSheet = quote.rate!.amount;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      <div className="min-w-0">
        {/* The bundle line — board + front + back + press = panel. */}
        <div
          className="mb-8 grid items-center gap-3 rounded-[3px] border p-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]"
          style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
        >
          <BundleCell caption="Board" title={`${board.brand} ${board.label}`} sub={board.thickness} from={board.swatch} to={board.swatchTo} />
          <Operator symbol="+" />
          <BundleCell caption="Front laminate" title={`${front.brand} ${front.code}`} sub={front.label} from={front.swatch} to={front.swatchTo} />
          <Operator symbol="+" />
          <BundleCell
            caption={config.sides === "double" ? "Back laminate" : "Back"}
            title={config.sides === "double" ? `${back.brand} ${back.code}` : "Unpressed"}
            sub={config.sides === "double" ? back.thickness : "Single side only"}
            from={config.sides === "double" ? back.swatch : "#dcd6cb"}
            to={config.sides === "double" ? back.swatchTo : "#c4bdb0"}
            muted={config.sides !== "double"}
          />
          <Operator symbol="=" />
          <div
            className="rounded-[3px] p-2.5"
            style={{ background: "color-mix(in srgb, var(--burgundy) 7%, transparent)" }}
            role="status"
            aria-live="polite"
          >
            <p className="tracked-caps text-[9px]" style={{ color: "var(--burgundy)" }}>
              Finished panel
            </p>
            <p className="metric mt-1 text-[22px] leading-none">{inr(perSheet)}</p>
            <p className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
              per 8′ × 4′ sheet, delivered
            </p>
          </div>
        </div>

        <section className="mb-8">
          <StepHeading step="01" title="Choose the board" hint="Anything you would buy from the catalogue anyway." />
          <OptionRail cols={5}>
            {PRESS_BOARDS.map((b) => (
              <OptionCard
                key={b.id}
                compact
                active={b.id === config.boardId}
                onClick={() => set("boardId", b.id)}
                label={b.label}
                sub={`${b.brand} · ${b.thickness}`}
                meta={`₹${b.rate.toLocaleString("en-IN")}/sheet`}
                swatch={b.swatch}
                swatchTo={b.swatchTo}
                logo={b.logo}
                deltaLabel={b.id === config.boardId ? "Selected" : undefined}
              />
            ))}
          </OptionRail>
        </section>

        <section className="mb-8">
          <StepHeading step="02" title="Front laminate" hint="The visible face. Shade codes are the real ones from the catalogue." />
          <OptionRail cols={5}>
            {PRESS_LAMINATES.map((l) => (
              <OptionCard
                key={l.id}
                compact
                active={l.id === config.frontLaminateId}
                onClick={() => set("frontLaminateId", l.id)}
                label={l.label}
                sub={`${l.brand} · ${l.code}`}
                meta={`₹${l.rate.toLocaleString("en-IN")}/sheet`}
                swatch={l.swatch}
                swatchTo={l.swatchTo}
                logo={l.logo}
                deltaLabel={l.id === config.frontLaminateId ? "Selected" : undefined}
              />
            ))}
          </OptionRail>
        </section>

        <section className="mb-8">
          <StepHeading
            step="03"
            title="Pressing"
            hint="Pressing one face only pulls the panel towards that side as it cures. A balancing laminate on the reverse is what keeps it flat."
          />
          <div className="grid items-start gap-3 sm:grid-cols-[220px_1fr]">
            <Segmented<PressSides>
              value={config.sides}
              onChange={(v) => set("sides", v)}
              label="Pressing sides"
              options={[
                { id: "single", label: "Single side" },
                { id: "double", label: "Double side" },
              ]}
            />
            {config.sides === "double" ? (
              <OptionRail cols={3}>
                {BALANCING_LAMINATES.map((l) => (
                  <OptionCard
                    key={l.id}
                    compact
                    active={l.id === config.backLaminateId}
                    onClick={() => set("backLaminateId", l.id)}
                    label={l.label}
                    sub={l.id === "bal-match" ? "Matches the front face" : `${l.brand} · ${l.thickness}`}
                    swatch={l.swatch}
                    swatchTo={l.swatchTo}
                    deltaLabel={l.id === config.backLaminateId ? "Selected" : undefined}
                  />
                ))}
              </OptionRail>
            ) : (
              <p className="self-center text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                Single-side pressing is fine for panels that are fixed flat against a wall or a carcass. For shutters
                and any free-standing panel, press both sides.
              </p>
            )}
          </div>
        </section>

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
          <p className="text-[13.5px] font-semibold">
            The boards alone would be {inr(boardOnly)}. Pressed, finished and delivered: {inr(quote.total)}.
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            The difference is the laminate you were going to buy anyway, plus {inr(quote.groups.find((g) => g.key === "fabrication")!.subtotal)} of
            pressing. Against site pressing, what you are actually buying is a flat panel, no curing time on site, and
            no adhesive on your floor.
          </p>
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

function BundleCell({
  caption,
  title,
  sub,
  from,
  to,
  muted,
}: {
  caption: string;
  title: string;
  sub: string;
  from: string;
  to?: string;
  muted?: boolean;
}) {
  return (
    <div style={{ opacity: muted ? 0.5 : 1 }}>
      <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
        {caption}
      </p>
      <Swatch from={from} to={to} className="mt-1.5 h-10 w-full" />
      <p className="mt-1.5 text-[12.5px] font-semibold leading-tight">{title}</p>
      <p className="text-[11px] leading-tight" style={{ color: "var(--ink-faint)" }}>
        {sub}
      </p>
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
