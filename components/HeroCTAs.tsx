"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { buttonClasses } from "@/components/ui/Button";

export function HeroCTAs({ align = "center" }: { align?: "center" | "left" }) {
  const { openModal } = useQuoteModal();
  return (
    <div className={`mt-6 flex flex-wrap gap-3 ${align === "left" ? "justify-center lg:justify-start" : "justify-center"}`}>
      <button type="button" onClick={() => openModal(undefined, undefined, "Upload Your BOQ")} className={buttonClasses("primary")}>
        Upload Your BOQ
      </button>
      <Link href="/products" className={buttonClasses("secondary")}>
        Browse Products
      </Link>
    </div>
  );
}
