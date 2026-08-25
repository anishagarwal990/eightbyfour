import { Reveal } from "@/components/Reveal";

/**
 * Structural value, not "why choose us" cards. Each claim is one the business
 * can actually stand behind, and each is stated as a mechanism rather than an
 * adjective — no icons, no boxes, no triptych.
 */
const PROPOSITIONS = [
  {
    title: "One requirement instead of five vendor threads",
    body: "Plywood, laminate, hardware and adhesive on the same list get sourced together and priced together. You hold one conversation, not one per category.",
  },
  {
    title: "Specification depth where it matters",
    body: "Shade codes, finishes, thicknesses and grades are carried through from the catalogue to the quote — the code you specify is the code that reaches site.",
  },
  {
    title: "Brand-neutral sourcing",
    body: "We're not a manufacturer's shopfront. Products get proposed on specification, availability and what your project actually needs.",
  },
  {
    title: "We source past our own catalogue",
    body: "The listed SKUs prove the sourcing is real; they aren't the limit of it. Put an unlisted item on your list and it gets quoted with the rest.",
  },
  {
    title: "A person handles it",
    body: "Someone reads the requirement, checks the stock and writes the quote. First reply in under 15 minutes during business hours.",
  },
  {
    title: "Hyderabad execution",
    body: "Brands, routes and delivery scheduling built around this city's sites and timelines, not a generic pan-India catalogue.",
  },
] as const;

export function WhyEightByFour() {
  return (
    <Reveal as="section" className="px-7 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
          Why send it to us rather than call four suppliers
        </h2>
        <Reveal stagger className="mt-10 grid grid-cols-1 gap-x-14 gap-y-9 md:grid-cols-2">
          {PROPOSITIONS.map((p) => (
            <div key={p.title} className="border-t pt-5" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="max-w-sm" style={{ fontSize: "var(--fs-h4)", lineHeight: "var(--lh-snug)" }}>
                {p.title}
              </h3>
              <p className="mt-2.5 max-w-md" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </Reveal>
  );
}
