import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { EMAIL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/contact";

/**
 * Evidence, not adjectives — and no fabricated social proof. Every item here
 * is checkable: a real address, real hours, a named parent entity, and the two
 * response numbers kept deliberately separate. "First response in under 15
 * minutes" used to sit next to BOQ upload copy in a way that read as a
 * promise to quote a whole BOQ in 15 minutes; a first reply and a priced quote
 * are different commitments and are stated as such.
 */
export function TrustBlock() {
  return (
    <Reveal as="section" className="px-7 py-16 md:py-20" style={{ background: "var(--surface-primary)" }} aria-label="How we work with you">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="max-w-sm" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            What you can hold us to
          </h2>
          <p className="mt-4 max-w-sm" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
            A real office in Begumpet, a real phone number, and a person on the other end of it during working hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href={`tel:${PHONE_TEL}`} className="underline underline-offset-4" style={{ color: "var(--brand-primary)" }}>
              {PHONE_DISPLAY}
            </a>
            <a href={`mailto:${EMAIL}`} className="underline underline-offset-4" style={{ color: "var(--brand-primary)" }}>
              {EMAIL}
            </a>
            <Link href="/contact" className="underline underline-offset-4" style={{ color: "var(--brand-primary)" }}>
              Office &amp; directions
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2">
          {[
            { term: "First response", desc: "Under 15 minutes on any requirement, during business hours." },
            { term: "Priced quote", desc: "Same or next working day for a full BOQ — not 15 minutes; we won't pretend otherwise." },
            { term: "Working hours", desc: "Monday to Saturday, 10:00 AM – 8:30 PM." },
            { term: "Where we deliver", desc: "Hyderabad and the surrounding metro area, scheduled against your site." },
            { term: "Who we are", desc: "EightxFour is a unit of DRG Group. Office: Sita Sarovar, Begumpet, Hyderabad 500016." },
            { term: "What it costs to ask", desc: "Nothing. Sending a requirement is not an order and commits you to nothing." },
          ].map((row) => (
            <div key={row.term} className="border-t py-5 pr-8" style={{ borderColor: "var(--border-subtle)" }}>
              <dt className="font-display text-[15px] font-semibold">{row.term}</dt>
              <dd className="mt-1.5 m-0" style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
                {row.desc}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}
