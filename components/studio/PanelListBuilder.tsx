"use client";

import { useMemo, useState } from "react";
import { inr } from "@/lib/studio/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Panel Processing is a professional's tool, so it opens as a table, not as a
 * card grid: rows of panel sizes with quantities, the way a cutting list is
 * already written. Everything recalculates as rows change, and the totals are
 * the ones a carpenter checks — panel count, cut metres, banding metres.
 */

type Row = { id: string; label: string; w: number; h: number; qty: number; band: number };

const RATES = {
  cut: 26, // ₹ per running ft of saw cut
  band: 42, // ₹ per running ft of edge banding
  drill: 34, // ₹ per panel, line drilling to 32 mm system
  groove: 38, // ₹ per running ft of groove
  handling: 18, // ₹ per panel
};

let seq = 0;
const newRow = (label = "", w = 2, h = 7, qty = 1, band = 2): Row => ({
  id: `r${++seq}`,
  label,
  w,
  h,
  qty,
  band,
});

const STARTER: Row[] = [
  newRow("Wardrobe shutter", 2, 7, 4, 4),
  newRow("Carcass side", 2, 8, 4, 1),
  newRow("Shelf", 2, 1.5, 12, 1),
];

export function PanelListBuilder() {
  const [rows, setRows] = useState<Row[]>(STARTER);
  const [drill, setDrill] = useState(true);
  const [groove, setGroove] = useState(false);

  const totals = useMemo(() => {
    let panels = 0;
    let cutFt = 0;
    let bandFt = 0;
    let grooveFt = 0;
    for (const r of rows) {
      const qty = Math.max(0, Math.round(r.qty));
      panels += qty;
      // Perimeter of every panel is what the saw travels, near enough.
      cutFt += qty * 2 * (r.w + r.h);
      // Banded edges: 1 = one long edge, 2 = both long, 4 = all round.
      const perimeterOfBanded = r.band >= 4 ? 2 * (r.w + r.h) : r.band * r.h;
      bandFt += qty * perimeterOfBanded;
      grooveFt += groove ? qty * r.w : 0;
    }
    const cut = cutFt * RATES.cut;
    const band = bandFt * RATES.band;
    const drilling = drill ? panels * RATES.drill : 0;
    const grooving = grooveFt * RATES.groove;
    const handling = panels * RATES.handling;
    return {
      panels,
      cutFt: Math.round(cutFt),
      bandFt: Math.round(bandFt),
      cut: Math.round(cut),
      band: Math.round(band),
      drilling: Math.round(drilling),
      grooving: Math.round(grooving),
      handling: Math.round(handling),
      total: Math.round(cut + band + drilling + grooving + handling),
    };
  }, [rows, drill, groove]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const numberInput =
    "w-full rounded-[2px] border bg-transparent px-2 py-1.5 text-[13px] tabular-nums outline-none transition-colors focus:border-[var(--burgundy)]";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div className="min-w-0">
        <div className="overflow-x-auto rounded-[3px] border" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
                <th className="px-3 py-2.5 text-left font-semibold">Panel</th>
                <th className="px-3 py-2.5 text-left font-semibold">Width (ft)</th>
                <th className="px-3 py-2.5 text-left font-semibold">Height (ft)</th>
                <th className="px-3 py-2.5 text-left font-semibold">Qty</th>
                <th className="px-3 py-2.5 text-left font-semibold">Banded edges</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "var(--studio-line)" }}>
                  <td className="px-3 py-2">
                    <input
                      value={r.label}
                      onChange={(e) => update(r.id, { label: e.target.value })}
                      placeholder="Description"
                      aria-label="Panel description"
                      className={`${numberInput} min-w-[140px]`}
                      style={{ borderColor: "var(--studio-line)" }}
                    />
                  </td>
                  {(["w", "h", "qty"] as const).map((k) => (
                    <td key={k} className="px-3 py-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={k === "qty" ? 1 : 0.25}
                        step={k === "qty" ? 1 : 0.25}
                        value={r[k]}
                        onChange={(e) => update(r.id, { [k]: Number(e.target.value) || 0 } as Partial<Row>)}
                        aria-label={k === "qty" ? "Quantity" : k === "w" ? "Width in feet" : "Height in feet"}
                        className={`${numberInput} w-[84px]`}
                        style={{ borderColor: "var(--studio-line)" }}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <select
                      value={r.band}
                      onChange={(e) => update(r.id, { band: Number(e.target.value) })}
                      aria-label="Banded edges"
                      className={`${numberInput} w-[120px]`}
                      style={{ borderColor: "var(--studio-line)" }}
                    >
                      <option value={0}>None</option>
                      <option value={1}>1 long edge</option>
                      <option value={2}>2 long edges</option>
                      <option value={4}>All four</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                      aria-label={`Remove ${r.label || "row"}`}
                      className="flex h-11 w-11 items-center justify-center text-[16px] leading-none transition-colors hover:text-[var(--burgundy)]"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, newRow()])}
            className="rounded-[3px] border px-3.5 py-2 text-[13px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
            style={{ borderColor: "var(--studio-line-strong)" }}
          >
            + Add panel
          </button>
          {[
            { on: drill, set: setDrill, label: "Line drilling (32 mm)" },
            { on: groove, set: setGroove, label: "Grooving" },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => t.set(!t.on)}
              aria-pressed={t.on}
              className="rounded-[3px] border px-3.5 py-2 text-[13px] transition-colors"
              style={{
                borderColor: t.on ? "var(--burgundy)" : "var(--studio-line)",
                color: t.on ? "var(--burgundy)" : "var(--ink-soft)",
                background: t.on ? "color-mix(in srgb, var(--burgundy) 6%, transparent)" : "transparent",
                fontWeight: t.on ? 600 : 400,
              }}
            >
              {t.on ? "✓ " : ""}
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-snug" style={{ color: "var(--ink-faint)" }}>
          Boards are not included — this prices the machining on panels you already have or are buying separately.
          Add pressing or supply on the same order and it moves onto one quote.
        </p>
      </div>

      <div className="self-start rounded-[3px] border" style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}>
        <div className="border-b p-4" style={{ borderColor: "var(--studio-line)" }} role="status" aria-live="polite">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Machining estimate
          </p>
          <p className="metric mt-1 text-[32px] leading-none">{inr(totals.total)}</p>
          <p className="metric mt-1 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
            {totals.panels} panels · {totals.cutFt} ft of cut · {totals.bandFt} ft banded
          </p>
        </div>
        <ul className="p-4">
          {[
            ["Panel cutting", totals.cut, `${totals.cutFt} ft × ₹${RATES.cut}`],
            ["Edge banding", totals.band, `${totals.bandFt} ft × ₹${RATES.band}`],
            ["Line drilling", totals.drilling, drill ? `${totals.panels} panels × ₹${RATES.drill}` : "not selected"],
            ["Grooving", totals.grooving, groove ? `per panel width × ₹${RATES.groove}` : "not selected"],
            ["Handling & packing", totals.handling, `${totals.panels} panels × ₹${RATES.handling}`],
          ]
            .filter(([, amount]) => (amount as number) > 0)
            .map(([label, amount, detail]) => (
              <li
                key={label as string}
                className="flex items-start justify-between gap-3 border-t py-2 first:border-t-0"
                style={{ borderColor: "var(--studio-line)" }}
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium">{label as string}</span>
                  <span className="block text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    {detail as string}
                  </span>
                </span>
                <span className="metric shrink-0 text-[12.5px]">{inr(amount as number)}</span>
              </li>
            ))}
        </ul>
        <div className="p-4 pt-0">
          <a
            href={buildWhatsAppUrl(
              `Studio EightxFour — panel processing\n\n${rows
                .map((r) => `• ${r.label || "Panel"} — ${r.w}′ × ${r.h}′ × ${r.qty} nos, ${r.band === 4 ? "all edges" : `${r.band} edge(s)`} banded`)
                .join("\n")}\n${drill ? "• Line drilling (32 mm)\n" : ""}${groove ? "• Grooving\n" : ""}\nIndicative machining estimate: ${inr(
                totals.total
              )}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white"
            style={{ background: "var(--burgundy)" }}
          >
            Send this list
          </a>
          <p className="mt-2 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
            Indicative estimate on demo rates. Regular volume is quoted on a running rate card instead.
          </p>
        </div>
      </div>
    </div>
  );
}
