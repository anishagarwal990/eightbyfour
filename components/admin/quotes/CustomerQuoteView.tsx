// HTML render of the customer quotation — the admin preview. Mirrors the PDF
// (lib/pdf/QuoteDocument.tsx). Same DTO, same numbers, no internal fields.

import type { CustomerQuote, CustomerQuoteOption } from "@/lib/customer-quote";
import { TERM_FIELDS, TERM_LABELS } from "@/lib/customer-quote";
import { inr, rate as fmtRate, quoteDate } from "@/lib/pdf/format";

const CARD = { borderColor: "var(--line)", background: "var(--paper)" } as const;

export function CustomerQuoteView({ quote }: { quote: CustomerQuote }) {
  const incl = quote.pricingDisplay === "INCL_GST";
  const rowCount = Math.max(...quote.options.map((o) => o.lines.length), 0);

  return (
    <div
      className="mx-auto max-w-4xl rounded-md border p-8 text-sm"
      style={{ borderColor: "var(--line)", background: "#fff", color: "var(--ink)" }}
    >
      <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: "var(--line)" }}>
        <div>
          <p className="serif text-xl font-bold" style={{ color: "var(--burgundy)", letterSpacing: "0.04em" }}>
            EIGHTBYFOUR
          </p>
          <p className="mt-0.5 text-[10px] tracking-widest" style={{ color: "var(--line-strong)" }}>
            INTERIOR &amp; CONSTRUCTION MATERIAL PROCUREMENT
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">QUOTATION</p>
          <p className="font-bold">{quote.versionRef}</p>
          <p className="text-xs" style={{ color: "var(--line-strong)" }}>Date: {quoteDate(quote.quoteDate)}</p>
          <p className="text-xs" style={{ color: "var(--line-strong)" }}>Valid until: {quoteDate(quote.validUntil)}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 rounded border p-3" style={CARD}>
        <Field label="Customer" value={quote.customer.name} />
        <Field label="Company" value={quote.customer.company} />
        <Field label="Phone" value={quote.customer.phone} />
        <Field label="GSTIN" value={quote.customer.gstin} />
        <Field label="Project" value={quote.customer.project} />
        <Field label="Delivery location" value={quote.customer.deliveryLocation} />
      </dl>

      <p className="mt-6 text-xs font-bold tracking-widest" style={{ color: "var(--burgundy)" }}>
        PRODUCT COMPARISON
      </p>
      <div className="mt-2 overflow-x-auto rounded border" style={{ borderColor: "var(--line)" }}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: "color-mix(in srgb, var(--burgundy) 6%, #fff)" }}>
              <th className="p-2" />
              <th className="p-2" />
              {quote.options.map((o) => (
                <th key={o.label} colSpan={2} className="border-l p-2 text-left align-top" style={{ borderColor: "var(--line)" }}>
                  <span className="block font-bold">{o.label}</span>
                  <span className="block text-[10px] font-normal" style={{ color: "var(--line-strong)" }}>
                    {[o.brand, o.rangeName, o.warranty].filter(Boolean).join(" · ") || "—"}
                  </span>
                </th>
              ))}
            </tr>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid var(--line)" }}>
              <th className="p-2 text-left font-medium" style={{ color: "var(--line-strong)" }}>Requirement</th>
              <th className="p-2 text-right font-medium" style={{ color: "var(--line-strong)" }}>Qty</th>
              {quote.options.map((o) => (
                <th key={o.label} className="border-l p-2 text-right font-medium" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                  <span className="border-l-0">{incl ? "Rate incl GST" : "Rate"}</span>
                  <span className="ml-3 inline-block">{incl ? "Amount incl GST" : "Amount"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, i) => {
              const anyLine = quote.options.map((o) => o.lines[i]).find(Boolean);
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="p-2">{anyLine?.requirement ?? ""}</td>
                  <td className="p-2 text-right" style={{ color: "var(--line-strong)" }}>
                    {anyLine ? `${anyLine.quantity} ${anyLine.unit}` : ""}
                  </td>
                  {quote.options.map((o, oi) => {
                    const line = o.lines[i];
                    if (!line) return <td key={oi} colSpan={2} className="border-l p-2" style={{ borderColor: "var(--line)" }} />;
                    if (!line.resolved) {
                      return (
                        <td key={oi} colSpan={2} className="border-l p-2 text-right" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                          on request
                        </td>
                      );
                    }
                    const r = incl ? line.rateInclGst : line.rateExGst;
                    const amt = incl ? line.amountInclGst : line.amountExGst;
                    return (
                      <td key={oi} colSpan={2} className="border-l p-2 text-right" style={{ borderColor: "var(--line)" }}>
                        <span className="mr-3">{fmtRate(r)}{line.basisUnit ? ` / ${line.basisUnit}` : ""}</span>
                        <span className="font-medium">{inr(amt)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px]" style={{ color: "var(--line-strong)" }}>
        {incl
          ? "Rates and amounts above are inclusive of GST."
          : "Rates and amounts above exclude GST; GST is shown against each option total below."}{" "}
        Each option is an alternative — the totals are not additive.
      </p>

      <p className="mt-6 text-xs font-bold tracking-widest" style={{ color: "var(--burgundy)" }}>OPTION TOTALS</p>
      <div className="mt-2 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(quote.options.length, 3)}, minmax(0,1fr))` }}>
        {quote.options.map((o) => (
          <OptionTotals key={o.label} option={o} incl={incl} />
        ))}
      </div>

      {quote.options.some((o) => o.notes) ? (
        <>
          <p className="mt-6 text-xs font-bold tracking-widest" style={{ color: "var(--burgundy)" }}>OPTION NOTES</p>
          <dl className="mt-2 space-y-1">
            {quote.options.filter((o) => o.notes).map((o) => (
              <div key={o.label} className="flex gap-3">
                <dt className="w-32 shrink-0 font-medium" style={{ color: "var(--line-strong)" }}>{o.label}</dt>
                <dd className="flex-1">{o.notes}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      <p className="mt-6 text-xs font-bold tracking-widest" style={{ color: "var(--burgundy)" }}>COMMERCIAL TERMS</p>
      <dl className="mt-2 space-y-1">
        {TERM_FIELDS.filter((f) => quote.terms[f]?.trim()).map((f) => (
          <div key={f} className="flex gap-3">
            <dt className="w-32 shrink-0 font-medium" style={{ color: "var(--line-strong)" }}>{TERM_LABELS[f]}</dt>
            <dd className="flex-1">{quote.terms[f]}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-t pt-3 text-[11px]" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
        EightByFour · Quotation {quote.versionRef} · This is a system-generated quotation.
      </p>
    </div>
  );
}

function OptionTotals({ option, incl }: { option: CustomerQuoteOption; incl: boolean }) {
  const t = option.totals;
  return (
    <div className="rounded border p-3" style={CARD}>
      <p className="font-bold" style={{ color: "var(--burgundy)" }}>
        {option.label}
        {option.warranty ? ` — ${option.warranty}` : ""}
      </p>
      <dl className="mt-2 space-y-1 text-xs">
        <Line label="Taxable value" value={inr(t.materialTaxable + t.chargesTaxable)} />
        {t.optionDiscount > 0 ? <Line label="Discount applied" value={`− ${inr(t.optionDiscount)}`} /> : null}
        {t.charges.map((c) => (
          <Line key={c.label} label={c.label + (c.taxable ? "" : " (no GST)")} value={inr(c.amount)} />
        ))}
        <Line label="GST" value={inr(t.totalGst)} />
        {t.roundOff !== 0 ? <Line label="Round-off" value={inr(t.roundOff)} /> : null}
        <div className="flex justify-between border-t pt-1 font-bold" style={{ borderColor: "var(--line)" }}>
          <span>Grand total{incl ? " (incl GST)" : ""}</span>
          <span style={{ color: "var(--burgundy)" }}>{inr(t.grandTotal)}</span>
        </div>
      </dl>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--line-strong)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide" style={{ color: "var(--line-strong)" }}>{label.toUpperCase()}</dt>
      <dd>{value?.trim() || "—"}</dd>
    </div>
  );
}
