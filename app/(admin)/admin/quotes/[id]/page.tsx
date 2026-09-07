import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuoteBuilderData } from "@/lib/data/quotes";
import { QuoteBuilder } from "@/components/admin/quotes/QuoteBuilder";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getQuoteBuilderData(id);
  return { title: data ? data.quote.ref : "Quote" };
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;
  const versionNo = v ? Number.parseInt(v, 10) || undefined : undefined;

  const data = await getQuoteBuilderData(id, versionNo);
  if (!data) notFound();

  return (
    <main className="px-6 py-5">
      <QuoteBuilder data={data} />
    </main>
  );
}
