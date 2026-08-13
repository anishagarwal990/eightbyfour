"use client";

import { useState } from "react";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button, buttonClasses } from "@/components/ui/Button";

const EXAMPLES = [
  "18 sheets 18mm BWP plywood",
  "12 sheets white laminate",
  "6 pairs soft-close hinges",
  "4 sheets MDF",
  "2 Corian slabs",
];

/** Tangible "give us your list" widget — the hero's primary interaction, not a plain upload button. */
export function HeroQuoteBuilder() {
  const { items, addItem, removeItem, openModal } = useQuoteModal();
  const [descInput, setDescInput] = useState("");

  function handleAdd() {
    if (!descInput.trim()) return;
    addItem(descInput);
    setDescInput("");
  }

  return (
    <div className="w-full max-w-md rounded-sm border p-6 text-left" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
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
          placeholder="e.g. 18 sheets 18mm BWP plywood"
          className="min-w-0 flex-1 rounded-sm border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)", background: "var(--paper)" }}
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
              className="flex items-center justify-between gap-2 rounded-sm border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--paper)" }}
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
              style={{ borderColor: "var(--line)", background: "var(--paper)", color: "var(--line-strong)" }}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={() => openModal(undefined, undefined, "Get My Quote")}>
          Get My Quote →
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
