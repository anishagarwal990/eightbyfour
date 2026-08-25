import { Reveal } from "@/components/Reveal";

/**
 * Show the output. The business's product is "one requirement comes back as
 * one priced list", and the old site described that in prose without ever
 * showing it. This is a static, clearly-labelled illustration of the format a
 * quote comes back in — not a live interface, and it does not pretend to be
 * one: there are no controls, and the panel says "example" in its own header.
 */
const EXAMPLE_GROUPS = [
  {
    category: "Plywood",
    lines: [
      { desc: "18mm BWP plywood, 8×4 ft", brand: "Century Club Prime", qty: "42 sheets" },
      { desc: "12mm MR plywood, 8×4 ft", brand: "Austin Gold", qty: "18 sheets" },
    ],
  },
  {
    category: "Laminates",
    lines: [
      { desc: "1mm laminate — SD 591 SF, Suede", brand: "Merino", qty: "60 sheets" },
      { desc: "0.8mm laminate — 2043 MT", brand: "Greenlam", qty: "24 sheets" },
    ],
  },
  {
    category: "Hardware & adhesives",
    lines: [
      { desc: "Soft-close hinges, full overlay", brand: "Hettich", qty: "96 pairs" },
      { desc: "SH marine adhesive, 50kg", brand: "Fevicol", qty: "6 drums" },
    ],
  },
];

export function RequirementExample() {
  return (
    <Reveal as="section" className="px-7 py-16 md:py-24" style={{ background: "var(--surface-inverse)", color: "var(--text-on-inverse)" }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <h2 style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            One requirement comes back as one priced list.
          </h2>
          <p className="mt-5 max-w-md" style={{ fontSize: "var(--fs-body-lg)", lineHeight: "var(--lh-normal)", opacity: 0.78 }}>
            Not five vendor threads in five formats. Your lines stay grouped by category, each one against a named
            brand and specification, so you can check it against the BOQ you sent and act on it.
          </p>
          <p className="mt-6 max-w-md" style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", opacity: 0.6 }}>
            Quotes are prepared by a person on our procurement desk and sent to you on WhatsApp or email — there is no
            portal to log into, and we don&rsquo;t pretend otherwise.
          </p>
        </div>

        <figure className="m-0">
          <div style={{ background: "var(--surface-primary)", color: "var(--text-primary)", borderRadius: "var(--radius-xs)" }}>
            <div
              className="flex items-baseline justify-between gap-4 border-b px-5 py-4 md:px-7"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <p className="font-display text-[15px] font-semibold">Requirement REF-4192-CEN</p>
              <p className="tracked-caps" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Illustrative example
              </p>
            </div>
            {EXAMPLE_GROUPS.map((group) => (
              <div key={group.category} className="border-b px-5 py-4 md:px-7" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="tracked-caps" style={{ fontSize: "10px", color: "var(--brand-primary)" }}>
                  {group.category}
                </p>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {group.lines.map((line) => (
                    <li key={line.desc} className="flex items-baseline justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block text-[13.5px] leading-snug">{line.desc}</span>
                        <span className="block text-[12px]" style={{ color: "var(--text-muted)" }}>
                          {line.brand}
                        </span>
                      </span>
                      <span className="metric shrink-0 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {line.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 px-5 py-4 md:px-7">
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                6 lines · 3 categories · 5 brands
              </span>
              <span className="text-[13px] font-medium" style={{ color: "var(--brand-primary)" }}>
                One quote
              </span>
            </div>
          </div>
          <figcaption className="mt-3 text-[12px]" style={{ opacity: 0.55 }}>
            Example layout with representative products — not a real customer quotation.
          </figcaption>
        </figure>
      </div>
    </Reveal>
  );
}
