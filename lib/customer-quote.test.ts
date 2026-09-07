/**
 * Customer quote DTO + terms tests.
 * Run: node --test lib/customer-quote.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import { buildCustomerQuote, pdfFileName, whatsappShareLink } from "./customer-quote.ts";
import { mergeTerms, defaultValidUntil, DEFAULT_QUOTE_TERMS } from "./customer-quote.ts";
import { computeLine, computeOption } from "./quote-math.ts";

// ---- minimal builder-data fixture (only the fields buildCustomerQuote reads) ----

function fixture(pricingDisplay = "EX_GST") {
  const mkItem = (over) => ({
    id: `it-${Math.random()}`,
    quote_option_id: "o",
    enquiry_item_id: "e",
    sort_order: 0,
    rate_book_id: "SECRET-rate-book-uuid",
    product_id: 14,
    match_state: "RATE_BOOK",
    description: null,
    category: "Plywood",
    brand: "Austin",
    product_name: "Gold",
    range_name: "Gold",
    thickness: "19mm",
    grade: "BWP",
    finish: null,
    size: "8x4",
    quantity: 45,
    unit: "sheets",
    pricing_basis: "PER_SQFT",
    sheet_width_ft: 4,
    sheet_length_ft: 8,
    sheet_area_sqft: 32,
    pricing_quantity: 1440,
    gst_rate: 18,
    rate_input_mode: "EX_GST",
    entered_rate: 137.3,
    rate_book_rate_snapshot: 137.3,
    rate_book_mode_snapshot: "EX_GST",
    is_overridden: true,
    base_rate_ex_gst: 137.3,
    rate_incl_gst: 162.014,
    line_discount: 0,
    manual_amount: null,
    taxable_amount: 197712,
    gst_amount: 35588.16,
    amount_incl_gst: 233300.16,
    warranty_text: null,
    customer_note: null,
    internal_note: "SECRET margin is thin, push freight",
    created_at: "2026-09-07",
    updated_at: "2026-09-07",
    ...over,
  });

  const option = {
    id: "o",
    quote_version_id: "v",
    label: "Austin Gold",
    brand: "Austin",
    range_name: "Gold",
    warranty_text: "30 Years",
    customer_notes: null,
    sort_order: 0,
    option_discount: 0,
    freight: 0,
    freight_taxable: true,
    loading_unloading: 0,
    loading_taxable: true,
    packing: 0,
    packing_taxable: true,
    other_charges: 0,
    other_taxable: true,
    charges_gst_rate: 18,
    round_off: null,
    totals_snapshot: null,
    created_at: "x",
    updated_at: "x",
  };
  const items = [mkItem({}), mkItem({ thickness: "Liner", pricing_basis: "PER_SHEET", quantity: 50, sheet_area_sqft: null, entered_rate: 450, base_rate_ex_gst: 450, taxable_amount: 22500, gst_amount: 4050, amount_incl_gst: 26550 })];
  const lines = items.map((it) => ({
    ...computeLine({
      basis: it.pricing_basis,
      quantity: it.quantity,
      sheetAreaSqft: it.sheet_area_sqft,
      gstRate: it.gst_rate,
      inputMode: it.rate_input_mode,
      enteredRate: it.entered_rate,
      lineDiscount: it.line_discount,
      manualAmount: it.manual_amount,
    }),
    item: it,
  }));
  const totals = computeOption({
    lines,
    optionDiscount: 0,
    freight: { amount: 0, taxable: true },
    loading: { amount: 0, taxable: true },
    packing: { amount: 0, taxable: true },
    other: { amount: 0, taxable: true },
    chargesGstRate: 18,
    roundOff: null,
  });

  return {
    quote: { id: "q", ref: "Q-TEST", status: "READY", inquiry_id: "i", customer_id: "c", current_version: 1, sent_at: null, sent_by: null, created_at: "x", updated_at: "x", created_by: "SECRET-admin-uuid", updated_by: "SECRET-admin-uuid" },
    version: {
      id: "v", quote_id: "q", version_no: 1, status: "READY", label: null, pricing_display: pricingDisplay,
      customer_snapshot: {}, terms: { payment: "Custom payment terms" }, tax_assumption: "x", revision_reason: null,
      frozen_at: "2026-09-07", sent_at: null, sent_by: null, quote_date: "2026-09-07", valid_until: "2026-09-22",
      created_at: "2026-09-07", created_by: "SECRET",
    },
    enquiry: { id: "i", name: "Ravi Constructions", phone: "9703739918", project_name: "Villa 12", delivery_location: "Kondapur", internal_notes: "SECRET do not discount below 8%" },
    customer: { id: "c", name: "Ravi Constructions", company: "Ravi Constructions Pvt Ltd", phone: "9703739918", gstin: "36ABCDE1234F1Z5" },
    enquiryItems: [],
    versions: [],
    readOnly: true,
    options: [{ option, lines, totals }],
    valueRange: { min: totals.grandTotal, max: totals.grandTotal },
  };
}

test("DTO carries no internal fields", () => {
  const dto = buildCustomerQuote(fixture());
  const json = JSON.stringify(dto);
  for (const secret of [
    "rate_book_id", "SECRET-rate-book-uuid", "is_overridden", "internal_note", "SECRET margin",
    "created_by", "updated_by", "SECRET-admin-uuid", "cost_per_unit", "supplier", "rate_book_rate_snapshot",
    "internal_notes", "SECRET do not discount", "match_state",
  ]) {
    assert.ok(!json.includes(secret), `DTO leaked "${secret}"`);
  }
});

test("DTO exposes the expected customer fields", () => {
  const dto = buildCustomerQuote(fixture());
  assert.equal(dto.ref, "Q-TEST");
  assert.equal(dto.versionRef, "Q-TEST-V1");
  assert.equal(dto.customer.company, "Ravi Constructions Pvt Ltd");
  assert.equal(dto.customer.gstin, "36ABCDE1234F1Z5");
  assert.equal(dto.customer.project, "Villa 12");
  assert.equal(dto.options[0].warranty, "30 Years");
  assert.equal(dto.options[0].lines[0].basisUnit, "sqft");
  assert.equal(dto.options[0].lines[1].basisUnit, "sheet");
  assert.equal(dto.options[0].lines[0].amountExGst, 197712);
  assert.equal(dto.options[0].lines[1].amountExGst, 22500);
});

test("options are not summed — DTO has no combined total", () => {
  const dto = buildCustomerQuote(fixture());
  const json = JSON.stringify(dto);
  const grand = dto.options[0].totals.grandTotal;
  // only per-option grandTotal exists; no top-level total field
  assert.equal("grandTotal" in dto, false);
  assert.equal("total" in dto, false);
  assert.ok(json.includes(String(grand)));
});

test("ex-GST vs incl-GST presentation — grand total is identical", () => {
  const ex = buildCustomerQuote(fixture("EX_GST"));
  const incl = buildCustomerQuote(fixture("INCL_GST"));
  assert.equal(ex.pricingDisplay, "EX_GST");
  assert.equal(incl.pricingDisplay, "INCL_GST");
  assert.equal(ex.options[0].totals.grandTotal, incl.options[0].totals.grandTotal);
  assert.equal(ex.options[0].totals.totalGst, incl.options[0].totals.totalGst);
  // line rate fields carry both; the view chooses
  assert.equal(ex.options[0].lines[0].rateExGst, 137.3);
  assert.ok(Math.abs(ex.options[0].lines[0].rateInclGst - 162.014) < 0.01);
});

test("terms: stored value overrides default, missing keys fall back", () => {
  const dto = buildCustomerQuote(fixture());
  assert.equal(dto.terms.payment, "Custom payment terms");
  assert.equal(dto.terms.delivery_timeline, DEFAULT_QUOTE_TERMS.delivery_timeline);
});

test("mergeTerms + defaultValidUntil", () => {
  assert.deepEqual(mergeTerms(null), DEFAULT_QUOTE_TERMS);
  assert.equal(mergeTerms({ taxes: "  " }).taxes, DEFAULT_QUOTE_TERMS.taxes);
  assert.equal(defaultValidUntil("2026-09-07"), "2026-09-22");
});

test("pdf filename + whatsapp link are customer-clean", () => {
  const dto = buildCustomerQuote(fixture());
  assert.equal(pdfFileName(dto), "EightByFour-Quotation-Q-TEST-V1.pdf");
  const wa = whatsappShareLink(dto);
  assert.ok(wa.startsWith("https://wa.me/919703739918?text="));
  assert.ok(!wa.includes("uuid"));
});
