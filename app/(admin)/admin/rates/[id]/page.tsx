import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRate } from "@/lib/data/rates";
import { RateForm } from "@/components/admin/rates/RateForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rate = await getRate(id);
  return { title: rate ? `${rate.brand ?? ""} ${rate.thickness ?? ""} rate`.trim() : "Rate" };
}

export default async function EditRatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rate = await getRate(id);
  if (!rate) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/rates" className="text-sm" style={{ color: "var(--line-strong)" }}>← Rate Book</Link>
        <h1 className="serif text-lg">
          {[rate.brand, rate.range_name, rate.product_name, rate.thickness].filter(Boolean).join(" ") || "Rate"}
        </h1>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        Editing a rate here does not touch any saved quotation — quotes snapshot the rate they used.
      </p>
      <div className="mt-4">
        <RateForm rate={rate} />
      </div>
    </main>
  );
}
