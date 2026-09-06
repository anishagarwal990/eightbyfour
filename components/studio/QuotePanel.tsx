"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { inr } from "@/lib/studio/format";
import type { Quote } from "@/lib/studio/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { IndicativeNote } from "./primitives";

/**
 * The signature Studio component: a quote that reads like a cart, not like a
 * contractor's one-line total. Every material line keeps its brand, its
 * arithmetic and a link to the catalogue page it came from — the whole point
 * being that the material does not disappear inside the number.
 */

function useChangePulse(value: number) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 640);
      return () => clearTimeout(t);
    }
  }, [value]);
  return pulse;
}

export function QuotePanel({
  quote,
  contextLabel,
  compareNote,
  defaultOpen = true,
  sticky = true,
  showLabel = true,
}: {
  quote: Quote;
  /** e.g. "Your Studio Quote" — the label above the title. */
  contextLabel?: string;
  /** Optional line under the total, used by the compare-methods view. */
  compareNote?: React.ReactNode;
  defaultOpen?: boolean;
  sticky?: boolean;
  /** False inside the mobile sheet, whose own header already carries it. */
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(quote.groups.map((g) => [g.key, defaultOpen && g.key === "materials"]))
  );
  const pulse = useChangePulse(quote.total);

  const whatsappMessage = [
    `Studio EightxFour — indicative estimate`,
    quote.title,
    "",
    ...quote.spec.map((s) => `• ${s}`),
    "",
    ...quote.groups.map((g) => `${g.label}: ${inr(g.subtotal)}`),
    `Estimated total: ${inr(quote.total)}`,
    "",
    "I'd like a verified quote for this specification.",
  ].join("\n");

  return (
    <aside
      // 128px clears the master header at its tallest — it re-expands on
      // scroll-up, and a quote panel half-hidden behind it is worse than one
      // that sits a little lower.
      className={`${sticky ? "lg:sticky lg:top-[128px]" : ""} rounded-[3px] border`}
      style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
    >
      <div className="border-b p-4" style={{ borderColor: "var(--studio-line)" }}>
        {showLabel ? (
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            {contextLabel ?? "Your Studio quote"}
          </p>
        ) : null}
        <h3 className={`serif ${showLabel ? "mt-1.5" : ""} text-[20px] leading-tight`}>{quote.title}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quote.spec.map((s) => (
            <span
              key={s}
              className="rounded-[2px] px-1.5 py-1 text-[11px] leading-none"
              style={{ background: "var(--stone-deep)", color: "var(--ink-soft)" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* The number changes on every selection, so it has to be announced —
          without this a screen reader user changes the carcass and hears
          nothing at all. role="status" keeps it polite rather than assertive:
          it waits for a pause instead of interrupting. */}
      <div className={`px-4 py-4 ${pulse ? "price-pulse" : ""}`} role="status" aria-live="polite">
        <div className="flex items-baseline justify-between gap-3">
          <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Estimated total
          </span>
          {quote.rate ? (
            <span className="metric text-[12px]" style={{ color: "var(--ink-soft)" }}>
              {inr(quote.rate.amount)} {quote.rate.unit}
            </span>
          ) : null}
        </div>
        <p className="metric mt-0.5 text-[38px] leading-none">{inr(quote.total)}</p>
        {compareNote}
      </div>

      <div className="border-t" style={{ borderColor: "var(--studio-line)" }}>
        {quote.groups.map((group) => {
          const isOpen = open[group.key];
          const share = quote.total > 0 ? group.subtotal / quote.total : 0;
          return (
            <div key={group.key} className="border-b last:border-b-0" style={{ borderColor: "var(--studio-line)" }}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [group.key]: !o[group.key] }))}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--stone)]"
              >
                <span className="flex-1">
                  <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    {group.label}
                  </span>
                  {/* Share bar — how much of the total this group is, which is
                      the question people actually have about a quote. */}
                  <span className="mt-1.5 block h-[3px] w-full rounded-full" style={{ background: "var(--stone-deep)" }}>
                    <span
                      className="block h-full rounded-full transition-[width] duration-500 [transition-timing-function:var(--ease-out-soft)]"
                      style={{ width: `${Math.round(share * 100)}%`, background: "var(--burgundy)" }}
                    />
                  </span>
                </span>
                <span className="metric shrink-0 text-[14px]">{inr(group.subtotal)}</span>
                <span
                  className="shrink-0 text-[11px] transition-transform duration-200"
                  style={{ color: "var(--ink-faint)", transform: isOpen ? "rotate(180deg)" : undefined }}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {isOpen ? (
                <ul className="px-4 pb-3">
                  {group.lines.map((line, i) => (
                    <li
                      key={`${line.label}-${i}`}
                      className="flex items-start justify-between gap-3 border-t py-2 first:border-t-0"
                      style={{ borderColor: "var(--studio-line)" }}
                    >
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-medium leading-tight">
                          {line.catalogueHref ? (
                            <Link
                              href={line.catalogueHref}
                              className="underline decoration-[var(--studio-line-strong)] underline-offset-2 transition-colors hover:text-[var(--burgundy)]"
                            >
                              {line.label}
                            </Link>
                          ) : (
                            line.label
                          )}
                        </span>
                        {line.detail ? (
                          <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                            {line.detail}
                          </span>
                        ) : null}
                      </span>
                      <span className="metric shrink-0 text-[12.5px]">{inr(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="p-4">
        <a
          href={buildWhatsAppUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white transition-colors"
          style={{ background: "var(--burgundy)" }}
        >
          Get a verified quote
        </a>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { label: "Save", title: "Save this specification" },
            { label: "Share", title: "Share a link to this specification" },
            { label: "Download", title: "Download the specification sheet" },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              title={`${a.title} — available in the live product`}
              className="rounded-[3px] border px-2 py-2 text-[12px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line)" }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <IndicativeNote className="mt-3" />
      </div>
    </aside>
  );
}

/**
 * Mobile counterpart: a sticky bar that shows the number at all times and
 * expands into the full quote. Sits above the site's own mobile CTA bar.
 */
export function MobileQuoteBar({ quote, contextLabel }: { quote: Quote; contextLabel?: string }) {
  const [open, setOpen] = useState(false);
  const pulse = useChangePulse(quote.total);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /**
   * Modal housekeeping.
   *
   * This is declared `aria-modal`, which owes the user three things it was not
   * doing: Escape closes it, focus moves inside on open, and focus returns to
   * the button that opened it on close. Without the first, a keyboard user who
   * opens the estimate on a narrow screen has no way out of it.
   */
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    // Captured now: by cleanup time the ref may point somewhere else, and the
    // whole point is to return focus to the button that was clicked.
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the sheet so the next Tab lands inside it rather than
    // continuing through the page behind.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t lg:hidden"
        style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${pulse ? "price-pulse" : ""}`}
        >
          <span role="status" aria-live="polite">
            <span className="tracked-caps block text-[9px]" style={{ color: "var(--ink-faint)" }}>
              Estimated total
            </span>
            <span className="metric text-[22px] leading-tight">{inr(quote.total)}</span>
          </span>
          <span
            className="rounded-[3px] px-3 py-2 text-[13px] font-semibold text-white"
            style={{ background: "var(--burgundy)" }}
          >
            View estimate ↑
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Estimate breakdown">
          {/* Tap-outside-to-close is a convenience on top of the labelled
              close button, so it carries no semantics of its own. */}
          <div className="modal-backdrop absolute inset-0 bg-black/45" onClick={close} aria-hidden="true" />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="sheet-panel absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[6px] outline-none"
            style={{ background: "var(--stone)" }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3"
              style={{ background: "var(--stone)", borderColor: "var(--studio-line)" }}
            >
              <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                {contextLabel ?? "Your Studio quote"}
              </span>
              <button
                type="button"
                onClick={close}
                className="-my-2 -mr-2 flex h-11 w-11 items-center justify-center text-[18px] leading-none"
                aria-label="Close estimate"
              >
                ×
              </button>
            </div>
            <div className="p-3 pb-8">
              <QuotePanel quote={quote} contextLabel={contextLabel} sticky={false} showLabel={false} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
