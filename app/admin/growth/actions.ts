"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, requireAdmin } from "@/lib/supabase/admin-server";
import {
  createItem,
  createTask,
  deleteItem,
  getItem,
  updateItem,
  upsertMemory,
  type NewItemInput,
  type NewTaskInput,
} from "@/lib/growth/queries";
import type { CompetitorData, GrowthMemorySection } from "@/lib/growth/types";
import { isFirecrawlConfigured, scrapeUrl } from "@/lib/growth/integrations/firecrawl";

// Same layered-guard model as app/admin/actions.ts: middleware + the layout
// guard authorize the page, not the action, so every action re-checks.
async function assertAdmin() {
  const check = await requireAdmin();
  if (!check.ok) throw new Error(check.message);
  return check.user;
}

async function recordAudit(tableName: string, rowSlug: string, changes: Record<string, unknown>, actor: string) {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("admin_audit").insert({ table_name: tableName, row_slug: rowSlug, changes, actor_email: actor });
  if (error) console.error(`Audit write failed for ${tableName}/${rowSlug}: ${error.message}`);
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function createItemAction(input: NewItemInput): Promise<ActionResult> {
  const user = await assertAdmin();
  try {
    const item = await createItem(input);
    await recordAudit("growth_items", item.id, { created: input }, user.email ?? user.id);
    revalidatePath(`/admin/growth/${input.module.replace(/_/g, "-")}`);
    revalidatePath("/admin/growth");
    return { ok: true, message: `Added "${input.title}".` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to create item." };
  }
}

export async function updateItemAction(id: string, module: string, patch: Partial<NewItemInput>): Promise<ActionResult> {
  const user = await assertAdmin();
  try {
    await updateItem(id, patch);
    await recordAudit("growth_items", id, patch, user.email ?? user.id);
    revalidatePath(`/admin/growth/${module.replace(/_/g, "-")}`);
    revalidatePath("/admin/growth");
    return { ok: true, message: "Saved." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to save." };
  }
}

export async function deleteItemAction(id: string, module: string): Promise<ActionResult> {
  const user = await assertAdmin();
  try {
    await deleteItem(id);
    await recordAudit("growth_items", id, { deleted: true }, user.email ?? user.id);
    revalidatePath(`/admin/growth/${module.replace(/_/g, "-")}`);
    revalidatePath("/admin/growth");
    return { ok: true, message: "Removed." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to remove." };
  }
}

export async function upsertMemoryAction(id: GrowthMemorySection, data: unknown): Promise<ActionResult> {
  const user = await assertAdmin();
  try {
    await upsertMemory(id, data, user.email ?? user.id);
    await recordAudit("growth_memory", id, { updated: true }, user.email ?? user.id);
    revalidatePath("/admin/growth/business-brain");
    return { ok: true, message: "Business Brain updated." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to save." };
  }
}

/**
 * Actually calls Firecrawl — the one action in this file that executes
 * real external work instead of just queuing a growth_tasks row. Scoped
 * narrowly: scrapes the competitor's own URL, stores the raw result under
 * data.firecrawlScrape, and moves status to "scraped". It does not attempt
 * to fill in category/positioning/pricingApproach/etc — no LLM is wired to
 * turn the raw markdown into those structured fields, so they stay for a
 * human to read the evidence and fill in.
 */
export async function scrapeCompetitorAction(itemId: string): Promise<ActionResult> {
  const user = await assertAdmin();
  if (!isFirecrawlConfigured()) {
    return { ok: false, message: "FIRECRAWL_API_KEY is not set — cannot scrape." };
  }
  const item = await getItem(itemId);
  if (!item) return { ok: false, message: "Competitor not found." };
  const url = (item.data as Partial<CompetitorData>).url;
  if (!url) return { ok: false, message: "Add a URL to this competitor before scraping." };

  const task = await createTask({
    type: "COMPETITOR_ANALYSIS",
    title: `Scrape ${item.title}`,
    module: "market_intelligence",
    input: { url, tool: "firecrawl_scrape" },
    related_item_id: itemId,
  });

  try {
    const result = await scrapeUrl(url);
    const nextData: Partial<CompetitorData> = {
      ...(item.data as Partial<CompetitorData>),
      firecrawlScrape: {
        title: result.title,
        description: result.description,
        markdownExcerpt: result.markdown.slice(0, 4000),
        sourceUrl: result.url,
        scrapedAt: result.scrapedAt,
      },
    };
    await updateItem(itemId, { status: "scraped", data: nextData as Record<string, unknown> });
    await recordAudit("growth_items", itemId, { firecrawl_scrape: { url } }, user.email ?? user.id);

    const supabase = await createAdminSupabaseClient();
    await supabase
      .from("growth_tasks")
      .update({ status: "needs_review", output: { title: result.title, description: result.description }, updated_at: new Date().toISOString() })
      .eq("id", task.id);
    await supabase
      .from("growth_integrations")
      .update({ status: "connected", last_sync: new Date().toISOString() })
      .eq("id", "firecrawl");

    revalidatePath("/admin/growth/market-intelligence");
    revalidatePath("/admin/growth");
    return { ok: true, message: `Scraped ${url} — raw content saved. Read it and fill in the structured fields.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrape failed.";
    const supabase = await createAdminSupabaseClient();
    await supabase.from("growth_tasks").update({ status: "failed", output: { error: message }, updated_at: new Date().toISOString() }).eq("id", task.id);
    return { ok: false, message };
  }
}

export async function createTaskAction(input: NewTaskInput): Promise<ActionResult> {
  const user = await assertAdmin();
  try {
    const task = await createTask({ ...input, source: input.source ?? user.email ?? user.id });
    await recordAudit("growth_tasks", task.id, { created: input }, user.email ?? user.id);
    revalidatePath("/admin/growth");
    revalidatePath(`/admin/growth/${input.module.replace(/_/g, "-")}`);
    return { ok: true, message: `Queued: "${input.title}". Nothing executes automatically — this is a task record, not a running job.` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to queue task." };
  }
}
