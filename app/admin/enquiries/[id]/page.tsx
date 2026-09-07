import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEnquiryDetail, signAttachmentUrls } from "@/lib/data/enquiries";
import { ageInDays, isOverdue, sourceLabel } from "@/lib/enquiry";
import { StatusPill } from "@/components/admin/enquiries/StatusPill";
import {
  AttachmentUploader,
  DetailsPanel,
  FollowupPanel,
  RequirementPanel,
  StatusChanger,
} from "@/components/admin/enquiries/EnquiryPanels";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getEnquiryDetail(id);
  return { title: detail ? detail.enquiry.ref : "Enquiry" };
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getEnquiryDetail(id);
  if (!detail) notFound();

  const { enquiry, customer, items, attachments, activity, followups } = detail;
  // Private bucket — every attachment link is a fresh short-lived signed URL,
  // minted per render. Nothing here is publicly reachable.
  const signed = await signAttachmentUrls(attachments.map((a) => a.storage_path));
  const openFollowups = followups.filter((f) => !f.completed_at);
  const incomplete = items.filter((item) => !item.specification_complete).length;

  return (
    <main className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/enquiries" className="text-sm" style={{ color: "var(--line-strong)" }}>
              ← Enquiries
            </Link>
            <h1 className="serif text-lg">{enquiry.ref}</h1>
            <StatusPill status={enquiry.status} />
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
            {(customer?.name ?? enquiry.name) || "Unknown"}
            {customer?.company ? ` · ${customer.company}` : ""} · <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a> ·{" "}
            {sourceLabel(enquiry.source)} · received {stamp(enquiry.created_at)} · {ageInDays(enquiry.created_at)}d old
          </p>
        </div>
        {/* Reserved for Slice 2. Disabled rather than hidden so the workflow's
            next step is visible, and deliberately not wired to anything —
            there is no quote layer yet to fake. */}
        <button
          type="button"
          disabled
          title="Quote builder arrives in the next slice"
          className="cursor-not-allowed rounded-md border px-3 py-1.5 text-sm opacity-50"
          style={{ borderColor: "var(--line)" }}
        >
          Create quote
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <Panel title={`Customer requirement${incomplete > 0 ? ` · ${incomplete} incomplete` : ""}`}>
            <RequirementPanel enquiry={enquiry} items={items} />
            {enquiry.message ? (
              <p className="mt-3 rounded border p-2 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                <span className="font-medium">Customer said:</span> {enquiry.message}
              </p>
            ) : null}
          </Panel>

          <Panel title="Attachments">
            <AttachmentUploader enquiryId={enquiry.id} />
            {attachments.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex flex-wrap items-baseline gap-2">
                    {signed[attachment.storage_path] ? (
                      <a href={signed[attachment.storage_path]} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                        {attachment.file_name}
                      </a>
                    ) : (
                      <span>{attachment.file_name}</span>
                    )}
                    <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                      {attachment.kind.toLowerCase()}
                      {attachment.size_bytes ? ` · ${Math.round(attachment.size_bytes / 1024)} KB` : ""}
                      {attachment.caption ? ` · ${attachment.caption}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs" style={{ color: "var(--line-strong)" }}>
                No attachments. WhatsApp screenshots and BOQs go here.
              </p>
            )}
          </Panel>

          {/* Legacy website payload, shown verbatim so nothing from the
              original submission is lost when the normalised lines above were
              derived from it. */}
          {Array.isArray(enquiry.items) && enquiry.items.length > 0 ? (
            <Panel title="Original website submission">
              <pre className="overflow-x-auto text-xs" style={{ color: "var(--line-strong)" }}>
                {JSON.stringify(enquiry.items, null, 2)}
              </pre>
            </Panel>
          ) : null}
        </div>

        <aside className="flex flex-col gap-5">
          <Panel title="Status">
            <StatusChanger enquiry={enquiry} />
            {enquiry.lost_reason ? (
              <p className="mt-2 text-xs" style={{ color: "var(--line-strong)" }}>
                Lost reason: {enquiry.lost_reason.replace(/_/g, " ").toLowerCase()}
              </p>
            ) : null}
          </Panel>

          <Panel title={`Follow-up${openFollowups.some((f) => isOverdue(f.due_at)) ? " · overdue" : ""}`}>
            <FollowupPanel enquiryId={enquiry.id} openFollowups={openFollowups} />
          </Panel>

          <Panel title="Customer">
            {customer ? (
              <dl className="flex flex-col gap-1 text-xs">
                <Row label="Name" value={customer.name} />
                <Row label="Company" value={customer.company} />
                <Row label="Phone" value={customer.phone} />
                <Row label="WhatsApp" value={customer.whatsapp} />
                <Row label="Email" value={customer.email} />
                <Row label="GSTIN" value={customer.gstin} />
              </dl>
            ) : (
              <p className="text-xs" style={{ color: "var(--line-strong)" }}>
                No linked customer record — this enquiry predates the customer table.
              </p>
            )}
          </Panel>

          <Panel title="Enquiry details">
            <DetailsPanel enquiry={enquiry} />
          </Panel>

          <Panel title="Activity">
            <ol className="flex flex-col gap-2 text-xs">
              {activity.map((entry) => (
                <li key={entry.id}>
                  <p style={{ color: "var(--line-strong)" }}>{stamp(entry.created_at)}</p>
                  <p>{entry.summary}</p>
                  {entry.actor_email ? (
                    <p style={{ color: "var(--line-strong)" }}>{entry.actor_email}</p>
                  ) : null}
                </li>
              ))}
              {activity.length === 0 ? (
                <li style={{ color: "var(--line-strong)" }}>Nothing recorded yet.</li>
              ) : null}
            </ol>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border p-3" style={{ borderColor: "var(--line)" }}>
      <h2 className="tracked-caps mb-2 text-[11px]" style={{ color: "var(--line-strong)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt style={{ color: "var(--line-strong)", minWidth: 70 }}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
