import { Reveal } from "@/components/Reveal";

/**
 * The real process, described as it actually runs — human-assisted
 * procurement. Step 03 used to read "You compare — see options side-by-side",
 * which promised a comparison screen the product does not have. What actually
 * happens is a person prepares the options and sends them; that is what it
 * says now.
 */
const STEPS = [
  {
    n: "01",
    title: "You send the requirement",
    detail: "A BOQ, a product list, a shade code, a drawing, or a sentence. Whatever form it already exists in.",
  },
  {
    n: "02",
    title: "We read it and come back",
    detail: "A person on the procurement desk confirms what we've understood, in under 15 minutes during business hours.",
  },
  {
    n: "03",
    title: "We source across the network",
    detail: "Stock, specification and pricing checked across manufacturers and distributors — including things we don't list.",
  },
  {
    n: "04",
    title: "You get one consolidated quote",
    detail: "Every line priced and grouped by category, with brands and specs named, so you can check it against your BOQ.",
  },
  {
    n: "05",
    title: "We procure and deliver",
    detail: "You confirm the lines you want. We coordinate supply and delivery in Hyderabad against your site timeline.",
  },
] as const;

export function HowItWorks() {
  return (
    <Reveal as="section" className="px-7 py-16 md:py-20" style={{ background: "var(--surface-primary)" }}>
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
          How it actually works
        </h2>
        <p className="mt-4 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
          There is no dashboard and no automated matching engine. There is a procurement desk that reads your
          requirement and works it — which is why it copes with a scanned BOQ and a half-remembered shade code.
        </p>
        <Reveal stagger className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`border-t py-6 lg:pr-6 ${i > 0 ? "sm:pl-0 lg:border-l lg:pl-6" : ""}`}
              style={{ borderColor: i === 0 ? "var(--brand-primary)" : "var(--border-subtle)" }}
            >
              <p className="metric" style={{ fontSize: "13px", color: "var(--brand-primary)" }}>
                {step.n}
              </p>
              <p className="font-display mt-3 text-[16px] font-semibold leading-snug">{step.title}</p>
              <p className="mt-2" style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
                {step.detail}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </Reveal>
  );
}
