"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createQuoteFromEnquiry } from "@/app/(admin)/admin/quotes/actions";

export function CreateQuoteButton({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await createQuoteFromEnquiry(inquiryId);
            if (res.ok && res.id) router.push(`/admin/quotes/${res.id}`);
            else setError(res.message);
          })
        }
        className="rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        style={{ background: "var(--burgundy)", color: "var(--paper)" }}
      >
        {pending ? "Creating…" : "Create quote"}
      </button>
      {error ? <span className="text-xs" style={{ color: "var(--burgundy)" }}>{error}</span> : null}
    </div>
  );
}
