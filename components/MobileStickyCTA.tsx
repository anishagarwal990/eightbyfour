"use client";

import { useEffect, useState } from "react";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { PHONE_TEL } from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 12.5 21 14v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 5.2 2 2 0 0 1 7 3Z" />
    </svg>
  );
}

/**
 * Thumb-reach bar for the audiences most likely to be on a phone (carpenters,
 * site supervisors). Scroll-triggered rather than pinned at rest: at rest it
 * sat over the hero's own primary action, so the first screen carried two
 * competing quote CTAs. It appears once the hero is behind you, and drops the
 * emoji glyphs it used to mix in with the bespoke SVG icon set.
 */
export function MobileStickyCTA() {
  const { openModalWithItems } = useQuoteModal();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      setVisible(window.scrollY > 420);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex border-t transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] lg:hidden"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-primary)",
        paddingBottom: "env(safe-area-inset-bottom)",
        transform: visible ? "translateY(0)" : "translateY(110%)",
      }}
      aria-hidden={!visible}
    >
      <a
        href={`tel:${PHONE_TEL}`}
        onClick={() => trackEvent("phone_click", { source: "mobile_sticky_cta" })}
        className="flex min-h-[52px] w-2/5 items-center justify-center gap-2 border-r text-sm font-medium"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
        tabIndex={visible ? undefined : -1}
      >
        <PhoneIcon />
        Call
      </a>
      <button
        type="button"
        onClick={() => openModalWithItems([], "Send your requirement")}
        className="flex min-h-[52px] flex-1 items-center justify-center text-sm font-semibold"
        style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
        tabIndex={visible ? undefined : -1}
      >
        Send your requirement
      </button>
    </div>
  );
}
