"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";

export interface LinkListEntry {
  label: string;
  href?: string;
  /** Set instead of `href` for brands/materials we don't have a page for yet — opens the quote modal. */
  quotePrefill?: string;
}

export function HyderabadLinkList({ title, entries }: { title: string; entries: LinkListEntry[] }) {
  const { openModal } = useQuoteModal();

  return (
    <div>
      <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
        {title}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.label} className="text-sm leading-snug">
            {e.href ? (
              <Link href={e.href} className="hover:underline" style={{ color: "var(--ink)" }}>
                {e.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() =>
                  openModal(e.quotePrefill ?? e.label, `Tell us what you need and we'll get back to you in less than 15 minutes.`)
                }
                className="text-left hover:underline"
                style={{ color: "var(--ink)" }}
              >
                {e.label} <span style={{ color: "var(--accent)" }}>— request a quote</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
