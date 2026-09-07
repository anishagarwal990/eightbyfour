import Link from "next/link";
import type { Metadata } from "next";
import { listQuotes } from "@/lib/data/quotes";
import { ageInDays } from "@/lib/rate-book";
import { quoteValueRange, valueRangeLabel } from "@/lib/quote-math";
import type { QuoteTone } from "@/lib/quote-status";

export const metadata: Metadata = { title: "Quotes" };

const TH = "px-2.5 py-1.5 text-left font-medium whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-top";

const TONE_STYLE: Record<QuoteTone, { background: string; color: string }> = {
  draft: { background: "var(--card)", color: "var(--line-strong)" },
  ready: { background: "color-mix(in srgb, #1a7f4b 14%, var(--paper))", color: "#136138" },
  sent: { background: "color-mix(in srgb, var(--burgundy) 12%, var(--paper))", color: "var(--burgundy)" },
  revision: { background: "color-mix(in srgb, #b8860b 16%, var(--paper))", color: "#7a5b00" },
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function QuotesPage() {
  const rows = await listQuotes();

  return (
    <main className="px-6 py-5">
      <h1 className="serif text-lg">Quotes</h1>
      <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
        Start a quote from an enquiry. Option values are shown as a range — alternatives are never summed.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th className={TH}>Quote</th>
              <th className={TH}>Enquiry</th>
              <th className={TH}>Customer</th>
              <th className={TH}>Options</th>
              <th className={TH}>Version</th>
              <th className={TH}>Value range</th>
              <th className={TH}>Status</th>
              <th className={TH}>Last sent</th>
              <th className={TH}>Updated</th>
              <th className={TH}>Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => {
              const range =
                q.value_min != null && q.value_max != null ? quoteValueRange([q.value_min, q.value_max]) : null;
              return (
                <tr key={q.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className={TD}>
                    <Link href={`/admin/quotes/${q.id}`} className="font-medium hover:opacity-70">{q.ref}</Link>
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    <Link href={`/admin/enquiries/${q.inquiry_id}`} className="hover:opacity-70">{q.enquiry_ref ?? "—"}</Link>
                  </td>
                  <td className={TD}>{q.customer_name ?? "—"}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{q.option_count}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    V{Math.max(q.current_version, q.version_count)}
                    {q.version_count > 1 ? ` (${q.version_count})` : ""}
                  </td>
                  <td className={TD}>{valueRangeLabel(range)}</td>
                  <td className={TD}>
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={TONE_STYLE[q.display.tone]}
                    >
                      {q.display.label}
                    </span>
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {q.display.lastSent
                      ? `V${q.display.lastSent.versionNo} · ${shortDate(q.display.lastSent.at)}`
                      : "—"}
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{shortDate(q.updated_at)}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{ageInDays(q.created_at)}d</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center" style={{ color: "var(--line-strong)" }}>
                  No quotes yet. Open an enquiry and click “Create quote”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
