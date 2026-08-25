"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { Button, buttonClasses } from "@/components/ui/Button";

/**
 * The two journeys, given equal legitimacy on the page. The old homepage
 * funnelled every visitor into a quote form regardless of whether they were
 * ready to hand over a project — browsing was a grey underline beneath the
 * hero. Here both doors are the same size and the same weight; only the
 * button treatment differs, because a page still needs one primary action.
 */
export function TwoDoors({ totalSkus, brandCount }: { totalSkus: number; brandCount: number }) {
  const { openModalWithItems } = useQuoteModal();

  return (
    <section className="px-7 py-16 md:py-20" aria-label="How to work with us">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px md:grid-cols-2" style={{ background: "var(--border-subtle)" }}>
        <div className="flex flex-col p-8 md:p-10" style={{ background: "var(--surface-page)" }}>
          <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>
            I know what I&rsquo;m looking for
          </p>
          <h2 className="mt-3" style={{ fontSize: "var(--fs-h2)", lineHeight: "var(--lh-snug)" }}>
            Browse the catalogue
          </h2>
          <p className="mt-3 max-w-sm" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
            {totalSkus.toLocaleString("en-IN")} live SKUs across {brandCount}+ manufacturers, searchable by shade code,
            brand, finish and thickness. Add anything you need to your requirement as you go, then send the whole list
            at once.
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Link href="/products" className={buttonClasses("secondary")}>
              Browse materials
            </Link>
            <Link href="/brands" className={buttonClasses("secondary")}>
              Browse by brand
            </Link>
          </div>
        </div>

        <div className="flex flex-col p-8 md:p-10" style={{ background: "var(--surface-primary)" }}>
          <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--brand-primary)" }}>
            I have a project to source
          </p>
          <h2 className="mt-3" style={{ fontSize: "var(--fs-h2)", lineHeight: "var(--lh-snug)" }}>
            Send the whole requirement
          </h2>
          <p className="mt-3 max-w-sm" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
            A BOQ, a product list, a drawing, or a sentence describing what you&rsquo;re building. It can span
            categories we stock and things we don&rsquo;t — we source beyond the catalogue and price the lot together.
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
            <Button type="button" variant="primary" onClick={() => openModalWithItems([], "Send your requirement")}>
              Send your requirement
            </Button>
            <span style={{ fontSize: "var(--fs-body-sm)", color: "var(--text-muted)" }}>
              First reply in under 15 minutes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
