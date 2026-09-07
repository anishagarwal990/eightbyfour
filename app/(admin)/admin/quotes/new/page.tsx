import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getEnquiryDetail } from "@/lib/data/enquiries";
import { getQuoteByEnquiry } from "@/lib/data/quotes";
import { requirementLabel } from "@/lib/enquiry";
import { CreateQuoteButton } from "@/components/admin/quotes/CreateQuoteButton";

export const metadata: Metadata = { title: "New quote" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ inquiry?: string }> }) {
  const { inquiry } = await searchParams;
  if (!inquiry) notFound();

  const existing = await getQuoteByEnquiry(inquiry);
  if (existing) redirect(`/admin/quotes/${existing.id}`);

  const detail = await getEnquiryDetail(inquiry);
  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-5">
      <div className="flex items-center gap-3">
        <Link href={`/admin/enquiries/${inquiry}`} className="text-sm" style={{ color: "var(--line-strong)" }}>← {detail.enquiry.ref}</Link>
        <h1 className="serif text-lg">Create quote</h1>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        {detail.customer?.name ?? detail.enquiry.name} · {detail.items.length} requirement line{detail.items.length === 1 ? "" : "s"} carried over — no retyping.
      </p>

      <div className="mt-4 rounded-md border" style={{ borderColor: "var(--line)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th className="px-3 py-1.5 text-left font-medium">Requirement</th>
              <th className="px-3 py-1.5 text-left font-medium">Qty</th>
              <th className="px-3 py-1.5 text-left font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {detail.items.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td className="px-3 py-1.5">{requirementLabel(it)}</td>
                <td className="px-3 py-1.5">{it.quantity ?? "—"}</td>
                <td className="px-3 py-1.5" style={{ color: "var(--line-strong)" }}>{it.unit ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <CreateQuoteButton inquiryId={inquiry} />
      </div>
    </main>
  );
}
