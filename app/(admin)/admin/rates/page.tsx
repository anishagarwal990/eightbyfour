import Link from "next/link";
import type { Metadata } from "next";
import { listRates, getRateFacets, RATE_PAGE_SIZE, type RateFilters as RF } from "@/lib/data/rates";
import { basisLabel, basisUnit, isRateStale } from "@/lib/rate-book";
import { formatRate, normalizeRate } from "@/lib/quote-math";
import { RateFilters } from "@/components/admin/rates/RateFilters";

export const metadata: Metadata = { title: "Rate Book" };

const TH = "px-2.5 py-1.5 text-left font-medium whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-top";

type SearchParams = { q?: string; category?: string; brand?: string; thickness?: string; basis?: string; state?: string; page?: string };

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

export default async function RatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const filters: RF = { ...params, page };

  const [{ rows, total, totalPages }, facets] = await Promise.all([listRates(filters), getRateFacets()]);

  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") next.set(k, v);
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/admin/rates?${qs}` : "/admin/rates";
  };

  return (
    <main className="px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="serif text-lg">Rate Book</h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
            The rates EightByFour quotes at. Not a supplier cost.
          </p>
        </div>
        <Link href="/admin/rates/new" className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ background: "var(--burgundy)", color: "var(--paper)" }}>
          New rate
        </Link>
      </div>

      <div className="mt-4">
        <RateFilters facets={facets} current={params} />
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
        {total} rate{total === 1 ? "" : "s"}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th className={TH}>Brand</th>
              <th className={TH}>Product / range</th>
              <th className={TH}>Category</th>
              <th className={TH}>Thickness</th>
              <th className={TH}>Grade</th>
              <th className={TH}>Size</th>
              <th className={TH}>Basis</th>
              <th className={TH}>Rate</th>
              <th className={TH}>GST</th>
              <th className={TH}>Ex / Incl</th>
              <th className={TH}>Warranty</th>
              <th className={TH}>Updated</th>
              <th className={TH}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const unit = basisUnit(r.pricing_basis);
              const eq = normalizeRate(Number(r.rate), r.rate_input_mode as "EX_GST" | "INCL_GST", Number(r.gst_rate));
              const stale = isRateStale(r);
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--line)", opacity: stale ? 0.55 : 1 }}>
                  <td className={TD}>{r.brand ?? "—"}</td>
                  <td className={TD}>{[r.range_name, r.product_name].filter(Boolean).join(" · ") || "—"}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{r.category ?? "—"}</td>
                  <td className={TD}>{r.thickness ?? "—"}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{r.grade ?? "—"}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{r.size ?? "—"}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{basisLabel(r.pricing_basis)}</td>
                  <td className={TD}>
                    <span className="font-medium">{formatRate(Number(r.rate))}</span>
                    <span style={{ color: "var(--line-strong)" }}>{unit ? ` / ${unit}` : ""}</span>
                    <span className="ml-1 text-[10px]" style={{ color: "var(--line-strong)" }}>
                      {r.rate_input_mode === "INCL_GST" ? "incl" : "ex"}
                    </span>
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{Number(r.gst_rate)}%</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {formatRate(eq.baseRateExGst)} / {formatRate(eq.rateInclGst)}
                  </td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>{r.warranty_text ?? "—"}</td>
                  <td className={TD} style={{ color: "var(--line-strong)" }}>
                    {shortDate(r.updated_at)}
                    {stale ? <span className="ml-1" style={{ color: "var(--burgundy)" }}>· {r.active ? "expired" : "retired"}</span> : null}
                  </td>
                  <td className={TD}>
                    <Link href={`/admin/rates/${r.id}`} className="text-xs underline-offset-2 hover:underline">Edit</Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center" style={{ color: "var(--line-strong)" }}>
                  No rates yet. Add the first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="hover:opacity-70">← Previous</Link> : null}
          {page < totalPages ? <Link href={pageHref(page + 1)} className="hover:opacity-70">Next →</Link> : null}
          <span className="text-xs" style={{ color: "var(--line-strong)" }}>{RATE_PAGE_SIZE} per page</span>
        </div>
      ) : null}
    </main>
  );
}
