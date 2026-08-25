"use client";

import { useState } from "react";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button, buttonClasses } from "@/components/ui/Button";

// Real lines a Hyderabad site actually orders, and the same lines the example
// card beside this one returns priced — the two halves have to agree or the
// demonstration falls apart.
const EXAMPLES = [
  "42 sheets 18mm BWP plywood",
  "60 sheets 1mm laminate, SD 591 SF",
  "96 pairs soft-close hinges",
  "6 drums SH marine adhesive",
];

/**
 * The "what you send" half of the compare section. Deliberately typed, not
 * described: a visitor who adds two lines has already done the thing the
 * business is asking for, and the example beside it shows those lines coming
 * back priced. Chips are real materials off the catalogue, not lorem.
 */
export function RequirementBuilder() {
  const { items, addItem, removeItem, openModal } = useQuoteModal();
  const [descInput, setDescInput] = useState("");

  function handleAdd() {
    if (!descInput.trim()) return;
    addItem(descInput);
    setDescInput("");
  }

  return (
    <div
      className="flex w-full flex-col p-5 text-left sm:p-6"
      // Explicit ink: this card sits inside an inverted section, so without
      // it every input value, chip and list row inherits the section's white
      // text and renders white-on-white.
      style={{ background: "var(--paper)", color: "var(--ink)", borderRadius: "var(--radius-xs)" }}
    >
      <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--burgundy)" }}>
        What do you need?
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={descInput}
          onChange={(e) => setDescInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="e.g. 42 sheets 18mm BWP plywood"
          className="min-w-0 flex-1 border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)", background: "var(--paper)", borderRadius: "var(--radius-xs)" }}
        />
        <button type="button" onClick={handleAdd} className={buttonClasses("secondary", "sm", "shrink-0")}>
          + Add
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--paper)", borderRadius: "var(--radius-xs)" }}
            >
              <span>
                <strong>{item.qty} ×</strong> {item.desc}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                aria-label="Remove item"
                className="text-base leading-none"
                style={{ color: "var(--line-strong)" }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => addItem(example)}
              className={buttonClasses("chip", "sm")}
              style={{ boxShadow: "inset 0 0 0 1px var(--line)", background: "var(--paper)", color: "var(--line-strong)" }}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={() => openModal(undefined, undefined, "Get My Quote")}>
          Get My Quote
        </Button>
        <button
          type="button"
          onClick={() => openModal(undefined, "Upload your BOQ, drawings or product list — we'll take it from there.", "Upload Your BOQ")}
          className={buttonClasses("secondary")}
        >
          Upload BOQ
        </button>
      </div>
    </div>
  );
}
