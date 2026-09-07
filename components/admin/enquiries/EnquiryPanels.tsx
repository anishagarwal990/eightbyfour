"use client";

import { useState, useTransition } from "react";
import {
  addAttachment,
  addFollowup,
  changeStatus,
  completeFollowup,
  updateEnquiryDetails,
  updateRequirement,
} from "@/app/(admin)/admin/enquiries/actions";
import { RequirementEditor } from "@/components/admin/enquiries/RequirementEditor";
import {
  ENQUIRY_PRIORITIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  FOLLOWUP_PRESETS,
  LOST_REASONS,
  LOST_REASON_LABELS,
  followupDateFor,
  sourceLabel,
  statusLabel,
} from "@/lib/enquiry";
import type { InquiryItemRow, InquiryRow } from "@/lib/supabase/types";

const FIELD = "w-full rounded border px-2 py-1.5 text-sm";
const FIELD_STYLE = { borderColor: "var(--line)", background: "var(--paper)" };
const BTN = "rounded-md px-3 py-1.5 text-sm font-medium";

type ActionFn = (formData: FormData) => Promise<{ ok: boolean; message: string }>;

/** Shared submit plumbing: pending state plus a one-line result under the control. */
function useAction() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const run = (fn: ActionFn) => (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fn(formData);
      setMessage({ ok: result.ok, text: result.message });
    });
  };
  const note = message ? (
    <p className="mt-1.5 text-xs" style={{ color: message.ok ? "var(--line-strong)" : "var(--burgundy)" }}>
      {message.text}
    </p>
  ) : null;
  return { run, note, isPending };
}

export function StatusChanger({ enquiry }: { enquiry: InquiryRow }) {
  const { run, note, isPending } = useAction();
  const [next, setNext] = useState(enquiry.status?.toUpperCase() ?? "NEW");

  return (
    <form action={run((fd) => changeStatus(enquiry.id, fd))}>
      <div className="flex flex-wrap items-center gap-2">
        <select name="status" value={next} onChange={(e) => setNext(e.target.value)} className={FIELD} style={{ ...FIELD_STYLE, width: "auto" }}>
          {ENQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        {next === "LOST" ? (
          <select name="lost_reason" className={FIELD} style={{ ...FIELD_STYLE, width: "auto" }} defaultValue="">
            <option value="">Reason…</option>
            {LOST_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {LOST_REASON_LABELS[reason]}
              </option>
            ))}
          </select>
        ) : null}
        <button type="submit" disabled={isPending} className={BTN} style={{ background: "var(--card)" }}>
          {isPending ? "Saving…" : "Update"}
        </button>
      </div>
      {note}
    </form>
  );
}

export function FollowupPanel({
  enquiryId,
  openFollowups,
}: {
  enquiryId: string;
  openFollowups: { id: string; due_at: string; note: string | null }[];
}) {
  const { run, note, isPending } = useAction();
  const [dueAt, setDueAt] = useState(() => followupDateFor(1));

  return (
    <div className="flex flex-col gap-3">
      {openFollowups.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {openFollowups.map((followup) => (
            <li key={followup.id} className="rounded border p-2 text-xs" style={{ borderColor: "var(--line)" }}>
              <p className="font-medium">
                Due {new Date(followup.due_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </p>
              {followup.note ? <p style={{ color: "var(--line-strong)" }}>{followup.note}</p> : null}
              <form action={run((fd) => completeFollowup(enquiryId, fd))} className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <input type="hidden" name="followup_id" value={followup.id} />
                <select name="outcome" className="rounded border px-1.5 py-1 text-xs" style={FIELD_STYLE} defaultValue="SPOKE">
                  <option value="SPOKE">Spoke</option>
                  <option value="NO_ANSWER">No answer</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <input name="result" placeholder="What happened?" className="flex-1 rounded border px-1.5 py-1 text-xs" style={FIELD_STYLE} />
                <button type="submit" disabled={isPending} className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--line)" }}>
                  Done
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <form action={run((fd) => addFollowup(enquiryId, fd))} className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FOLLOWUP_PRESETS.filter((p) => p.days !== null).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDueAt(followupDateFor(preset.days as number))}
              className="rounded-full border px-2.5 py-0.5 text-xs"
              style={{ borderColor: "var(--line)" }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input
          type="datetime-local"
          name="due_at"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className={FIELD}
          style={FIELD_STYLE}
          aria-label="Follow-up date and time"
        />
        <input name="note" placeholder="Note (optional)" className={FIELD} style={FIELD_STYLE} />
        <button type="submit" disabled={isPending} className={BTN} style={{ background: "var(--card)" }}>
          {isPending ? "Saving…" : "Schedule follow-up"}
        </button>
      </form>
      {note}
    </div>
  );
}

export function RequirementPanel({
  enquiry,
  items,
}: {
  enquiry: InquiryRow;
  items: InquiryItemRow[];
}) {
  const { run, note, isPending } = useAction();
  const [editing, setEditing] = useState(false);

  if (!editing) {
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    return (
      <div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="py-1.5 pr-3 font-medium">
                    {item.thickness || item.requested_product || item.material || item.category || item.notes || "Unspecified"}
                  </td>
                  <td className="py-1.5 pr-3 whitespace-nowrap" style={{ color: "var(--line-strong)" }}>
                    {item.quantity !== null ? item.quantity.toLocaleString("en-IN") : "—"} {item.unit ?? ""}
                  </td>
                  <td className="py-1.5 pr-3 text-xs" style={{ color: "var(--line-strong)" }}>
                    {[item.requested_brand, item.grade, item.finish, item.size].filter(Boolean).join(" · ")}
                    {item.notes && item.thickness ? (item.requested_brand || item.grade ? " · " : "") + item.notes : ""}
                  </td>
                  <td className="py-1.5 whitespace-nowrap text-xs">
                    {item.specification_complete ? null : (
                      <span className="font-medium" style={{ color: "var(--burgundy)" }}>
                        ⚠ Specification incomplete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td className="py-3 text-sm" style={{ color: "var(--line-strong)" }}>
                    No requirement lines recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--line-strong)" }}>
          <span>
            {items.length} line{items.length === 1 ? "" : "s"}
            {totalQuantity > 0 ? ` · ${totalQuantity.toLocaleString("en-IN")} total qty` : ""}
          </span>
          {enquiry.requested_brand ? <span>Brand requested: {enquiry.requested_brand}</span> : null}
          <button type="button" onClick={() => setEditing(true)} className="underline-offset-2 hover:underline">
            Edit requirement
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        run((fd) => updateRequirement(enquiry.id, fd))(formData);
        setEditing(false);
      }}
    >
      <RequirementEditor initialItems={items} />
      <label className="mt-3 flex flex-col gap-0.5">
        <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
          Brand requested (whole enquiry)
        </span>
        <input name="requested_brand" defaultValue={enquiry.requested_brand ?? ""} className={FIELD} style={FIELD_STYLE} />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={isPending} className={BTN} style={{ background: "var(--burgundy)", color: "var(--paper)" }}>
          {isPending ? "Saving…" : "Save requirement"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-sm" style={{ color: "var(--line-strong)" }}>
          Cancel
        </button>
      </div>
      {note}
    </form>
  );
}

export function AttachmentUploader({ enquiryId }: { enquiryId: string }) {
  const { run, note, isPending } = useAction();
  return (
    <form action={run((fd) => addAttachment(enquiryId, fd))} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="file"
        required
        accept="image/*,application/pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
        className="text-xs"
        aria-label="Attachment file"
      />
      <input name="caption" placeholder="Caption (optional)" className="rounded border px-2 py-1 text-xs" style={FIELD_STYLE} />
      <button type="submit" disabled={isPending} className="rounded border px-2.5 py-1 text-xs" style={{ borderColor: "var(--line)" }}>
        {isPending ? "Uploading…" : "Attach"}
      </button>
      {note}
    </form>
  );
}

export function DetailsPanel({ enquiry }: { enquiry: InquiryRow }) {
  const { run, note, isPending } = useAction();
  return (
    <form action={run((fd) => updateEnquiryDetails(enquiry.id, fd))} className="flex flex-col gap-2">
      <Labelled label="Source">
        <select name="source" defaultValue={enquiry.source ?? ""} className={FIELD} style={FIELD_STYLE}>
          <option value="">—</option>
          {ENQUIRY_SOURCES.map((source) => (
            <option key={source} value={source}>
              {sourceLabel(source)}
            </option>
          ))}
        </select>
      </Labelled>
      <Labelled label="Priority">
        <select name="priority" defaultValue={enquiry.priority ?? ""} className={FIELD} style={FIELD_STYLE}>
          <option value="">—</option>
          {ENQUIRY_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority[0] + priority.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </Labelled>
      <Labelled label="Project">
        <input name="project_name" defaultValue={enquiry.project_name ?? ""} className={FIELD} style={FIELD_STYLE} />
      </Labelled>
      <Labelled label="Delivery location">
        <input name="delivery_location" defaultValue={enquiry.delivery_location ?? ""} className={FIELD} style={FIELD_STYLE} />
      </Labelled>
      <Labelled label="Required by">
        <input type="date" name="required_delivery_date" defaultValue={enquiry.required_delivery_date ?? ""} className={FIELD} style={FIELD_STYLE} />
      </Labelled>
      <Labelled label="Internal notes">
        <textarea name="internal_notes" defaultValue={enquiry.internal_notes ?? ""} rows={3} className={FIELD} style={FIELD_STYLE} />
      </Labelled>
      <button type="submit" disabled={isPending} className={BTN} style={{ background: "var(--card)" }}>
        {isPending ? "Saving…" : "Save details"}
      </button>
      {note}
    </form>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
