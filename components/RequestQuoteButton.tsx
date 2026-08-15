"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button } from "@/components/ui/Button";

export function RequestQuoteButton({ label = "Request a Quote" }: { label?: string }) {
  const { openModal } = useQuoteModal();
  return (
    <Button type="button" variant="primary" className="shrink-0" onClick={() => openModal(undefined, undefined, label)}>
      {label}
    </Button>
  );
}
