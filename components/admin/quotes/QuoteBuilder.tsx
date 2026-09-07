"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import type { QuoteBuilderData, BuilderOption } from "@/lib/data/quotes";
import type { QuoteItemRow } from "@/lib/supabase/types";
import {
  addOption,
  applyRatesToOption,
  createNewVersion,
  markQuoteReady,
  removeOption,
  saveQuoteDraft,
  saveQuoteItem,
  setPricingDisplay,
  updateOptionCharges,
  updateQuoteTerms,
} from "@/app/(admin)/admin/quotes/actions";
import { DEFAULT_QUOTE_TERMS, TERM_FIELDS, TERM_LABELS, mergeTerms } from "@/lib/customer-quote";
import {
  GST_RATES,
  PRICING_BASES,
  PRICING_BASIS_LABELS,
  RATE_INPUT_MODES,
  RATE_INPUT_MODE_LABELS,
  basisUnit,
  basisUsesArea,
  type PricingBasis,
} from "@/lib/rate-book";
import { computeLine, formatINR, formatINR0, formatRate } from "@/lib/quote-math";
import { quoteDisplayStatus, type QuoteTone } from "@/lib/quote-status";
import { useAction } from "./useAction";

const FIELD = "w-full rounded border px-2 py-1 text-sm";
const FS = { borderColor: "var(--line)", background: "var(--paper)" } as const;
const BUILDER_TONE: Record<QuoteTone, { background: string; color: string }> = {
  draft: { background: "var(--card)", color: "var(--line-strong)" },
  ready: { background: "color-mix(in srgb, #1a7f4b 14%, var(--paper))", color: "#136138" },
  sent: { background: "color-mix(in srgb, var(--burgundy) 12%, var(--paper))", color: "var(--burgundy)" },
  revision: { background: "color-mix(in srgb, #b8860b 16%, var(--paper))", color: "#7a5b00" },
};

const TH = "px-2 py-1.5 text-left font-medium whitespace-nowrap";
const TD = "px-2 py-1.5 align-top";

type RateCandidate = {
  id: string;
  brand: string | null;
  product_name: string | null;
  range_name: string | null;
  thickness: string | null;
  pricing_basis: string;
  rate: number;
  rate_input_mode: string;
  gst_rate: number;
  sheet_area_sqft: number | null;
  warranty_text: string | null;
};

export function QuoteBuilder({ data }: { data: QuoteBuilderData }) {
  const { quote, enquiry, customer, versions, version, readOnly, options, valueRange, enquiryItems } = data;
  const { pending, result, run } = useAction();
  const inclusive = version.pricing_display === "INCL_GST";
  const display = quoteDisplayStatus(
    quote.status,
    versions.map((v) => ({ version_no: v.version_no, status: v.status, frozen_at: v.frozen_at, sent_at: v.sent_at }))
  );
  const viewingLabel = version.sent_at
    ? "Sent"
    : version.frozen_at
      ? "Frozen"
      : version.status === "READY"
        ? "Ready"
        : "Draft";

  // Requirement rows, aligned across options by enquiry_item_id.
  const requirementRows = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const it of enquiryItems) {
      const k = it.id;
      if (!seen.has(k)) { seen.add(k); keys.push(k); }
    }
    // Any option line without an enquiry_item_id (rare) tacked on after.
    for (const o of options) {
      for (const l of o.lines) {
        const k = l.item.enquiry_item_id ?? `loose-${l.item.id}`;
        if (!seen.has(k)) { seen.add(k); keys.push(k); }
      }
    }
    return keys.map((key) => {
      const enq = enquiryItems.find((e) => e.id === key) ?? null;
      const label =
        enq
          ? [enq.thickness, enq.requested_product, enq.material, enq.category].find((v) => v?.trim()) ?? enq.notes ?? "Line"
          : "Added line";
      const qty = enq?.quantity ?? null;
      const unit = enq?.unit ?? null;
      const perOption = options.map((o) => o.lines.find((l) => (l.item.enquiry_item_id ?? `loose-${l.item.id}`) === key) ?? null);
      return { key, label, qty, unit, perOption };
    });
  }, [enquiryItems, options]);

  const [editing, setEditing] = useState<string | null>(null); // quote_item id
  const [addingOption, setAddingOption] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* -------- header -------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/enquiries/${enquiry.id}`} className="text-sm" style={{ color: "var(--line-strong)" }}>
              ← {enquiry.ref}
            </Link>
            <h1 className="serif text-lg">{quote.ref}</h1>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={BUILDER_TONE[display.tone]}
            >
              {display.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
            Viewing: V{version.version_no} · {viewingLabel} ·{" "}
            {display.lastSent && display.lastSent.versionNo !== version.version_no ? (
              <>
                Previously sent: V{display.lastSent.versionNo} ·{" "}
                {new Date(display.lastSent.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
              </>
            ) : null}
            {options.length} option{options.length === 1 ? "" : "s"} ·{" "}
            {valueRange
              ? valueRange.min === valueRange.max
                ? formatINR0(valueRange.min)
                : `${formatINR0(valueRange.min)} – ${formatINR0(valueRange.max)} (alternatives, not a total)`
              : "no priced options yet"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
            {customer?.name ?? enquiry.name}
            {customer?.company ? ` · ${customer.company}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {versions.map((v) => (
            <Link
              key={v.id}
              href={v.version_no === version.version_no ? `/admin/quotes/${quote.id}` : `/admin/quotes/${quote.id}?v=${v.version_no}`}
              className="rounded border px-2 py-1 text-xs"
              style={{
                borderColor: v.version_no === version.version_no ? "var(--burgundy)" : "var(--line)",
                color: v.version_no === version.version_no ? "var(--burgundy)" : "var(--line-strong)",
                fontWeight: v.version_no === version.version_no ? 600 : 400,
              }}
            >
              V{v.version_no}
              {v.frozen_at ? " 🔒" : ""}
            </Link>
          ))}
        </div>
      </div>

      {readOnly ? (
        <p className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}>
          V{version.version_no} is finalised and read-only{version.sent_at ? " and was sent to the customer" : ""}. Its amounts will never change.
          {versions[0].version_no === version.version_no ? " Create a new version to revise." : " A newer version exists."}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span style={{ color: "var(--line-strong)" }}>Customer sees rates:</span>
          <div className="inline-flex rounded border" style={{ borderColor: "var(--line)" }}>
            {RATE_INPUT_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => run(() => setPricingDisplay(quote.id, m))}
                className="px-2 py-1"
                style={
                  (m === "INCL_GST") === inclusive
                    ? { background: "var(--burgundy)", color: "var(--paper)" }
                    : { color: "var(--line-strong)" }
                }
              >
                {RATE_INPUT_MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <span style={{ color: "var(--line-strong)" }}>· presentation only — the money is identical either way</span>
        </div>
      )}

      {result ? (
        <p className="text-xs" style={{ color: result.ok ? "#136138" : "var(--burgundy)" }}>{result.message}</p>
      ) : null}

      {/* -------- comparison table -------- */}
      {options.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--line-strong)" }}>No options yet. Add the first alternative below.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--line)" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th className={TH} rowSpan={2}>Requirement</th>
                <th className={TH} rowSpan={2}>Qty</th>
                {options.map((o) => (
                  <th key={o.option.id} className={`${TH} border-l text-center`} colSpan={2} style={{ borderColor: "var(--line)" }}>
                    <div className="font-semibold">{o.option.label}</div>
                    <div className="text-[10px] font-normal" style={{ color: "var(--line-strong)" }}>
                      {[o.option.brand, o.option.range_name, o.option.warranty_text].filter(Boolean).join(" · ") || "—"}
                    </div>
                    {!readOnly ? (
                      <div className="mt-0.5 flex justify-center gap-2 text-[10px] font-normal">
                        <button type="button" className="underline-offset-2 hover:underline" onClick={() => run(() => applyRatesToOption(quote.id, o.option.id))}>
                          Apply rates
                        </button>
                        <button type="button" className="underline-offset-2 hover:underline" style={{ color: "var(--burgundy)" }} onClick={() => {
                          if (confirm(`Remove option “${o.option.label}”?`)) run(() => removeOption(quote.id, o.option.id));
                        }}>
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {options.map((o) => (
                  <Fragment key={o.option.id}>
                    <th className={`${TH} border-l text-right`} style={{ borderColor: "var(--line)" }}>Rate</th>
                    <th className={`${TH} text-right`}>Amount{inclusive ? " incl GST" : " + GST"}</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {requirementRows.map((row) => (
                <RowGroup
                  key={row.key}
                  row={row}
                  options={options}
                  inclusive={inclusive}
                  readOnly={readOnly}
                  quoteId={quote.id}
                  editing={editing}
                  setEditing={setEditing}
                  run={run}
                  pending={pending}
                />
              ))}
              <tr style={{ borderTop: "2px solid var(--line)" }}>
                <td className={`${TD} font-semibold`}>Material taxable</td>
                <td className={TD}></td>
                {options.map((o) => (
                  <td key={o.option.id} className={`${TD} border-l text-right font-semibold`} colSpan={2} style={{ borderColor: "var(--line)" }}>
                    {formatINR(o.totals.materialTaxable)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* -------- per-option summary + charges -------- */}
      {options.length > 0 ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, minmax(0, 1fr))` }}>
          {options.map((o) => (
            <OptionSummary key={o.option.id} o={o} readOnly={readOnly} quoteId={quote.id} run={run} pending={pending} />
          ))}
        </div>
      ) : null}

      {/* -------- add option -------- */}
      {!readOnly ? (
        addingOption ? (
          <AddOptionForm
            quoteId={quote.id}
            onDone={() => setAddingOption(false)}
            run={run}
            pending={pending}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingOption(true)}
            className="self-start rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--line)" }}
          >
            + Add option
          </button>
        )
      ) : null}

      {/* -------- commercial terms -------- */}
      {!readOnly ? <TermsEditor quoteId={quote.id} version={version} run={run} pending={pending} /> : null}

      {/* -------- actions -------- */}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
        {!readOnly ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveQuoteDraft(quote.id))}
              className="rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--burgundy)", color: "var(--paper)" }}
            >
              Save draft
            </button>
            <MarkReadyButton quoteId={quote.id} run={run} pending={pending} />
          </>
        ) : (
          <>
            <Link
              href={`/admin/quotes/${quote.id}/preview?v=${version.version_no}`}
              className="rounded-md px-4 py-1.5 text-sm font-medium"
              style={{ background: "var(--burgundy)", color: "var(--paper)" }}
            >
              Preview customer quote
            </Link>
            <a
              href={`/admin/quotes/${quote.id}/pdf?v=${version.version_no}`}
              className="rounded-md border px-4 py-1.5 text-sm"
              style={{ borderColor: "var(--line)" }}
            >
              Download PDF
            </a>
            {version.sent_at ? (
              <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                Sent {new Date(version.sent_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </span>
            ) : null}
          </>
        )}
        <NewVersionButton quoteId={quote.id} run={run} pending={pending} canRevise={versions[0].version_no === version.version_no} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------- row group --

interface Row {
  key: string;
  label: string;
  qty: number | null;
  unit: string | null;
  perOption: (BuilderOption["lines"][number] | null)[];
}

function RowGroup({
  row,
  options,
  inclusive,
  readOnly,
  quoteId,
  editing,
  setEditing,
  run,
  pending,
}: {
  row: Row;
  options: QuoteBuilderData["options"];
  inclusive: boolean;
  readOnly: boolean;
  quoteId: string;
  editing: string | null;
  setEditing: (v: string | null) => void;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
}) {
  const openItem = row.perOption.find((l) => l && l.item.id === editing)?.item ?? null;

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--line)" }}>
        <td className={TD}>{row.label}</td>
        <td className={TD} style={{ color: "var(--line-strong)" }}>
          {row.qty ?? "—"} {row.unit ?? ""}
        </td>
        {row.perOption.map((l, i) => {
          const opt = options[i];
          if (!l) {
            return (
              <td key={opt.option.id} className="border-l px-2 py-1.5 text-center text-xs" colSpan={2} style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                —
              </td>
            );
          }
          const unit = basisUnit(l.item.pricing_basis);
          const rateShown = inclusive ? l.rateInclGst : l.baseRateExGst;
          return (
            <Fragment key={opt.option.id}>
              <td className="border-l px-2 py-1.5 text-right" style={{ borderColor: "var(--line)" }}>
                {l.priced ? (
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setEditing(editing === l.item.id ? null : l.item.id)}
                    className="hover:underline"
                    style={{ color: l.item.is_overridden ? "var(--burgundy)" : undefined }}
                  >
                    {l.item.pricing_basis === "MANUAL"
                      ? "manual"
                      : `${formatRate(rateShown ?? 0)}${unit ? ` / ${unit}` : ""}`}
                    {l.item.is_overridden ? " ✎" : ""}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setEditing(editing === l.item.id ? null : l.item.id)}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium hover:underline"
                    style={{ background: "color-mix(in srgb, var(--burgundy) 12%, var(--paper))", color: "var(--burgundy)" }}
                  >
                    UNRESOLVED
                  </button>
                )}
              </td>
              <td className="px-2 py-1.5 text-right">
                {l.priced ? formatINR(inclusive ? l.amountInclGst : l.taxableAmount) : "—"}
              </td>
            </Fragment>
          );
        })}
      </tr>
      {openItem && !readOnly ? (
        <tr>
          <td colSpan={2 + options.length * 2} className="border-b px-2 py-3" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <LineEditor
              key={openItem.id}
              quoteId={quoteId}
              item={openItem}
              optionLabel={options[row.perOption.findIndex((l) => l?.item.id === openItem.id)]?.option.label ?? ""}
              onDone={() => setEditing(null)}
              run={run}
              pending={pending}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

// -------------------------------------------------------------- line editor --

function LineEditor({
  quoteId,
  item,
  optionLabel,
  onDone,
  run,
  pending,
}: {
  quoteId: string;
  item: QuoteItemRow;
  optionLabel: string;
  onDone: () => void;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
}) {
  const [basis, setBasis] = useState<PricingBasis>(item.pricing_basis as PricingBasis);
  const [mode, setMode] = useState(item.rate_input_mode);
  const [gst, setGst] = useState(String(item.gst_rate));
  const [rate, setRate] = useState(item.entered_rate == null ? "" : String(item.entered_rate));
  const [manual, setManual] = useState(item.manual_amount == null ? "" : String(item.manual_amount));
  const [qty, setQty] = useState(String(item.quantity));
  const [area, setArea] = useState(item.sheet_area_sqft == null ? "" : String(item.sheet_area_sqft));
  const [discount, setDiscount] = useState(String(item.line_discount));
  const [candidates, setCandidates] = useState<RateCandidate[] | null>(null);

  const usesArea = basisUsesArea(basis);
  const unit = basisUnit(basis);

  const preview = useMemo(() => {
    return computeLine({
      basis,
      quantity: Number(qty) || 0,
      sheetAreaSqft: usesArea ? Number(area) || null : null,
      gstRate: Number(gst) || 0,
      inputMode: mode as "EX_GST" | "INCL_GST",
      enteredRate: basis === "MANUAL" ? null : Number(rate) || null,
      lineDiscount: Number(discount) || 0,
      manualAmount: basis === "MANUAL" ? Number(manual) || null : null,
    });
  }, [basis, qty, area, gst, mode, rate, discount, manual, usesArea]);

  const overrideDiff =
    item.rate_book_id != null && item.rate_book_rate_snapshot != null && Number(rate) > 0
      ? Number(rate) - Number(item.rate_book_rate_snapshot)
      : 0;

  async function loadCandidates() {
    const p = new URLSearchParams();
    if (item.brand) p.set("brand", item.brand);
    if (item.thickness) p.set("thickness", item.thickness);
    if (optionLabel) p.set("label", optionLabel);
    if (item.range_name) p.set("range", item.range_name);
    const res = await fetch(`/admin/quotes/rate-candidates?${p.toString()}`);
    const body = (await res.json()) as { rates: RateCandidate[] };
    setCandidates(body.rates ?? []);
  }

  function save() {
    const fd = new FormData();
    fd.set("pricing_basis", basis);
    fd.set("quantity", qty);
    fd.set("rate_input_mode", mode);
    fd.set("gst_rate", gst);
    fd.set("line_discount", discount);
    if (basis === "MANUAL") fd.set("manual_amount", manual);
    else fd.set("entered_rate", rate);
    if (usesArea) fd.set("sheet_area_sqft", area);
    run(() => saveQuoteItem(quoteId, item.id, fd), { onSuccess: onDone });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">
          {optionLabel} · {item.description ?? "line"} · {item.thickness ?? ""}
        </p>
        <button type="button" onClick={onDone} className="text-xs" style={{ color: "var(--line-strong)" }}>Close</button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Labeled label="Basis">
          <select value={basis} onChange={(e) => setBasis(e.target.value as PricingBasis)} className={FIELD} style={FS}>
            {PRICING_BASES.map((b) => <option key={b} value={b}>{PRICING_BASIS_LABELS[b]}</option>)}
          </select>
        </Labeled>
        <Labeled label="Qty">
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" className={FIELD} style={FS} />
        </Labeled>
        {usesArea ? (
          <Labeled label="Sheet area (sqft)">
            <input value={area} onChange={(e) => setArea(e.target.value)} inputMode="decimal" className={FIELD} style={FS} />
          </Labeled>
        ) : null}
        {basis === "MANUAL" ? (
          <Labeled label="Amount (taxable ₹)">
            <input value={manual} onChange={(e) => setManual(e.target.value)} inputMode="decimal" className={FIELD} style={FS} />
          </Labeled>
        ) : (
          <>
            <Labeled label={`Rate ₹${unit ? ` / ${unit}` : ""}`}>
              <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" className={FIELD} style={FS} />
            </Labeled>
            <Labeled label="Entered as">
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={FIELD} style={FS}>
                {RATE_INPUT_MODES.map((m) => <option key={m} value={m}>{RATE_INPUT_MODE_LABELS[m]}</option>)}
              </select>
            </Labeled>
          </>
        )}
        <Labeled label="GST">
          <select value={gst} onChange={(e) => setGst(e.target.value)} className={FIELD} style={FS}>
            {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
          </select>
        </Labeled>
        <Labeled label="Line discount ₹">
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" className={FIELD} style={FS} />
        </Labeled>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs" style={{ color: "var(--line-strong)" }}>
        <span>Pricing qty: <b style={{ color: "var(--ink)" }}>{preview.pricingQuantity || "—"}</b></span>
        <span>Ex-GST rate: <b style={{ color: "var(--ink)" }}>{preview.baseRateExGst != null ? formatRate(preview.baseRateExGst) : "—"}</b></span>
        <span>Incl-GST rate: <b style={{ color: "var(--ink)" }}>{preview.rateInclGst != null ? formatRate(preview.rateInclGst) : "—"}</b></span>
        <span>Taxable: <b style={{ color: "var(--ink)" }}>{formatINR(preview.taxableAmount)}</b></span>
        <span>GST: <b style={{ color: "var(--ink)" }}>{formatINR(preview.gstAmount)}</b></span>
        <span>Incl GST: <b style={{ color: "var(--ink)" }}>{formatINR(preview.amountInclGst)}</b></span>
        {overrideDiff !== 0 ? (
          <span style={{ color: "var(--burgundy)" }}>
            Override vs Rate Book {formatRate(Number(item.rate_book_rate_snapshot))}: {overrideDiff > 0 ? "+" : ""}{formatRate(overrideDiff)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={save} className="rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50" style={{ background: "var(--burgundy)", color: "var(--paper)" }}>
          Save line
        </button>
        <button type="button" onClick={loadCandidates} className="rounded-md border px-3 py-1 text-sm" style={{ borderColor: "var(--line)" }}>
          Rate Book…
        </button>
      </div>

      {candidates ? (
        candidates.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--line-strong)" }}>Nothing in the Rate Book matches this brand + thickness. Enter the rate manually or <Link href="/admin/rates/new" className="underline">add a rate</Link>.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-left hover:bg-[var(--paper)]"
                  style={{ borderColor: "var(--line)" }}
                  onClick={() => {
                    setBasis(c.pricing_basis as PricingBasis);
                    setMode(c.rate_input_mode);
                    setGst(String(c.gst_rate));
                    setRate(String(c.rate));
                    if (basisUsesArea(c.pricing_basis as PricingBasis) && c.sheet_area_sqft) setArea(String(c.sheet_area_sqft));
                  }}
                >
                  {[c.brand, c.range_name, c.product_name, c.thickness].filter(Boolean).join(" ")} — {formatRate(Number(c.rate))} / {basisUnit(c.pricing_basis)} ({c.rate_input_mode === "INCL_GST" ? "incl" : "ex"} GST {c.gst_rate}%)
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

// --------------------------------------------------------- option summary --

function OptionSummary({
  o,
  readOnly,
  quoteId,
  run,
  pending,
}: {
  o: BuilderOption;
  readOnly: boolean;
  quoteId: string;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
}) {
  const t = o.totals;
  const [open, setOpen] = useState(false);
  const c = o.option;

  return (
    <div className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
      <p className="font-semibold">{c.label}</p>
      <dl className="mt-2 flex flex-col gap-1 text-xs">
        <Row k="Material taxable" v={formatINR(t.materialTaxable)} />
        {t.optionDiscount > 0 ? <Row k="Option discount" v={`− ${formatINR(t.optionDiscount)}`} /> : null}
        <Row k="Material GST" v={formatINR(t.materialGst)} />
        {t.chargesTaxableBase > 0 || t.chargesNonTaxable > 0 ? (
          <>
            <Row k="Charges (taxable)" v={formatINR(t.chargesTaxableBase)} />
            {t.chargesNonTaxable > 0 ? <Row k="Charges (no GST)" v={formatINR(t.chargesNonTaxable)} /> : null}
            <Row k="GST on charges" v={formatINR(t.chargesGst)} />
          </>
        ) : null}
        <Row k="Taxable subtotal" v={formatINR(t.taxableSubtotal)} />
        <Row k="Total GST" v={formatINR(t.totalGst)} />
        {t.roundOff !== 0 ? <Row k="Round-off" v={formatINR(t.roundOff)} /> : null}
        <div className="mt-1 flex justify-between border-t pt-1 font-semibold" style={{ borderColor: "var(--line)" }}>
          <span>Grand total</span>
          <span>{formatINR(t.grandTotal)}</span>
        </div>
        {t.unresolvedLineCount > 0 ? (
          <p style={{ color: "var(--burgundy)" }}>{t.unresolvedLineCount} line{t.unresolvedLineCount === 1 ? "" : "s"} still unresolved</p>
        ) : null}
      </dl>

      {!readOnly ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-xs underline-offset-2 hover:underline" style={{ color: "var(--line-strong)" }}>
          {open ? "Hide charges" : "Edit charges & discount"}
        </button>
      ) : null}

      {open && !readOnly ? <OptionChargesForm quoteId={quoteId} o={o} run={run} pending={pending} onDone={() => setOpen(false)} /> : null}
    </div>
  );
}

function OptionChargesForm({
  quoteId,
  o,
  run,
  pending,
  onDone,
}: {
  quoteId: string;
  o: BuilderOption;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  onDone: () => void;
}) {
  const c = o.option;
  function save(fd: FormData) {
    run(() => updateOptionCharges(quoteId, c.id, fd), { onSuccess: onDone });
  }
  return (
    <form action={save} className="mt-2 flex flex-col gap-2 text-xs">
      <Money name="option_discount" label="Option discount ₹" defaultValue={c.option_discount} />
      <ChargeRow amountName="freight" taxableName="freight_taxable" label="Freight" amount={c.freight} taxable={c.freight_taxable} />
      <ChargeRow amountName="loading_unloading" taxableName="loading_taxable" label="Loading / unloading" amount={c.loading_unloading} taxable={c.loading_taxable} />
      <ChargeRow amountName="packing" taxableName="packing_taxable" label="Packing" amount={c.packing} taxable={c.packing_taxable} />
      <ChargeRow amountName="other_charges" taxableName="other_taxable" label="Other" amount={c.other_charges} taxable={c.other_taxable} />
      <label className="flex items-center justify-between gap-2">
        <span style={{ color: "var(--line-strong)" }}>GST on charges</span>
        <select name="charges_gst_rate" defaultValue={String(c.charges_gst_rate)} className="rounded border px-1.5 py-1" style={FS}>
          {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
        </select>
      </label>
      <label className="flex items-center justify-between gap-2">
        <span style={{ color: "var(--line-strong)" }}>Round-off</span>
        <input name="round_off" defaultValue={c.round_off == null ? "auto" : String(c.round_off)} className="w-24 rounded border px-1.5 py-1 text-right" style={FS} />
      </label>
      <button type="submit" disabled={pending} className="mt-1 self-start rounded-md px-3 py-1 font-medium disabled:opacity-50" style={{ background: "var(--burgundy)", color: "var(--paper)" }}>
        Save charges
      </button>
    </form>
  );
}

function ChargeRow({
  amountName,
  taxableName,
  label,
  amount,
  taxable,
}: {
  amountName: string;
  taxableName: string;
  label: string;
  amount: number;
  taxable: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ color: "var(--line-strong)" }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <input name={amountName} defaultValue={String(amount)} inputMode="decimal" className="w-24 rounded border px-1.5 py-1 text-right" style={FS} />
        <label className="flex items-center gap-1">
          {/* absent (unchecked) => the action reads it as not taxable */}
          <input type="checkbox" name={taxableName} defaultChecked={taxable} value="true" />
          <span className="text-[10px]" style={{ color: "var(--line-strong)" }}>+GST</span>
        </label>
      </div>
    </div>
  );
}

function Money({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span style={{ color: "var(--line-strong)" }}>{label}</span>
      <input name={name} defaultValue={String(defaultValue)} inputMode="decimal" className="w-24 rounded border px-1.5 py-1 text-right" style={FS} />
    </label>
  );
}

// ----------------------------------------------------------- add option --

export function AddOptionForm({
  quoteId,
  onDone,
  run,
  pending,
}: {
  quoteId: string;
  onDone: () => void;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
}) {
  function save(fd: FormData) {
    run(() => addOption(quoteId, fd), { onSuccess: onDone });
  }
  return (
    <form action={save} className="flex flex-col gap-2 rounded-md border p-3" style={{ borderColor: "var(--line)" }}>
      <p className="text-xs font-medium">New option (an alternative — never added to the others)</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Labeled label="Option name *"><input name="label" required className={FIELD} style={FS} placeholder="Austin Gold" /></Labeled>
        <Labeled label="Brand"><input name="brand" className={FIELD} style={FS} placeholder="Mikasa" /></Labeled>
        <Labeled label="Range"><input name="range_name" className={FIELD} style={FS} placeholder="Marine Blue" /></Labeled>
        <Labeled label="Warranty"><input name="warranty_text" className={FIELD} style={FS} placeholder="30 Years" /></Labeled>
      </div>
      <Labeled label="Customer note"><input name="customer_notes" className={FIELD} style={FS} /></Labeled>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="apply_to_lines" value="true" defaultChecked />
        <span>Seed the requirement lines into this option (leave rates unresolved)</span>
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50" style={{ background: "var(--burgundy)", color: "var(--paper)" }}>Add option</button>
        <button type="button" onClick={onDone} className="text-xs" style={{ color: "var(--line-strong)" }}>Cancel</button>
      </div>
    </form>
  );
}

// ----------------------------------------------------- commercial terms --

function TermsEditor({
  quoteId,
  version,
  run,
  pending,
}: {
  quoteId: string;
  version: QuoteBuilderData["version"];
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const terms = mergeTerms(version.terms);

  return (
    <div className="rounded-md border" style={{ borderColor: "var(--line)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm"
      >
        <span className="font-medium">Commercial terms &amp; dates</span>
        <span className="text-xs" style={{ color: "var(--line-strong)" }}>{open ? "Hide" : "Edit"}</span>
      </button>
      {open ? (
        <form
          action={(fd) => run(() => updateQuoteTerms(quoteId, fd), { onSuccess: () => setOpen(false) })}
          className="flex flex-col gap-2 border-t px-3 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Quote date">
              <input type="date" name="quote_date" defaultValue={version.quote_date ?? ""} className={FIELD} style={FS} />
            </Labeled>
            <Labeled label="Valid until">
              <input type="date" name="valid_until" defaultValue={version.valid_until ?? ""} className={FIELD} style={FS} />
            </Labeled>
          </div>
          {TERM_FIELDS.map((f) => (
            <Labeled key={f} label={TERM_LABELS[f]}>
              <textarea
                name={`term_${f}`}
                defaultValue={terms[f]}
                placeholder={DEFAULT_QUOTE_TERMS[f]}
                rows={2}
                className={FIELD}
                style={FS}
              />
            </Labeled>
          ))}
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--burgundy)", color: "var(--paper)" }}
          >
            Save terms
          </button>
        </form>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------- actions --

function MarkReadyButton({ quoteId, run, pending }: { quoteId: string; run: ReturnType<typeof useAction>["run"]; pending: boolean }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Mark this quote ready? The current version freezes and the enquiry moves to Quote ready.")) {
          run(() => markQuoteReady(quoteId));
        }
      }}
      className="rounded-md border px-4 py-1.5 text-sm font-medium disabled:opacity-50"
      style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}
    >
      Mark ready
    </button>
  );
}

function NewVersionButton({
  quoteId,
  run,
  pending,
  canRevise,
}: {
  quoteId: string;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  canRevise: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!canRevise) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md border px-4 py-1.5 text-sm disabled:opacity-50" style={{ borderColor: "var(--line)" }}>
        Create new version
      </button>
    );
  }
  return (
    <form
      action={(fd) => run(() => createNewVersion(quoteId, fd), { onSuccess: () => setOpen(false) })}
      className="flex items-center gap-2"
    >
      <input name="revision_reason" placeholder="Revision reason (e.g. customer negotiated)" className="rounded border px-2 py-1 text-sm" style={{ ...FS, minWidth: 260 }} />
      <button type="submit" disabled={pending} className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50" style={{ background: "var(--burgundy)", color: "var(--paper)" }}>
        Freeze &amp; clone
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs" style={{ color: "var(--line-strong)" }}>Cancel</button>
    </form>
  );
}

// ----------------------------------------------------------- small bits --

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--line-strong)" }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}
