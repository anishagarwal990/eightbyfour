"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button } from "@/components/ui/Button";

export function SourceOnlyQuoteButton({ name, label }: { name: string; label?: string }) {
  const { openModal } = useQuoteModal();
  const buttonLabel = label || `Request ${name} Products`;
  return (
    <Button
      type="button"
      variant="primary"
      onClick={() =>
        openModal(
          `${name} products`,
          `Tell us what you need from ${name} and we'll get back to you in less than 15 minutes.`,
          buttonLabel
        )
      }
    >
      {buttonLabel}
    </Button>
  );
}
