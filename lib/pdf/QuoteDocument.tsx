// Server-side PDF for a customer quotation. Pure function of the CustomerQuote
// DTO — no DB, no internal fields. @react-pdf/renderer (pure JS, deterministic,
// Vercel-serverless friendly; no headless browser).

import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { CustomerQuote, CustomerQuoteOption } from "@/lib/customer-quote";
import { TERM_FIELDS, TERM_LABELS } from "@/lib/customer-quote";
import { inr as inr0, rate as rate0, quoteDate, PDF_SYM } from "./format";

const inr = (n: number) => inr0(n, PDF_SYM);
const fmtRate = (n: number | null | undefined) => rate0(n, PDF_SYM);

const BURGUNDY = "#6e1f2e";
const INK = "#121212";
const MUTE = "#5b5b5b";
const LINE = "#d9d9d9";
const BAND = "#f4eef0";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9, color: INK, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  wordmark: { fontSize: 17, fontFamily: "Helvetica-Bold", color: BURGUNDY, letterSpacing: 0.5 },
  wordmarkSub: { fontSize: 7, color: MUTE, marginTop: 2, letterSpacing: 1 },
  quoteMeta: { alignItems: "flex-end" },
  quoteTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: INK },
  metaLine: { fontSize: 8, color: MUTE, marginTop: 2 },
  metaStrong: { fontSize: 9, color: INK, fontFamily: "Helvetica-Bold" },

  custBox: { borderWidth: 1, borderColor: LINE, borderRadius: 3, padding: 8, marginBottom: 14, flexDirection: "row", flexWrap: "wrap" },
  custCell: { width: "50%", marginBottom: 3 },
  custLabel: { fontSize: 7, color: MUTE, letterSpacing: 0.5 },
  custValue: { fontSize: 9 },

  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: BURGUNDY, letterSpacing: 1, marginBottom: 6, marginTop: 4 },

  table: { borderWidth: 1, borderColor: LINE, borderRadius: 3, marginBottom: 14 },
  optHeadRow: { flexDirection: "row", backgroundColor: BAND, borderBottomWidth: 1, borderBottomColor: LINE },
  colHeadRow: { flexDirection: "row", backgroundColor: "#fafafa", borderBottomWidth: 1, borderBottomColor: LINE },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, minHeight: 18 },
  rowLast: { flexDirection: "row", minHeight: 18 },
  cell: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 8.5 },
  cellR: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 8.5, textAlign: "right" },
  headCell: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 7.5, color: MUTE, fontFamily: "Helvetica-Bold", letterSpacing: 0.3 },
  headCellR: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 7.5, color: MUTE, fontFamily: "Helvetica-Bold", textAlign: "right", letterSpacing: 0.3 },
  optName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK },
  optSub: { fontSize: 7, color: MUTE, marginTop: 1 },
  vLine: { borderLeftWidth: 1, borderLeftColor: LINE },

  totalsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  totalCard: { borderWidth: 1, borderColor: LINE, borderRadius: 3, padding: 8, minWidth: 200, flexGrow: 1 },
  totalName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: BURGUNDY, marginBottom: 4 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  totalLabel: { fontSize: 8, color: MUTE },
  totalVal: { fontSize: 8 },
  grandLine: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: LINE, paddingTop: 3, marginTop: 2 },
  grandLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  grandVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: BURGUNDY },

  note: { fontSize: 7.5, color: MUTE, marginBottom: 10 },
  termRow: { flexDirection: "row", marginBottom: 3 },
  termLabel: { width: 110, fontSize: 8, color: MUTE, fontFamily: "Helvetica-Bold" },
  termValue: { flex: 1, fontSize: 8 },

  footer: { position: "absolute", bottom: 28, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: MUTE },
});

// Requirement + Qty are fixed widths; the option pair-columns share the rest.
const REQ_W = 108;
const QTY_W = 40;

function LineRateAmount({
  line,
  incl,
}: {
  line: CustomerQuoteOption["lines"][number];
  incl: boolean;
}) {
  if (!line.resolved) {
    return (
      <>
        <Text style={[s.cellR, s.vLine, { flex: 1, color: MUTE }]}>—</Text>
        <Text style={[s.cellR, { flex: 1, color: MUTE }]}>on request</Text>
      </>
    );
  }
  const r = incl ? line.rateInclGst : line.rateExGst;
  const amt = incl ? line.amountInclGst : line.amountExGst;
  return (
    <>
      <Text style={[s.cellR, s.vLine, { flex: 1 }]}>
        {fmtRate(r)}
        {line.basisUnit ? ` / ${line.basisUnit}` : ""}
      </Text>
      <Text style={[s.cellR, { flex: 1 }]}>{inr(amt)}</Text>
    </>
  );
}

function ComparisonTable({ quote }: { quote: CustomerQuote }) {
  const incl = quote.pricingDisplay === "INCL_GST";
  const amountHead = incl ? "Amount incl GST" : "Amount";
  const rateHead = incl ? "Rate incl GST" : "Rate";

  // Rows are aligned by index across options (each option was seeded from the
  // same requirement list).
  const rowCount = Math.max(...quote.options.map((o) => o.lines.length), 0);

  return (
    <View style={s.table}>
      {/* option header band */}
      <View style={s.optHeadRow} wrap={false}>
        <View style={{ width: REQ_W }} />
        <View style={{ width: QTY_W }} />
        {quote.options.map((o) => (
          <View key={o.label} style={[s.vLine, { flex: 2, paddingVertical: 5, paddingHorizontal: 5 }]}>
            <Text style={s.optName}>{o.label}</Text>
            <Text style={s.optSub}>
              {[o.brand, o.rangeName].filter(Boolean).join(" · ")}
              {o.warranty ? `${o.brand || o.rangeName ? "  ·  " : ""}${o.warranty}` : ""}
            </Text>
          </View>
        ))}
      </View>
      {/* column header (repeats on page break) */}
      <View style={s.colHeadRow} fixed>
        <Text style={[s.headCell, { width: REQ_W }]}>Requirement</Text>
        <Text style={[s.headCellR, { width: QTY_W }]}>Qty</Text>
        {quote.options.map((o) => (
          <React.Fragment key={o.label}>
            <Text style={[s.headCellR, s.vLine, { flex: 1 }]}>{rateHead}</Text>
            <Text style={[s.headCellR, { flex: 1 }]}>{amountHead}</Text>
          </React.Fragment>
        ))}
      </View>
      {/* body */}
      {Array.from({ length: rowCount }).map((_, i) => {
        const last = i === rowCount - 1;
        const anyLine = quote.options.map((o) => o.lines[i]).find(Boolean);
        return (
          <View key={i} style={last ? s.rowLast : s.row} wrap={false}>
            <Text style={[s.cell, { width: REQ_W }]}>{anyLine?.requirement ?? ""}</Text>
            <Text style={[s.cellR, { width: QTY_W }]}>
              {anyLine ? `${anyLine.quantity} ${anyLine.unit}` : ""}
            </Text>
            {quote.options.map((o, oi) => {
              const line = o.lines[i];
              if (!line) {
                return (
                  <React.Fragment key={oi}>
                    <Text style={[s.cellR, s.vLine, { flex: 1 }]} />
                    <Text style={[s.cellR, { flex: 1 }]} />
                  </React.Fragment>
                );
              }
              return <React.Fragment key={oi}><LineRateAmount line={line} incl={incl} /></React.Fragment>;
            })}
          </View>
        );
      })}
    </View>
  );
}

function OptionTotals({ option, incl }: { option: CustomerQuoteOption; incl: boolean }) {
  const t = option.totals;
  return (
    <View style={s.totalCard} wrap={false}>
      <Text style={s.totalName}>
        {option.label}
        {option.warranty ? `  —  ${option.warranty}` : ""}
      </Text>
      <Row label="Taxable value" value={inr(t.materialTaxable + t.chargesTaxable)} />
      {t.optionDiscount > 0 ? <Row label="Discount applied" value={`− ${inr(t.optionDiscount)}`} /> : null}
      {t.charges.map((c) => (
        <Row key={c.label} label={c.label + (c.taxable ? "" : " (no GST)")} value={inr(c.amount)} />
      ))}
      <Row label="GST" value={inr(t.totalGst)} />
      {t.roundOff !== 0 ? <Row label="Round-off" value={inr(t.roundOff)} /> : null}
      <View style={s.grandLine}>
        <Text style={s.grandLabel}>Grand total{incl ? " (incl GST)" : ""}</Text>
        <Text style={s.grandVal}>{inr(t.grandTotal)}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.totalLine}>
      <Text style={s.totalLabel}>{label}</Text>
      <Text style={s.totalVal}>{value}</Text>
    </View>
  );
}

export function QuoteDocument({ quote }: { quote: CustomerQuote }) {
  const incl = quote.pricingDisplay === "INCL_GST";
  const landscape = quote.options.length >= 3;

  return (
    <Document title={quote.versionRef} author="EightByFour">
      <Page size="A4" orientation={landscape ? "landscape" : "portrait"} style={s.page}>
        <View style={s.headerRow} fixed>
          <View>
            <Text style={s.wordmark}>EIGHTBYFOUR</Text>
            <Text style={s.wordmarkSub}>INTERIOR &amp; CONSTRUCTION MATERIAL PROCUREMENT</Text>
          </View>
          <View style={s.quoteMeta}>
            <Text style={s.quoteTitle}>QUOTATION</Text>
            <Text style={s.metaStrong}>{quote.versionRef}</Text>
            <Text style={s.metaLine}>Date: {quoteDate(quote.quoteDate)}</Text>
            <Text style={s.metaLine}>Valid until: {quoteDate(quote.validUntil)}</Text>
          </View>
        </View>

        <View style={s.custBox}>
          <Field label="Customer" value={quote.customer.name} />
          <Field label="Company" value={quote.customer.company} />
          <Field label="Phone" value={quote.customer.phone} />
          <Field label="GSTIN" value={quote.customer.gstin} />
          <Field label="Project" value={quote.customer.project} />
          <Field label="Delivery location" value={quote.customer.deliveryLocation} />
        </View>

        <Text style={s.sectionTitle}>PRODUCT COMPARISON</Text>
        <ComparisonTable quote={quote} />

        <Text style={s.note}>
          {incl
            ? "Rates and amounts above are inclusive of GST. Option totals below show the GST component."
            : "Rates and amounts above exclude GST. GST is shown against each option total below."}
          {"  "}Each option is an alternative — the totals are not additive.
        </Text>

        <Text style={s.sectionTitle}>OPTION TOTALS</Text>
        <View style={s.totalsWrap}>
          {quote.options.map((o) => (
            <OptionTotals key={o.label} option={o} incl={incl} />
          ))}
        </View>

        {quote.options.some((o) => o.notes) ? (
          <View wrap={false}>
            <Text style={s.sectionTitle}>OPTION NOTES</Text>
            {quote.options
              .filter((o) => o.notes)
              .map((o) => (
                <View key={o.label} style={s.termRow}>
                  <Text style={s.termLabel}>{o.label}</Text>
                  <Text style={s.termValue}>{o.notes}</Text>
                </View>
              ))}
          </View>
        ) : null}

        <View wrap={false}>
          <Text style={s.sectionTitle}>COMMERCIAL TERMS</Text>
          {TERM_FIELDS.map((f) =>
            quote.terms[f]?.trim() ? (
              <View key={f} style={s.termRow}>
                <Text style={s.termLabel}>{TERM_LABELS[f]}</Text>
                <Text style={s.termValue}>{quote.terms[f]}</Text>
              </View>
            ) : null
          )}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>EightByFour · Quotation {quote.versionRef}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={s.custCell}>
      <Text style={s.custLabel}>{label.toUpperCase()}</Text>
      <Text style={s.custValue}>{value?.trim() || "—"}</Text>
    </View>
  );
}
