"use client";

import { useState } from "react";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button, buttonClasses } from "@/components/ui/Button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * The hero's second slide: the mechanic, shown as the thing itself — a
 * material list being filled in, and what happens to it after you send it.
 *
 * Inverted, and the only inverted surface on the page. Slide one is a white
 * page with the material fan on it, so flipping the ground is what tells a
 * visitor who lands mid-transition that the hero moved. The brand keeps
 * burgundy as a signal and neutral everywhere else, so the ground is the
 * strongest structural move available without introducing a colour.
 *
 * The pad is real, not a picture of one: what you type here is the same list
 * the quote modal opens with. The five rows it starts with are real catalogue
 * SKUs and are labelled as an example, so nothing on screen pretends to be a
 * customer's order.
 */

// Real products, in the shape a Hyderabad site actually orders them — the
// point of the example is that a list mixes categories, brands and units, and
// still comes back as one quote.
const EXAMPLE_ROWS = [
  { qty: "40", unit: "sheets", item: "Century Sainik 710", note: "BWR plywood", spec: "19 mm" },
  { qty: "25", unit: "sheets", item: "Merino 14603 Huron Lowa Walnut", note: "laminate", spec: "1 mm" },
  { qty: "25", unit: "sheets", item: "Balancing laminate", note: "white", spec: "0.8 mm" },
  { qty: "3", unit: "sheets", item: "Tiara Marble Calacatta", note: "solid surface", spec: "12 mm" },
  { qty: "2", unit: "packs", item: "Fevicol Heatx", note: "adhesive", spec: "—" },
];

const STEPS = [
  {
    title: "We read your list",
    body: "BOQ, Excel, a drawing, or a photo of a handwritten list — any format works.",
  },
  {
    title: "First response in under 15 minutes",
    body: "During business hours, on WhatsApp or a call.",
  },
  {
    title: "You compare options",
    body: "Every line priced against a named brand and specification, so you can check it against your BOQ yourself.",
  },
];

const ROW = "grid grid-cols-[76px_minmax(0,1fr)] items-center sm:grid-cols-[92px_minmax(0,1fr)_76px]";

export function ListSlide({ manufacturerCount }: { manufacturerCount: number }) {
  const { items, addItem, removeItem, openModal } = useQuoteModal();
  const [descInput, setDescInput] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!descInput.trim()) return;
    addItem(descInput.trim());
    setDescInput("");
  }

  const hasItems = items.length > 0;

  return (
    <div className="h-full px-7 py-14 md:py-16" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--accent-inverse)", opacity: 0.9 }}>
            Interior material procurement · Hyderabad
          </p>
          <h2 className="mt-3" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            Send us your material list. Get priced options back.
          </h2>
          <p className="mt-4 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", opacity: 0.75 }}>
            One list, every category on it.{" "}
            {/* The second sentence costs four lines on a 375px screen, where it
                sits between the headline and the pad — the thing worth seeing. */}
            <span className="hidden sm:inline">
              We price each line against a named brand and send back one document instead of five vendor threads in five
              formats.
            </span>
            <span className="sm:hidden">Every line priced against a named brand.</span>
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-14">
          {/* ---- the pad: what you send ---- */}
          <div
            className="overflow-hidden"
            style={{ background: "var(--paper)", color: "var(--ink)", borderRadius: "var(--radius-xs)" }}
          >
            <div
              className="flex items-baseline justify-between gap-4 border-b px-5 py-4 md:px-6"
              style={{ borderColor: "var(--line)" }}
            >
              <p className="tracked-caps" style={{ fontSize: "var(--fs-label)" }}>
                Your list
              </p>
              <p className="text-[13px]" style={{ color: "var(--line-strong)" }}>
                {hasItems ? `${items.length} line${items.length === 1 ? "" : "s"} added` : "Example — replace it with yours"}
              </p>
            </div>

            <ul className="m-0 list-none p-0">
              {hasItems
                ? items.map((item, i) => (
                    <li
                      key={`${item.desc}-${i}`}
                      className={`${ROW} border-b`}
                      style={{ borderColor: "#ededed", minHeight: 47 }}
                    >
                      {/* addItem() defaults qty to "1" with no unit, and a bare
                          numeral in a column that otherwise reads "40 sheets"
                          looks like a stray digit against the description. The
                          quote modal collects the real quantity, so an
                          unqualified 1 is shown as "qty" rather than faking a
                          unit we were never told. */}
                      <span
                        className="border-r py-2.5 pr-3.5 text-right text-[13.5px]"
                        style={{ borderColor: "rgba(110,31,46,0.32)", color: "var(--line-strong)" }}
                      >
                        <b className="metric mr-1 text-[15px]" style={{ color: "var(--ink)" }}>
                          {item.qty}
                        </b>
                        {item.qty === "1" ? "qty" : "units"}
                      </span>
                      <span className="px-4 py-2.5 text-[14.5px] leading-snug">{item.desc}</span>
                      <span className="hidden pr-5 text-right sm:block">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          aria-label={`Remove ${item.desc}`}
                          className="cursor-pointer text-base leading-none"
                          style={{ color: "var(--line-strong)" }}
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))
                : EXAMPLE_ROWS.map((row) => (
                    <li key={row.item} className={`${ROW} border-b`} style={{ borderColor: "#ededed", minHeight: 47 }}>
                      <span
                        className="border-r py-2.5 pr-3.5 text-right text-[13.5px]"
                        style={{ borderColor: "rgba(110,31,46,0.32)", color: "var(--line-strong)" }}
                      >
                        <b className="metric mr-1 text-[15px]" style={{ color: "var(--ink)" }}>
                          {row.qty}
                        </b>
                        {row.unit}
                      </span>
                      <span className="px-4 py-2.5 text-[14.5px] leading-snug">
                        {row.item}{" "}
                        {/* Name + category + spec is three things in one cell, which
                            wraps every other row to two lines on a phone. The
                            category is the one a reader can infer from the name. */}
                        <small className="hidden sm:inline" style={{ color: "var(--line-strong)" }}>
                          · {row.note}
                        </small>
                        <small className="sm:hidden" style={{ color: "var(--line-strong)" }}>
                          {row.spec === "—" ? "" : ` · ${row.spec}`}
                        </small>
                      </span>
                      <span
                        className="metric hidden pr-5 text-right text-[13.5px] sm:block"
                        style={{ color: "#6b6b6b", fontWeight: 400 }}
                      >
                        {row.spec}
                      </span>
                    </li>
                  ))}

              {/* The live line. Typing here fills the same list the quote modal
                  opens with, so the example above is the only fiction on screen. */}
              <li className={`${ROW} border-b`} style={{ borderColor: "#ededed" }}>
                <span
                  className="tracked-caps border-r py-2.5 pr-3.5 text-right"
                  style={{ borderColor: "rgba(110,31,46,0.32)", fontSize: "10px", color: "var(--line-strong)" }}
                >
                  Add
                </span>
                <form onSubmit={handleAdd} className="flex min-w-0 items-center gap-2 px-3 py-2 sm:col-span-2">
                  <input
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="e.g. 24 soft-close hinges, Hettich"
                    aria-label="Add a line to your list"
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 text-[14.5px] outline-none"
                    style={{ color: "var(--ink)" }}
                  />
                  <button type="submit" className={buttonClasses("secondary", "sm", "shrink-0")}>
                    + Add
                  </button>
                </form>
              </li>
            </ul>

            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2.5 px-5 py-4 md:px-6"
              style={{ background: "#fafafa", borderTop: "1px solid var(--line)" }}
            >
              <Button
                type="button"
                variant="primary"
                onClick={() => openModal(undefined, undefined, "Send This List", { cta_location: "hero_list_slide" })}
              >
                Send this list
              </Button>
              <button
                type="button"
                onClick={() =>
                  openModal(
                    undefined,
                    "Upload your BOQ, drawings or product list — we'll take it from there.",
                    "Upload Your BOQ",
                    { cta_location: "hero_list_slide_attach" }
                  )
                }
                className={buttonClasses("secondary")}
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
                  <path
                    d="M10.5 4.5 5.4 9.6a1.4 1.4 0 0 0 2 2l5.4-5.4a2.8 2.8 0 0 0-4-4L3.4 7.6a4.2 4.2 0 0 0 6 6l4.2-4.2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Attach BOQ, drawing or photo
              </button>
              <a
                href={buildWhatsAppUrl("Hi, I'd like to send you my material list for a quote.")}
                className="text-[14px] font-medium"
                style={{ color: "var(--burgundy)" }}
              >
                or WhatsApp it
              </a>
            </div>
          </div>

          {/* ---- what happens next ---- */}
          <div>
            <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", opacity: 0.55 }}>
              What happens next
            </p>
            {/* A real sequence, so it is numbered: the order is the information. */}
            <ol className="m-0 mt-4 list-none p-0">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[42px_minmax(0,1fr)] gap-x-3.5 gap-y-1 py-[18px]"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <span
                    className="metric row-span-2 text-[26px]"
                    style={{ color: "var(--accent-inverse)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[16.5px] font-semibold leading-snug">{step.title}</span>
                  <span className="text-[14.5px]" style={{ opacity: 0.7, lineHeight: "var(--lh-normal)" }}>
                    {step.body}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-[13px]" style={{ opacity: 0.6 }}>
              Sourced across {manufacturerCount} manufacturers. One person on our procurement desk reads the list,
              checks stock and pricing, and writes the quote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
