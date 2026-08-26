"use client";

import { useMemo, useState } from "react";
import { parsePercentCell, parseRateCell, type RateGridRow } from "@/lib/catalogue/rateGrid";
import { saveProductRates, type SaveResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

const CELL_CLASS = "w-32 rounded-md border px-2 py-1 text-sm";
const CELL_STYLE = { borderColor: "var(--line)", background: "var(--card)" };

function cellState(raw: string) {
  const parsed = parseRateCell(raw);
  if (parsed.kind === "invalid") return { tone: "var(--burgundy)", note: "not a number" };
  if (parsed.kind === "not-stocked") return { tone: "var(--line-strong)", note: "removes this thickness" };
  if (parsed.kind === "blank") return { tone: "var(--line-strong)", note: "unpriced" };
  return { tone: "var(--burgundy)", note: "" };
}

export function RateGridEditor({
  slug,
  initialRows,
  hasVariants,
  initialDiscount,
  initialCashback,
  packPricing,
}: {
  slug: string;
  initialRows: RateGridRow[];
  hasVariants: boolean;
  initialDiscount: string;
  initialCashback: string;
  /** Per-pack price table (the Fevicol range) — no single object to hang an offer on. */
  packPricing: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [discount, setDiscount] = useState(initialDiscount);
  const [cashback, setCashback] = useState(initialCashback);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, setPending] = useState(false);

  const summary = useMemo(() => {
    const parsed = rows.map((row) => parseRateCell(row.rate));
    return {
      priced: parsed.filter((p) => p.kind === "rate").length,
      blank: parsed.filter((p) => p.kind === "blank").length,
      invalid: parsed.filter((p) => p.kind === "invalid").length,
      notStocked: parsed.filter((p) => p.kind === "not-stocked").length,
    };
  }, [rows]);

  // The headline band only re-derives from a complete grid — mirror that rule
  // here so the editor tells you before you save, not after.
  const bandWillSync = summary.priced > 0 && summary.blank === 0 && summary.invalid === 0;

  // Cheapest rate currently typed into the grid, so the discount field can
  // show what it does before anyone commits to it.
  const previewRate = useMemo(() => {
    const values = rows.map((row) => parseRateCell(row.rate)).flatMap((p) => (p.kind === "rate" ? [p.value] : []));
    return values.length ? Math.min(...values) : null;
  }, [rows]);

  const discountState = parsePercentCell(discount);
  const cashbackState = parsePercentCell(cashback);
  const offersInvalid = discountState.kind === "invalid" || cashbackState.kind === "invalid";

  function setRate(index: number, rate: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, rate } : row)));
    setResult(null);
  }

  async function handleSave() {
    setPending(true);
    setResult(null);
    setResult(await saveProductRates(slug, rows, discount, cashback));
    setPending(false);
  }

  // Products with no thicknesses on file (most laminates and veneers) have no
  // grid to fill, but they can still carry an offer — so the section renders
  // without the table rather than returning early and hiding the discount field.
  const hasGrid = rows.length > 0;

  const showCore = new Set(rows.map((r) => r.core)).size > 1;
  const showSize = new Set(rows.map((r) => r.size)).size > 1;

  return (
    <div className="mt-4">
      {!hasGrid ? (
        <p className="text-sm" style={{ color: "var(--line-strong)" }}>
          No thicknesses on file for this product, so there is nothing to rate. Add them under Product fields if it is sold
          by thickness.
        </p>
      ) : null}
      {hasGrid ? (
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              {showCore ? <th className="px-3 py-2 text-left font-medium">Core</th> : null}
              {showSize ? <th className="px-3 py-2 text-left font-medium">Sheet size</th> : null}
              <th className="px-3 py-2 text-left font-medium">Thickness</th>
              <th className="px-3 py-2 text-left font-medium">Rate</th>
              <th className="px-3 py-2 text-left font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const state = cellState(row.rate);
              return (
                <tr key={`${row.core}-${row.size}-${row.thickness}-${index}`} style={{ borderBottom: "1px solid var(--line)" }}>
                  {showCore ? (
                    <td className="px-3 py-1.5" style={{ color: "var(--line-strong)" }}>
                      {row.core}
                    </td>
                  ) : null}
                  {showSize ? (
                    <td className="px-3 py-1.5" style={{ color: "var(--line-strong)" }}>
                      {row.size || "—"}
                    </td>
                  ) : null}
                  <td className="px-3 py-1.5 font-medium">{row.thickness}</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.rate}
                      onChange={(event) => setRate(index, event.target.value)}
                      placeholder="blank = unpriced"
                      className={CELL_CLASS}
                      style={CELL_STYLE}
                      aria-label={`Rate for ${row.thickness}`}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-xs" style={{ color: state.tone }}>
                    {state.note}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : null}

      {hasGrid ? (
      <>
      <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
        {summary.priced} priced · {summary.blank} unpriced · {summary.notStocked} marked not stocked
        {summary.invalid > 0 ? ` · ${summary.invalid} invalid` : ""}
        {hasVariants ? "" : " · this product has no rates yet"}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        {bandWillSync
          ? "Saving will also re-derive the headline price band from these rates."
          : "The headline price band is left alone until every stocked thickness has a rate."}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        Row order sets the product page&apos;s default thickness — the first row wins.
      </p>
      </>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="text-xs" style={{ color: "var(--line-strong)" }}>
            <span className="font-medium" style={{ color: "var(--ink)" }}>
              Discount
            </span>
            <span>
              {" "}
              · fixed percentage off the rates above. The product page strikes through the list price and shows the
              discounted one. Leave empty for none.
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={discount}
              onChange={(event) => {
                setDiscount(event.target.value);
                setResult(null);
              }}
              disabled={packPricing}
              placeholder={packPricing ? "not available on per-pack pricing" : "empty = no discount"}
              className="mt-1 block w-40 rounded-md border px-2 py-1 text-sm disabled:opacity-50"
              style={CELL_STYLE}
            />
          </label>
          {discountState.kind === "invalid" ? (
            <p className="mt-1 text-xs" style={{ color: "var(--burgundy)" }}>
              Enter a percentage between 0 and 100, or leave it empty.
            </p>
          ) : null}
          {discountState.kind === "pct" && previewRate !== null ? (
            <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
              Cheapest rate above becomes ₹{Math.round(previewRate * (1 - discountState.value / 100))} (was ₹{previewRate}).
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-xs" style={{ color: "var(--line-strong)" }}>
            <span className="font-medium" style={{ color: "var(--ink)" }}>
              Cashback
            </span>
            <span>
              {" "}
              · shown as &ldquo;Instant Cashback up to X%&rdquo;. Not subtracted from the price — the real figure is settled
              in conversation. Leave empty for none.
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={cashback}
              onChange={(event) => {
                setCashback(event.target.value);
                setResult(null);
              }}
              disabled={packPricing}
              placeholder={packPricing ? "not available on per-pack pricing" : "empty = no cashback"}
              className="mt-1 block w-40 rounded-md border px-2 py-1 text-sm disabled:opacity-50"
              style={CELL_STYLE}
            />
          </label>
          {cashbackState.kind === "invalid" ? (
            <p className="mt-1 text-xs" style={{ color: "var(--burgundy)" }}>
              Enter a percentage between 0 and 100, or leave it empty.
            </p>
          ) : null}
        </div>

        {packPricing ? (
          <p className="text-xs sm:col-span-2" style={{ color: "var(--line-strong)" }}>
            This product is priced per pack size, which has no single price table to attach an offer to.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={pending || summary.invalid > 0 || offersInvalid}>
          {pending ? "Saving…" : "Save rates"}
        </Button>
        {result ? (
          <span className="text-sm" style={{ color: result.ok ? "var(--line-strong)" : "var(--burgundy)" }}>
            {result.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
