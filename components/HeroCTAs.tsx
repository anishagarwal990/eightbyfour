"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { buttonClasses } from "@/components/ui/Button";

export function HeroCTAs() {
  const { openModal } = useQuoteModal();
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={() => openModal()} className={buttonClasses("primary")}>
        Start Your Procurement
      </button>
      <button
        type="button"
        onClick={() => openModal(undefined, "Tell us what you're looking for and we'll get back to you in less than 15 minutes.")}
        className={buttonClasses("secondary")}
      >
        Can&apos;t Find It? Ask Us.
      </button>
    </div>
  );
}
