"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createRate, updateRate, type RateActionResult } from "@/app/(admin)/admin/rates/actions";
import {
  GST_RATES,
  PRICING_BASES,
  PRICING_BASIS_LABELS,
  RATE_INPUT_MODES,
  RATE_INPUT_MODE_LABELS,
  basisUnit,
  basisUsesArea,
  DEFAULT_SHEET_AREA_SQFT,
  DEFAULT_SHEET_LENGTH_FT,
  DEFAULT_SHEET_WIDTH_FT,
  suggestedBasisForCategory,
  type PricingBasis,
} from "@/lib/rate-book";
import { formatRate, normalizeRate } from "@/lib/quote-math";
import type { QuoteRateRow } from "@/lib/supabase/types";

const FIELD = "w-full rounded border px-2 py-1.5 text-sm";
const FS = { borderColor: "var(--line)", background: "var(--paper)" } as const;

export function RateForm({ rate }: { rate?: QuoteRateRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<RateActionResult | null>(null);

  const [basis, setBasis] = useState<PricingBasis>((rate?.pricing_basis as PricingBasis) ?? "PER_SQFT");
  const [rateValue, setRateValue] = useState(rate ? String(rate.rate) : "");
  const [mode, setMode] = useState(rate?.rate_input_mode ?? "EX_GST");
  const [gst, setGst] = useState(String(rate?.gst_rate ?? 18));
  const [width, setWidth] = useState(String(rate?.sheet_width_ft ?? DEFAULT_SHEET_WIDTH_FT));
  const [length, setLength] = useState(String(rate?.sheet_length_ft ?? DEFAULT_SHEET_LENGTH_FT));
  const [area, setArea] = useState(String(rate?.sheet_area_sqft ?? DEFAULT_SHEET_AREA_SQFT));

  const usesArea = basisUsesArea(basis);
  const unit = basisUnit(basis);

  const equiv = useMemo(() => {
    const n = Number.parseFloat(rateValue);
    if (!Number.isFinite(n) || n <= 0) return null;
    return normalizeRate(n, mode as "EX_GST" | "INCL_GST", Number(gst) || 0);
  }, [rateValue, mode, gst]);

  function submit(formData: FormData) {
    formData.set("pricing_basis", basis);
    formData.set("rate", rateValue);
    formData.set("rate_input_mode", mode);
    formData.set("gst_rate", gst);
    if (usesArea) {
      formData.set("sheet_width_ft", width);
      formData.set("sheet_length_ft", length);
      formData.set("sheet_area_sqft", area);
    }
    start(async () => {
      const res = rate ? await updateRate(rate.id, formData) : await createRate(formData);
      setResult(res);
      if (res.ok) {
        if (!rate && res.id) router.push("/admin/rates");
        else router.refresh();
      }
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Text label="Brand" name="brand" defaultValue={rate?.brand ?? ""} placeholder="Austin, Mikasa…" />
        <Text label="Product name" name="product_name" defaultValue={rate?.product_name ?? ""} placeholder="Gold, MR+…" />
        <Text label="Range / collection" name="range_name" defaultValue={rate?.range_name ?? ""} placeholder="Marine Blue…" />
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Category</span>
          <input
            name="category"
            defaultValue={rate?.category ?? ""}
            onBlur={(e) => {
              if (!rate) setBasis(suggestedBasisForCategory(e.target.value));
            }}
            className={FIELD}
            style={FS}
            placeholder="Plywood, Laminates, Hardware…"
          />
        </label>
        <Text label="Thickness" name="thickness" defaultValue={rate?.thickness ?? ""} placeholder="19mm" />
        <Text label="Grade" name="grade" defaultValue={rate?.grade ?? ""} placeholder="BWP" />
        <Text label="Finish" name="finish" defaultValue={rate?.finish ?? ""} />
        <Text label="Size" name="size" defaultValue={rate?.size ?? ""} placeholder="8×4 ft" />
        <Text label="Warranty" name="warranty_text" defaultValue={rate?.warranty_text ?? ""} placeholder="30 Years" />
      </div>

      <div className="rounded-md border p-3" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Pricing basis</span>
            <select value={basis} onChange={(e) => setBasis(e.target.value as PricingBasis)} className={FIELD} style={FS}>
              {PRICING_BASES.map((b) => (
                <option key={b} value={b}>{PRICING_BASIS_LABELS[b]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Rate (₹{unit ? ` / ${unit}` : ""})</span>
            <input
              value={rateValue}
              onChange={(e) => setRateValue(e.target.value)}
              inputMode="decimal"
              className={FIELD}
              style={FS}
              placeholder="137.30"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Rate entered as</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className={FIELD} style={FS}>
              {RATE_INPUT_MODES.map((m) => (
                <option key={m} value={m}>{RATE_INPUT_MODE_LABELS[m]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>GST</span>
            <select value={gst} onChange={(e) => setGst(e.target.value)} className={FIELD} style={FS}>
              {GST_RATES.map((g) => (
                <option key={g} value={g}>{g}%</option>
              ))}
            </select>
          </label>
        </div>

        {usesArea ? (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Sheet width (ft)</span>
              <input value={width} onChange={(e) => { setWidth(e.target.value); recomputeArea(e.target.value, length, setArea); }} inputMode="decimal" className={FIELD} style={FS} />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Sheet length (ft)</span>
              <input value={length} onChange={(e) => { setLength(e.target.value); recomputeArea(width, e.target.value, setArea); }} inputMode="decimal" className={FIELD} style={FS} />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Area (sqft)</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} inputMode="decimal" className={FIELD} style={FS} />
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: "var(--line-strong)" }}>
          <span>
            Equivalent ex GST:{" "}
            <span className="font-medium" style={{ color: "var(--ink)" }}>
              {equiv ? `${formatRate(equiv.baseRateExGst)}${unit ? ` / ${unit}` : ""}` : "—"}
            </span>
          </span>
          <span>
            Equivalent incl GST:{" "}
            <span className="font-medium" style={{ color: "var(--ink)" }}>
              {equiv ? `${formatRate(equiv.rateInclGst)}${unit ? ` / ${unit}` : ""}` : "—"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Text label="Effective from" name="effective_from" type="date" defaultValue={rate?.effective_from ?? ""} />
        <Text label="Effective to (optional)" name="effective_to" type="date" defaultValue={rate?.effective_to ?? ""} />
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Status</span>
          <select name="active" defaultValue={rate ? String(rate.active) : "true"} className={FIELD} style={FS}>
            <option value="true">Active</option>
            <option value="false">Retired</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-0.5">
        <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>Notes</span>
        <textarea name="notes" defaultValue={rate?.notes ?? ""} rows={2} className={FIELD} style={FS} />
      </label>
      <input type="hidden" name="product_id" defaultValue={rate?.product_id ?? ""} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--burgundy)", color: "var(--paper)" }}
        >
          {pending ? "Saving…" : rate ? "Save rate" : "Add rate"}
        </button>
        {result ? (
          <span className="text-xs" style={{ color: result.ok ? "#136138" : "var(--burgundy)" }}>
            {result.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function recomputeArea(w: string, l: string, setArea: (v: string) => void) {
  const a = Number.parseFloat(w) * Number.parseFloat(l);
  if (Number.isFinite(a) && a > 0) setArea(String(Math.round(a * 100) / 100));
}

function Text({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className={FIELD} style={FS} />
    </label>
  );
}
