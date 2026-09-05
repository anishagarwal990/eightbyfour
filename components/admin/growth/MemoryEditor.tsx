"use client";

import { useState, useTransition } from "react";
import { upsertMemoryAction } from "@/app/admin/growth/actions";
import { GrowthButton } from "@/components/admin/growth/ui";
import type { GrowthMemorySection } from "@/lib/growth/types";

/**
 * Edits one growth_memory row as raw JSON. A bespoke form per section (6
 * different shapes: company, icp array, positioning, brand voice, growth
 * goals, content pillars) would be six times the surface area to keep in
 * sync with lib/growth/types.ts for marginal gain over a validated JSON
 * editor — this is the honest trade for v1. Validates and pretty-prints on
 * save; never writes malformed JSON over a working row.
 */
export function MemoryEditor({ id, initialData }: { id: GrowthMemorySection; initialData: unknown }) {
  const [text, setText] = useState(() => JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    setError(null);
    setMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON.");
      return;
    }
    startTransition(async () => {
      const result = await upsertMemoryAction(id, parsed);
      if (result.ok) setMessage(result.message);
      else setError(result.message);
    });
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={16}
        className="w-full border p-3 font-mono text-xs"
        style={{ borderColor: "var(--line)", background: "var(--paper-dim)", borderRadius: "var(--radius-xs)" }}
      />
      <div className="mt-2 flex items-center gap-3">
        <GrowthButton onClick={onSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </GrowthButton>
        {error ? <span className="text-xs" style={{ color: "#9E3B2F" }}>{error}</span> : null}
        {message ? <span className="text-xs" style={{ color: "#2F6B4B" }}>{message}</span> : null}
      </div>
    </div>
  );
}
