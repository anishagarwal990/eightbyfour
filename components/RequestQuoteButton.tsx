"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button } from "@/components/ui/Button";

export function RequestQuoteButton() {
  const { openModal } = useQuoteModal();
  return (
    <Button type="button" variant="primary" className="shrink-0" onClick={() => openModal()}>
      Request a Quote
    </Button>
  );
}
