"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";

export function MoreBrandsTile() {
  const { openModal } = useQuoteModal();
  return (
    <button
      type="button"
      onClick={() => openModal(undefined, "Tell us what you're looking for and we'll get back to you in less than 15 minutes.")}
      className={cardClasses("flex flex-col items-center justify-center gap-2 p-5 text-center")}
      style={CARD_BASE_STYLE}
    >
      <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
        More brands sourced
      </p>
      <p className="text-xs tracked-caps" style={{ color: "var(--accent)" }}>
        Tell us what you need
      </p>
    </button>
  );
}
