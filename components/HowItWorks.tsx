import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Tell us what you need",
    detail: "Upload a BOQ, share a product list, or just tell us what you're building.",
  },
  {
    n: "02",
    title: "We source it",
    detail: "We check products, brands, availability and pricing across our manufacturer network.",
  },
  {
    n: "03",
    title: "You compare",
    detail: "See options side-by-side instead of managing multiple supplier conversations.",
  },
  {
    n: "04",
    title: "You decide",
    detail: "Choose what works best for your project — we handle the rest.",
  },
] as const;

export function HowItWorks() {
  return (
    <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
      <div className="mx-auto max-w-5xl">
        <p className="tracked-caps text-center text-xs" style={{ color: "var(--accent)" }}>
          How It Works
        </p>
        <Reveal stagger className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n}>
              <p className="serif" style={{ fontSize: "32px", color: "var(--burgundy)" }}>
                {step.n}
              </p>
              <p className="mt-2 text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                {step.detail}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </Reveal>
  );
}
