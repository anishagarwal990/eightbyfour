"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, requireAdmin } from "@/lib/supabase/admin-server";
import { EDITABLE_FIELDS, deepEqual, fromCell } from "@/lib/catalogue/fields";
import { offersPatch, parsePercentCell, variantsFromGrid, type RateGridRow } from "@/lib/catalogue/rateGrid";

export interface SaveResult {
  ok: boolean;
  message: string;
  /** Column names actually written, for the confirmation line. */
  changed?: string[];
}

/**
 * Re-check authorization inside every action rather than trusting the page
 * that rendered the form. A Server Action is a public POST endpoint —
 * middleware and the layout guard the page, not the action, so an action
 * skipping this check is callable by anyone who learns its id.
 */
async function assertAdmin() {
  const check = await requireAdmin();
  if (!check.ok) throw new Error(check.message);
  return check.user;
}

/** Write an audit row. Never throws — a missing audit table must not lose the edit. */
async function recordAudit(
  supabase: Awaited<ReturnType<typeof createAdminSupabaseClient>>,
  entry: { slug: string; changes: Record<string, { from: unknown; to: unknown }>; actor: string }
) {
  const { error } = await supabase.from("admin_audit").insert({
    table_name: "products",
    row_slug: entry.slug,
    changes: entry.changes,
    actor_email: entry.actor,
  });
  if (error) console.error(`Audit write failed for ${entry.slug}: ${error.message}`);
}

export async function saveProductFields(slug: string, formData: FormData): Promise<SaveResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const { data: current, error: readError } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (readError) return { ok: false, message: readError.message };
  if (!current) return { ok: false, message: `No product with slug "${slug}".` };

  const patch: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of Object.keys(EDITABLE_FIELDS)) {
    // A field absent from the form was not rendered — leave it alone rather
    // than reading undefined and nulling the column.
    if (!formData.has(field)) continue;
    const next = fromCell(field, String(formData.get(field) ?? ""));
    if (deepEqual(current[field], next)) continue;
    patch[field] = next;
    changes[field] = { from: current[field], to: next };
  }

  if (Object.keys(patch).length === 0) return { ok: true, message: "No changes to save." };

  // update(), never upsert(): an upsert on a partial object nulls every
  // column absent from the payload, which here would wipe images, pricing
  // and specs for any product whose form only carried a description.
  const { error } = await supabase.from("products").update(patch).eq("slug", slug);
  if (error) return { ok: false, message: error.message };

  await recordAudit(supabase, { slug, changes, actor: user.email ?? user.id });

  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin");
  return { ok: true, message: `Saved ${Object.keys(patch).length} change${Object.keys(patch).length === 1 ? "" : "s"}.`, changed: Object.keys(patch) };
}

export async function saveProductRates(slug: string, rows: RateGridRow[], discount: string, cashback: string): Promise<SaveResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const { data: current, error: readError } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (readError) return { ok: false, message: readError.message };
  if (!current) return { ok: false, message: `No product with slug "${slug}".` };

  const result = variantsFromGrid(rows, current);
  if (result.problems.length > 0) return { ok: false, message: result.problems.join(" ") };

  const parsedDiscount = parsePercentCell(discount);
  const parsedCashback = parsePercentCell(cashback);
  for (const [label, parsed] of [["Discount", parsedDiscount], ["Cashback", parsedCashback]] as const) {
    if (parsed.kind === "invalid") {
      return { ok: false, message: `${label}: "${parsed.raw}" is not a percentage between 0 and 100. Leave it empty for none.` };
    }
  }
  // Applied after the band sync so it lands on whichever price_table is about
  // to be written, rather than on a stale copy the sync would then overwrite.
  const nextPriceTable = offersPatch(parsedDiscount, parsedCashback, current, result.patch.price_table);
  if (nextPriceTable) result.patch.price_table = nextPriceTable;

  const patch: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [field, value] of Object.entries(result.patch)) {
    if (deepEqual(current[field], value)) continue;
    patch[field] = value;
    changes[field] = { from: current[field], to: value };
  }

  if (Object.keys(patch).length === 0) return { ok: true, message: "No changes to save." };

  const { error } = await supabase.from("products").update(patch).eq("slug", slug);
  if (error) return { ok: false, message: error.message };

  await recordAudit(supabase, { slug, changes, actor: user.email ?? user.id });

  revalidatePath(`/products/${slug}`);
  revalidatePath("/hyderabad/plywood-price");
  revalidatePath("/admin");
  return {
    ok: true,
    message: result.bandSynced
      ? "Rates saved. Headline band re-derived from the full grid."
      : "Rates saved. Headline band left alone — fill every stocked thickness to re-derive it.",
    changed: Object.keys(patch),
  };
}
