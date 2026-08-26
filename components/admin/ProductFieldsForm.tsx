"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { EDITABLE_FIELDS, toCell } from "@/lib/catalogue/fields";
import { saveProductFields, type SaveResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

const INPUT_CLASS = "w-full rounded-md border px-3 py-2 text-sm";
const INPUT_STYLE = { borderColor: "var(--line)", background: "var(--card)" };

export function ProductFieldsForm({ slug, product }: { slug: string; product: ProductRow }) {
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const formData = new FormData(event.currentTarget);
    setResult(await saveProductFields(slug, formData));
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(EDITABLE_FIELDS).map(([field, spec]) => {
          const value = toCell(field, product[field as keyof ProductRow]);
          const isWide = spec.kind === "longtext" || spec.kind === "list";
          return (
            <label key={field} className={`text-xs ${isWide ? "sm:col-span-2" : ""}`} style={{ color: "var(--line-strong)" }}>
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                {spec.label}
              </span>
              {spec.kind === "list" ? <span> · separate with |</span> : null}
              {spec.warn ? <span style={{ color: "var(--burgundy)" }}> · {spec.warn}</span> : null}
              {spec.help ? <span> · {spec.help}</span> : null}
              {spec.kind === "longtext" ? (
                <textarea name={field} defaultValue={value} rows={4} className={`${INPUT_CLASS} mt-1`} style={INPUT_STYLE} />
              ) : (
                <input type="text" name={field} defaultValue={value} className={`${INPUT_CLASS} mt-1`} style={INPUT_STYLE} />
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save fields"}
        </Button>
        {result ? (
          <span className="text-sm" style={{ color: result.ok ? "var(--line-strong)" : "var(--burgundy)" }}>
            {result.message}
            {result.changed?.length ? ` (${result.changed.join(", ")})` : ""}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--line-strong)" }}>
        An empty box saves as empty (NULL), which is what the site treats as &ldquo;no value&rdquo; — not an empty string.
      </p>
    </form>
  );
}
