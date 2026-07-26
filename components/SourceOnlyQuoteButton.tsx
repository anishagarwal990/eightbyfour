"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button } from "@/components/ui/Button";

export function SourceOnlyQuoteButton({ name }: { name: string }) {
  const { openModal } = useQuoteModal();
  return (
    <Button
      type="button"
      variant="primary"
      onClick={() => openModal(`${name} products`, `Tell us what you need from ${name} and we'll get back to you in less than 15 minutes.`)}
    >
      Request {name} Products
    </Button>
  );
}
