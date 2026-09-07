import Link from "next/link";
import type { Metadata } from "next";
import { NewEnquiryForm } from "@/components/admin/enquiries/NewEnquiryForm";

export const metadata: Metadata = { title: "New enquiry" };

export default function NewEnquiryPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/enquiries" className="text-sm" style={{ color: "var(--line-strong)" }}>
          ← Enquiries
        </Link>
        <h1 className="serif text-lg">New enquiry</h1>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        Enter the requirement as the customer stated it. Enter in the Qty field opens the next line.
      </p>
      <div className="mt-4">
        <NewEnquiryForm />
      </div>
    </main>
  );
}
