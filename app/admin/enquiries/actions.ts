"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, requireAdmin } from "@/lib/supabase/admin-server";
import {
  ENQUIRY_PRIORITIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  LOST_REASONS,
  attachmentKindFor,
  generateEnquiryRef,
  isSpecificationComplete,
  normalizeStatus,
  statusLabel,
} from "@/lib/enquiry";

export interface ActionResult {
  ok: boolean;
  message: string;
  /** Set on create, so the form can redirect to the new enquiry. */
  id?: string;
}

/**
 * A Server Action is a public POST endpoint. middleware.ts guards the *page*
 * and the layout guards the *render* — neither guards this. Every action below
 * calls this first, so learning an action id gets you nothing.
 */
async function assertAdmin() {
  const check = await requireAdmin();
  if (!check.ok) throw new Error(check.message);
  return check.user;
}

type Supabase = Awaited<ReturnType<typeof createAdminSupabaseClient>>;

/** Append to the timeline. Never throws — a failed log line must not lose the write it describes. */
async function logActivity(
  supabase: Supabase,
  entry: { inquiryId: string; kind: string; summary: string; detail?: unknown; actorEmail: string; actorId: string }
) {
  const { error } = await supabase.from("inquiry_activity").insert({
    inquiry_id: entry.inquiryId,
    kind: entry.kind,
    summary: entry.summary,
    detail: entry.detail ?? null,
    actor_email: entry.actorEmail,
    actor_id: entry.actorId,
  });
  if (error) console.error(`Activity log failed for ${entry.inquiryId}: ${error.message}`);
}

function str(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function oneOf<T extends readonly string[]>(value: string | null, allowed: T): T[number] | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}

/** Requirement lines arrive as parallel indexed fields (`item.0.thickness`, …) from the repeating row editor. */
interface ParsedItem {
  category: string | null;
  material: string | null;
  requested_brand: string | null;
  requested_product: string | null;
  thickness: string | null;
  size: string | null;
  grade: string | null;
  finish: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  specification_complete: boolean;
  sort_order: number;
}

function parseItems(form: FormData): ParsedItem[] {
  const indices = new Set<number>();
  for (const key of form.keys()) {
    const match = key.match(/^item\.(\d+)\./);
    if (match) indices.add(Number(match[1]));
  }

  const items: ParsedItem[] = [];
  for (const index of [...indices].sort((a, b) => a - b)) {
    const field = (name: string) => str(form, `item.${index}.${name}`);
    const rawQuantity = field("quantity");
    const quantity = rawQuantity === null ? null : Number.parseFloat(rawQuantity.replace(/[^0-9.]/g, ""));

    const base = {
      category: field("category"),
      material: field("material"),
      requested_brand: field("requested_brand"),
      requested_product: field("requested_product"),
      thickness: field("thickness"),
      size: field("size"),
      grade: field("grade"),
      finish: field("finish"),
      quantity: quantity !== null && Number.isFinite(quantity) ? quantity : null,
      unit: field("unit"),
      notes: field("notes"),
    };

    // A row where the operator typed nothing at all is a stray blank from the
    // editor, not a requirement — drop it rather than store an empty line.
    const hasContent = Object.values(base).some((v) => v !== null);
    if (!hasContent) continue;

    // Staff can override the flag; absent an explicit override we compute the
    // suggested default. Never inferred *into* the spec fields themselves.
    const override = str(form, `item.${index}.specification_complete`);
    items.push({
      ...base,
      specification_complete: override === null ? isSpecificationComplete(base) : override === "true",
      sort_order: items.length,
    });
  }
  return items;
}

export async function createEnquiry(formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const name = str(formData, "customer_name");
  const phone = str(formData, "customer_phone");
  if (!name) return { ok: false, message: "Customer name is required." };
  if (!phone) return { ok: false, message: "Customer phone is required." };

  // Reuse the picked customer when the form carried one; otherwise create.
  // The picker searches by normalised phone before staff get here, so this
  // path only runs for a genuinely new contact.
  let customerId = str(formData, "customer_id");
  if (!customerId) {
    const { data: created, error: customerError } = await supabase
      .from("customers")
      .insert({
        name,
        phone,
        company: str(formData, "customer_company"),
        whatsapp: str(formData, "customer_whatsapp"),
        email: str(formData, "customer_email"),
        gstin: str(formData, "customer_gstin"),
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (customerError) return { ok: false, message: `Customer: ${customerError.message}` };
    customerId = created.id;
  }

  const items = parseItems(formData);

  const { data: enquiry, error } = await supabase
    .from("inquiries")
    .insert({
      ref: generateEnquiryRef(),
      // The legacy CHECK on `type` allows 'single' | 'list'. A multi-line
      // staff-entered requirement is a list; this keeps the constraint happy
      // without touching it.
      type: "list",
      name,
      phone,
      email: str(formData, "customer_email"),
      // `message` stays the customer's own words — same column the website
      // form writes — so the two intake paths read identically downstream.
      message: str(formData, "customer_notes"),
      customer_id: customerId,
      source: oneOf(str(formData, "source"), ENQUIRY_SOURCES) ?? "WHATSAPP",
      status: oneOf(str(formData, "status"), ENQUIRY_STATUSES) ?? "NEW",
      priority: oneOf(str(formData, "priority"), ENQUIRY_PRIORITIES),
      project_name: str(formData, "project_name"),
      delivery_location: str(formData, "delivery_location"),
      required_delivery_date: str(formData, "required_delivery_date"),
      requested_brand: str(formData, "requested_brand"),
      internal_notes: str(formData, "internal_notes"),
      assigned_to: user.id,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id, ref")
    .single();
  if (error) return { ok: false, message: error.message };

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("inquiry_items")
      .insert(items.map((item) => ({ ...item, inquiry_id: enquiry.id })));
    // The header is already saved; surface the failure rather than rolling it
    // back, so the operator keeps the customer and can re-enter lines.
    if (itemsError) {
      await logActivity(supabase, {
        inquiryId: enquiry.id,
        kind: "ENQUIRY_CREATED",
        summary: `Enquiry created — requirement lines failed to save (${itemsError.message}).`,
        actorEmail: user.email ?? user.id,
        actorId: user.id,
      });
      revalidatePath("/admin/enquiries");
      return { ok: false, message: `Enquiry ${enquiry.ref} saved, but requirement lines failed: ${itemsError.message}`, id: enquiry.id };
    }
  }

  await logActivity(supabase, {
    inquiryId: enquiry.id,
    kind: "ENQUIRY_CREATED",
    summary: `Enquiry created with ${items.length} requirement line${items.length === 1 ? "" : "s"}.`,
    detail: { source: str(formData, "source"), requested_brand: str(formData, "requested_brand") },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath("/admin/enquiries");
  return { ok: true, message: `Created ${enquiry.ref}.`, id: enquiry.id };
}

export async function updateRequirement(inquiryId: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();
  const items = parseItems(formData);

  // Replace-in-place: the editor submits the full set, so anything absent was
  // deleted in the UI. Delete-then-insert keeps sort_order contiguous without
  // diffing rows the operator may have reordered.
  const { error: deleteError } = await supabase.from("inquiry_items").delete().eq("inquiry_id", inquiryId);
  if (deleteError) return { ok: false, message: deleteError.message };

  if (items.length > 0) {
    const { error } = await supabase.from("inquiry_items").insert(items.map((item) => ({ ...item, inquiry_id: inquiryId })));
    if (error) return { ok: false, message: error.message };
  }

  const requestedBrand = str(formData, "requested_brand");
  await supabase
    .from("inquiries")
    .update({ requested_brand: requestedBrand, updated_by: user.id })
    .eq("id", inquiryId);

  await logActivity(supabase, {
    inquiryId,
    kind: "REQUIREMENT_EDITED",
    summary: `Requirement updated — ${items.length} line${items.length === 1 ? "" : "s"}.`,
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Requirement saved." };
}

export async function changeStatus(inquiryId: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const next = oneOf(str(formData, "status"), ENQUIRY_STATUSES);
  if (!next) return { ok: false, message: "Unknown status." };

  const { data: current, error: readError } = await supabase.from("inquiries").select("status").eq("id", inquiryId).maybeSingle();
  if (readError) return { ok: false, message: readError.message };

  const patch: Record<string, unknown> = { status: next, updated_by: user.id };
  if (next === "REQUIREMENT_VERIFIED") patch.requirement_verified_at = new Date().toISOString();
  if (next === "LOST") patch.lost_reason = oneOf(str(formData, "lost_reason"), LOST_REASONS);

  const { error } = await supabase.from("inquiries").update(patch).eq("id", inquiryId);
  if (error) return { ok: false, message: error.message };

  await logActivity(supabase, {
    inquiryId,
    kind: "STATUS_CHANGED",
    summary: `Status ${statusLabel(current?.status)} → ${statusLabel(next)}.`,
    detail: { from: normalizeStatus(current?.status), to: next, lost_reason: patch.lost_reason ?? null },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, message: `Status set to ${statusLabel(next)}.` };
}

export async function addFollowup(inquiryId: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const dueAt = str(formData, "due_at");
  if (!dueAt) return { ok: false, message: "Pick a follow-up date." };
  const parsed = new Date(dueAt);
  if (Number.isNaN(parsed.getTime())) return { ok: false, message: "That follow-up date isn't valid." };

  const note = str(formData, "note");
  const { error } = await supabase.from("followups").insert({
    inquiry_id: inquiryId,
    due_at: parsed.toISOString(),
    note,
    created_by: user.id,
  });
  if (error) return { ok: false, message: error.message };

  // Denormalised onto the header so the inbox can sort and filter on it
  // without joining followups for every row.
  await supabase.from("inquiries").update({ next_followup_at: parsed.toISOString(), updated_by: user.id }).eq("id", inquiryId);

  await logActivity(supabase, {
    inquiryId,
    kind: "FOLLOWUP_ADDED",
    summary: `Follow-up scheduled for ${parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`,
    detail: { due_at: parsed.toISOString(), note },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Follow-up scheduled." };
}

export async function completeFollowup(inquiryId: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const followupId = str(formData, "followup_id");
  if (!followupId) return { ok: false, message: "Missing follow-up." };

  const { error } = await supabase
    .from("followups")
    .update({
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      result: str(formData, "result"),
      outcome: str(formData, "outcome"),
    })
    .eq("id", followupId)
    .eq("inquiry_id", inquiryId);
  if (error) return { ok: false, message: error.message };

  // Point the header at the next still-open follow-up, or clear it.
  const { data: nextOpen } = await supabase
    .from("followups")
    .select("due_at")
    .eq("inquiry_id", inquiryId)
    .is("completed_at", null)
    .order("due_at")
    .limit(1);
  await supabase.from("inquiries").update({ next_followup_at: nextOpen?.[0]?.due_at ?? null, updated_by: user.id }).eq("id", inquiryId);

  await logActivity(supabase, {
    inquiryId,
    kind: "FOLLOWUP_COMPLETED",
    summary: `Follow-up completed${str(formData, "outcome") ? ` — ${str(formData, "outcome")}` : ""}.`,
    detail: { result: str(formData, "result") },
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Follow-up closed." };
}

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export async function addAttachment(inquiryId: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pick a file to attach." };
  if (file.size > MAX_ATTACHMENT_BYTES) return { ok: false, message: "That file is over the 15 MB limit." };

  // Namespaced by enquiry so a storage policy can scope by prefix later, and
  // timestamped so re-uploading the same filename never overwrites evidence.
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  const path = `${inquiryId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("enquiry-attachments")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) return { ok: false, message: `Upload failed: ${uploadError.message}` };

  const { error } = await supabase.from("inquiry_attachments").insert({
    inquiry_id: inquiryId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    kind: attachmentKindFor(file.type, file.name),
    caption: str(formData, "caption"),
    created_by: user.id,
  });
  if (error) {
    // Don't leave an orphan object in the bucket if the metadata row fails.
    await supabase.storage.from("enquiry-attachments").remove([path]);
    return { ok: false, message: error.message };
  }

  await logActivity(supabase, {
    inquiryId,
    kind: "ATTACHMENT_ADDED",
    summary: `Attachment added — ${file.name}.`,
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  return { ok: true, message: "Attachment saved." };
}

export async function updateEnquiryDetails(inquiryId: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();
  const supabase = await createAdminSupabaseClient();

  const { error } = await supabase
    .from("inquiries")
    .update({
      source: oneOf(str(formData, "source"), ENQUIRY_SOURCES),
      priority: oneOf(str(formData, "priority"), ENQUIRY_PRIORITIES),
      project_name: str(formData, "project_name"),
      delivery_location: str(formData, "delivery_location"),
      required_delivery_date: str(formData, "required_delivery_date"),
      internal_notes: str(formData, "internal_notes"),
      updated_by: user.id,
    })
    .eq("id", inquiryId);
  if (error) return { ok: false, message: error.message };

  await logActivity(supabase, {
    inquiryId,
    kind: "DETAILS_UPDATED",
    summary: "Enquiry details updated.",
    actorEmail: user.email ?? user.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/enquiries/${inquiryId}`);
  return { ok: true, message: "Details saved." };
}

/** Customer lookup for the create form's picker. Read-only, admin-gated. */
export async function findCustomers(term: string) {
  await assertAdmin();
  const { searchCustomers } = await import("@/lib/data/enquiries");
  return searchCustomers(term);
}
