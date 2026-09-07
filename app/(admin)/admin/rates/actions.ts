"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, requireAdmin } from "@/lib/supabase/admin-server";
import { GST_RATES, PRICING_BASES, RATE_INPUT_MODES } from "@/lib/rate-book";

export interface RateActionResult {
  ok: boolean;
  message: string;
  id?: string;
}

async function assertAdmin() {
  const check = await requireAdmin();
  if (!check.ok) throw new Error(check.message);
  return check.user;
}

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

function oneOf<T extends readonly string[]>(v: string | null, allowed: T): T[number] | null {
  return v && (allowed as readonly string[]).includes(v) ? (v as T[number]) : null;
}

function gstRate(form: FormData): number {
  const n = num(form, "gst_rate");
  return n != null && (GST_RATES as readonly number[]).includes(n) ? n : 18;
}

async function recordAudit(
  supabase: Awaited<ReturnType<typeof createAdminSupabaseClient>>,
  entry: { rowId: string; changes: Record<string, unknown>; actor: string }
) {
  const { error } = await supabase.from("admin_audit").insert({
    table_name: "quote_rates",
    row_slug: entry.rowId,
    changes: entry.changes,
    actor_email: entry.actor,
  });
  if (error) console.error(`Rate audit failed for ${entry.rowId}: ${error.message}`);
}

/** Fields the form owns. `rate` + `rate_input_mode` + `gst_rate` are the ONE
 *  source of truth; ex/incl equivalents are always derived, never stored. */
function ratePatch(form: FormData): Record<string, unknown> {
  const basis = oneOf(str(form, "pricing_basis"), PRICING_BASES) ?? "PER_SQFT";
  const productId = num(form, "product_id");
  return {
    product_id: productId != null && Number.isInteger(productId) ? productId : null,
    category: str(form, "category"),
    brand: str(form, "brand"),
    product_name: str(form, "product_name"),
    range_name: str(form, "range_name"),
    thickness: str(form, "thickness"),
    grade: str(form, "grade"),
    finish: str(form, "finish"),
    size: str(form, "size"),
    pricing_basis: basis,
    sheet_width_ft: num(form, "sheet_width_ft"),
    sheet_length_ft: num(form, "sheet_length_ft"),
    sheet_area_sqft: num(form, "sheet_area_sqft"),
    rate: Math.max(0, num(form, "rate") ?? 0),
    rate_input_mode: oneOf(str(form, "rate_input_mode"), RATE_INPUT_MODES) ?? "EX_GST",
    gst_rate: gstRate(form),
    warranty_text: str(form, "warranty_text"),
    notes: str(form, "notes"),
    effective_from: str(form, "effective_from") ?? new Date().toISOString().slice(0, 10),
    effective_to: str(form, "effective_to"),
    active: str(form, "active") !== "false",
  };
}

export async function createRate(formData: FormData): Promise<RateActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const patch = ratePatch(formData);

  if (!patch.brand && !patch.product_name && !patch.range_name) {
    return { ok: false, message: "Give the rate a brand, product or range name." };
  }
  if ((patch.rate as number) <= 0) return { ok: false, message: "Enter a rate above zero." };

  const { data, error } = await supabase
    .from("quote_rates")
    .insert({ ...patch, created_by: user.id, updated_by: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await recordAudit(supabase, { rowId: data.id, changes: { created: patch }, actor: user.email ?? user.id });
  revalidatePath("/admin/rates");
  return { ok: true, message: "Rate added.", id: data.id };
}

export async function updateRate(id: string, formData: FormData): Promise<RateActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const { data: current, error: readErr } = await supabase.from("quote_rates").select("*").eq("id", id).maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!current) return { ok: false, message: "Rate not found." };

  const patch = ratePatch(formData);
  const changes: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (JSON.stringify(current[k]) !== JSON.stringify(v)) changes[k] = { from: current[k], to: v };
  }

  const { error } = await supabase
    .from("quote_rates")
    .update({ ...patch, updated_by: user.id })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  if (Object.keys(changes).length > 0) {
    await recordAudit(supabase, { rowId: id, changes, actor: user.email ?? user.id });
  }
  revalidatePath("/admin/rates");
  revalidatePath(`/admin/rates/${id}`);
  return { ok: true, message: "Rate saved." };
}

export async function setRateActive(id: string, active: boolean): Promise<RateActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("quote_rates").update({ active, updated_by: user.id }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await recordAudit(supabase, { rowId: id, changes: { active }, actor: user.email ?? user.id });
  revalidatePath("/admin/rates");
  return { ok: true, message: active ? "Rate reactivated." : "Rate retired." };
}
