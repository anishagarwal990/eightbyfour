"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, requireAdmin } from "@/lib/supabase/admin-server";
import {
  createItem,
  createTask,
  deleteItem,
  updateItem,
  upsertMemory,
  type NewItemInput,
  type NewTaskInput,
} from "@/lib/growth/queries";
import type { GrowthMemorySection } from "@/lib/growth/types";

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
