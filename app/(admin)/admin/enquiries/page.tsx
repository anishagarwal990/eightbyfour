import Link from "next/link";
import type { Metadata } from "next";
import { getEnquiryCounters, listEnquiries, ENQUIRY_PAGE_SIZE } from "@/lib/data/enquiries";
import { ageInDays, isOverdue, sourceLabel, statusLabel } from "@/lib/enquiry";
import { EnquiryFilters } from "@/components/admin/enquiries/EnquiryFilters";
import { StatusPill } from "@/components/admin/enquiries/StatusPill";

export const metadata: Metadata = { title: "Enquiries" };

type SearchParams = { q?: string; status?: string; source?: string; followup?: string; page?: string };

const TH = "px-2.5 py-1.5 text-left font-medium whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-top";

// The stages worth a permanent counter. The other six statuses are reachable
// from the status dropdown; putting all eleven up here would be a wall of
// numbers nobody reads.
const COUNTER_STATUSES = ["NEW", "REQUIREMENT_VERIFIED", "PRICING", "AWAITING_CUSTOMER"] as const;

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const [{ rows, total, totalPages }, counters] = await Promise.all([
    listEnquiries({ search: params.q, status: params.status, source: params.source, followup: params.followup, page }),
    getEnquiryCounters(),
  ]);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") query.set(key, value);
  }
  const pageHref = (n: number) => {
    const next = new URLSearchParams(query);
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/admin/enquiries?${qs}` : "/admin/enquiries";
  };
  const counterHref = (key: "status" | "followup", value: string) =>
    `/admin/enquiries?${new URLSearchParams({ [key]: value }).toString()}`;

  return (
    <main className="px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="serif text-lg">Enquiries</h1>
        <Link
          href="/admin/enquiries/new"
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{ background: "var(--burgundy)", color: "var(--paper)" }}
        >
          New enquiry
        </Link>
      </div>

      {/* Operational counters only — revenue, conversion and margin wait for
          quote and order data to exist (Slice 2+). */}
      <div className="mt-4 flex flex-wrap gap-2">
        {COUNTER_STATUSES.map((status) => (
          <Link
            key={status}
            href={counterHref("status", status)}
            className="rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--line)", background: params.status === status ? "var(--card)" : "transparent" }}
          >
            <span style={{ color: "var(--line-strong)" }}>{statusLabel(status)}</span>{" "}
            <span className="font-semibold">{counters.byStatus[status] ?? 0}</span>
          </Link>
        ))}
        <Link
          href={counterHref("followup", "today")}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            borderColor: counters.followupsDue > 0 ? "var(--burgundy)" : "var(--line)",
            background: params.followup === "today" ? "var(--card)" : "transparent",
          }}
        >
          <span style={{ color: "var(--line-strong)" }}>Follow-ups due</span>{" "}
          <span className="font-semibold" style={{ color: counters.followupsDue > 0 ? "var(--burgundy)" : undefined }}>
            {counters.followupsDue}
          </span>
        </Link>
      </div>

      <div className="mt-4">
        <EnquiryFilters current={params} />
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
        {total} enquir{total === 1 ? "y" : "ies"}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th className={TH}>Ref</th>
              <th className={TH}>Received</th>
              <th className={TH}>Customer</th>
              <th className={TH}>Company</th>
              <th className={TH}>Phone</th>
              <th className={TH}>Source</th>
              <th className={TH}>Requirement</th>
              <th className={TH}>Status</th>
              <th className={TH}>Next follow-up</th>
              <th className={TH}>Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const overdue = isOverdue(row.next_followup_at);
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className={TD}>
                    <Link href={`/admin/enquiries/${row.id}`} className="font-medium hover:opacity-70">
                      {row.ref}
                    </Link>
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {shortDate(row.created_at)}
                  </td>
                  <td className={TD}>{row.customer?.name ?? row.name}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {row.customer?.company ?? "—"}
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    <a href={`tel:${row.phone}`} className="hover:opacity-70">
                      {row.phone}
                    </a>
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {sourceLabel(row.source)}
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {row.item_count > 0 ? `${row.item_count} line${row.item_count === 1 ? "" : "s"}` : "—"}
                    {row.requested_brand ? <span className="ml-1.5">· {row.requested_brand}</span> : null}
                  </td>
                  <td className={TD}>
                    <StatusPill status={row.status} />
                  </td>
                  <td className={TD} style={{ color: overdue ? "var(--burgundy)" : "var(--line-strong)", fontWeight: overdue ? 600 : 400 }}>
                    {shortDate(row.next_followup_at)}
                    {overdue ? " · overdue" : ""}
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {ageInDays(row.created_at)}d
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center" style={{ color: "var(--line-strong)" }}>
                  Nothing matches those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="hover:opacity-70">
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="hover:opacity-70">
              Next →
            </Link>
          ) : null}
          <span className="text-xs" style={{ color: "var(--line-strong)" }}>
            {ENQUIRY_PAGE_SIZE} per page
          </span>
        </div>
      ) : null}
    </main>
  );
}
