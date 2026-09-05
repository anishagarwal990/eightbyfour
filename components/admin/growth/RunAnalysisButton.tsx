"use client";

import { useState, useTransition } from "react";
import { createTaskAction } from "@/app/admin/growth/actions";
import { GrowthButton } from "@/components/admin/growth/ui";
import type { GrowthModule, GrowthTaskType } from "@/lib/growth/types";

/**
 * Queues a growth_tasks row — does not call Firecrawl/Claude/anything.
 * Firecrawl and this kind of research agent are not wired into this
 * codebase (see growth_integrations); this button creates the task/prompt
 * record so a human or a future agent has a concrete, evidence-anchored
 * starting point, per the brief's own phase-1 instruction.
 */
export function RunAnalysisButton({
  module,
  type,
  title,
  prompt,
  itemId,
  label = "Run Analysis",
}: {
  module: GrowthModule;
  type: GrowthTaskType;
  title: string;
  prompt: string;
  itemId?: string;
  label?: string;
}) {
  const [done, setDone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <GrowthButton
        variant="secondary"
        disabled={isPending || !!done}
        onClick={() =>
          startTransition(async () => {
            const result = await createTaskAction({ type, title, module, input: { prompt }, related_item_id: itemId });
            setDone(result.message);
          })
        }
      >
        {isPending ? "Queuing…" : done ? "Queued" : label}
      </GrowthButton>
      {done ? (
        <span className="text-xs" style={{ color: "var(--line-strong)" }}>
          {done}
        </span>
      ) : null}
    </div>
  );
}
