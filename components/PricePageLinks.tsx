import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { PricePageLink } from "@/lib/pricePages";

/**
 * Links from a catalogue page into the Hyderabad price cluster. Kept as its
 * own section rather than folded into "Related Categories" so the two intents
 * stay visibly separate — browsing the range vs. checking what it costs.
 */
export function PricePageLinks({ links, intro }: { links: PricePageLink[]; intro: string }) {
  if (links.length === 0) return null;
  return (
    <Reveal as="section" className="px-7 py-8">
      <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
        Hyderabad price guides
      </h2>
      <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
        {intro}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.slug}
            href={`/hyderabad/${link.slug}`}
            className="rounded-full px-4 py-1.5 text-sm hover:opacity-70"
            style={{ background: "var(--paper-dim)" }}
          >
            {link.title}
          </Link>
        ))}
      </div>
    </Reveal>
  );
}
