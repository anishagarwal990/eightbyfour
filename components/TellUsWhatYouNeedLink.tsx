"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";

export function TellUsWhatYouNeedLink() {
  const { openModal } = useQuoteModal();
  return (
    <p className="mt-5 text-sm" style={{ color: "var(--line-strong)" }}>
      We source well beyond what&apos;s on this site.{" "}
      <button
        type="button"
        onClick={() => openModal(undefined, "Tell us what you're looking for and we'll get back to you in less than 15 minutes.")}
        className="underline hover:opacity-70"
        style={{ color: "var(--burgundy)" }}
      >
        Tell us what you need
      </button>{" "}
      and we&apos;ll get back to you in less than 15 minutes.
    </p>
  );
}
