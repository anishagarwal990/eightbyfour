"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createEnquiry } from "@/app/(admin)/admin/enquiries/actions";
import { CustomerPicker } from "@/components/admin/enquiries/CustomerPicker";
import { RequirementEditor } from "@/components/admin/enquiries/RequirementEditor";
import { ENQUIRY_PRIORITIES, ENQUIRY_SOURCES, ENQUIRY_STATUSES, sourceLabel, statusLabel } from "@/lib/enquiry";

const FIELD = "w-full rounded border px-2 py-1.5 text-sm";
const FIELD_STYLE = { borderColor: "var(--line)", background: "var(--paper)" };

export function NewEnquiryForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createEnquiry(formData);
          if (result.ok && result.id) router.push(`/admin/enquiries/${result.id}`);
          else setError(result.message);
        });
      }}
      className="flex flex-col gap-5"
    >
      <Section title="Customer">
        <CustomerPicker />
      </Section>

      <Section title="Requirement">
        <RequirementEditor />
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
              Brand requested (whole enquiry)
            </span>
            <input name="requested_brand" placeholder="Mikasa" className={FIELD} style={FIELD_STYLE} />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
              Customer notes — their words
            </span>
            <input
              name="customer_notes"
              placeholder="Quote Austin Gold and Marine Blue."
              className={FIELD}
              style={FIELD_STYLE}
            />
          </label>
        </div>
        <p className="mt-1.5 text-[11px]" style={{ color: "var(--line-strong)" }}>
          Alternatives the customer asked to be quoted (Austin Gold, Marine Blue) belong here as a note, not as extra
          requirement lines — they become quote options in the next slice.
        </p>
      </Section>

      <Section title="Enquiry">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select label="Source" name="source" options={ENQUIRY_SOURCES.map((s) => [s, sourceLabel(s)])} defaultValue="WHATSAPP" />
          <Select label="Status" name="status" options={ENQUIRY_STATUSES.map((s) => [s, statusLabel(s)])} defaultValue="NEW" />
          <Select label="Priority" name="priority" options={ENQUIRY_PRIORITIES.map((p) => [p, p[0] + p.slice(1).toLowerCase()])} defaultValue="NORMAL" />
          <Text label="Project name" name="project_name" />
          <Text label="Delivery location" name="delivery_location" />
          <Text label="Required by" name="required_delivery_date" type="date" />
          <div className="sm:col-span-3">
            <Text label="Internal notes — not shown to the customer" name="internal_notes" />
          </div>
        </div>
      </Section>

      {error ? (
        <p className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}>
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--burgundy)", color: "var(--paper)" }}
        >
          {isPending ? "Saving…" : "Create enquiry"}
        </button>
        <button type="button" onClick={() => router.push("/admin/enquiries")} className="text-sm" style={{ color: "var(--line-strong)" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border p-3" style={{ borderColor: "var(--line)" }}>
      <h2 className="tracked-caps mb-2 text-[11px]" style={{ color: "var(--line-strong)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Text({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
        {label}
      </span>
      <input name={name} type={type} className={FIELD} style={FIELD_STYLE} />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: [string, string][];
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
        {label}
      </span>
      <select name={name} defaultValue={defaultValue} className={FIELD} style={FIELD_STYLE}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
