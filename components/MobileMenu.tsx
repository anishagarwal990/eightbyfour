"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { EMAIL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/contact";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/brands", label: "Brands" },
  { href: "/applications", label: "Applications" },
  { href: "/guides", label: "Guides" },
  { href: "/comparisons", label: "Comparisons" },
  { href: "/hyderabad", label: "Serving Hyderabad" },
  { href: "/saved", label: "Saved Products" },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mobile-only hamburger + slide-in drawer. The desktop hover mega-menus in
    SiteHeader don't work on touch at all, so below `lg` this is the entire nav. */
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // `open` can only ever become true via a click handler, which never runs
  // during SSR — so by the time it's true, document.body is guaranteed to
  // exist for the portal below. No separate "mounted" effect needed.

  // Close on navigation. Comparing during render (not in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes —
  // this is a same-render adjustment, not a new render triggered by an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    // Remember what had focus so it can be restored when the drawer closes.
    // Both captured now, at open time, so the cleanup isn't reading a ref whose
    // node may have changed.
    const trigger = triggerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    // Move focus into the drawer once it's painted.
    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      cancelAnimationFrame(raf);
      // Restore focus to the hamburger (falling back to whatever was focused
      // when the drawer opened).
      const restoreTo = trigger ?? previouslyFocused;
      restoreTo?.focus?.();
    };
  }, [open]);

  const drawer = (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className="modal-backdrop absolute inset-0"
        style={{ background: "rgba(18,18,18,0.4)" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="modal-panel absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col overflow-y-auto"
        style={{ background: "var(--paper)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--line)" }}>
          <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
            Menu
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-2xl leading-none"
            style={{ color: "var(--line-strong)" }}
          >
            &times;
          </button>
        </div>

        <div className="px-5 py-5">
          <SearchBar />
        </div>

        <nav className="flex flex-col px-5" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b py-3.5 text-base"
              style={{
                borderColor: "var(--line)",
                color: pathname?.startsWith(link.href) ? "var(--burgundy)" : "var(--ink)",
                fontWeight: pathname?.startsWith(link.href) ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div
          className="mt-auto flex flex-col gap-3 px-5 py-6"
          onClick={(e) => e.currentTarget.contains(e.target as Node) && setOpen(false)}
        >
          <RequestQuoteButton />
          <a
            href={buildWhatsAppUrl("Hi, I'd like to get a quote for my project.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm"
            style={{ color: "var(--accent)" }}
          >
            ↗ Chat with us on WhatsApp
          </a>
          <a href={`tel:${PHONE_TEL}`} className="text-sm" style={{ color: "var(--line-strong)" }}>
            Call us: {PHONE_DISPLAY}
          </a>
          <a href={`mailto:${EMAIL}`} className="text-sm" style={{ color: "var(--line-strong)" }}>
            Write us: {EMAIL}
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden"
      >
        <span aria-hidden="true" className="block h-[1.5px] w-5" style={{ background: "var(--ink)" }} />
        <span aria-hidden="true" className="block h-[1.5px] w-5" style={{ background: "var(--ink)" }} />
        <span aria-hidden="true" className="block h-[1.5px] w-3.5 self-end" style={{ background: "var(--ink)" }} />
      </button>

      {open ? createPortal(drawer, document.body) : null}
    </>
  );
}
