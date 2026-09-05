import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import type {
  GrowthItemRow,
  GrowthMemoryRow,
  GrowthMemorySection,
  GrowthModule,
  GrowthTaskRow,
  GrowthIntegrationRow,
} from "@/lib/growth/types";

// Every function here assumes the caller has already run requireAdmin() —
// same layered-guard model as the rest of /admin (see docs/ADMIN.md). RLS on
// growth_memory/growth_items/growth_tasks/growth_integrations is the actual
// enforcement; these are just typed, DRY query helpers on top of it.

export async function getMemory(id: GrowthMemorySection): Promise<GrowthMemoryRow | null> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("growth_memory").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllMemory(): Promise<GrowthMemoryRow[]> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("growth_memory").select("*").order("id");
  if (error) throw error;
  return data;
}

export async function upsertMemory(id: GrowthMemorySection, memoryData: unknown, updatedBy: string): Promise<void> {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("growth_memory")
    .upsert({ id, data: memoryData, updated_at: new Date().toISOString(), updated_by: updatedBy });
  if (error) throw error;
}

export interface ItemFilter {
  module: GrowthModule;
  type?: string;
  status?: string;
}

export async function listItems(filter: ItemFilter): Promise<GrowthItemRow[]> {
  const supabase = await createAdminSupabaseClient();
  let query = supabase.from("growth_items").select("*").eq("module", filter.module);
  if (filter.type) query = query.eq("type", filter.type);
  if (filter.status) query = query.eq("status", filter.status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function countItems(module: GrowthModule): Promise<number> {
  const supabase = await createAdminSupabaseClient();
  const { count, error } = await supabase.from("growth_items").select("*", { count: "exact", head: true }).eq("module", module);
  if (error) throw error;
  return count ?? 0;
}

export async function getItem(id: string): Promise<GrowthItemRow | null> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("growth_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface NewItemInput {
  module: GrowthModule;
  type: string;
  title: string;
  status?: string;
  priority?: string | null;
  impact?: number | null;
  effort?: number | null;
  confidence?: string | null;
  evidence?: string | null;
  source?: string | null;
  data?: Record<string, unknown>;
}

export async function createItem(input: NewItemInput): Promise<GrowthItemRow> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("growth_items")
    .insert({ status: "new", data: {}, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, patch: Partial<NewItemInput>): Promise<void> {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("growth_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("growth_items").delete().eq("id", id);
  if (error) throw error;
}

export async function listTasks(limit = 50): Promise<GrowthTaskRow[]> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("growth_tasks").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export interface NewTaskInput {
  type: GrowthTaskRow["type"];
  title: string;
  module: GrowthModule;
  input?: Record<string, unknown>;
  source?: string | null;
  related_item_id?: string | null;
}

export async function createTask(input: NewTaskInput): Promise<GrowthTaskRow> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("growth_tasks")
    .insert({ status: "queued", input: {}, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listIntegrations(): Promise<GrowthIntegrationRow[]> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("growth_integrations").select("*").order("id");
  if (error) throw error;
  return data;
}

// --- Overview aggregates ---------------------------------------------------

export interface GrowthOverviewCounts {
  competitorsTracked: number;
  competitorsPending: number;
  openOpportunities: number;
  prospectsToContact: number;
  contentInQueue: number;
  croIssuesOpen: number;
  tasksQueued: number;
  tasksNeedingReview: number;
}

export async function getOverviewCounts(): Promise<GrowthOverviewCounts> {
  const supabase = await createAdminSupabaseClient();
  const [competitors, pending, opportunities, prospects, content, cro, queued, review] = await Promise.all([
    supabase.from("growth_items").select("*", { count: "exact", head: true }).eq("module", "market_intelligence").eq("type", "competitor"),
    supabase
      .from("growth_items")
      .select("*", { count: "exact", head: true })
      .eq("module", "market_intelligence")
      .eq("type", "competitor")
      .eq("status", "research_pending"),
    supabase
      .from("growth_items")
      .select("*", { count: "exact", head: true })
      .eq("module", "market_intelligence")
      .eq("type", "opportunity")
      .neq("status", "done"),
    supabase
      .from("growth_items")
      .select("*", { count: "exact", head: true })
      .eq("module", "leads")
      .in("status", ["New", "Qualified", "Ready for Outreach"]),
    supabase.from("growth_items").select("*", { count: "exact", head: true }).eq("module", "seo").eq("type", "content").neq("status", "Published"),
    supabase.from("growth_items").select("*", { count: "exact", head: true }).eq("module", "cro").neq("status", "resolved"),
    supabase.from("growth_tasks").select("*", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("growth_tasks").select("*", { count: "exact", head: true }).eq("status", "needs_review"),
  ]);
  const errs = [competitors, pending, opportunities, prospects, content, cro, queued, review].map((r) => r.error).filter(Boolean);
  if (errs.length) throw errs[0];
  return {
    competitorsTracked: competitors.count ?? 0,
    competitorsPending: pending.count ?? 0,
    openOpportunities: opportunities.count ?? 0,
    prospectsToContact: prospects.count ?? 0,
    contentInQueue: content.count ?? 0,
    croIssuesOpen: cro.count ?? 0,
    tasksQueued: queued.count ?? 0,
    tasksNeedingReview: review.count ?? 0,
  };
}

/** Real inquiries count from the live table — the one number Overview can show without any new integration. */
export async function getInquiryStats(days = 28): Promise<{ total: number; recent: number }> {
  const supabase = await createAdminSupabaseClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const [total, recent] = await Promise.all([
    supabase.from("inquiries").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).gte("created_at", since),
  ]);
  if (total.error) throw total.error;
  if (recent.error) throw recent.error;
  return { total: total.count ?? 0, recent: recent.count ?? 0 };
}

export interface ChannelBreakdown {
  channel: string;
  count: number;
}

/**
 * Real acquisition-channel split from inquiries.utm_source — the one piece
 * of Growth Analytics' funnel that needs no new integration, because every
 * quote request already carries whatever UTM params it arrived with (see
 * lib/utm.ts / supabase/schema.sql). Rows with no UTM at all are bucketed as
 * "Direct / organic" rather than dropped — that is still a real inquiry.
 */
export async function getInquiryChannelBreakdown(days = 90): Promise<ChannelBreakdown[]> {
  const supabase = await createAdminSupabaseClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("inquiries").select("utm_source").gte("created_at", since);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data as { utm_source: string | null }[]) {
    const key = row.utm_source?.trim() || "Direct / organic";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count);
}
