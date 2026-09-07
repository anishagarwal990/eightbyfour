import Link from "next/link";
import type { Metadata } from "next";
import { RateForm } from "@/components/admin/rates/RateForm";

export const metadata: Metadata = { title: "New rate" };

export default function NewRatePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/rates" className="text-sm" style={{ color: "var(--line-strong)" }}>← Rate Book</Link>
        <h1 className="serif text-lg">New rate</h1>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        One source rate — ex or incl GST. The equivalents are always derived.
      </p>
      <div className="mt-4">
        <RateForm />
      </div>
    </main>
  );
}
