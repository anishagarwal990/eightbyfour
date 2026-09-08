"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inr } from "@/lib/studio/format";
import type { StudioMaterial, StudioMaterialFacets } from "@/lib/studio/materialCatalogue";
import {
  selectionLabel,
  selectionPriceNote,
  type MaterialSelection,
} from "@/lib/studio/materialSelection";

export type { MaterialSelection } from "@/lib/studio/materialSelection";

/**
 * Pick a board or a laminate from the real EightByFour catalogue.
 *
 * The curated lists were never the catalogue — 5 boards against 29 real SKUs,
 * 5 laminates against 2,464. This searches the live rows: filter by brand,
 * grade and thickness, or type a shade name. What the catalogue does not have
 * — a shade that only exists in a sample book, a board from a brand we do not
 * list — is entered by hand, and priced on the order rather than guessed at.
 *
 * Deliberately an inline panel, not a modal: it sits inside a configurator
 * step, and a customer comparing two boards should not lose the rest of the
 * form behind an overlay.
 */

interface ApiResponse {
  items: StudioMaterial[];
  total: number;
  hasMore: boolean;
  facets: StudioMaterialFacets | null;
}

export function MaterialPicker({
  kind,
  value,
  onChange,
  title,
  allowSameAsFront = false,
  needsThickness = false,
}: {
  kind: "board" | "laminate";
  value: MaterialSelection | null;
  onChange: (s: MaterialSelection) => void;
  title: string;
  allowSameAsFront?: boolean;
  needsThickness?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[3px] border" style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}>
      <div className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            {title}
          </p>
          <p className="mt-0.5 truncate text-[13.5px] font-semibold">{selectionLabel(value)}</p>
          {selectionPriceNote(value) ? (
            <p className="metric text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
              {selectionPriceNote(value)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-h-11 shrink-0 rounded-[3px] border px-3 text-[12.5px] font-semibold transition-colors"
          style={{ borderColor: "var(--studio-line-strong)", color: "var(--burgundy)" }}
        >
          {open ? "Close" : "Change"}
        </button>
      </div>

      {open ? (
        <PickerPanel
          kind={kind}
          allowSameAsFront={allowSameAsFront}
          needsThickness={needsThickness}
          onPick={(s) => {
            onChange(s);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PickerPanel({
  kind,
  allowSameAsFront,
  needsThickness,
  onPick,
}: {
  kind: "board" | "laminate";
  allowSameAsFront: boolean;
  needsThickness: boolean;
  onPick: (s: MaterialSelection) => void;
}) {
  const [facets, setFacets] = useState<StudioMaterialFacets | null>(null);
  const [items, setItems] = useState<StudioMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [grade, setGrade] = useState("");
  const [thickness, setThickness] = useState("");

  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ brand: "", code: "", finish: "" });

  // The board row a customer tapped, waiting for a thickness choice.
  const [pending, setPending] = useState<StudioMaterial | null>(null);
  const [pendingThickness, setPendingThickness] = useState("");

  const reqId = useRef(0);

  const load = useCallback(
    async (opts: { append?: boolean } = {}) => {
      const id = ++reqId.current;
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({ kind });
      if (q) params.set("q", q);
      if (brand) params.set("brand", brand);
      if (grade) params.set("grade", grade);
      if (thickness) params.set("thickness", thickness);
      if (opts.append) params.set("offset", String(items.length));
      if (!facets) params.set("facets", "1");

      try {
        const res = await fetch(`/api/studio/materials?${params}`);
        if (!res.ok) throw new Error(String(res.status));
        const data: ApiResponse = await res.json();
        if (id !== reqId.current) return; // a newer request already landed
        if (data.facets) setFacets(data.facets);
        setItems((prev) => (opts.append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch {
        if (id === reqId.current) setError(true);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    // items.length is read for the append offset; intentionally not a dep or
    // every list change would refire the search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, q, brand, grade, thickness, facets]
  );

  // Debounced reload on any filter change.
  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, brand, grade, thickness]);

  function confirmCatalogue(m: StudioMaterial, chosenThickness: string | null) {
    onPick({
      kind: "catalogue",
      slug: m.slug,
      name: m.name,
      brand: m.brand,
      label: [m.brand, m.name, chosenThickness].filter(Boolean).join(" · "),
      thickness: chosenThickness,
      sheetPrice: m.sheetPrice,
      href: m.href,
    });
  }

  function pick(m: StudioMaterial) {
    if (needsThickness && m.thicknesses.length > 1) {
      setPending(m);
      setPendingThickness(preferredThickness(m.thicknesses));
      return;
    }
    confirmCatalogue(m, needsThickness ? (m.thicknesses[0] ?? null) : null);
  }

  return (
    <div className="border-t p-3.5" style={{ borderColor: "var(--studio-line)" }}>
      {allowSameAsFront ? (
        <button
          type="button"
          onClick={() => onPick({ kind: "same-as-front" })}
          className="mb-3 min-h-11 w-full rounded-[3px] border px-3 text-left text-[12.5px] font-medium transition-colors"
          style={{ borderColor: "var(--studio-line)" }}
        >
          Use the same laminate as the front face
        </button>
      ) : null}

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={kind === "board" ? "Search boards…" : "Search shade or code…"}
          className="min-h-11 min-w-0 flex-1 rounded-[3px] border px-2.5 text-[13px]"
          style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <FilterSelect label="Brand" value={brand} onChange={setBrand} options={(facets?.brands ?? []).map((b) => ({ value: b.name, label: `${b.name} (${b.count})` }))} />
        {kind === "board" ? (
          <FilterSelect label="Grade" value={grade} onChange={setGrade} options={(facets?.grades ?? []).map((g) => ({ value: g, label: g }))} />
        ) : null}
        <FilterSelect label="Thickness" value={thickness} onChange={setThickness} options={(facets?.thicknesses ?? []).map((t) => ({ value: t, label: t }))} />
      </div>

      {/* thickness step for a chosen board */}
      {pending ? (
        <div className="mt-3 rounded-[3px] border p-3" style={{ borderColor: "var(--burgundy)", background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))" }}>
          <p className="text-[12.5px] font-semibold">
            {pending.brand} {pending.name}
          </p>
          <p className="mt-1 text-[11.5px]" style={{ color: "var(--ink-soft)" }}>
            Which thickness are you pressing?
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pending.thicknesses.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPendingThickness(t)}
                aria-pressed={t === pendingThickness}
                className="min-h-9 rounded-[2px] border px-2.5 text-[12px]"
                style={{
                  borderColor: t === pendingThickness ? "var(--burgundy)" : "var(--studio-line-strong)",
                  color: t === pendingThickness ? "var(--burgundy)" : "var(--ink)",
                  fontWeight: t === pendingThickness ? 600 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => confirmCatalogue(pending, pendingThickness)}
              className="min-h-11 rounded-[3px] px-3 text-[12.5px] font-semibold text-white"
              style={{ background: "var(--burgundy)" }}
            >
              Use this board
            </button>
            <button type="button" onClick={() => setPending(null)} className="min-h-11 px-1 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {/* results */}
      {!pending ? (
        <>
          <p className="mt-3 text-[11px]" style={{ color: "var(--ink-faint)" }}>
            {error ? "Search unavailable — enter it manually below." : loading && items.length === 0 ? "Searching…" : `${total} match${total === 1 ? "" : "es"}`}
          </p>
          <ul className="mt-1.5 max-h-72 divide-y overflow-y-auto" style={{ borderColor: "var(--studio-line)" }}>
            {items.map((m) => (
              <li key={m.slug} className="border-t first:border-t-0" style={{ borderColor: "var(--studio-line)" }}>
                <button
                  type="button"
                  onClick={() => pick(m)}
                  className="flex min-h-11 w-full items-start gap-3 py-2 text-left transition-colors hover:bg-[var(--stone-deep)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium">{m.name}</span>
                    <span className="block truncate text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                      {[m.brand, m.collection, m.grade, m.finish].filter(Boolean).join(" · ")}
                      {m.thicknesses.length ? ` · ${m.thicknesses.slice(0, 4).join(", ")}${m.thicknesses.length > 4 ? "…" : ""}` : ""}
                    </span>
                  </span>
                  <span className="metric shrink-0 whitespace-nowrap text-[11.5px]" style={{ color: m.sheetPrice ? "var(--ink-soft)" : "var(--ink-faint)" }}>
                    {m.sheetPrice ? `${m.sheetPrice.from ? "from " : ""}${inr(m.sheetPrice.amount)}` : "On request"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <button type="button" onClick={() => load({ append: true })} className="mt-2 inline-flex min-h-11 items-center text-[12px] font-semibold" style={{ color: "var(--burgundy)" }}>
              Load more
            </button>
          ) : null}

          {/* manual entry */}
          <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--studio-line)" }}>
            <button type="button" onClick={() => setManualOpen((v) => !v)} aria-expanded={manualOpen} className="inline-flex min-h-11 items-center text-[12.5px] font-semibold" style={{ color: "var(--burgundy)" }}>
              Can&rsquo;t find it? Enter it manually <span aria-hidden="true">{manualOpen ? "▴" : "▾"}</span>
            </button>
            {manualOpen ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <ManualInput label="Brand" value={manual.brand} onChange={(v) => setManual((m) => ({ ...m, brand: v }))} />
                <ManualInput label={kind === "board" ? "Grade / code" : "Shade code"} value={manual.code} onChange={(v) => setManual((m) => ({ ...m, code: v }))} />
                <ManualInput label={kind === "board" ? "Thickness" : "Finish"} value={manual.finish} onChange={(v) => setManual((m) => ({ ...m, finish: v }))} />
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    disabled={!manual.brand.trim()}
                    onClick={() => onPick({ kind: "manual", brand: manual.brand.trim(), code: manual.code.trim(), finish: manual.finish.trim() })}
                    className="min-h-11 rounded-[3px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
                    style={{ background: "var(--burgundy)" }}
                  >
                    Use these details
                  </button>
                  <span className="ml-2 text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    Priced on your order, not in this estimate.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function preferredThickness(list: string[]): string {
  return list.find((t) => /(^|[^0-9])19/.test(t)) ?? list.find((t) => /18/.test(t)) ?? list[0];
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-faint)" }}>
      <span className="tracked-caps">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-[3px] border px-2 text-[12px]"
        style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)", color: "var(--ink)" }}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ManualInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="tracked-caps block text-[9px]" style={{ color: "var(--ink-faint)" }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 min-h-11 w-full rounded-[3px] border px-2 text-[12.5px]"
        style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
      />
    </label>
  );
}
