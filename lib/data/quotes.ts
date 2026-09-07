import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import type {
  CustomerRow,
  InquiryItemRow,
  InquiryRow,
  QuoteItemRow,
  QuoteOptionRow,
  QuoteRow,
  QuoteVersionRow,
} from "@/lib/supabase/types";
import {
  computeLine,
  computeOption,
  quoteValueRange,
  type LineInput,
  type LineResult,
  type OptionResult,
} from "@/lib/quote-math";
import type { PricingBasis, RateInputMode } from "@/lib/rate-book";
import { buildCustomerQuote } from "@/lib/customer-quote";
import { isUuid } from "@/lib/uuid";

// ------------------------------------------------------------- engine glue --

/** A stored quote item -> the inputs the engine needs. Reads ONLY snapshot
 *  columns, so recomputing is immune to later Rate Book / catalogue edits. */
export function lineInputForItem(item: QuoteItemRow): LineInput {
  return {
    basis: item.pricing_basis as PricingBasis,
    quantity: Number(item.quantity),
    sheetAreaSqft: item.sheet_area_sqft == null ? null : Number(item.sheet_area_sqft),
    gstRate: Number(item.gst_rate),
    inputMode: item.rate_input_mode as RateInputMode,
    enteredRate: item.entered_rate == null ? null : Number(item.entered_rate),
    lineDiscount: Number(item.line_discount),
    manualAmount: item.manual_amount == null ? null : Number(item.manual_amount),
  };
}

export function optionInputForOption(option: QuoteOptionRow, lines: LineResult[]) {
  return {
    lines,
    optionDiscount: Number(option.option_discount),
    freight: { amount: Number(option.freight), taxable: option.freight_taxable },
    loading: { amount: Number(option.loading_unloading), taxable: option.loading_taxable },
    packing: { amount: Number(option.packing), taxable: option.packing_taxable },
    other: { amount: Number(option.other_charges), taxable: option.other_taxable },
    chargesGstRate: Number(option.charges_gst_rate),
    roundOff: option.round_off == null ? null : Number(option.round_off),
  };
}

// --------------------------------------------------------------- list view --

export interface QuoteListRow {
  id: string;
  ref: string;
  status: string;
  current_version: number;
  sent_at: string | null;
  updated_at: string;
  created_at: string;
  inquiry_id: string;
  enquiry_ref: string | null;
  customer_name: string | null;
  option_count: number;
  version_count: number;
  value_min: number | null;
  value_max: number | null;
}

export async function listQuotes(): Promise<QuoteListRow[]> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `id, ref, status, current_version, sent_at, updated_at, created_at, inquiry_id,
       inquiries(ref, name),
       customers(name),
       quote_versions(id, version_no, frozen_at,
         quote_options(*,
           quote_items(pricing_basis, quantity, sheet_area_sqft, gst_rate, rate_input_mode, entered_rate, line_discount, manual_amount)))`
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;

  // Supabase types embedded relations inconsistently (object vs array by
  // version); normalise with first().
  const first = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? v[0] ?? null : v ?? null;

  type Raw = {
    id: string;
    ref: string;
    status: string;
    current_version: number;
    updated_at: string;
    created_at: string;
    inquiry_id: string;
    inquiries: { ref: string; name: string | null } | { ref: string; name: string | null }[] | null;
    customers: { name: string | null } | { name: string | null }[] | null;
    sent_at: string | null;
    quote_versions: (Pick<QuoteVersionRow, "id" | "version_no" | "frozen_at"> & {
      quote_options: (QuoteOptionRow & { quote_items: Partial<QuoteItemRow>[] })[];
    })[];
  };

  return ((data ?? []) as unknown as Raw[]).map((q) => {
    const inquiry = first(q.inquiries);
    const customer = first(q.customers);
    const versions = [...(q.quote_versions ?? [])].sort((a, b) => b.version_no - a.version_no);
    // The version shown in the list is the current (highest) one.
    const current = versions[0];
    const optionTotals = (current?.quote_options ?? []).map((o) => {
      const lines = (o.quote_items ?? []).map((it) => computeLine(lineInputForItem(it as QuoteItemRow)));
      return computeOption(optionInputForOption(o, lines)).grandTotal;
    });
    const range = quoteValueRange(optionTotals);
    return {
      id: q.id,
      ref: q.ref,
      status: q.status,
      current_version: q.current_version,
      sent_at: q.sent_at ?? null,
      updated_at: q.updated_at,
      created_at: q.created_at,
      inquiry_id: q.inquiry_id,
      enquiry_ref: inquiry?.ref ?? null,
      customer_name: customer?.name ?? inquiry?.name ?? null,
      option_count: current?.quote_options?.length ?? 0,
      version_count: versions.length,
      value_min: range?.min ?? null,
      value_max: range?.max ?? null,
    };
  });
}

// ----------------------------------------------------- enquiry -> quote link --

export async function getQuoteByEnquiry(inquiryId: string): Promise<QuoteRow | null> {
  if (!isUuid(inquiryId)) return null;
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .maybeSingle();
  if (error) throw error;
  return (data as QuoteRow | null) ?? null;
}

// --------------------------------------------------------------- builder view --

export interface BuilderLine extends LineResult {
  item: QuoteItemRow;
}

export interface BuilderOption {
  option: QuoteOptionRow;
  lines: BuilderLine[];
  totals: OptionResult;
}

export interface QuoteBuilderData {
  quote: QuoteRow;
  enquiry: InquiryRow;
  customer: CustomerRow | null;
  enquiryItems: InquiryItemRow[];
  versions: Pick<QuoteVersionRow, "id" | "version_no" | "status" | "frozen_at" | "label" | "sent_at">[];
  version: QuoteVersionRow;
  /** frozen version — the builder renders read-only. */
  readOnly: boolean;
  options: BuilderOption[];
  valueRange: { min: number; max: number } | null;
}

/**
 * Everything the builder / detail page needs for one quote, at one version.
 * `versionNo` omitted -> the latest version (the live draft, or the newest
 * frozen one if there is no draft).
 */
export async function getQuoteBuilderData(quoteId: string, versionNo?: number): Promise<QuoteBuilderData | null> {
  if (!isUuid(quoteId)) return null;
  const supabase = await createAdminSupabaseClient();

  const { data: quote, error: qErr } = await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (qErr) throw qErr;
  if (!quote) return null;
  const quoteRow = quote as QuoteRow;

  const { data: versionsData, error: vErr } = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version_no", { ascending: false });
  if (vErr) throw vErr;
  const versions = (versionsData ?? []) as QuoteVersionRow[];
  if (versions.length === 0) return null;

  const version = versionNo ? versions.find((v) => v.version_no === versionNo) ?? versions[0] : versions[0];

  const [enquiryRes, itemsRes, optionsRes] = await Promise.all([
    supabase.from("inquiries").select("*").eq("id", quoteRow.inquiry_id).maybeSingle(),
    supabase.from("inquiry_items").select("*").eq("inquiry_id", quoteRow.inquiry_id).order("sort_order"),
    supabase
      .from("quote_options")
      .select("*, quote_items(*)")
      .eq("quote_version_id", version.id)
      .order("sort_order"),
  ]);
  for (const r of [enquiryRes, itemsRes, optionsRes]) if (r.error) throw r.error;

  const enquiry = enquiryRes.data as InquiryRow;
  let customer: CustomerRow | null = null;
  if (quoteRow.customer_id) {
    const { data } = await supabase.from("customers").select("*").eq("id", quoteRow.customer_id).maybeSingle();
    customer = (data as CustomerRow | null) ?? null;
  }

  type OptionWithItems = QuoteOptionRow & { quote_items: QuoteItemRow[] };
  const options: BuilderOption[] = ((optionsRes.data ?? []) as OptionWithItems[]).map((o) => {
    const items = [...(o.quote_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const lines: BuilderLine[] = items.map((item) => ({
      ...computeLine(lineInputForItem(item)),
      item,
    }));
    const totals = computeOption(optionInputForOption(o, lines));
    return { option: o, lines, totals };
  });

  return {
    quote: quoteRow,
    enquiry,
    customer,
    enquiryItems: (itemsRes.data ?? []) as InquiryItemRow[],
    versions: versions.map((v) => ({
      id: v.id,
      version_no: v.version_no,
      status: v.status,
      frozen_at: v.frozen_at,
      label: v.label,
      sent_at: v.sent_at,
    })),
    version,
    readOnly: version.frozen_at != null,
    options,
    valueRange: quoteValueRange(options.map((o) => o.totals.grandTotal)),
  };
}

// --------------------------------------------------------- customer quote --

/**
 * The customer-facing DTO for one quote version. Thin wrapper over
 * getQuoteBuilderData + buildCustomerQuote — the DTO is where internal fields
 * are dropped. Used by the admin preview page and the PDF route.
 */
export async function getCustomerQuote(quoteId: string, versionNo?: number) {
  const data = await getQuoteBuilderData(quoteId, versionNo);
  if (!data) return null;
  return { dto: buildCustomerQuote(data), quote: data.quote, inquiryId: data.enquiry.id };
}

// ---------------------------------------------------- catalogue product search --

export interface CatalogueHit {
  id: number;
  brand: string;
  name: string;
  category: string;
  grade: string | null;
  size: string | null;
  thicknesses: string[] | null;
  warranty: string | null;
}

export async function searchCatalogue(term: string, limit = 12): Promise<CatalogueHit[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  const supabase = await createAdminSupabaseClient();
  const like = `%${trimmed}%`;
  const { data, error } = await supabase
    .from("products")
    .select("id, brand, name, category, grade, size, thicknesses, warranty")
    .or(`brand.ilike.${like},name.ilike.${like},collection.ilike.${like}`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CatalogueHit[];
}
