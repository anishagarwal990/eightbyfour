"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, requireAdmin } from "@/lib/supabase/admin-server";
import type { InquiryItemRow, QuoteItemRow, QuoteOptionRow, QuoteRateRow, QuoteRow, QuoteVersionRow } from "@/lib/supabase/types";
import {
  DEFAULT_GST_RATE,
  DEFAULT_SHEET_AREA_SQFT,
  DEFAULT_SHEET_LENGTH_FT,
  DEFAULT_SHEET_WIDTH_FT,
  GST_RATES,
  PRICING_BASES,
  RATE_INPUT_MODES,
  basisUsesArea,
  generateQuoteRef,
  suggestedBasisForCategory,
  type PricingBasis,
  type RateInputMode,
} from "@/lib/rate-book";
import { computeLine, computeOption } from "@/lib/quote-math";
import { requirementLabel } from "@/lib/enquiry";
import { findRateCandidates } from "@/lib/data/rates";
import { lineInputForItem, optionInputForOption } from "@/lib/data/quotes";
import { isUuid } from "@/lib/uuid";

export interface QuoteActionResult {
  ok: boolean;
  message: string;
  id?: string;
  /** applied / unresolved counts, for the "apply rates" toast. */
  applied?: number;
  unresolved?: number;
}

async function assertAdmin() {
  const check = await requireAdmin();
  if (!check.ok) throw new Error(check.message);
  return check.user;
}

type Supabase = Awaited<ReturnType<typeof createAdminSupabaseClient>>;

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
function num(form: FormData, key: string): number | null {
  const v = str(form, key);
  if (v === null) return null;
  const n = Number.parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function bool(form: FormData, key: string, dflt: boolean): boolean {
  const v = str(form, key);
  if (v === null) return dflt;
  return v === "true" || v === "on" || v === "1";
}
function oneOf<T extends readonly string[]>(v: string | null, allowed: T): T[number] | null {
  return v && (allowed as readonly string[]).includes(v) ? (v as T[number]) : null;
}
function gstRate(n: number | null): number {
  return n != null && (GST_RATES as readonly number[]).includes(n) ? n : DEFAULT_GST_RATE;
}

async function logQuote(
  supabase: Supabase,
  entry: { inquiryId: string; quoteId: string; kind: string; summary: string; detail?: unknown; actorEmail: string; actorId: string }
) {
  const { error } = await supabase.from("inquiry_activity").insert({
    inquiry_id: entry.inquiryId,
    kind: entry.kind,
    summary: entry.summary,
    detail: entry.detail ?? null,
    entity_type: "quote",
    entity_id: entry.quoteId,
    actor_email: entry.actorEmail,
    actor_id: entry.actorId,
  });
  if (error) console.error(`Quote activity failed for ${entry.quoteId}: ${error.message}`);
}

/** The current (highest, non-frozen) version of a quote, or an error if the
 *  latest version is frozen — every edit action funnels through here so a
 *  frozen version can never be written to from the app layer. */
async function loadDraftVersion(
  supabase: Supabase,
  quoteId: string
): Promise<{ error: string } | { quote: QuoteRow; version: QuoteVersionRow }> {
  const { data: quote, error: qErr } = await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (qErr) return { error: qErr.message };
  if (!quote) return { error: "Quote not found." };

  const { data: versions, error: vErr } = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version_no", { ascending: false })
    .limit(1);
  if (vErr) return { error: vErr.message };
  const version = versions?.[0] as QuoteVersionRow | undefined;
  if (!version) return { error: "Quote has no version." };
  if (version.frozen_at) return { error: `V${version.version_no} is finalised — create a new version to make changes.` };
  return { quote: quote as QuoteRow, version };
}

// -------------------------------------------------- item amount derivation --

interface ItemMathInput {
  pricing_basis: string;
  quantity: number;
  sheet_area_sqft: number | null;
  gst_rate: number;
  rate_input_mode: string;
  entered_rate: number | null;
  line_discount: number;
  manual_amount: number | null;
}

/** Derived columns for a quote_items row, from its own snapshot fields only. */
function deriveItemColumns(input: ItemMathInput) {
  const line = computeLine({
    basis: input.pricing_basis as PricingBasis,
    quantity: Number(input.quantity),
    sheetAreaSqft: input.sheet_area_sqft == null ? null : Number(input.sheet_area_sqft),
    gstRate: Number(input.gst_rate),
    inputMode: input.rate_input_mode as RateInputMode,
    enteredRate: input.entered_rate == null ? null : Number(input.entered_rate),
    lineDiscount: Number(input.line_discount),
    manualAmount: input.manual_amount == null ? null : Number(input.manual_amount),
  });
  return {
    pricing_quantity: line.pricingQuantity,
    base_rate_ex_gst: line.baseRateExGst,
    rate_incl_gst: line.rateInclGst,
    taxable_amount: line.taxableAmount,
    gst_amount: line.gstAmount,
    amount_incl_gst: line.amountInclGst,
  };
}

// --------------------------------------------------- create quote from enquiry --

export async function createQuoteFromEnquiry(inquiryId: string): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  if (!isUuid(inquiryId)) return { ok: false, message: "Bad enquiry id." };
  const supabase = await createAdminSupabaseClient();

  // Idempotent: one quote per enquiry.
  const { data: existing } = await supabase.from("quotes").select("id").eq("inquiry_id", inquiryId).maybeSingle();
  if (existing) return { ok: true, message: "Quote already exists.", id: existing.id };

  const { data: enquiry, error: eErr } = await supabase
    .from("inquiries")
    .select("id, ref, name, customer_id")
    .eq("id", inquiryId)
    .maybeSingle();
  if (eErr) return { ok: false, message: eErr.message };
  if (!enquiry) return { ok: false, message: "Enquiry not found." };

  const ref = generateQuoteRef();
  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .insert({
      ref,
      inquiry_id: inquiryId,
      customer_id: enquiry.customer_id,
      status: "DRAFT",
      current_version: 1,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();
  if (qErr) return { ok: false, message: qErr.message };

  const { error: vErr } = await supabase.from("quote_versions").insert({
    quote_id: quote.id,
    version_no: 1,
    status: "DRAFT",
    customer_snapshot: { name: enquiry.name },
    created_by: user.id,
  });
  if (vErr) return { ok: false, message: vErr.message };

  await logQuote(supabase, {
    inquiryId,
    quoteId: quote.id,
    kind: "QUOTE_CREATED",
    summary: `Quote ${ref} created (V1 draft).`,
    detail: { quote_ref: ref },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  revalidatePath("/admin/quotes");
  return { ok: true, message: `Created ${ref}.`, id: quote.id };
}

// ------------------------------------------------------------- option CRUD --

/** Build the seed quote_items for an option from the enquiry's requirement
 *  lines. Snapshots the spec; leaves every line UNRESOLVED (no rate yet). */
function seedItemsFromRequirement(
  optionId: string,
  enquiryItems: InquiryItemRow[],
  optionBrand: string | null
): Record<string, unknown>[] {
  return enquiryItems.map((it, i) => {
    const basis = suggestedBasisForCategory(it.category);
    const usesArea = basisUsesArea(basis);
    return {
      quote_option_id: optionId,
      enquiry_item_id: it.id,
      sort_order: i,
      match_state: "UNRESOLVED",
      description: requirementLabel(it),
      category: it.category,
      brand: optionBrand ?? it.requested_brand,
      product_name: it.requested_product,
      thickness: it.thickness,
      grade: it.grade,
      finish: it.finish,
      size: it.size,
      quantity: it.quantity ?? 0,
      unit: it.unit ?? "sheet",
      pricing_basis: basis,
      sheet_width_ft: usesArea ? DEFAULT_SHEET_WIDTH_FT : null,
      sheet_length_ft: usesArea ? DEFAULT_SHEET_LENGTH_FT : null,
      sheet_area_sqft: usesArea ? DEFAULT_SHEET_AREA_SQFT : null,
      pricing_quantity: 0,
      gst_rate: DEFAULT_GST_RATE,
      rate_input_mode: "EX_GST",
      taxable_amount: 0,
      gst_amount: 0,
      amount_incl_gst: 0,
    };
  });
}

export async function addOption(quoteId: string, formData: FormData): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };
  const { quote, version } = loaded;

  const label = str(formData, "label");
  if (!label) return { ok: false, message: "Give the option a name." };
  const brand = str(formData, "brand");

  const { count } = await supabase
    .from("quote_options")
    .select("id", { count: "exact", head: true })
    .eq("quote_version_id", version.id);

  const { data: option, error } = await supabase
    .from("quote_options")
    .insert({
      quote_version_id: version.id,
      label,
      brand,
      range_name: str(formData, "range_name"),
      warranty_text: str(formData, "warranty_text"),
      customer_notes: str(formData, "customer_notes"),
      sort_order: count ?? 0,
      charges_gst_rate: DEFAULT_GST_RATE,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  // Seed requirement lines unless the operator opted out.
  if (str(formData, "apply_to_lines") !== "false") {
    const { data: enquiryItems } = await supabase
      .from("inquiry_items")
      .select("*")
      .eq("inquiry_id", quote.inquiry_id)
      .order("sort_order");
    const seed = seedItemsFromRequirement(option.id, (enquiryItems ?? []) as InquiryItemRow[], brand);
    if (seed.length > 0) {
      const { error: seedErr } = await supabase.from("quote_items").insert(seed);
      if (seedErr) return { ok: false, message: `Option saved, lines failed: ${seedErr.message}` };
    }
  }

  await logQuote(supabase, {
    inquiryId: quote.inquiry_id,
    quoteId,
    kind: "QUOTE_OPTION_ADDED",
    summary: `Option “${label}” added${brand ? ` (${brand})` : ""}.`,
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: `Option “${label}” added.`, id: option.id };
}

export async function updateOptionMeta(optionId: string, formData: FormData): Promise<QuoteActionResult> {
  await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const label = str(formData, "label");
  if (!label) return { ok: false, message: "Option name can't be blank." };
  const { error } = await supabase
    .from("quote_options")
    .update({
      label,
      brand: str(formData, "brand"),
      range_name: str(formData, "range_name"),
      warranty_text: str(formData, "warranty_text"),
      customer_notes: str(formData, "customer_notes"),
    })
    .eq("id", optionId);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Option saved." };
}

export async function removeOption(quoteId: string, optionId: string): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };

  const { data: option } = await supabase.from("quote_options").select("label").eq("id", optionId).maybeSingle();
  const { error } = await supabase.from("quote_options").delete().eq("id", optionId);
  if (error) return { ok: false, message: error.message };

  await logQuote(supabase, {
    inquiryId: loaded.quote.inquiry_id,
    quoteId,
    kind: "QUOTE_OPTION_REMOVED",
    summary: `Option “${option?.label ?? "?"}” removed.`,
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: "Option removed." };
}

// ---------------------------------------------------------- apply rate book --

export async function applyRatesToOption(quoteId: string, optionId: string): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };

  const { data: option, error: oErr } = await supabase
    .from("quote_options")
    .select("*, quote_items(*)")
    .eq("id", optionId)
    .maybeSingle();
  if (oErr) return { ok: false, message: oErr.message };
  if (!option) return { ok: false, message: "Option not found." };

  const opt = option as QuoteOptionRow & { quote_items: QuoteItemRow[] };
  let applied = 0;
  let unresolved = 0;

  for (const item of opt.quote_items) {
    // Don't overwrite a line the operator has already priced by hand.
    if (item.entered_rate != null) continue;

    const candidates = await findRateCandidates({
      brand: opt.brand ?? item.brand,
      rangeName: opt.range_name,
      label: opt.label,
      thickness: item.thickness,
      grade: item.grade,
    });

    if (candidates.length !== 1) {
      unresolved += 1;
      continue;
    }
    const rate = candidates[0] as QuoteRateRow;
    const basis = (rate.pricing_basis as PricingBasis) ?? item.pricing_basis;
    const usesArea = basisUsesArea(basis);
    const area = usesArea ? rate.sheet_area_sqft ?? item.sheet_area_sqft ?? DEFAULT_SHEET_AREA_SQFT : null;

    const patch: Record<string, unknown> = {
      rate_book_id: rate.id,
      product_id: rate.product_id,
      match_state: "RATE_BOOK",
      brand: rate.brand ?? item.brand,
      product_name: rate.product_name ?? item.product_name,
      range_name: rate.range_name ?? opt.range_name,
      grade: rate.grade ?? item.grade,
      finish: rate.finish ?? item.finish,
      size: rate.size ?? item.size,
      pricing_basis: basis,
      sheet_width_ft: usesArea ? rate.sheet_width_ft ?? item.sheet_width_ft ?? DEFAULT_SHEET_WIDTH_FT : null,
      sheet_length_ft: usesArea ? rate.sheet_length_ft ?? item.sheet_length_ft ?? DEFAULT_SHEET_LENGTH_FT : null,
      sheet_area_sqft: area,
      gst_rate: rate.gst_rate,
      rate_input_mode: rate.rate_input_mode,
      entered_rate: rate.rate,
      rate_book_rate_snapshot: rate.rate,
      rate_book_mode_snapshot: rate.rate_input_mode,
      is_overridden: false,
      warranty_text: rate.warranty_text ?? item.warranty_text,
    };
    Object.assign(patch, deriveItemColumns({
      pricing_basis: basis,
      quantity: Number(item.quantity),
      sheet_area_sqft: area,
      gst_rate: Number(rate.gst_rate),
      rate_input_mode: rate.rate_input_mode,
      entered_rate: Number(rate.rate),
      line_discount: Number(item.line_discount),
      manual_amount: null,
    }));

    const { error: uErr } = await supabase.from("quote_items").update(patch).eq("id", item.id);
    if (uErr) return { ok: false, message: uErr.message };
    applied += 1;
  }

  await logQuote(supabase, {
    inquiryId: loaded.quote.inquiry_id,
    quoteId,
    kind: "QUOTE_RATES_APPLIED",
    summary: `Rates applied to “${opt.label}” — ${applied} matched, ${unresolved} unresolved.`,
    detail: { option: opt.label, applied, unresolved },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: `${applied} line${applied === 1 ? "" : "s"} priced, ${unresolved} unresolved.`, applied, unresolved };
}

// -------------------------------------------------------------- edit a line --

export async function saveQuoteItem(quoteId: string, itemId: string, formData: FormData): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };

  const { data: item, error: iErr } = await supabase.from("quote_items").select("*").eq("id", itemId).maybeSingle();
  if (iErr) return { ok: false, message: iErr.message };
  if (!item) return { ok: false, message: "Line not found." };
  const row = item as QuoteItemRow;

  const basis = oneOf(str(formData, "pricing_basis"), PRICING_BASES) ?? (row.pricing_basis as PricingBasis);
  const usesArea = basisUsesArea(basis);
  const quantity = num(formData, "quantity") ?? Number(row.quantity);
  const area = usesArea ? num(formData, "sheet_area_sqft") ?? row.sheet_area_sqft ?? DEFAULT_SHEET_AREA_SQFT : null;
  const enteredRate = basis === "MANUAL" ? null : num(formData, "entered_rate");
  const manualAmount = basis === "MANUAL" ? num(formData, "manual_amount") : null;
  const inputMode = oneOf(str(formData, "rate_input_mode"), RATE_INPUT_MODES) ?? (row.rate_input_mode as RateInputMode);
  const gst = gstRate(num(formData, "gst_rate"));
  const lineDiscount = Math.max(0, num(formData, "line_discount") ?? 0);

  const overridden =
    row.rate_book_id != null &&
    enteredRate != null &&
    row.rate_book_rate_snapshot != null &&
    Math.abs(enteredRate - Number(row.rate_book_rate_snapshot)) > 0.0001;

  const nextMatchState =
    basis === "MANUAL" || (enteredRate != null && row.rate_book_id == null)
      ? "MANUAL"
      : enteredRate != null && row.rate_book_id != null
      ? "RATE_BOOK"
      : "UNRESOLVED";

  const patch: Record<string, unknown> = {
    description: str(formData, "description") ?? row.description,
    brand: str(formData, "brand") ?? row.brand,
    product_name: str(formData, "product_name") ?? row.product_name,
    thickness: str(formData, "thickness") ?? row.thickness,
    grade: str(formData, "grade") ?? row.grade,
    size: str(formData, "size") ?? row.size,
    product_id: (() => {
      const p = num(formData, "product_id");
      return p != null && Number.isInteger(p) ? p : row.product_id;
    })(),
    quantity,
    unit: str(formData, "unit") ?? row.unit,
    pricing_basis: basis,
    sheet_width_ft: usesArea ? num(formData, "sheet_width_ft") ?? row.sheet_width_ft ?? DEFAULT_SHEET_WIDTH_FT : null,
    sheet_length_ft: usesArea ? num(formData, "sheet_length_ft") ?? row.sheet_length_ft ?? DEFAULT_SHEET_LENGTH_FT : null,
    sheet_area_sqft: area,
    gst_rate: gst,
    rate_input_mode: inputMode,
    entered_rate: enteredRate,
    manual_amount: manualAmount,
    line_discount: lineDiscount,
    is_overridden: overridden,
    match_state: nextMatchState,
    customer_note: str(formData, "customer_note"),
    internal_note: str(formData, "internal_note"),
  };
  Object.assign(patch, deriveItemColumns({
    pricing_basis: basis,
    quantity,
    sheet_area_sqft: area,
    gst_rate: gst,
    rate_input_mode: inputMode,
    entered_rate: enteredRate,
    line_discount: lineDiscount,
    manual_amount: manualAmount,
  }));

  const { error } = await supabase.from("quote_items").update(patch).eq("id", itemId);
  if (error) return { ok: false, message: error.message };

  if (overridden) {
    await logQuote(supabase, {
      inquiryId: loaded.quote.inquiry_id,
      quoteId,
      kind: "QUOTE_RATE_OVERRIDDEN",
      summary: `Rate overridden on “${patch.description ?? row.description ?? "line"}” — ${row.rate_book_rate_snapshot} → ${enteredRate}.`,
      detail: { from: row.rate_book_rate_snapshot, to: enteredRate },
      actorEmail: user.email ?? user.id,
      actorId: user.id,
    });
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: "Line saved." };
}

// --------------------------------------------------------- option charges --

export async function updateOptionCharges(quoteId: string, optionId: string, formData: FormData): Promise<QuoteActionResult> {
  await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };

  const roundRaw = str(formData, "round_off");
  const { error } = await supabase
    .from("quote_options")
    .update({
      // Charges form: the checkbox is only present in the payload when ticked,
      // so absent = not taxable.
      option_discount: Math.max(0, num(formData, "option_discount") ?? 0),
      freight: Math.max(0, num(formData, "freight") ?? 0),
      freight_taxable: bool(formData, "freight_taxable", false),
      loading_unloading: Math.max(0, num(formData, "loading_unloading") ?? 0),
      loading_taxable: bool(formData, "loading_taxable", false),
      packing: Math.max(0, num(formData, "packing") ?? 0),
      packing_taxable: bool(formData, "packing_taxable", false),
      other_charges: Math.max(0, num(formData, "other_charges") ?? 0),
      other_taxable: bool(formData, "other_taxable", false),
      charges_gst_rate: gstRate(num(formData, "charges_gst_rate")),
      round_off: roundRaw === "auto" || roundRaw === null ? null : num(formData, "round_off"),
    })
    .eq("id", optionId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: "Charges saved." };
}

export async function setPricingDisplay(quoteId: string, mode: string): Promise<QuoteActionResult> {
  await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };
  const next = mode === "INCL_GST" ? "INCL_GST" : "EX_GST";
  const { error } = await supabase.from("quote_versions").update({ pricing_display: next }).eq("id", loaded.version.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: `Showing rates ${next === "INCL_GST" ? "inclusive of" : "excluding"} GST.` };
}

// ---------------------------------------------------------- save / version --

export async function saveQuoteDraft(quoteId: string): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };

  await supabase.from("quotes").update({ updated_by: user.id, current_version: loaded.version.version_no }).eq("id", quoteId);
  await logQuote(supabase, {
    inquiryId: loaded.quote.inquiry_id,
    quoteId,
    kind: "QUOTE_SAVED",
    summary: `Quote ${loaded.quote.ref} V${loaded.version.version_no} saved (draft).`,
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  return { ok: true, message: "Draft saved." };
}

export async function createNewVersion(quoteId: string, formData: FormData): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const { data: quote, error: qErr } = await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (qErr) return { ok: false, message: qErr.message };
  if (!quote) return { ok: false, message: "Quote not found." };

  const { data: versions, error: vErr } = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version_no", { ascending: false });
  if (vErr) return { ok: false, message: vErr.message };
  const current = versions?.[0] as QuoteVersionRow | undefined;
  if (!current) return { ok: false, message: "Quote has no version." };

  const reason = str(formData, "revision_reason");

  // Freeze the current version if it is still a live draft.
  if (!current.frozen_at) {
    const { error: fErr } = await supabase
      .from("quote_versions")
      .update({ frozen_at: new Date().toISOString() })
      .eq("id", current.id);
    if (fErr) return { ok: false, message: `Freeze failed: ${fErr.message}` };
  }

  // Clone into the next version.
  const nextNo = current.version_no + 1;
  const { data: newVersion, error: nvErr } = await supabase
    .from("quote_versions")
    .insert({
      quote_id: quoteId,
      version_no: nextNo,
      status: "DRAFT",
      label: str(formData, "label"),
      pricing_display: current.pricing_display,
      customer_snapshot: current.customer_snapshot,
      terms: current.terms,
      tax_assumption: current.tax_assumption,
      revision_reason: reason,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (nvErr) return { ok: false, message: nvErr.message };

  const { data: options, error: oErr } = await supabase
    .from("quote_options")
    .select("*, quote_items(*)")
    .eq("quote_version_id", current.id)
    .order("sort_order");
  if (oErr) return { ok: false, message: oErr.message };

  for (const o of (options ?? []) as (QuoteOptionRow & { quote_items: QuoteItemRow[] })[]) {
    const { quote_items, id: _oldId, quote_version_id: _v, totals_snapshot: _t, created_at: _c, updated_at: _u, ...optCols } = o;
    void _oldId; void _v; void _t; void _c; void _u;
    const { data: clonedOpt, error: coErr } = await supabase
      .from("quote_options")
      .insert({ ...optCols, quote_version_id: newVersion.id, totals_snapshot: null })
      .select("id")
      .single();
    if (coErr) return { ok: false, message: coErr.message };

    if (quote_items.length > 0) {
      const clonedItems = quote_items.map((it) => {
        const { id: _iId, quote_option_id: _qo, created_at: _ic, updated_at: _iu, ...itCols } = it;
        void _iId; void _qo; void _ic; void _iu;
        return { ...itCols, quote_option_id: clonedOpt.id };
      });
      const { error: ciErr } = await supabase.from("quote_items").insert(clonedItems);
      if (ciErr) return { ok: false, message: ciErr.message };
    }
  }

  await supabase.from("quotes").update({ current_version: nextNo, status: "DRAFT", updated_by: user.id }).eq("id", quoteId);
  await logQuote(supabase, {
    inquiryId: quote.inquiry_id,
    quoteId,
    kind: "QUOTE_VERSION_CREATED",
    summary: `Quote ${quote.ref} V${nextNo} created${reason ? ` — ${reason}` : ""}.`,
    detail: { version: nextNo, reason },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: `V${nextNo} created.`, id: newVersion.id };
}

export async function markQuoteReady(quoteId: string): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };
  const { quote, version } = loaded;

  const { data: options, error: oErr } = await supabase
    .from("quote_options")
    .select("*, quote_items(*)")
    .eq("quote_version_id", version.id)
    .order("sort_order");
  if (oErr) return { ok: false, message: oErr.message };
  const opts = (options ?? []) as (QuoteOptionRow & { quote_items: QuoteItemRow[] })[];
  if (opts.length === 0) return { ok: false, message: "Add at least one option before marking ready." };

  // Every line must be priced.
  const unresolved: string[] = [];
  const totals: Record<string, unknown> = {};
  for (const o of opts) {
    const lines = o.quote_items.map((it) => computeLine(lineInputForItem(it)));
    lines.forEach((l, i) => {
      if (!l.priced) unresolved.push(`${o.label}: ${o.quote_items[i].description ?? "line"}`);
    });
    const result = computeOption(optionInputForOption(o, lines));
    totals[o.id] = {
      material_taxable: result.materialTaxableNet,
      material_gst: result.materialGst,
      charges_taxable: result.chargesTaxableBase,
      charges_gst: result.chargesGst,
      taxable_subtotal: result.taxableSubtotal,
      total_gst: result.totalGst,
      round_off: result.roundOff,
      grand_total: result.grandTotal,
    };
  }
  if (unresolved.length > 0) {
    return { ok: false, message: `Unresolved lines: ${unresolved.slice(0, 4).join("; ")}${unresolved.length > 4 ? " …" : ""}` };
  }

  const { error } = await supabase.rpc("mark_quote_ready", { p_quote_id: quoteId, p_totals: totals });
  if (error) return { ok: false, message: `Mark ready failed: ${error.message}` };

  await supabase.from("quotes").update({ updated_by: user.id }).eq("id", quoteId);
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/enquiries/${quote.inquiry_id}`);
  return { ok: true, message: `${quote.ref} V${version.version_no} marked ready. Enquiry moved to Quote ready.` };
}

// ---------------------------------------------------- terms / validity --

export async function updateQuoteTerms(quoteId: string, formData: FormData): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const loaded = await loadDraftVersion(supabase, quoteId);
  if ("error" in loaded) return { ok: false, message: loaded.error };

  const { TERM_FIELDS } = await import("@/lib/customer-quote");
  const terms: Record<string, string> = {};
  for (const f of TERM_FIELDS) {
    const v = str(formData, `term_${f}`);
    if (v) terms[f] = v;
  }

  const quoteDate = str(formData, "quote_date");
  const validUntil = str(formData, "valid_until");

  const { error } = await supabase
    .from("quote_versions")
    .update({
      terms,
      quote_date: quoteDate,
      valid_until: validUntil,
    })
    .eq("id", loaded.version.id);
  if (error) return { ok: false, message: error.message };

  void user;
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/preview`);
  return { ok: true, message: "Terms saved." };
}

// --------------------------------------------------------- mark sent --

export async function markQuoteSent(quoteId: string, formData: FormData): Promise<QuoteActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("id, ref, status, inquiry_id, current_version")
    .eq("id", quoteId)
    .maybeSingle();
  if (qErr) return { ok: false, message: qErr.message };
  if (!quote) return { ok: false, message: "Quote not found." };
  if (quote.status !== "READY") {
    return { ok: false, message: `Quote is ${quote.status} — mark it ready first.` };
  }

  const { error } = await supabase.rpc("mark_quote_sent", { p_quote_id: quoteId });
  if (error) return { ok: false, message: `Mark sent failed: ${error.message}` };

  // Optional follow-up, using the Slice 1 follow-up system (no second architecture).
  const days = num(formData, "followup_days");
  if (days != null && days >= 0) {
    const { followupDateFor } = await import("@/lib/enquiry");
    const dueAt = new Date(followupDateFor(days)).toISOString();
    const { error: fErr } = await supabase.from("followups").insert({
      inquiry_id: quote.inquiry_id,
      due_at: dueAt,
      note: `Follow up on quote ${quote.ref} (sent ${new Date().toLocaleDateString("en-IN")}).`,
      created_by: user.id,
    });
    if (!fErr) {
      await supabase.from("inquiries").update({ next_followup_at: dueAt, updated_by: user.id }).eq("id", quote.inquiry_id);
      await supabase.from("inquiry_activity").insert({
        inquiry_id: quote.inquiry_id,
        kind: "FOLLOWUP_ADDED",
        summary: `Follow-up scheduled for ${new Date(dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} after sending ${quote.ref}.`,
        entity_type: "quote",
        entity_id: quoteId,
        actor_email: user.email ?? user.id,
        actor_id: user.id,
      });
    }
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/preview`);
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/enquiries/${quote.inquiry_id}`);
  return { ok: true, message: `${quote.ref} marked sent. Enquiry moved to Quote sent.` };
}
