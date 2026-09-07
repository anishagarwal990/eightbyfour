import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import type {
  CustomerRow,
  FollowupRow,
  InquiryActivityRow,
  InquiryAttachmentRow,
  InquiryItemRow,
  InquiryRow,
} from "@/lib/supabase/types";
import { ENQUIRY_STATUSES } from "@/lib/enquiry";
import { isUuid } from "@/lib/uuid";

export const ENQUIRY_PAGE_SIZE = 50;

/** Row shape the inbox table renders — the header plus the joined customer and a cheap item count. */
export interface EnquiryListRow extends InquiryRow {
  customer: Pick<CustomerRow, "id" | "name" | "company" | "phone" | "whatsapp"> | null;
  item_count: number;
}

export interface EnquiryListFilters {
  search?: string;
  status?: string;
  source?: string;
  assigned?: string;
  /** "overdue" | "today" | "week" — filters on next_followup_at. */
  followup?: string;
  page?: number;
}

export interface EnquiryListResult {
  rows: EnquiryListRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listEnquiries(filters: EnquiryListFilters = {}): Promise<EnquiryListResult> {
  const supabase = await createAdminSupabaseClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * ENQUIRY_PAGE_SIZE;

  // The customer join is a left join (`customers(...)`) rather than an inner
  // one: the seven backfilled website enquiries are linked, but a staff member
  // can also save an enquiry before the customer record is finalised, and such
  // a row must still appear in the inbox rather than vanish from it.
  let query = supabase
    .from("inquiries")
    .select("*, customer:customers(id, name, company, phone, whatsapp), inquiry_items(count)", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.assigned) query = query.eq("assigned_to", filters.assigned);

  if (filters.followup === "overdue") {
    query = query.not("next_followup_at", "is", null).lt("next_followup_at", new Date().toISOString());
  } else if (filters.followup === "today") {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    query = query.not("next_followup_at", "is", null).lte("next_followup_at", end.toISOString());
  } else if (filters.followup === "week") {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    query = query.not("next_followup_at", "is", null).lte("next_followup_at", end.toISOString());
  }

  const search = filters.search?.trim();
  if (search) {
    // Searches the enquiry's own denormalised contact fields plus its ref and
    // project. Customer name/company are covered because the website form and
    // the admin create form both write `name` onto the enquiry itself.
    const term = `%${search}%`;
    query = query.or(
      `ref.ilike.${term},name.ilike.${term},phone.ilike.${term},email.ilike.${term},project_name.ilike.${term},requested_brand.ilike.${term}`
    );
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + ENQUIRY_PAGE_SIZE - 1);
  if (error) throw error;

  const rows = (data ?? []).map((row) => {
    const { inquiry_items, ...rest } = row as InquiryRow & {
      customer: EnquiryListRow["customer"];
      inquiry_items: { count: number }[] | null;
    };
    return { ...rest, item_count: inquiry_items?.[0]?.count ?? 0 } as EnquiryListRow;
  });

  const total = count ?? 0;
  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE)) };
}

export interface EnquiryCounters {
  byStatus: Record<string, number>;
  followupsDue: number;
  total: number;
}

/**
 * Inbox counters. One grouped RPC would be cheaper, but that needs a migration
 * to add the function; at current volumes a single full scan of a narrow
 * two-column projection is well inside budget and keeps the migration additive.
 */
export async function getEnquiryCounters(): Promise<EnquiryCounters> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("inquiries").select("status, next_followup_at");
  if (error) throw error;

  const byStatus: Record<string, number> = Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s, 0]));
  let followupsDue = 0;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  for (const row of data as { status: string; next_followup_at: string | null }[]) {
    const status = (row.status ?? "NEW").toUpperCase();
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (row.next_followup_at && new Date(row.next_followup_at) <= endOfToday) followupsDue++;
  }

  return { byStatus, followupsDue, total: data.length };
}

export interface EnquiryDetail {
  enquiry: InquiryRow;
  customer: CustomerRow | null;
  items: InquiryItemRow[];
  attachments: InquiryAttachmentRow[];
  activity: InquiryActivityRow[];
  followups: FollowupRow[];
}

export async function getEnquiryDetail(id: string): Promise<EnquiryDetail | null> {
  // Postgres errors on a malformed uuid rather than returning no rows, so a
  // bad param would 500 instead of 404 without this.
  if (!isUuid(id)) return null;
  const supabase = await createAdminSupabaseClient();
  const { data: enquiry, error } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!enquiry) return null;

  const [itemsRes, attachmentsRes, activityRes, followupsRes, customerRes] = await Promise.all([
    supabase.from("inquiry_items").select("*").eq("inquiry_id", id).order("sort_order"),
    supabase.from("inquiry_attachments").select("*").eq("inquiry_id", id).order("created_at", { ascending: false }),
    supabase.from("inquiry_activity").select("*").eq("inquiry_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("followups").select("*").eq("inquiry_id", id).order("due_at", { ascending: false }),
    enquiry.customer_id
      ? supabase.from("customers").select("*").eq("id", enquiry.customer_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  for (const res of [itemsRes, attachmentsRes, activityRes, followupsRes, customerRes]) {
    if (res.error) throw res.error;
  }

  return {
    enquiry: enquiry as InquiryRow,
    customer: (customerRes.data as CustomerRow | null) ?? null,
    items: (itemsRes.data ?? []) as InquiryItemRow[],
    attachments: (attachmentsRes.data ?? []) as InquiryAttachmentRow[],
    activity: (activityRes.data ?? []) as InquiryActivityRow[],
    followups: (followupsRes.data ?? []) as FollowupRow[],
  };
}

/**
 * Customer lookup for the create form. Matches on normalised phone first (the
 * strongest practical signal), then name/company/email substrings, so typing a
 * phone number surfaces the existing record before staff can create a second
 * one for the same person.
 */
export async function searchCustomers(term: string, limit = 8): Promise<CustomerRow[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  const supabase = await createAdminSupabaseClient();

  const digits = trimmed.replace(/[^0-9]/g, "");
  const like = `%${trimmed}%`;
  const clauses = [`name.ilike.${like}`, `company.ilike.${like}`, `email.ilike.${like}`];
  if (digits.length >= 4) clauses.push(`phone_normalized.ilike.%${digits.slice(-10)}%`);

  const { data, error } = await supabase.from("customers").select("*").or(clauses.join(",")).order("updated_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as CustomerRow[];
}

/** Signed URLs for private attachments. Short-lived — these are re-minted on every page render. */
export async function signAttachmentUrls(paths: string[], expiresInSeconds = 300): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.storage.from("enquiry-attachments").createSignedUrls(paths, expiresInSeconds);
  if (error) return {};
  const signed: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) signed[entry.path] = entry.signedUrl;
  }
  return signed;
}
