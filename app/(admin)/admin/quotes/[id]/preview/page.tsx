import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerQuote } from "@/lib/data/quotes";
import { whatsappMessage, pdfFileName } from "@/lib/customer-quote";
import { whatsAppLink } from "@/lib/phone";
import { CustomerQuoteView } from "@/components/admin/quotes/CustomerQuoteView";
import { PreviewActions } from "@/components/admin/quotes/PreviewActions";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { v } = await searchParams;
  const r = await getCustomerQuote(id, v ? Number.parseInt(v, 10) || undefined : undefined);
  return { title: r ? `${r.dto.versionRef} preview` : "Quote preview" };
}

export default async function QuotePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string; display?: string }>;
}) {
  const { id } = await params;
  const { v, display } = await searchParams;
  const versionNo = v ? Number.parseInt(v, 10) || undefined : undefined;

  const result = await getCustomerQuote(id, versionNo);
  if (!result) notFound();

  const dto = result.dto;
  // ?display= is a preview-only override to demonstrate ex/incl presentation.
  // It never changes stored data or any amount — grand totals are identical.
  if (display === "EX_GST" || display === "INCL_GST") dto.pricingDisplay = display;

  const vParam = versionNo ? `?v=${versionNo}` : "";
  const pdfHref = `/admin/quotes/${id}/pdf${versionNo ? `?v=${versionNo}` : ""}`;
  const wa = whatsAppLink(dto.customer.phone, whatsappMessage(dto));

  return (
    <main className="px-6 py-5">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/admin/quotes/${id}${vParam}`} className="text-sm" style={{ color: "var(--line-strong)" }}>
              ← Back to builder
            </Link>
            <h1 className="serif text-lg">{dto.versionRef} — customer preview</h1>
          </div>
          <PreviewActions
            quoteId={id}
            versionNo={versionNo}
            status={result.quote.status}
            pdfHref={pdfHref}
            pdfName={pdfFileName(dto)}
            whatsappHref={wa}
            currentDisplay={dto.pricingDisplay}
          />
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
          This is what the customer sees — no internal pricing, supplier or rate-book data. Reads the frozen V{dto.versionNo} snapshot.
        </p>

        <div className="mt-4">
          <CustomerQuoteView quote={dto} />
        </div>
      </div>
    </main>
  );
}
