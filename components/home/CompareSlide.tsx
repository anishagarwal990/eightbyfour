import { RequirementBuilder } from "@/components/home/RequirementBuilder";

/**
 * The hero's second slide: the mechanic, shown rather than described.
 *
 * Inverted, and the only inverted surface on the page — it has to read as a
 * different beat from slide one at a glance, so that a visitor who lands
 * mid-transition knows the hero moved. The brand keeps burgundy as a signal
 * and neutral everywhere else, so flipping the ground is the strongest
 * structural move available without introducing a colour.
 *
 * The two halves are a real sequence, so they are labelled by who acts rather
 * than numbered: you send a list, a person prices it, it comes back as one
 * document. The middle rule carries that person, because the honest
 * differentiator here is that a human does the work — not that software does.
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

export function CompareSlide() {
  return (
    <div className="h-full px-7 py-14 md:py-16" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            Stop chasing suppliers. Start comparing smartly.
          </h2>
          <p className="mt-4 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", opacity: 0.75 }}>
            Send one list. Every line comes back priced and grouped by category, against a named brand and
            specification — one document to check against your BOQ, instead of five vendor threads in five formats.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-y-0 lg:grid-cols-[1fr_auto_1.15fr] lg:gap-x-8">
          <div className="flex flex-col">
            <p className="tracked-caps mb-3" style={{ fontSize: "var(--fs-label)", opacity: 0.55 }}>
              What you send
            </p>
            <RequirementBuilder />
          </div>

          {/* A plain rule between the two halves. It was carrying the
              "one person prices it" line as vertical type, which is a second
              flourish competing with the inverted band — the band is where the
              boldness is spent, so the rule went quiet and the line moved to a
              caption under both cards where it can be read normally. */}
          <div aria-hidden="true" className="my-6 h-px w-full lg:my-0 lg:h-full lg:w-px" style={{ background: "rgba(255,255,255,0.18)" }} />

          <figure className="m-0 flex flex-col">
            <p className="tracked-caps mb-3" style={{ fontSize: "var(--fs-label)", opacity: 0.55 }}>
              What comes back
            </p>
            <div className="flex-1" style={{ background: "var(--paper)", color: "var(--ink)", borderRadius: "var(--radius-xs)" }}>
              <div className="flex items-baseline justify-between gap-4 border-b px-5 py-4 md:px-6" style={{ borderColor: "var(--line)" }}>
                <p className="font-display text-[15px] font-semibold">Requirement REF-4192-CEN</p>
                <p className="tracked-caps" style={{ fontSize: "10px", color: "var(--line-strong)" }}>
                  Illustrative example
                </p>
              </div>
              {EXAMPLE_GROUPS.map((group) => (
                <div key={group.category} className="border-b px-5 py-4 md:px-6" style={{ borderColor: "var(--line)" }}>
                  <p className="tracked-caps" style={{ fontSize: "10px", color: "var(--burgundy)" }}>
                    {group.category}
                  </p>
                  <ul className="mt-2.5 flex flex-col gap-2">
                    {group.lines.map((line) => (
                      <li key={line.desc} className="flex items-baseline justify-between gap-4">
                        <span className="min-w-0">
                          <span className="block text-[13.5px] leading-snug">{line.desc}</span>
                          <span className="block text-[12px]" style={{ color: "var(--line-strong)" }}>
                            {line.brand}
                          </span>
                        </span>
                        <span className="metric shrink-0 text-[13px]" style={{ color: "var(--line-strong)" }}>
                          {line.qty}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 px-5 py-4 md:px-6">
                <span className="text-[13px]" style={{ color: "var(--line-strong)" }}>
                  6 lines · 3 categories · 5 brands
                </span>
                <span className="text-[13px] font-medium" style={{ color: "var(--burgundy)" }}>
                  One quote
                </span>
              </div>
            </div>
            <figcaption className="mt-3 text-[12px]" style={{ opacity: 0.5 }}>
              Example layout with representative products — not a real customer quotation.
            </figcaption>
          </figure>
        </div>

        {/* The step between the two cards, stated plainly. It is the honest
            differentiator — a person does this, not a matching engine — so it
            sits on its own line rather than being implied by an arrow. */}
        <p className="mt-8 text-[13px]" style={{ opacity: 0.6 }}>
          In between, one person on our procurement desk reads the list, checks stock and pricing across the network,
          and writes the quote. First reply in under 15 minutes during business hours; the priced list follows the same
          or next working day.
        </p>
      </div>
    </div>
  );
}
