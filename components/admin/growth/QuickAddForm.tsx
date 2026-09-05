"use client";

import { useRef, useState, useTransition } from "react";
import { createItemAction } from "@/app/admin/growth/actions";
import { GrowthButton } from "@/components/admin/growth/ui";
import type { NewItemInput } from "@/lib/growth/queries";
import type { GrowthModule } from "@/lib/growth/types";

export interface QuickAddField {
  key: string;
  label: string;
  placeholder?: string;
  /** Rendered into `data.<key>` unless it's one of the top-level column names below. */
  topLevel?: boolean;
}

const TOP_LEVEL_KEYS = new Set(["title", "status", "priority", "confidence", "evidence", "source", "impact", "effort"]);

/**
 * One reusable add-item form, configured per module/type. Real insert via
 * createItemAction — no local-only state pretending to be saved data.
 * Fields not in TOP_LEVEL_KEYS land in the row's `data` jsonb.
 */
export function QuickAddForm({
  module,
  type,
  fields,
  defaultStatus = "new",
}: {
  module: GrowthModule;
  type: string;
  fields: QuickAddField[];
  defaultStatus?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    const title = String(formData.get("title") ?? "").trim();
    if (!title) {
      setError("Title is required.");
      return;
    }
    const topLevel: Record<string, unknown> = {};
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.key === "title") continue;
      const value = String(formData.get(f.key) ?? "").trim();
      if (!value) continue;
      if (TOP_LEVEL_KEYS.has(f.key)) topLevel[f.key] = value;
      else data[f.key] = value;
    }
    const input: NewItemInput = { module, type, title, status: defaultStatus, ...topLevel, data };
    startTransition(async () => {
      const result = await createItemAction(input);
      if (!result.ok) setError(result.message);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <GrowthButton variant="secondary" onClick={() => setOpen(true)}>
        + Add
      </GrowthButton>
    );
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-2 border p-3" style={{ borderColor: "var(--line)", borderRadius: "var(--radius-xs)" }}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="title"
          placeholder="Title"
          required
          className="border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--line)", borderRadius: "var(--radius-xs)" }}
        />
        {fields
          .filter((f) => f.key !== "title")
          .map((f) => (
            <input
              key={f.key}
              name={f.key}
              placeholder={f.placeholder ?? f.label}
              className="border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--line)", borderRadius: "var(--radius-xs)" }}
            />
          ))}
      </div>
      <div className="flex items-center gap-2">
        <GrowthButton type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </GrowthButton>
        <GrowthButton type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </GrowthButton>
        {error ? <span className="text-xs" style={{ color: "#9E3B2F" }}>{error}</span> : null}
      </div>
    </form>
  );
}
