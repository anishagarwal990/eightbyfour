"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button, type ButtonVariant } from "@/components/ui/Button";

type EventParams = Record<string, string | number | boolean | null | undefined>;

export function RequestQuoteButton({
  label = "Request a Quote",
  ctaLocation,
  prefill,
  context,
  variant = "primary",
  className,
}: {
  label?: string;
  /** Where on the page this CTA sits (e.g. "category_hero") — rides on quote_modal_open and the eventual quote_request. */
  ctaLocation?: string;
  /** A line pre-added to the quote list, e.g. the product the visitor is looking at. */
  prefill?: string;
  /** Extra analytics context: product_slug, brand, category… */
  context?: EventParams;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { openModal } = useQuoteModal();
  return (
    <Button
      type="button"
      variant={variant}
      className={["shrink-0", className].filter(Boolean).join(" ")}
      onClick={() => openModal(prefill, undefined, label, { cta_location: ctaLocation, ...context })}
    >
      {label}
    </Button>
  );
}
