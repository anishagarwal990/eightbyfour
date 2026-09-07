"use client";

import { useId, useRef, useState } from "react";
import { ENQUIRY_UNITS, isSpecificationComplete } from "@/lib/enquiry";
import type { InquiryItemRow } from "@/lib/supabase/types";

const CELL = "w-full rounded border px-2 py-1 text-sm";
const CELL_STYLE = { borderColor: "var(--line)", background: "var(--paper)" };

interface Draft {
  key: string;
  thickness: string;
  quantity: string;
  unit: string;
  category: string;
  material: string;
  requested_brand: string;
  requested_product: string;
  size: string;
  grade: string;
  finish: string;
  notes: string;
  /** null = follow the computed default; true/false = staff override. */
  specOverride: boolean | null;
}

function emptyDraft(unit: string, key: string): Draft {
  return {
    key,
    thickness: "",
    quantity: "",
    unit,
    category: "",
    material: "",
    requested_brand: "",
    requested_product: "",
    size: "",
    grade: "",
    finish: "",
    notes: "",
    specOverride: null,
  };
}

function fromRow(row: InquiryItemRow): Draft {
  return {
    key: row.id,
    thickness: row.thickness ?? "",
    quantity: row.quantity !== null ? String(row.quantity) : "",
    unit: row.unit ?? "sheets",
    category: row.category ?? "",
    material: row.material ?? "",
    requested_brand: row.requested_brand ?? "",
    requested_product: row.requested_product ?? "",
    size: row.size ?? "",
    grade: row.grade ?? "",
    finish: row.finish ?? "",
    notes: row.notes ?? "",
    specOverride: row.specification_complete === isSpecificationComplete(specOf(row)) ? null : row.specification_complete,
  };
}

function specOf(row: InquiryItemRow) {
  return {
    category: row.category,
    material: row.material,
    requested_brand: row.requested_brand,
    requested_product: row.requested_product,
    thickness: row.thickness,
    size: row.size,
    grade: row.grade,
    finish: row.finish,
    quantity: row.quantity,
    unit: row.unit,
  };
}

function draftSpec(draft: Draft) {
  return {
    category: draft.category || null,
    material: draft.material || null,
    requested_brand: draft.requested_brand || null,
    requested_product: draft.requested_product || null,
    thickness: draft.thickness || null,
    size: draft.size || null,
    grade: draft.grade || null,
    finish: draft.finish || null,
    quantity: draft.quantity ? Number.parseFloat(draft.quantity) : null,
    unit: draft.unit || null,
  };
}

/**
 * Repeating requirement-line editor, tuned for one-pass typing off a WhatsApp
 * message: Thickness, Qty, Unit on the primary row, everything else behind a
 * per-row "more" toggle. Enter in the quantity field commits the line and
 * focuses a fresh one, so the Mikasa list is five Enters, not five clicks.
 *
 * Renders plain inputs named `item.<n>.<field>`, so the whole thing submits as
 * ordinary FormData and the server action stays the single source of parsing
 * and validation — no JSON blob, no client-side "save" round trip.
 */
export function RequirementEditor({ initialItems = [] }: { initialItems?: InquiryItemRow[] }) {
  // Row keys come off a useId() prefix plus a monotonic counter, never
  // Math.random(): the initial rows are rendered on the server too, and random
  // keys made the server and client markup disagree (hydration mismatch on
  // data-row).
  const baseId = useId();
  const BLANK_ROWS = 3;
  // Seeded from props at mount rather than reconciled during render — reading
  // or writing a ref while rendering is exactly what react-hooks/refs forbids.
  const nextKey = useRef(initialItems.length > 0 ? initialItems.length : BLANK_ROWS);
  const makeKey = () => `${baseId}-row-${nextKey.current++}`;

  const [drafts, setDrafts] = useState<Draft[]>(() =>
    initialItems.length > 0
      ? initialItems.map(fromRow)
      : Array.from({ length: BLANK_ROWS }, (_, i) => emptyDraft("sheets", `${baseId}-row-${i}`))
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function addRow(afterKey?: string) {
    // Inherit the unit from the row above — a sheet list is all sheets.
    const previous = afterKey ? drafts.find((d) => d.key === afterKey) : drafts[drafts.length - 1];
    const next = emptyDraft(previous?.unit || "sheets", makeKey());
    setDrafts((prev) => [...prev, next]);
    // Focus the new row's first field once React has committed it.
    requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLInputElement>(`[data-row="${next.key}"] input`)?.focus();
    });
  }

  function removeRow(key: string) {
    setDrafts((prev) => (prev.length === 1 ? [emptyDraft(prev[0].unit, makeKey())] : prev.filter((d) => d.key !== key)));
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filled = drafts.filter((d) => Object.entries(d).some(([k, v]) => k !== "key" && k !== "unit" && k !== "specOverride" && v));
  const totalQuantity = filled.reduce((sum, d) => sum + (Number.parseFloat(d.quantity) || 0), 0);

  return (
    <div ref={containerRef}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th className="px-2 py-1.5 text-left font-medium" style={{ width: "22%" }}>
                Thickness / item
              </th>
              <th className="px-2 py-1.5 text-left font-medium" style={{ width: "12%" }}>
                Qty
              </th>
              <th className="px-2 py-1.5 text-left font-medium" style={{ width: "14%" }}>
                Unit
              </th>
              <th className="px-2 py-1.5 text-left font-medium">Notes</th>
              <th className="px-2 py-1.5 text-left font-medium" style={{ width: "16%" }}>
                Spec
              </th>
              <th className="px-2 py-1.5" style={{ width: "1%" }} />
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft, index) => {
              const spec = draftSpec(draft);
              // `unit` is pre-filled (inherited from the row above), so an
              // untouched row would otherwise look "filled" and get flagged
              // incomplete before anyone has typed in it. Judge emptiness on
              // the fields the operator actually enters.
              const hasContent = Object.entries(spec).some(([field, value]) => field !== "unit" && value !== null && value !== "");
              const computed = isSpecificationComplete(spec);
              const complete = draft.specOverride ?? computed;
              const isOpen = expanded.has(draft.key);
              return (
                <tr key={draft.key} data-row={draft.key} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-2 py-1.5" colSpan={isOpen ? 6 : 1}>
                    {isOpen ? (
                      <div className="grid grid-cols-2 gap-2 py-1 sm:grid-cols-4">
                        <LabelledInput label="Thickness / item" name={`item.${index}.thickness`} value={draft.thickness} onChange={(v) => update(draft.key, { thickness: v })} />
                        <LabelledInput label="Qty" name={`item.${index}.quantity`} value={draft.quantity} onChange={(v) => update(draft.key, { quantity: v })} inputMode="decimal" />
                        <LabelledInput label="Unit" name={`item.${index}.unit`} value={draft.unit} onChange={(v) => update(draft.key, { unit: v })} list="enquiry-units" />
                        <LabelledInput label="Category" name={`item.${index}.category`} value={draft.category} onChange={(v) => update(draft.key, { category: v })} />
                        <LabelledInput label="Material" name={`item.${index}.material`} value={draft.material} onChange={(v) => update(draft.key, { material: v })} />
                        <LabelledInput label="Brand" name={`item.${index}.requested_brand`} value={draft.requested_brand} onChange={(v) => update(draft.key, { requested_brand: v })} />
                        <LabelledInput label="Product" name={`item.${index}.requested_product`} value={draft.requested_product} onChange={(v) => update(draft.key, { requested_product: v })} />
                        <LabelledInput label="Size" name={`item.${index}.size`} value={draft.size} onChange={(v) => update(draft.key, { size: v })} />
                        <LabelledInput label="Grade" name={`item.${index}.grade`} value={draft.grade} onChange={(v) => update(draft.key, { grade: v })} />
                        <LabelledInput label="Finish" name={`item.${index}.finish`} value={draft.finish} onChange={(v) => update(draft.key, { finish: v })} />
                        <div className="col-span-2 sm:col-span-4">
                          <LabelledInput label="Notes" name={`item.${index}.notes`} value={draft.notes} onChange={(v) => update(draft.key, { notes: v })} />
                        </div>
                        <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
                          <SpecToggle draft={draft} computed={computed} index={index} onChange={(v) => update(draft.key, { specOverride: v })} />
                          <button type="button" onClick={() => toggleExpanded(draft.key)} className="text-xs underline-offset-2 hover:underline" style={{ color: "var(--line-strong)" }}>
                            Collapse
                          </button>
                          <button type="button" onClick={() => removeRow(draft.key)} className="text-xs underline-offset-2 hover:underline" style={{ color: "var(--line-strong)" }}>
                            Remove line
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        name={`item.${index}.thickness`}
                        value={draft.thickness}
                        onChange={(e) => update(draft.key, { thickness: e.target.value })}
                        placeholder="19mm / Liner"
                        className={CELL}
                        style={CELL_STYLE}
                        aria-label={`Line ${index + 1} thickness or item`}
                      />
                    )}
                  </td>
                  {!isOpen ? (
                    <>
                      <td className="px-2 py-1.5">
                        <input
                          name={`item.${index}.quantity`}
                          value={draft.quantity}
                          onChange={(e) => update(draft.key, { quantity: e.target.value })}
                          onKeyDown={(e) => {
                            // Enter commits the line and opens the next one.
                            // Without this the browser submits the whole form
                            // halfway through a five-line requirement.
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (index === drafts.length - 1) addRow(draft.key);
                              else containerRef.current?.querySelector<HTMLInputElement>(`[data-row="${drafts[index + 1].key}"] input`)?.focus();
                            }
                          }}
                          inputMode="decimal"
                          placeholder="45"
                          className={CELL}
                          style={CELL_STYLE}
                          aria-label={`Line ${index + 1} quantity`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`item.${index}.unit`}
                          value={draft.unit}
                          onChange={(e) => update(draft.key, { unit: e.target.value })}
                          list="enquiry-units"
                          className={CELL}
                          style={CELL_STYLE}
                          aria-label={`Line ${index + 1} unit`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`item.${index}.notes`}
                          value={draft.notes}
                          onChange={(e) => update(draft.key, { notes: e.target.value })}
                          placeholder="As written by the customer"
                          className={CELL}
                          style={CELL_STYLE}
                          aria-label={`Line ${index + 1} notes`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        {hasContent ? (
                          complete ? (
                            <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                              Complete
                            </span>
                          ) : (
                            <span className="text-xs font-medium" style={{ color: "var(--burgundy)" }} title="Quantity, unit and something identifying the material are needed">
                              ⚠ Incomplete
                            </span>
                          )
                        ) : (
                          <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                            —
                          </span>
                        )}
                        {/* Persist the effective flag even when the row is collapsed. */}
                        <input type="hidden" name={`item.${index}.specification_complete`} value={String(complete)} />
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <button type="button" onClick={() => toggleExpanded(draft.key)} className="px-1 text-xs" style={{ color: "var(--line-strong)" }} title="More fields">
                          More
                        </button>
                        <button type="button" onClick={() => removeRow(draft.key)} className="px-1 text-xs" style={{ color: "var(--line-strong)" }} title="Remove line">
                          ✕
                        </button>
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <datalist id="enquiry-units">
        {ENQUIRY_UNITS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => addRow()}
          className="rounded-md border px-2.5 py-1 text-sm"
          style={{ borderColor: "var(--line)" }}
        >
          + Add line
        </button>
        <span className="text-xs" style={{ color: "var(--line-strong)" }}>
          {filled.length} line{filled.length === 1 ? "" : "s"}
          {totalQuantity > 0 ? ` · ${totalQuantity.toLocaleString("en-IN")} total qty` : ""}
        </span>
      </div>
    </div>
  );
}

function LabelledInput({
  label,
  name,
  value,
  onChange,
  inputMode,
  list,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal";
  list?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
        {label}
      </span>
      <input name={name} value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} list={list} className={CELL} style={CELL_STYLE} />
    </label>
  );
}

function SpecToggle({
  draft,
  computed,
  index,
  onChange,
}: {
  draft: Draft;
  computed: boolean;
  index: number;
  onChange: (value: boolean | null) => void;
}) {
  const effective = draft.specOverride ?? computed;
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={effective}
        onChange={(e) => onChange(e.target.checked === computed ? null : e.target.checked)}
      />
      <span style={{ color: "var(--line-strong)" }}>Specification complete</span>
      <input type="hidden" name={`item.${index}.specification_complete`} value={String(effective)} />
    </label>
  );
}
