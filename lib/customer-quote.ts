// Enquiry OS — the customer-facing quotation model + DTO.
//
// This is the SECURITY BOUNDARY between internal quote data and anything a
// customer sees (the admin preview and the PDF). The DTO is built ONLY from
// the frozen quote_items snapshot via the shared engine, and carries ONLY
// customer-appropriate commercial fields.
//
// NEVER add to CustomerQuote*: rate_book_id, is_overridden, internal_note, any
// cost_*/supplier_*/margin_* field, match_state, created_by/updated_by, audit
// data, or the enquiry's internal_notes. If it would not be printed on a
// quotation handed to a contractor, it does not belong here.
//
// Deliberately ZERO runtime imports (only `import type`) so it loads under
// `node --test` — see lib/customer-quote.test.ts.

import type { QuoteBuilderData } from "@/lib/data/quotes";
import type { PricingBasis } from "@/lib/rate-book";

// -------------------------------------------------------- commercial terms --

export interface QuoteTerms {
  payment: string;
  delivery_timeline: string;
  validity: string;
  freight: string;
  unloading: string;
  taxes: string;
  availability: string;
  other: string;
}

export const TERM_FIELDS = [
  "payment",
  "delivery_timeline",
  "validity",
  "freight",
  "unloading",
  "taxes",
  "availability",
  "other",
] as const;

export const TERM_LABELS: Record<keyof QuoteTerms, string> = {
  payment: "Payment terms",
  delivery_timeline: "Delivery timeline",
  validity: "Quotation validity",
  freight: "Freight / transport",
  unloading: "Unloading",
  taxes: "Taxes",
  availability: "Availability",
  other: "Other terms",
};

export const DEFAULT_QUOTE_TERMS: QuoteTerms = {
  payment: "50% advance with the purchase order, balance before dispatch.",
  delivery_timeline: "3–5 working days from confirmed order, subject to stock.",
  validity: "This quotation is valid for 15 days from the date of issue.",
  freight: "Freight extra at actuals unless stated otherwise.",
  unloading: "Unloading at site is to the customer's account.",
  taxes: "GST as applicable, shown against each option.",
  availability: "Subject to stock availability at the time of order confirmation.",
  other: "Rates are for the specifications quoted; any change in specification will be re-quoted.",
};

export function mergeTerms(stored: unknown): QuoteTerms {
  const base = { ...DEFAULT_QUOTE_TERMS };
  if (stored && typeof stored === "object") {
    for (const key of TERM_FIELDS) {
      const v = (stored as Record<string, unknown>)[key];
      if (typeof v === "string" && v.trim()) base[key] = v.trim();
    }
  }
  return base;
}

export const DEFAULT_VALIDITY_DAYS = 15;

export function defaultValidUntil(fromIso: string): string {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + DEFAULT_VALIDITY_DAYS);
  return d.toISOString().slice(0, 10);
}

// --------------------------------------------------- pricing-basis display --
// Inlined (not imported from ./rate-book) to keep this module import-free.

const BASIS_LABEL: Record<string, string> = {
  PER_SQFT: "Per sqft",
  PER_SHEET: "Per sheet",
  PER_UNIT: "Per unit",
  PER_PIECE: "Per piece",
  PER_PAIR: "Per pair",
  PER_SET: "Per set",
  PER_BOX: "Per box",
  PER_RUNNING_FT: "Per running ft",
  PER_RUNNING_M: "Per running m",
  PER_KG: "Per kg",
  PER_PACK: "Per pack",
  MANUAL: "Manual amount",
};
const BASIS_UNIT: Record<string, string> = {
  PER_SQFT: "sqft",
  PER_SHEET: "sheet",
  PER_UNIT: "unit",
  PER_PIECE: "piece",
  PER_PAIR: "pair",
  PER_SET: "set",
  PER_BOX: "box",
  PER_RUNNING_FT: "rft",
  PER_RUNNING_M: "rm",
  PER_KG: "kg",
  PER_PACK: "pack",
  MANUAL: "lot",
};

// ------------------------------------------------------------------- DTO --

export interface CustomerQuoteLine {
  requirement: string;
  quantity: number;
  unit: string;
  basis: PricingBasis;
  basisLabel: string;
  basisUnit: string;
  gstRate: number;
  rateExGst: number | null;
  rateInclGst: number | null;
  amountExGst: number;
  gstAmount: number;
  amountInclGst: number;
  resolved: boolean;
}

export interface CustomerQuoteCharge {
  label: string;
  amount: number;
  taxable: boolean;
}

export interface CustomerQuoteOption {
  label: string;
  brand: string | null;
  rangeName: string | null;
  warranty: string | null;
  notes: string | null;
  lines: CustomerQuoteLine[];
  totals: {
    materialTaxable: number;
    optionDiscount: number;
    materialGst: number;
    charges: CustomerQuoteCharge[];
    chargesTaxable: number;
    chargesNonTaxable: number;
    chargesGst: number;
    taxableSubtotal: number;
    totalGst: number;
    roundOff: number;
    grandTotal: number;
  };
}

export interface CustomerQuote {
  ref: string;
  versionNo: number;
  versionRef: string;
  status: string;
  frozen: boolean;
  pricingDisplay: "EX_GST" | "INCL_GST";
  quoteDate: string;
  validUntil: string;
  customer: {
    name: string;
    company: string | null;
    phone: string | null;
    gstin: string | null;
    project: string | null;
    deliveryLocation: string | null;
  };
  options: CustomerQuoteOption[];
  terms: QuoteTerms;
}

function requirementLabelFor(line: QuoteBuilderData["options"][number]["lines"][number]): string {
  const it = line.item;
  return [it.thickness, it.description, it.product_name, it.category].map((s) => s?.trim()).find(Boolean) || "Item";
}

/**
 * Build the customer DTO for one version. `data` is already scoped to a
 * version and its amounts are recomputed from snapshot columns, so a later
 * Rate Book / catalogue / GST-default change cannot move these numbers.
 */
export function buildCustomerQuote(data: QuoteBuilderData): CustomerQuote {
  const { quote, version, enquiry, customer } = data;
  const quoteDate = version.quote_date ?? version.created_at.slice(0, 10);
  const validUntil = version.valid_until ?? defaultValidUntil(version.created_at);

  const options: CustomerQuoteOption[] = data.options.map((o) => {
    const opt = o.option;
    const t = o.totals;

    const charges: CustomerQuoteCharge[] = [
      { label: "Freight", amount: Number(opt.freight), taxable: opt.freight_taxable },
      { label: "Loading / unloading", amount: Number(opt.loading_unloading), taxable: opt.loading_taxable },
      { label: "Packing", amount: Number(opt.packing), taxable: opt.packing_taxable },
      { label: "Other charges", amount: Number(opt.other_charges), taxable: opt.other_taxable },
    ].filter((c) => c.amount > 0);

    const lines: CustomerQuoteLine[] = o.lines.map((l) => {
      const basis = l.item.pricing_basis as PricingBasis;
      return {
        requirement: requirementLabelFor(l),
        quantity: Number(l.item.quantity),
        unit: l.item.unit,
        basis,
        basisLabel: BASIS_LABEL[basis] ?? basis,
        basisUnit: BASIS_UNIT[basis] ?? "",
        gstRate: Number(l.item.gst_rate),
        rateExGst: l.baseRateExGst,
        rateInclGst: l.rateInclGst,
        amountExGst: l.taxableAmount,
        gstAmount: l.gstAmount,
        amountInclGst: l.amountInclGst,
        resolved: l.priced,
      };
    });

    return {
      label: opt.label,
      brand: opt.brand,
      rangeName: opt.range_name,
      warranty: opt.warranty_text,
      notes: opt.customer_notes,
      lines,
      totals: {
        materialTaxable: t.materialTaxableNet,
        optionDiscount: t.optionDiscount,
        materialGst: t.materialGst,
        charges,
        chargesTaxable: t.chargesTaxableBase,
        chargesNonTaxable: t.chargesNonTaxable,
        chargesGst: t.chargesGst,
        taxableSubtotal: t.taxableSubtotal,
        totalGst: t.totalGst,
        roundOff: t.roundOff,
        grandTotal: t.grandTotal,
      },
    };
  });

  return {
    ref: quote.ref,
    versionNo: version.version_no,
    versionRef: `${quote.ref}-V${version.version_no}`,
    status: quote.status,
    frozen: version.frozen_at != null,
    pricingDisplay: version.pricing_display === "INCL_GST" ? "INCL_GST" : "EX_GST",
    quoteDate,
    validUntil,
    customer: {
      name: customer?.name ?? enquiry.name ?? "Customer",
      company: customer?.company ?? null,
      phone: customer?.phone ?? enquiry.phone ?? null,
      gstin: customer?.gstin ?? null,
      project: enquiry.project_name ?? null,
      deliveryLocation: enquiry.delivery_location ?? null,
    },
    options,
    terms: mergeTerms(version.terms),
  };
}

/** Prefilled WhatsApp message for this quote. Pure text — number
 *  normalisation and the wa.me link live in lib/phone.ts (whatsAppLink), which
 *  refuses a number it cannot safely reach. The PDF is attached manually; a
 *  wa.me link cannot carry an attachment without the WhatsApp Business API. */
export function whatsappMessage(quote: CustomerQuote): string {
  return (
    `Hi ${quote.customer.name},\n\n` +
    `Please find our quotation ${quote.ref} for your requirement. ` +
    `We have included the requested alternatives for your comparison.\n\n` +
    `Regards,\nEightByFour`
  );
}

export function pdfFileName(quote: CustomerQuote): string {
  return `EightByFour-Quotation-${quote.versionRef}.pdf`;
}
