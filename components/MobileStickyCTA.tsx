"use client";

import { usePathname } from "next/navigation";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { PHONE_TEL } from "@/lib/contact";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

/** Thumb-friendly bottom bar for the audiences most likely to be on mobile
    (carpenters, contractors) — always-visible instead of buried in a menu. */
export function MobileStickyCTA() {
  const { openModal } = useQuoteModal();
  const pathname = usePathname();

  // /admin is an internal tool, not a storefront page. The bar is
  // position:fixed at the bottom, so on a phone it sits on top of the admin
  // forms' save buttons — and "WhatsApp us for a quote" makes no sense to
  // someone editing the catalogue.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t lg:hidden"
      style={{
        borderColor: "var(--line)",
        background: "var(--paper)",
        boxShadow: "var(--shadow-lg)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <a
        href={`tel:${PHONE_TEL}`}
        onClick={() => trackEvent("phone_click", { source: "mobile_sticky_cta" })}
        className="flex flex-col items-center justify-center gap-0.5 border-r py-2.5 text-xs font-medium"
        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
      >
        <span aria-hidden="true">📞</span>
        Call
      </a>
      <a
        href={buildWhatsAppUrl("Hi, I'd like to get a quote for my project.")}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { source: "mobile_sticky_cta" })}
        className="flex flex-col items-center justify-center gap-0.5 border-r py-2.5 text-xs font-medium"
        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
      >
        <span aria-hidden="true">↗</span>
        WhatsApp
      </a>
      <button
        type="button"
        onClick={() => openModal(undefined, undefined, "Get My Quote")}
        className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold"
        style={{ background: "var(--burgundy)", color: "var(--paper)" }}
      >
        <span aria-hidden="true">→</span>
        Get My Quote
      </button>
    </div>
  );
}
