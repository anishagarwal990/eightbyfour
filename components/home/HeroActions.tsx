"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button, buttonClasses } from "@/components/ui/Button";

/**
 * The hero's only two actions. The old first viewport carried a quote widget,
 * a header quote button and a pinned mobile quote bar simultaneously; this is
 * the single primary action, with browsing as an equally reachable — but
 * visually secondary — second route.
 */
export function HeroActions({ browseLabel }: { browseLabel: string }) {
  const { openModalWithItems } = useQuoteModal();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button type="button" variant="primary" onClick={() => openModalWithItems([], "Send your requirement")}>
        Send your requirement
      </Button>
      <Link href="/products" className={buttonClasses("secondary")}>
        {browseLabel}
      </Link>
    </div>
  );
}
