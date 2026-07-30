"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { buttonClasses } from "@/components/ui/Button";

export function HeroCTAs() {
  const { openModal } = useQuoteModal();
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={() => openModal()} className={buttonClasses("primary")}>
        Upload Your BOQ
      </button>
      <Link href="/products" className={buttonClasses("secondary")}>
        Browse Products
      </Link>
    </div>
  );
}
